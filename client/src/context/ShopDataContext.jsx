import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { bootstrapApi } from '../services/api';
import { sortCategories } from '../utils/products';
import { cache } from '../utils/cache';

const ShopDataContext = createContext(null);
const REFRESH_INTERVAL_MS = 45_000;
const CACHE_KEY = 'shop';

/**
 * Holds the shared product and category lists.
 * Data is refreshed when the app opens, when the phone returns to the app,
 * and every 45 seconds while visible, so all three family members see the
 * same latest prices.
 */
export function ShopDataProvider({ children }) {
  // Start from the copy saved on this device (if any): the list shows at once,
  // and the fresh copy from the server replaces it a moment later.
  const [saved] = useState(() => cache.get(CACHE_KEY));
  const [products, setProducts] = useState(() => saved?.data.products || []);
  const [categories, setCategories] = useState(() => sortCategories(saved?.data.categories || []));
  const [status, setStatus] = useState(saved ? 'ready' : 'loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(() => (saved ? new Date(saved.savedAt) : null));
  const inFlight = useRef(null);

  // Keep the saved copy in step with every change (refresh, add, edit, delete).
  useEffect(() => {
    if (status === 'ready') cache.set(CACHE_KEY, { products, categories });
  }, [products, categories, status]);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      try {
        const { products: p, categories: c } = await bootstrapApi.get();
        setProducts(p);
        setCategories(sortCategories(c));
        setStatus('ready');
        setError(null);
        setLastSyncedAt(new Date());
      } catch (err) {
        setError(err);
        setStatus((s) => (s === 'ready' ? 'ready' : 'error'));
        throw err;
      } finally {
        inFlight.current = null;
      }
    })();
    return inFlight.current;
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    const timer = setInterval(onVisible, REFRESH_INTERVAL_MS);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
      clearInterval(timer);
    };
  }, [refresh]);

  // ---- local state helpers used after successful API calls ----
  const upsertProduct = useCallback((product) => {
    setProducts((list) => {
      const i = list.findIndex((p) => p._id === product._id);
      if (i === -1) return [...list, product];
      const next = [...list];
      next[i] = product;
      return next;
    });
  }, []);

  const removeProduct = useCallback((id) => setProducts((list) => list.filter((p) => p._id !== id)), []);

  const upsertCategory = useCallback((category) => {
    setCategories((list) => {
      const i = list.findIndex((c) => c._id === category._id);
      const next = i === -1 ? [...list, category] : list.map((c) => (c._id === category._id ? category : c));
      return sortCategories(next);
    });
  }, []);

  const removeCategory = useCallback((id) => setCategories((list) => list.filter((c) => c._id !== id)), []);

  const categoryMap = useMemo(() => new Map(categories.map((c) => [c._id, c])), [categories]);
  const categoryName = useCallback((id) => (id && categoryMap.get(id)?.nameGujarati) || 'કેટેગરી વગર', [categoryMap]);

  const value = useMemo(
    () => ({
      products,
      categories,
      categoryMap,
      categoryName,
      status,
      error,
      lastSyncedAt,
      refresh,
      upsertProduct,
      removeProduct,
      upsertCategory,
      removeCategory,
    }),
    [products, categories, categoryMap, categoryName, status, error, lastSyncedAt, refresh, upsertProduct, removeProduct, upsertCategory, removeCategory]
  );

  return <ShopDataContext.Provider value={value}>{children}</ShopDataContext.Provider>;
}

export const useShopData = () => useContext(ShopDataContext);
