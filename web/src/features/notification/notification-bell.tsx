import { Link } from 'react-router-dom';
import { useUnreadCount } from './use-notification';

export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  return (
    <Link to="/notifications" className="neu-pill" style={{ textDecoration: 'none' }}>
      🔔
      {count > 0 && <b style={{ color: 'var(--c-pink)' }}>{count > 99 ? '99+' : count}</b>}
    </Link>
  );
}
