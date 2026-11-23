import { useEffect, useRef, useState } from 'react';
import ProductRow from './ProductRow';
import { Bone } from './ui/Skeleton';
import { useAvailabilityToggle } from '../hooks/useAvailabilityToggle';
import { productApi } from '../services/api';
import { useShopData } from '../context/ShopDataContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

const PAGE_SIZE = 20;

/**
 * Scroll pagination: render PAGE_SIZE cards, and add the next PAGE_SIZE when the
 * bottom of the list comes near the screen. `resetKey` (search / filter / sort)
 * starts again from the first page; a background refresh of the same list does not.
 */
function useScrollPages(total, resetKey) {
  const [count, setCount] = useState(PAGE_SIZE);
  const [lastKey, setLastKey] = useState(resetKey);
  if (resetKey !== lastKey) {
    setLastKey(resetKey);
    setCount(PAGE_SIZE);
  }
  const sentinel = useRef(null);
  const hasMore = count < total;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && setCount((c) => c + PAGE_SIZE),
      { rootMargin: '600px 0px' } // start before the user reaches the end
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, count]);

  return { count, hasMore, sentinel };
}

/** A divided list of products with the stock button and tap-to-edit prices. */
export default function ProductList({ products, resetKey = '' }) {
  const { count, hasMore, sentinel } = useScrollPages(products.length, resetKey);
  const { setAvailability, pendingId } = useAvailabilityToggle();
  const { upsertProduct } = useShopData();
  const { operator } = useSettings();
  const toast = useToast();
  // Only one card edits prices at a time: { id, key } of the tapped price.
  const [editing, setEditing] = useState(null);

  const savePrices = async (product, values) => {
    const prices = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === '' ? null : Number(v)]));
    if (Object.values(prices).some((v) => v !== null && !Number.isFinite(v))) {
      toast.error('ભાવ સાચો આંકડો હોવો જોઈએ.');
      return false;
    }
    if (Object.entries(prices).every(([k, v]) => v === product[k])) {
      setEditing(null);
      return true;
    }
    try {
      const { product: updated } = await productApi.update(product._id, { ...product, ...prices, updatedBy: operator || '' });
      upsertProduct(updated);
      setEditing(null);
      toast.success(`${updated.nameGujarati}ના ભાવ અપડેટ થયા`);
      return true;
    } catch (err) {
      toast.error(err.fields?.sellingPrices || err.message);
      return false;
    }
  };

  return (
    <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
      {products.slice(0, count).map((p) => (
        <ProductRow
          key={p._id}
          product={p}
          onToggle={setAvailability}
          toggling={pendingId === p._id}
          editingKey={editing?.id === p._id ? editing.key : null}
          onEditPrices={(product, key) => setEditing({ id: product._id, key })}
          onSavePrices={savePrices}
          onCancelEdit={() => setEditing(null)}
        />
      ))}
      {hasMore && (
        <div ref={sentinel} className="flex items-center gap-2 px-4 py-4" role="status" aria-label="વધુ વસ્તુઓ લોડ થઈ રહી છે">
          <Bone className="size-2.5 rounded-full" />
          <Bone className="h-5 w-32" />
          <span className="ml-auto text-[12px] text-subtle">
            <span className="num">{count}</span> / <span className="num">{products.length}</span>
          </span>
        </div>
      )}
    </div>
  );
}
