// Thin wrapper around fetch for the BAJARANG API.
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
  },
};

async function request(method, path, body) {
  const token = tokenStore.get();
  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      method,
      headers: {
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiRequestError('સર્વર સાથે જોડાણ થયું નહીં. ઇન્ટરનેટ તપાસો.', { code: 'NETWORK' });
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok || !payload?.success) {
    const err = payload?.error || {};
    if (res.status === 401 && path !== '/auth/login') unauthorizedHandler?.();
    throw new ApiRequestError(err.message || 'કંઈક ખોટું થયું. ફરી પ્રયાસ કરો.', {
      status: res.status,
      code: err.code,
      fields: err.fields,
    });
  }
  return payload.data;
}

const qs = (params = {}) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const authApi = {
  login: (pin) => request('POST', '/auth/login', { pin }),
  check: () => request('GET', '/auth/check'),
};

export const productApi = {
  list: (params) => request('GET', `/products${qs(params)}`),
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
};

export const categoryApi = {
  list: () => request('GET', '/categories'),
  create: (data) => request('POST', '/categories', data),
  update: (id, data) => request('PUT', `/categories/${id}`, data),
  setStatus: (id, isActive) => request('PATCH', `/categories/${id}/status`, { isActive }),
  remove: (id) => request('DELETE', `/categories/${id}`),
};
