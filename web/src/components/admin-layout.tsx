import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';
import { NeuButton } from './neu';

const LINKS = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/idols', label: 'Duyệt Idol', end: false },
  { to: '/admin/campaigns/new', label: 'Tạo Campaign', end: false },
];

// Admin desktop — sidebar mật độ cao, full width (§8/§9).
export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          borderRight: 'var(--border)',
          background: 'var(--c-white)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <h3 style={{ fontFamily: 'var(--font-head)' }}>FDV Admin</h3>
        {LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              border: 'var(--border-thin)',
              textDecoration: 'none',
              color: 'var(--c-ink)',
              fontWeight: 600,
              background: isActive ? 'var(--c-blue)' : 'var(--c-white)',
            })}
          >
            {l.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto' }} className="col">
          <NavLink to="/" style={{ fontSize: 13 }}>
            ← Về User web
          </NavLink>
          <span className="muted" style={{ fontSize: 12 }}>
            {user?.displayName}
          </span>
          <NeuButton
            size="sm"
            variant="pink"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            Đăng xuất
          </NeuButton>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
