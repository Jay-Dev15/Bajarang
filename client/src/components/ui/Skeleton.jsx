// Grey placeholder shapes shown while data loads, laid out like the real content
// so the page doesn't jump when it arrives.

export function Bone({ className = '' }) {
  return <span className={`block animate-pulse rounded-md bg-line/80 ${className}`} />;
}

/** Placeholder for one product card: name line, price boxes, purchase line. */
function ProductCardSkeleton({ prices }) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-2">
        <Bone className="size-2.5 rounded-full" />
        <Bone className="h-5 w-32" />
        <Bone className="ml-auto size-8 rounded-lg" />
        <Bone className="size-8 rounded-lg" />
      </div>
      <div
        className="mt-3 grid gap-px overflow-hidden rounded-xl border border-line bg-line"
        style={{ gridTemplateColumns: `repeat(${prices}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: prices }, (_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 bg-surface py-2.5">
            <Bone className="h-3 w-12" />
            <Bone className="h-5 w-14" />
          </div>
        ))}
      </div>
      <Bone className="mt-2.5 h-3.5 w-24" />
    </div>
  );
}

export function ProductListSkeleton({ count = 4 }) {
  return (
    <div
      className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface"
      role="status"
      aria-label="ભાવ યાદી લોડ થઈ રહી છે"
    >
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} prices={[4, 2, 3, 2][i % 4]} />
      ))}
    </div>
  );
}

/** Row of chip/tab placeholders (categories, purchase places). */
export function ChipsSkeleton({ count = 5 }) {
  return (
    <div className="flex gap-2 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} className={`h-9 shrink-0 rounded-[10px] ${i === 0 ? 'w-16' : 'w-20'}`} />
      ))}
    </div>
  );
}

/** A card with simple text rows (purchase list, categories). */
export function RowsSkeleton({ rows = 6, header = true, label = 'લોડ થઈ રહ્યું છે' }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface" role="status" aria-label={label}>
      {header && (
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/50 px-4 py-3">
          <Bone className="h-5 w-24" />
          <Bone className="ml-auto size-7 rounded-lg" />
        </div>
      )}
      <div className="divide-y divide-line">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Bone className={`h-4 ${['w-28', 'w-40', 'w-24', 'w-36'][i % 4]}`} />
            <Bone className="ml-auto size-6 rounded-lg" />
            <Bone className="size-6 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Dashboard: the 2 × 2 stat tiles. */
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line" aria-hidden="true">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-surface px-4 py-3.5">
          <Bone className="h-3.5 w-20" />
          <Bone className="mt-2 h-7 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Product form: name, category and price fields. */
export function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" role="status" aria-label="વસ્તુની માહિતી લોડ થઈ રહી છે">
      {[3, 5].map((fields, s) => (
        <div key={s} className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4">
          {Array.from({ length: fields }, (_, i) => (
            <div key={i}>
              <Bone className="h-3.5 w-20" />
              <Bone className="mt-2 h-11 w-full rounded-[var(--radius-control)]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
