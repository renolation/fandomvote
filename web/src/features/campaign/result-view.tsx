import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber, formatVnd } from '@/lib/format';
import { useCampaignResult } from './use-campaign';

export function ResultView({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error, refetch } = useCampaignResult(campaignId);
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { snapshot, receipt } = data;
  return (
    <div className="col">
      {receipt ? (
        <NeuCard style={{ background: 'var(--c-pink)', color: '#fff' }}>
          <strong>Quỹ quyên góp</strong>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>
            {formatVnd(receipt.fundVnd)}
          </div>
          <div style={{ fontSize: 12 }}>
            Biên lai {receipt.receiptNo} · từ {formatNumber(receipt.goldTotal)} Gold ×{' '}
            {receipt.donationRatioBps / 100}%
          </div>
        </NeuCard>
      ) : (
        <NeuCard style={{ background: 'var(--c-green)', color: '#fff' }}>
          <strong>🎉 Đạt mục tiêu — Vote LED kích hoạt</strong>
        </NeuCard>
      )}

      <strong>Bảng xếp hạng chốt</strong>
      {snapshot.map((s) => (
        <NeuCard key={s.id} flat>
          <div className="spread">
            <span>
              <b className="mono">#{s.rank}</b>
            </span>
            <span className="mono">{formatNumber(s.totalVotes)} ⭐</span>
          </div>
        </NeuCard>
      ))}
    </div>
  );
}
