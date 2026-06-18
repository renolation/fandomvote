import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useAuth } from '@/features/auth/auth-context';
import { usePendingIdols } from '@/features/admin/use-admin';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: '📊', end: true },
  { to: '/admin/review', label: 'Duyệt đề cử', icon: '✅', end: false, badge: true },
  { to: '/admin/campaigns', label: 'Campaign', icon: '🗳️', end: false },
  { to: '/admin/shop', label: 'Shop & Deals', icon: '🛒', end: false },
  { to: '/admin/events', label: 'Point Events', icon: '⚡', end: false },
  { to: '/admin/orders', label: 'Đơn hàng', icon: '📦', end: false },
  { to: '/admin/reconcile', label: 'Đối soát', icon: '💰', end: false },
  { to: '/admin/users', label: 'Người dùng', icon: '👥', end: false },
];

const TITLES: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/review': 'Duyệt đề cử idol',
  '/admin/campaigns': 'Quản lý Campaign',
  '/admin/campaigns/new': 'Tạo Campaign',
  '/admin/shop': 'Shop & Deals',
  '/admin/events': 'Point Events',
  '/admin/orders': 'Đơn hàng (Physical)',
  '/admin/reconcile': 'Đối soát',
  '/admin/users': 'Người dùng',
};

const navStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 11,
  width: '100%',
  padding: '11px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'var(--font-head)',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  color: 'var(--c-ink)',
  border: active ? '3px solid var(--c-ink)' : '3px solid transparent',
  background: active ? 'var(--c-yellow)' : 'transparent',
  boxShadow: active ? '3px 3px 0 var(--c-ink)' : 'none',
});

export function AdminLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const { data: pending } = usePendingIdols();
  const pendingCount = pending?.items.length ?? 0;
  const title = TITLES[pathname] ?? 'Admin';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--c-navbg)' }}>
      <aside
        style={{
          width: 252,
          flex: 'none',
          background: 'var(--c-white)',
          borderRight: '3px solid var(--c-ink)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div style={{ padding: 20, borderBottom: '3px solid var(--c-ink)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, background: 'var(--c-yellow)', border: '3px solid var(--c-ink)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, boxShadow: '3px 3px 0 var(--c-ink)' }}>
            FDV
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, lineHeight: 1.1 }}>FandomVote</div>
            <div className="mono" style={{ fontSize: 10, color: '#777', fontWeight: 600, letterSpacing: '.08em' }}>ADMIN CONSOLE</div>
          </div>
        </div>

        <nav style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 7, flex: 1, overflowY: 'auto' }}>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => navStyle(isActive)}>
              <span style={{ fontSize: 17, lineHeight: 1 }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.badge && pendingCount > 0 && (
                <span className="mono" style={{ fontWeight: 700, fontSize: 11, background: 'var(--c-pink)', color: '#fff', border: '2px solid var(--c-ink)', borderRadius: 6, padding: '0 6px' }}>
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 14, borderTop: '3px solid var(--c-ink)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={stripeStyle(colorForId(user?.id ?? 'a'), 36)} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.displayName}</div>
            <div className="mono" style={{ fontSize: 11, color: '#777' }}>{user?.role.toLowerCase()}</div>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: 70, flex: 'none', background: 'var(--c-navbg)', borderBottom: '3px solid var(--c-ink)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', position: 'sticky', top: 0, zIndex: 30 }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 23 }}>{title}</div>
          <NavLink to="/" className="neu-pill" style={{ textDecoration: 'none', padding: '8px 14px' }}>
            ← User web
          </NavLink>
        </header>
        <div style={{ flex: 1, padding: 28 }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
