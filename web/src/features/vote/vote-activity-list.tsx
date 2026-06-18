import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { formatDateTime, formatNumber } from '@/lib/format';
import { useVoteActivity } from './use-vote';

export function VoteActivityList() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useVoteActivity();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <EmptyState message="Chưa có hoạt động vote." />;

  return (
    <div className="col">
      {items.map((v) => (
        <NeuCard key={v.id} flat>
          <div className="spread">
            <div>
              <NeuPill>{v.currency}</NeuPill>{' '}
              <span className="mono">{formatNumber(v.amount)} phiếu</span>
              {v.isReversal && <span style={{ color: 'var(--c-pink)' }}> (hoàn)</span>}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              {formatDateTime(v.createdAt)}
            </span>
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
