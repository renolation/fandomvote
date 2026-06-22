import { Link } from 'react-router-dom';
import { useUnreadCount } from './use-notification';

// Box-button 42px viền đen + badge góc pink (FandomVote Web design §nav).
export function NotificationBell() {
  const { data } = useUnreadCount();
  const count = data?.count ?? 0;
  return (
    <Link
      to="/notifications"
      aria-label="Thông báo"
      style={{
        position: 'relative',
        width: 42,
        height: 42,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--c-white)',
        border: '3px solid var(--c-ink)',
        borderRadius: 10,
        boxShadow: '3px 3px 0 var(--c-ink)',
        textDecoration: 'none',
        fontSize: 16,
      }}
    >
      🔔
      {count > 0 && (
        <span
          className="mono"
          style={{
            position: 'absolute',
            top: -7,
            right: -7,
            background: 'var(--c-pink)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 10,
            border: '2px solid var(--c-ink)',
            borderRadius: 6,
            padding: '0 4px',
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
