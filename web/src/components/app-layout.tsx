import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { NotificationBell } from '@/features/notification/notification-bell';

const TABS = [
  { to: '/', label: '🗳️ Vote', end: true },
  { to: '/shop', label: '🛒 Shop', end: false },
  { to: '/profile', label: '👤 Profile', end: false },
];

// User web mô phỏng app: max-width ~480px (§9). Bottom tab nav.
export function AppLayout() {
  const { user, isAdmin } = useAuth();
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header
        className="spread"
        style={{
          padding: '12px 16px',
          borderBottom: 'var(--border-thin)',
          position: 'sticky',
          top: 0,
          background: 'var(--c-cream)',
          zIndex: 10,
        }}
      >
        <strong style={{ fontFamily: 'var(--font-head)' }}>FandomVote</strong>
        <div className="row">
          {isAdmin && (
            <NavLink to="/admin" className="neu-pill" style={{ textDecoration: 'none' }}>
              ⚙️ Admin
            </NavLink>
          )}
          <NotificationBell />
          <span className="muted" style={{ fontSize: 13 }}>
            {user?.displayName}
          </span>
        </div>
      </header>

      <main style={{ flex: 1, padding: 16, paddingBottom: 84 }}>
        <Outlet />
      </main>

      <nav
        style={{
          position: 'sticky',
          bottom: 0,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          borderTop: 'var(--border)',
          background: 'var(--c-white)',
        }}
      >
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            style={({ isActive }) => ({
              padding: '14px 0',
              textAlign: 'center',
              fontWeight: 700,
              fontFamily: 'var(--font-head)',
              textDecoration: 'none',
              color: 'var(--c-ink)',
              background: isActive ? 'var(--c-yellow)' : 'transparent',
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
