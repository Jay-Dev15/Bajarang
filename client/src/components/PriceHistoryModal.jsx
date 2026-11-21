import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, History } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Spinner, EmptyState } from './ui/States';
import { productApi } from '../services/api';
import { formatDateTime, formatPrice } from '../utils/format';
import { PRICE_FIELDS } from '../utils/constants';

const cap = (k) => k[0].toUpperCase() + k.slice(1);
const ROWS = [
  ...PRICE_FIELDS.map(({ key, label }) => ({ prev: `previous${cap(key)}`, next: `new${cap(key)}`, label })),
  { prev: 'previousPurchasePricePerKg', next: 'newPurchasePricePerKg', label: 'ખરીદ ભાવ (કિલો)' },
];

function Change({ from, to }) {
  const up = from !== null && to !== null && to > from;
  const down = from !== null && to !== null && to < from;
  return (
    <span className="num flex items-center gap-1.5 text-[15px]">
      <span className="text-muted line-through decoration-1">{formatPrice(from)}</span>
      <span className="text-subtle">→</span>
      <span className="font-bold text-ink">{formatPrice(to)}</span>
      {up && <ArrowUp className="size-4 text-warn" aria-label="વધ્યો" />}
      {down && <ArrowDown className="size-4 text-ok" aria-label="ઘટ્યો" />}
    </span>
  );
}

/** Shows who changed which price and when. Only changed fields are listed. */
export default function PriceHistoryModal({ product, onClose }) {
  const [state, setState] = useState({ status: 'loading', items: [], error: null });

  useEffect(() => {
    if (!product) return undefined;
    let cancelled = false;
    setState({ status: 'loading', items: [], error: null });
    productApi
      .history(product._id)
      .then((items) => !cancelled && setState({ status: 'ready', items, error: null }))
      .catch((error) => !cancelled && setState({ status: 'error', items: [], error }));
    return () => {
      cancelled = true;
    };
  }, [product]);

  return (
    <Modal open={Boolean(product)} onClose={onClose} title={product ? `${product.nameGujarati} – ભાવમાં ફેરફાર` : ''}>
      {state.status === 'loading' && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}
      {state.status === 'error' && <p className="py-6 text-center text-danger">{state.error.message}</p>}
      {state.status === 'ready' && state.items.length === 0 && (
        <EmptyState icon={History} title="હજી સુધી ભાવ બદલાયો નથી" message="ભાવ બદલશો ત્યારે અહીં નોંધ દેખાશે." />
      )}
      {state.status === 'ready' && state.items.length > 0 && (
        <ol className="relative flex flex-col gap-4 border-l-2 border-line pl-4">
          {state.items.map((h) => {
            const changed = ROWS.filter((r) => (h[r.prev] ?? null) !== (h[r.next] ?? null));
            return (
              <li key={h._id} className="relative">
                <span className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-surface bg-brand" />
                <p className="text-[13px] text-muted">
                  {formatDateTime(h.updatedAt)}
                  {h.updatedBy && <span className="font-semibold text-ink"> · {h.updatedBy}</span>}
                </p>
                <dl className="mt-1.5 flex flex-col gap-1 rounded-xl bg-surface-2 px-3 py-2.5">
                  {changed.map((r) => (
                    <div key={r.label} className="flex items-center justify-between gap-3">
                      <dt className="text-[14px] text-muted">{r.label}</dt>
                      <dd>
                        <Change from={h[r.prev] ?? null} to={h[r.next] ?? null} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
        </ol>
      )}
    </Modal>
  );
}
