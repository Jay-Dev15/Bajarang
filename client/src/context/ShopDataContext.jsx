import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { categoryApi, productApi } from '../services/api';
import { sortCategories } from '../utils/products';

const ShopDataContext = createContext(null);
const REFRESH_INTERVAL_MS = 45_000;

/**
 * Holds the shared product and category lists.
 * Data is refreshed when the app opens, when the phone returns to the app,
 * and every 45 seconds while visible, so all three family members see the
 * same latest prices.
 */
export function ShopDataProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const inFlight = useRef(null);

  const refresh = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      try {
        const [p, c] = await Promise.all([productApi.list(), categoryApi.list()]);
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
