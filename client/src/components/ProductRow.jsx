import { Link } from 'react-router-dom';
import { History, Pencil } from 'lucide-react';
import { StatusBadge } from './ui/States';
import Toggle from './ui/Toggle';
import { formatPrice, timeAgo, formatDateTime, hasPrice } from '../utils/format';
import { PRICE_FIELDS } from '../utils/constants';
import { useShopData } from '../context/ShopDataContext';

/**
 * Only the prices this product uses and has not hidden (e.g. just "1 કિલો", or just "1 નંગ").
 * Up to 4 prices sit in one row; a 5th (the piece price) gets its own row.
 */
function PriceGrid({ product, out }) {
  const hidden = product.hiddenPrices || [];
  const items = PRICE_FIELDS.filter(({ key }) => hasPrice(product[key]) && !hidden.includes(key));
  if (items.length === 0) {
    return <p className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-[14px] text-muted">ભાવ લખેલો નથી</p>;
  }
  const cols = Math.min(items.length, 4);
  const big = cols <= 3;
  return (
    <dl
      className="mt-3 grid gap-px overflow-hidden rounded-xl border border-line bg-line"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {items.map(({ key, label }, i) => (
        <div
          key={key}
          className="bg-surface px-1.5 py-2 text-center"
          style={i === 4 ? { gridColumn: `span ${cols}` } : undefined}
        >
          <dt className="text-[12px] font-medium text-muted">{label}</dt>
          <dd
            className={`num mt-0.5 font-bold leading-tight ${big ? 'text-[21px]' : 'text-[18px]'} ${
              out ? 'text-muted line-through decoration-1' : 'text-ink'
            }`}
          >
            {formatPrice(product[key])}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * One product in the price list. Selling prices are the visual focus.
 */
export default function ProductRow({ product, onToggle, toggling, onHistory }) {
  const { categoryName } = useShopData();
  const out = !product.isAvailable;

  return (
    <article className={`px-4 py-3.5 ${out ? 'bg-surface-2/60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className={`text-[18px] font-semibold leading-snug ${out ? 'text-muted' : 'text-ink'}`}>
            {product.nameGujarati}
          </h3>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {product.nameEnglish && <span>{product.nameEnglish} · </span>}
            {categoryName(product.categoryId)}
            {product.isSample && (
              <span className="ml-1.5 rounded bg-warn-soft px-1.5 py-px text-[11px] font-semibold text-warn">નમૂનો</span>
            )}
          </p>
        </div>
        <StatusBadge available={product.isAvailable} size="sm" />
      </div>

      <PriceGrid product={product} out={out} />

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 text-[13px] leading-snug text-muted">
          {hasPrice(product.purchasePricePerKg) && (
            <p className="truncate">
              ખરીદ <span className="num font-semibold text-ink">{formatPrice(product.purchasePricePerKg)}</span>/કિલો
            </p>
          )}
          <p className="truncate" title={`છેલ્લે અપડેટ: ${formatDateTime(product.updatedAt)}`}>
            {timeAgo(product.updatedAt)}
            {product.lastUpdatedBy && <span> · {product.lastUpdatedBy}</span>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {onToggle && (
            <Toggle
              size="sm"
              checked={product.isAvailable}
              disabled={toggling}
              onChange={(v) => onToggle(product, v)}
              label={product.isAvailable ? `${product.nameGujarati}: સ્ટોક બહાર કરો` : `${product.nameGujarati}: સ્ટોકમાં કરો`}
            />
          )}
          {onHistory && (
            <button
              type="button"
              onClick={() => onHistory(product)}
              className="ml-2 flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
              aria-label={`${product.nameGujarati}: ભાવમાં ફેરફાર`}
              title="ભાવમાં ફેરફાર"
            >
              <History className="size-[19px]" />
            </button>
          )}
          <Link
            to={`/products/${product._id}/edit`}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-brand-soft px-3 text-[14px] font-semibold text-brand-text hover:brightness-95"
            aria-label={`${product.nameGujarati}: ફેરફાર કરો`}
          >
            <Pencil className="size-4" />
            ફેરફાર
          </Link>
        </div>
      </div>
    </article>
  );
}
