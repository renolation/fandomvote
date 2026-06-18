import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/auth-context';

// Client guard CHỈ là UX — backend mới thực thi quyền (§2 web.CLAUDE.md).
export function RequireAuth() {
  const { isAuthed } = useAuth();
  const loc = useLocation();
  if (!isAuthed) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <Outlet />;
}

export function RequireAdmin() {
  const { isAuthed, isAdmin } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
