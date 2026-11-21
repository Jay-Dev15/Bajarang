import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PackageSearch, ChevronRight, RefreshCw } from 'lucide-react';
import Logo from '../components/Logo';
import SearchBar from '../components/SearchBar';
import CategoryChips from '../components/CategoryChips';
import ProductList from '../components/ProductList';
import Button from '../components/ui/Button';
import { PageLoader, ErrorState, EmptyState } from '../components/ui/States';
import { useShopData } from '../context/ShopDataContext';
import { useSettings } from '../context/SettingsContext';
import { filterProducts } from '../utils/products';
import { formatTime } from '../utils/format';

const SEARCH_PREVIEW = 6;
const RECENT_COUNT = 5;

function Stat({ label, value, to, tone }) {
  const toneCls = tone === 'danger' ? 'text-danger' : tone === 'ok' ? 'text-ok' : 'text-ink';
  return (
    <Link to={to} className="flex flex-col justify-between bg-surface px-4 py-3 transition-colors hover:bg-surface-2">
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <span className={`num mt-1 text-[26px] font-bold leading-none ${toneCls}`}>{value}</span>
    </Link>
  );
}

export default function DashboardPage() {
  const { products, categories, status, error, refresh, lastSyncedAt } = useShopData();
  const { operator } = useSettings();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const available = products.filter((p) => p.isAvailable).length;
    return {
      total: products.length,
      categories: categories.filter((c) => c.isActive).length,
      available,
      out: products.length - available,
    };
  }, [products, categories]);

  const searchResults = useMemo(() => (search ? filterProducts(products, { search }) : []), [products, search]);
  const recent = useMemo(
    () => [...products].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, RECENT_COUNT),
    [products]
  );

  const manualRefresh = async () => {
    setRefreshing(true);
    await refresh().catch(() => {});
    setRefreshing(false);
  };

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <div>
          <Logo className="h-16 w-auto" />
          {lastSyncedAt && (
            <p className="mt-1.5 text-[12px] text-muted">
              {operator ? `નમસ્તે ${operator} · ` : ''}ભાવ {formatTime(lastSyncedAt)} વાગ્યે અપડેટ થયા
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={manualRefresh}
          className="flex size-10 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
          aria-label="ભાવ ફરી લાવો"
        >
          <RefreshCw className={`size-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </header>

      <SearchBar value={search} onChange={setSearch} placeholder="ભાવ જોવા વસ્તુ શોધો…" />

      {status === 'loading' && <PageLoader />}
      {status === 'error' && <ErrorState message={error?.message} onRetry={manualRefresh} />}

      {status === 'ready' && search && (
        <section className="mt-4">
          {searchResults.length ? (
            <>
              <ProductList products={searchResults.slice(0, SEARCH_PREVIEW)} />
              {searchResults.length > SEARCH_PREVIEW && (
                <Link
                  to={`/products?q=${encodeURIComponent(search)}`}
                  className="mt-3 flex items-center justify-center gap-1 text-[15px] font-semibold text-brand-text"
                >
                  બધાં {searchResults.length} પરિણામ જુઓ <ChevronRight className="size-4" />
                </Link>
              )}
            </>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title={`“${search}” મળી નથી`}
              action={
                <Button to={`/products/new?name=${encodeURIComponent(search)}`} icon={Plus}>
                  “{search}” ઉમેરો
                </Button>
              }
            />
          )}
        </section>
      )}

      {status === 'ready' && !search && (
        <>
          <section className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
            <Stat label="કુલ વસ્તુઓ" value={stats.total} to="/products" />
            <Stat label="કેટેગરી" value={stats.categories} to="/categories" />
            <Stat label="ઉપલબ્ધ વસ્તુઓ" value={stats.available} to="/products?status=available" tone="ok" />
            <Stat label="સ્ટોક બહાર" value={stats.out} to="/products?status=unavailable" tone={stats.out ? 'danger' : undefined} />
          </section>

          <section className="mt-6">
            <h2 className="mb-2.5 text-[16px] font-semibold">કેટેગરી પ્રમાણે જુઓ</h2>
            <CategoryChips
              categories={categories}
              products={products}
              showAll={false}
              linkTo={(id) => `/products?category=${id}`}
            />
          </section>

          <section className="mt-6">
            <div className="mb-2.5 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">તાજેતરમાં બદલાયેલ ભાવ</h2>
              <Link to="/products?sort=updated" className="flex items-center text-[14px] font-semibold text-brand-text">
                બધા જુઓ <ChevronRight className="size-4" />
              </Link>
            </div>
            {recent.length ? (
              <ProductList products={recent} />
            ) : (
              <EmptyState
                icon={PackageSearch}
                title="હજી કોઈ વસ્તુ નથી"
                message="પહેલી વસ્તુ ઉમેરો અને તેના ભાવ લખો."
                action={<Button to="/products/new" icon={Plus}>નવી વસ્તુ ઉમેરો</Button>}
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
