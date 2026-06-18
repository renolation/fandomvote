import { NeuButton, NeuCard } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { formatDateTime } from '@/lib/format';
import { useMarkAllRead, useMarkRead, useNotifications } from './use-notification';

export function NotificationList() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications();
  const markRead = useMarkRead();
  const markAll = useMarkAllRead();

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <EmptyState message="Chưa có thông báo nào." />;

  return (
    <div className="col">
      <div className="spread">
        <strong>Thông báo</strong>
        <NeuButton size="sm" variant="ghost" onClick={() => markAll.mutate()}>
          Đọc tất cả
        </NeuButton>
      </div>
      {items.map((n) => (
        <NeuCard key={n.id} flat style={{ opacity: n.readAt ? 0.6 : 1 }}>
          <div className="spread">
            <strong>{n.title}</strong>
            {!n.readAt && (
              <NeuButton size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)}>
                ✓
              </NeuButton>
            )}
          </div>
          <div style={{ fontSize: 14 }}>{n.body}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {formatDateTime(n.createdAt)}
          </div>
        </NeuCard>
      ))}
      {hasNextPage && (
        <NeuButton variant="ghost" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
          Tải thêm
        </NeuButton>
      )}
    </div>
  );
}
