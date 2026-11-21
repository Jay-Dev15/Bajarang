import { useMemo } from 'react';
import { Link } from 'react-router-dom';

const chipBase =
  'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[14px] font-medium transition-colors';
const chipOn = 'border-brand bg-brand text-on-brand';
const chipOff = 'border-line-strong bg-surface text-ink hover:bg-surface-2';

// Scroll the chip row sideways (never the page) so the selected chip is visible.
function keepInView(el) {
  const row = el?.parentElement;
  if (!row) return;
  const left = el.offsetLeft - row.offsetLeft;
  if (left < row.scrollLeft || left + el.offsetWidth > row.scrollLeft + row.clientWidth) {
    row.scrollLeft = left - 16;
  }
}

/**
 * Horizontal scrolling category filter. Inactive categories are shown only if
 * they still contain products. Pass `onSelect` for a filter, or `linkTo` for links.
 */
export default function CategoryChips({ categories, products, selected = '', onSelect, linkTo, showAll = true }) {
  const counts = useMemo(() => {
    const m = new Map();
    for (const p of products) m.set(p.categoryId || 'none', (m.get(p.categoryId || 'none') || 0) + 1);
    return m;
  }, [products]);

  // Hide empty categories (nothing to filter) unless currently selected.
  const visible = categories.filter((c) => counts.get(c._id) || c._id === selected);
  const items = [
    ...(showAll ? [{ id: '', label: 'બધી', count: products.length }] : []),
    ...visible.map((c) => ({ id: c._id, label: c.nameGujarati, count: counts.get(c._id) || 0 })),
    ...(counts.get('none') ? [{ id: 'none', label: 'કેટેગરી વગર', count: counts.get('none') }] : []),
  ];

  return (
    <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((item) => {
        const active = selected === item.id;
        const content = (
          <>
            {item.label}
            <span className={`num text-[12px] ${active ? 'opacity-85' : 'text-muted'}`}>{item.count}</span>
          </>
        );
        return linkTo ? (
          <Link key={item.id || 'all'} to={linkTo(item.id)} className={`${chipBase} ${chipOff}`}>
            {content}
          </Link>
        ) : (
          <button
            key={item.id || 'all'}
            type="button"
            ref={active ? keepInView : undefined}
            onClick={() => onSelect(item.id)}
            aria-pressed={active}
            className={`${chipBase} ${active ? chipOn : chipOff}`}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
