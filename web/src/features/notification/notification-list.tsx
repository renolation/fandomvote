import { NeuButton } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { relativeTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import type { NotificationType } from '@/types/api';
import { useMarkAllRead, useMarkRead, useNotifications } from './use-notification';

// Map loại thông báo → icon + màu nền tile.
const TYPE_META: Record<NotificationType, { icon: string; bg: string }> = {
  SYSTEM: { icon: '🔔', bg: '#22C55E' },
  VOTE: { icon: '⭐', bg: '#FFD60A' },
  CAMPAIGN: { icon: '🏆', bg: '#FFD60A' },
  REFERRAL: { icon: '🎁', bg: '#FB7185' },
  SHOP: { icon: '🛒', bg: '#3B82F6' },
  RESOLUTION: { icon: '🏁', bg: '#3B82F6' },
};

export function NotificationList() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();
  const now = useNow(30_000);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <EmptyState message="Chưa có thông báo nào." />;

  return (
    <div className="col" style={{ gap: 10 }}>
      <div className="spread">
        <strong>🔔 Thông báo</strong>
        <NeuButton size="sm" variant="ghost" onClick={() => markAll.mutate()}>
          Đọc tất cả
        </NeuButton>
      </div>
      {items.map((n) => {
        const meta = TYPE_META[n.type] ?? TYPE_META.SYSTEM;
        const unread = !n.readAt;
        return (
          <div
            key={n.id}
            onClick={() => unread && markRead.mutate(n.id)}
            style={{
              display: 'flex',
              gap: 11,
              background: unread ? '#FFF9E0' : 'var(--c-white)',
              border: '3px solid var(--c-ink)',
              borderRadius: 11,
              padding: '11px 13px',
              cursor: unread ? 'pointer' : 'default',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                flex: 'none',
                border: '2px solid var(--c-ink)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                background: meta.bg,
              }}
            >
              {meta.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, lineHeight: 1.4, fontWeight: unread ? 700 : 500 }}>{n.title}</div>
              <div style={{ fontSize: 13, color: '#444' }}>{n.body}</div>
              <div className="mono" style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                {relativeTime(n.createdAt, now)}
              </div>
            </div>
            {unread && <div style={{ width: 9, height: 9, flex: 'none', background: 'var(--c-pink)', border: '2px solid var(--c-ink)', borderRadius: '50%', marginTop: 4 }} />}
          </div>
        );
      })}
      {hasNextPage && (
        <NeuButton variant="ghost" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Tải thêm
        </NeuButton>
      )}
    </div>
  );
}
