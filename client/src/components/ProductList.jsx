import { useState } from 'react';
import ProductRow from './ProductRow';
import PriceHistoryModal from './PriceHistoryModal';
import { useAvailabilityToggle } from '../hooks/useAvailabilityToggle';

/** A divided list of products with stock toggle and price-history panel. */
export default function ProductList({ products }) {
  const [historyFor, setHistoryFor] = useState(null);
  const { setAvailability, pendingId } = useAvailabilityToggle();

  return (
    <>
      <div className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
        {products.map((p) => (
          <div key={p._id}>
            <ProductRow
              product={p}
              onToggle={setAvailability}
              toggling={pendingId === p._id}
              onHistory={setHistoryFor}
            />
          </div>
        ))}
      </div>
      <PriceHistoryModal product={historyFor} onClose={() => setHistoryFor(null)} />
    </>
  );
}
