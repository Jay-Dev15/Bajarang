import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, PackageCheck, PackageX } from 'lucide-react';
import Button from './ui/Button';
import { formatPrice, hasPrice } from '../utils/format';
import { PRICE_FIELDS, WEIGHT_PRICES } from '../utils/constants';
import { applyWeightAutofill } from '../utils/priceAutofill';

/** The prices this product uses and has not hidden (e.g. just "1 કિલો", or just "1 નંગ"). */
const visibleFields = (product) => {
  const hidden = product.hiddenPrices || [];
  return PRICE_FIELDS.filter(({ key }) => hasPrice(product[key]) && !hidden.includes(key));
};

const gridStyle = (cols) => ({ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` });
// Up to 4 prices sit in one row; a 5th (the piece price) gets its own row.
const cellStyle = (i, cols) => (i === 4 ? { gridColumn: `span ${cols}` } : undefined);

/** Tap any price to edit the prices right in the card. */
function PriceGrid({ product, out, onEdit }) {
  const items = visibleFields(product);
  if (items.length === 0) {
    return <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[14px] text-muted">ભાવ લખેલો નથી</p>;
  }
  const cols = Math.min(items.length, 4);
  const big = cols <= 3;
  return (
    <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-line bg-line" style={gridStyle(cols)}>
      {items.map(({ key, label }, i) => (
        <button
          key={key}
          type="button"
          onClick={() => onEdit?.(key)}
          disabled={!onEdit}
          aria-label={`${product.nameGujarati} ${label}: ${formatPrice(product[key])}, ભાવ બદલો`}
          className="bg-surface px-1.5 py-2 text-center transition-colors enabled:hover:bg-surface-2"
          style={cellStyle(i, cols)}
        >
          <span className="block text-[12px] font-medium text-muted">{label}</span>
          <span
            className={`num mt-0.5 block font-bold leading-tight ${big ? 'text-[21px]' : 'text-[18px]'} ${
              out ? 'text-muted line-through decoration-1' : 'text-ink'
            }`}
          >
            {formatPrice(product[key])}
          </span>
        </button>
      ))}
    </div>
  );
}

const WEIGHT_KEYS = new Set(WEIGHT_PRICES.map((w) => w.key));

/**
 * Inline price editor. Typing a weight price auto-fills the other weight boxes
 * you have not typed in (same rule as the product form); boxes you type in keep
 * your own price.
 */
function PriceEditor({ product, focusKey, onSave, onCancel }) {
  const items = visibleFields(product);
  const keys = items.map((i) => i.key);
  const [values, setValues] = useState(() =>
    Object.fromEntries(keys.map((k) => [k, String(product[k])]))
  );
  const [manualOrder, setManualOrder] = useState([]);
  const [saving, setSaving] = useState(false);
  const cols = Math.min(items.length, 4);

  const change = (key, raw) => {
    const value = raw.replace(/[^\d.]/g, '');
    if (!WEIGHT_KEYS.has(key)) return setValues((v) => ({ ...v, [key]: value }));
    const order = manualOrder.includes(key) ? manualOrder : [...manualOrder, key];
    setManualOrder(order);
    // Only fill the boxes shown on this card.
    const filled = applyWeightAutofill({ ...values, [key]: value }, order.filter((k) => keys.includes(k)));
    setValues((v) => ({ ...v, ...Object.fromEntries(keys.map((k) => [k, k === key ? value : filled[k] ?? v[k]])) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const done = await onSave(product, values);
    if (!done) setSaving(false);
  };

  return (
    <form onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onCancel()} className="mt-3">
      <div className="grid gap-px overflow-hidden rounded-xl border border-focus bg-line" style={gridStyle(cols)}>
        {items.map(({ key, label }, i) => (
          <label key={key} className="bg-surface px-1.5 py-1.5 text-center" style={cellStyle(i, cols)}>
            <span className="block text-[12px] font-medium text-muted">{label}</span>
            <span className="mt-0.5 flex items-center justify-center rounded-lg border border-line-strong px-1.5 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/30">
              <span className="text-[14px] text-muted">₹</span>
              <input
                value={values[key]}
                onChange={(e) => change(key, e.target.value)}
                onFocus={(e) => e.target.select()}
                autoFocus={key === focusKey}
                inputMode="decimal"
                enterKeyHint="done"
                aria-label={`${product.nameGujarati} ${label}`}
                className="num h-9 w-full min-w-0 bg-transparent text-center text-[18px] font-bold focus:outline-none"
              />
            </span>
          </label>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={onCancel} disabled={saving}>
          રદ કરો
        </Button>
        <Button type="submit" size="sm" className="flex-1" loading={saving}>
          સાચવો
        </Button>
      </div>
    </form>
  );
}

/**
 * One product in the price list. Selling prices are the visual focus.
 */
export default function ProductRow({ product, onToggle, toggling, editingKey, onEditPrices, onSavePrices, onCancelEdit }) {
  const out = !product.isAvailable;
  const StockIcon = out ? PackageCheck : PackageX;

  return (
    <article className={`px-4 py-3.5 ${out ? 'bg-surface-2/60' : ''}`}>
      <div className="flex items-center gap-2">
        <h3 className={`flex min-w-0 flex-1 items-center gap-2 text-[18px] font-semibold leading-snug ${out ? 'text-muted' : 'text-ink'}`}>
          <span
            className={`size-2.5 shrink-0 rounded-full ${out ? 'bg-danger' : 'bg-ok'}`}
            role="img"
            aria-label={out ? 'સ્ટોક નથી' : 'સ્ટોકમાં છે'}
          />
          <span className="min-w-0">{product.nameGujarati}</span>
          {product.isSample && (
            <span className="shrink-0 rounded bg-warn-soft px-1.5 py-px text-[11px] font-semibold text-warn">નમૂનો</span>
          )}
        </h3>
        {onToggle && (
          <button
            type="button"
            onClick={() => onToggle(product, out)}
            disabled={toggling}
            aria-label={out ? `${product.nameGujarati}: સ્ટોકમાં કરો` : `${product.nameGujarati}: સ્ટોક બહાર કરો`}
            title={out ? 'સ્ટોકમાં કરો' : 'સ્ટોક બહાર કરો'}
            className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-surface-2 disabled:opacity-50 ${
              out ? 'text-ok' : 'text-danger'
            }`}
          >
            <StockIcon className="size-[19px]" />
          </button>
        )}
        <Link
          to={`/products/${product._id}/edit`}
          aria-label={`${product.nameGujarati}: ફેરફાર કરો`}
          title="ફેરફાર કરો"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        >
          <Pencil className="size-[17px]" />
        </Link>
      </div>

      {editingKey ? (
        <PriceEditor product={product} focusKey={editingKey} onSave={onSavePrices} onCancel={onCancelEdit} />
      ) : (
        <PriceGrid product={product} out={out} onEdit={onEditPrices && ((key) => onEditPrices(product, key))} />
      )}

      {hasPrice(product.purchasePricePerKg) && (
        <p className="mt-2 truncate text-[13px] leading-snug text-muted">
          ખરીદ <span className="num font-semibold text-ink">{formatPrice(product.purchasePricePerKg)}</span>/કિલો
        </p>
      )}
    </article>
  );
}
