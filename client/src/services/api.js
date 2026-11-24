// Thin wrapper around fetch for the BAJARANG API.
import { cache } from '../utils/cache';

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'bajarang.token';

export class ApiRequestError extends Error {
  constructor(message, { status = 0, code, fields } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let unauthorizedHandler = null;
export const onUnauthorized = (fn) => {
  unauthorizedHandler = fn;
};

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: token lives only for this session */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
    cache.clearAll(); // prices are private: drop the saved copy on logout
  },
};

const TIMEOUT_MS = 20_000;
const RETRY_DELAY_MS = 800;

// Messages for failures where the server sent no message of its own.
const MESSAGES = {
  OFFLINE: 'ઇન્ટરનેટ બંધ છે. ઇન્ટરનેટ ચાલુ કરીને ફરી પ્રયાસ કરો.',
  NETWORK: 'સર્વર સાથે જોડાણ થયું નહીં. ઇન્ટરનેટ તપાસો.',
  TIMEOUT: 'સર્વર જવાબ આપવામાં વધુ સમય લે છે. થોડી વાર પછી ફરી પ્રયાસ કરો.',
  SERVER: 'સર્વરમાં તકલીફ છે. થોડી વાર પછી ફરી પ્રયાસ કરો.',
  NOT_FOUND: 'માહિતી મળી નથી.',
  UNKNOWN: 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.',
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function send(method, path, body) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiRequestError(MESSAGES.OFFLINE, { code: 'NETWORK' });
  }
  const token = tokenStore.get();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    const timedOut = e?.name === 'AbortError';
    throw new ApiRequestError(timedOut ? MESSAGES.TIMEOUT : MESSAGES.NETWORK, { code: timedOut ? 'TIMEOUT' : 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response (e.g. a hosting error page) */
  }

  if (!res.ok || !payload?.success) {
    const err = payload?.error || {};
    if (res.status === 401 && path !== '/auth/login') unauthorizedHandler?.();
    const fallback = res.status >= 500 ? MESSAGES.SERVER : res.status === 404 ? MESSAGES.NOT_FOUND : MESSAGES.UNKNOWN;
    throw new ApiRequestError(err.message || fallback, {
      status: res.status,
      code: err.code || (res.status >= 500 ? 'SERVER' : undefined),
      fields: err.fields,
    });
  }
  return { data: payload.data, meta: payload.meta };
}

// Reads are retried once on a network blip, timeout or server error (a cold
// server often answers the second try). Writes are never retried, so nothing
// is saved twice.
async function sendWithRetry(method, path, body) {
  try {
    return await send(method, path, body);
  } catch (err) {
    const retryable = method === 'GET' && (['NETWORK', 'TIMEOUT'].includes(err.code) || err.status >= 500);
    if (!retryable || navigator.onLine === false) throw err;
    await wait(RETRY_DELAY_MS);
    return send(method, path, body);
  }
}

async function request(method, path, body) {
  return (await sendWithRetry(method, path, body)).data;
}

/** Same as request, but also returns the response meta (used for pagination). */
async function requestPage(path) {
  return sendWithRetry('GET', path);
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const authApi = {
  login: (pin) => request('POST', '/auth/login', { pin }),
  check: () => request('GET', '/auth/check'),
};

/** Products + categories in one request: what the app needs on open. */
export const bootstrapApi = {
  get: () => request('GET', '/bootstrap'),
};

export const productApi = {
  list: (params) => request('GET', `/products${qs(params)}`),
  /** One page: resolves to { data, meta: { page, limit, total, hasMore } }. */
  page: (params) => requestPage(`/products${qs(params)}`),
  get: (id) => request('GET', `/products/${id}`),
  create: (data) => request('POST', '/products', data),
  update: (id, data) => request('PUT', `/products/${id}`, data),
  remove: (id) => request('DELETE', `/products/${id}`),
  setAvailability: (id, isAvailable, updatedBy) =>
    request('PATCH', `/products/${id}/availability`, { isAvailable, updatedBy }),
  history: (id) => request('GET', `/products/${id}/history`),
};

export const purchaseApi = {
  list: () => request('GET', '/purchase'),
  createSource: (name) => request('POST', '/purchase/sources', { name }),
  renameSource: (id, name) => request('PUT', `/purchase/sources/${id}`, { name }),
  createItem: (data) => request('POST', '/purchase/items', data),
  updateItem: (id, data) => request('PUT', `/purchase/items/${id}`, data),
  setNeeded: (id, needed, updatedBy) => request('PATCH', `/purchase/items/${id}/needed`, { needed, updatedBy }),
  deleteItem: (id) => request('DELETE', `/purchase/items/${id}`),
};

export const categoryApi = {
  list: () => request('GET', '/categories'),
  create: (data) => request('POST', '/categories', data),
  update: (id, data) => request('PUT', `/categories/${id}`, data),
  setStatus: (id, isActive) => request('PATCH', `/categories/${id}/status`, { isActive }),
  remove: (id) => request('DELETE', `/categories/${id}`),
};
