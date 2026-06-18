import { NavLink, Outlet } from 'react-router-dom';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/features/auth/auth-context';
import { useBalance } from '@/features/wallet/use-wallet';
import { NotificationBell } from '@/features/notification/notification-bell';

const TABS = [
  { to: '/', label: '🗳️ Vote', end: true },
  { to: '/shop', label: '🛒 Shop', end: false },
  { to: '/profile', label: '👤 Hồ sơ', end: false },
];

const navBtn = (active: boolean): React.CSSProperties => ({
  border: '3px solid var(--c-ink)',
  borderRadius: 10,
  padding: '9px 18px',
  fontWeight: 700,
  fontSize: 14,
  fontFamily: 'var(--font-head)',
  textDecoration: 'none',
  color: 'var(--c-ink)',
  background: active ? 'var(--c-yellow)' : 'var(--c-white)',
  boxShadow: active ? '3px 3px 0 var(--c-ink)' : 'none',
});

const WALLET = [
  { key: 'green' as const, bg: '#22C55E', fg: '#fff', icon: '🟢' },
  { key: 'gold' as const, bg: '#FFD60A', fg: '#0a0a0a', icon: '🟡' },
  { key: 'diamond' as const, bg: '#3B82F6', fg: '#fff', icon: '💎' },
];

// Desktop top-nav 1200px (theo FandomVote Web design §nav).
export function AppLayout() {
  const { user, isAdmin } = useAuth();
  const { data: balance } = useBalance();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-cream)' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: 'var(--c-navbg)',
          borderBottom: '3px solid var(--c-ink)',
          height: 74,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
        }}
      >
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 22, padding: 0 }}>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: 'inherit' }}>
            <div
              style={{
                width: 42,
                height: 42,
                background: 'var(--c-yellow)',
                border: '3px solid var(--c-ink)',
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-head)',
                fontWeight: 700,
                fontSize: 15,
                boxShadow: '3px 3px 0 var(--c-ink)',
              }}
            >
              FDV
            </div>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>FandomVote</span>
          </NavLink>

          <nav style={{ display: 'flex', gap: 9, flex: 1 }}>
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} style={({ isActive }) => navBtn(isActive)}>
                {t.label}
              </NavLink>
            ))}
            {isAdmin && (
              <NavLink to="/admin" style={({ isActive }) => navBtn(isActive)}>
                ⚙️ Admin
              </NavLink>
            )}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            {user && balance ? (
              <>
                {WALLET.map((w) => (
                  <span key={w.key} className="wallet-pill" style={{ background: w.bg, color: w.fg }}>
                    {w.icon} {formatNumber(balance[w.key])}
                  </span>
                ))}
                <NotificationBell />
                <div style={stripeStyle(colorForId(user.id), 42)} title={user.displayName} />
              </>
            ) : (
              <NavLink to="/login" style={navBtn(false)}>
                Đăng nhập
              </NavLink>
            )}
          </div>
        </div>
      </header>

      <main className="container" style={{ padding: '28px 24px 60px' }}>
        <Outlet />
      </main>
    </div>
  );
}
