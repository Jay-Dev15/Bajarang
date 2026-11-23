// Last data seen from the server, kept on this device so the app opens
// instantly and still shows prices when the network is slow. Fresh data is
// always fetched in the background right after. Cleared on logout.
const PREFIX = 'bajarang.cache.';
const VERSION = 1;

export const cache = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const entry = JSON.parse(raw);
      return entry?.v === VERSION ? entry : null;
    } catch {
      return null;
    }
  },
  set(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify({ v: VERSION, savedAt: Date.now(), data }));
    } catch {
      /* storage full or blocked: the app simply loads from the network */
    }
  },
  clearAll() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  },
};
