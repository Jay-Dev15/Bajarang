import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchBar from '../components/SearchBar';
import CategoryChips from '../components/CategoryChips';
import ProductList from '../components/ProductList';
import Button from '../components/ui/Button';
import { SelectInput } from '../components/ui/Field';
import { PageLoader, ErrorState, EmptyState } from '../components/ui/States';
import { useShopData } from '../context/ShopDataContext';
import { filterProducts } from '../utils/products';
import { SORT_OPTIONS, STATUS_FILTERS } from '../utils/constants';

export default function ProductsPage() {
  const { products, categories, status, error, refresh } = useShopData();
  const [params, setParams] = useSearchParams();

  // The search box keeps its own state so fast typing / Gujarati keyboards never
  // lose characters; the URL is updated afterwards (keeps search on back/refresh).
  const [search, setSearch] = useState(() => params.get('q') || '');
  const category = params.get('category') || '';
  const stockStatus = params.get('status') || '';
  const sort = params.get('sort') || 'name';

  const setParam = (key, value) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') !== search) setParam('q', search);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const clearFilters = () => {
    setSearch('');
    setParams({}, { replace: true });
  };

  const results = useMemo(
    () => filterProducts(products, { search, category, status: stockStatus, sort }),
    [products, search, category, stockStatus, sort]
  );
  const hasFilters = Boolean(search || category || stockStatus);

  return (
    <>
      <PageHeader
        title="ભાવ યાદી"
        subtitle={status === 'ready' ? `કુલ ${products.length} વસ્તુઓ` : undefined}
        actions={
          <Button to="/products/new" icon={Plus}>
            નવી વસ્તુ
          </Button>
        }
      />

      {/* Sticky search & filters so they stay reachable while scrolling */}
      <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-line/0 bg-bg/95 px-4 pb-3 pt-1 backdrop-blur">
        <SearchBar value={search} onChange={setSearch} />
        <div className="mt-3">
          <CategoryChips
            categories={categories}
            products={products}
            selected={category}
            onSelect={(id) => setParam('category', id)}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex flex-1 rounded-[var(--radius-control)] border border-line-strong bg-surface p-1" role="group" aria-label="સ્ટોક">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setParam('status', f.value)}
                aria-pressed={stockStatus === f.value}
                className={`h-9 flex-1 rounded-lg px-2 text-[14px] font-medium transition-colors ${
                  stockStatus === f.value ? 'bg-brand-soft text-brand-text' : 'text-muted hover:text-ink'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="w-[42%] max-w-52">
            <SelectInput
              value={sort}
              onChange={(e) => setParam('sort', e.target.value === 'name' ? '' : e.target.value)}
              aria-label="ક્રમ"
              className="!h-11 text-[14px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectInput>
          </div>
        </div>
      </div>

      {status === 'loading' && <PageLoader />}
      {status === 'error' && <ErrorState message={error?.message} onRetry={() => refresh().catch(() => {})} />}

      {status === 'ready' && (
        <>
          {hasFilters && (
            <div className="mb-2 flex items-center justify-between text-[14px] text-muted">
              <span>
                <span className="num font-semibold text-ink">{results.length}</span> વસ્તુ મળી
              </span>
              <button type="button" onClick={clearFilters} className="font-semibold text-brand-text">
                ફિલ્ટર સાફ કરો
              </button>
            </div>
          )}

          {results.length > 0 ? (
            <ProductList products={results} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="હજી કોઈ વસ્તુ નથી"
              message="પહેલી વસ્તુ ઉમેરો અને તેના ભાવ લખો."
              action={<Button to="/products/new" icon={Plus}>નવી વસ્તુ ઉમેરો</Button>}
            />
          ) : (
            <EmptyState
              icon={PackageSearch}
              title={search ? `“${search}” મળી નથી` : 'આ ફિલ્ટરમાં કોઈ વસ્તુ નથી'}
              message={search ? 'જોડણી તપાસો અથવા આ નામે નવી વસ્તુ ઉમેરો.' : 'બીજી કેટેગરી અથવા ફિલ્ટર પસંદ કરો.'}
              action={
                search ? (
                  <Button to={`/products/new?name=${encodeURIComponent(search)}`} icon={Plus}>
                    “{search}” ઉમેરો
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={clearFilters}>
                    ફિલ્ટર સાફ કરો
                  </Button>
                )
              }
            />
          )}
        </>
      )}
    </>
  );
}
