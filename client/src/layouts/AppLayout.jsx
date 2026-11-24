import { NavLink, Outlet, Link } from 'react-router-dom';
import { House, ListOrdered, Plus, Tags, ShoppingBasket } from 'lucide-react';
import { useShopData } from '../context/ShopDataContext';

const NAV = [
  { to: '/', label: 'મુખ્ય', icon: House, end: true },
  { to: '/products', label: 'ભાવ યાદી', icon: ListOrdered },
  { to: '/purchase', label: 'ખરીદી', icon: ShoppingBasket },
  { to: '/categories', label: 'કેટેગરી', icon: Tags },
];

function OfflineBanner() {
  const { error, status } = useShopData();
  // Data is on screen (saved copy or older fetch) but the latest refresh failed.
  if (!error || status !== 'ready' || error.status === 401) return null;
  return (
    <div className="bg-warn-soft px-4 py-2 text-center text-[13px] font-medium text-warn" role="status">
      {error.code === 'NETWORK' ? 'સર્વર સાથે જોડાણ નથી' : 'નવા ભાવ લાવી શકાયા નહીં'} – દેખાતા ભાવ જૂના હોઈ શકે છે.
    </div>
  );
}

/**
 * Single mobile layout. On larger screens the same layout is simply centred
 * in a column no wider than 640px (see .app-column in index.css).
 */
export default function AppLayout() {
  return (
    <div className="app-column min-h-dvh">
      <OfflineBanner />
      <main className="px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-4">
        <Outlet />
      </main>

      <nav
        className="app-column pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur"
        aria-label="મુખ્ય મેનુ"
      >
        <div className="grid h-16 grid-cols-5">
          {NAV.slice(0, 2).map((item) => (
            <BottomItem key={item.to} {...item} />
          ))}
          <div className="flex items-center justify-center">
            <Link
              to="/products/new"
              className="flex size-12 items-center justify-center rounded-2xl bg-brand text-on-brand shadow-md shadow-brand/25 active:scale-95"
              aria-label="નવી વસ્તુ ઉમેરો"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </Link>
          </div>
          {NAV.slice(2).map((item) => (
            <BottomItem key={item.to} {...item} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function BottomItem({ to, label, icon: Icon, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 text-[12px] font-medium ${isActive ? 'text-brand-text' : 'text-muted'}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-brand-soft' : ''}`}>
            <Icon className="size-[21px]" strokeWidth={isActive ? 2.4 : 2} />
          </span>
          {label}
        </>
      )}
    </NavLink>
  );
}
