import { Link } from 'react-router-dom';
import { NotificationList } from '@/features/notification/notification-list';

export function NotificationsPage() {
  return (
    <div className="col">
      <Link to="/profile" style={{ fontSize: 13 }}>
        ← Hồ sơ
      </Link>
      <NotificationList />
    </div>
  );
}
