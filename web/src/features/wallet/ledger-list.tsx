import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { countdownLabel, formatDateTime, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useLedger } from './use-wallet';

export function LedgerList() {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLedger();
  const now = useNow(30_000);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const items = data?.pages.flatMap((p) => p.items) ?? [];
  if (items.length === 0) return <EmptyState message="Chưa có giao dịch." />;

  return (
    <div className="col">
      {items.map((r) => (
        <NeuCard key={r.id} flat>
          <div className="spread">
            <div>
              <NeuPill>{r.currency}</NeuPill>{' '}
              <span className="muted" style={{ fontSize: 12 }}>
                {r.source}
              </span>
            </div>
            <strong
              className="mono"
              style={{ color: r.amount >= 0 ? 'var(--c-green)' : 'var(--c-pink)' }}
            >
              {r.amount >= 0 ? '+' : ''}
              {formatNumber(r.amount)}
            </strong>
          </div>
          <div className="muted" style={{ fontSize: 12 }}>
            {formatDateTime(r.createdAt)}
            {r.currency === 'GREEN' && r.expiresAt && r.amount > 0 && (
              <> · hết hạn {countdownLabel(r.expiresAt, now)}</>
            )}
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
