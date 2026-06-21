import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber, formatVnd } from '@/lib/format';
import { useCampaignResult, useMyReceipt } from './use-campaign';

export function ResultView({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error, refetch } = useCampaignResult(campaignId);
  // Biên lai per-user: chỉ fetch khi có quỹ (fundVnd > 0) và user đã auth.
  const { data: myReceipt } = useMyReceipt(campaignId, !!data && data.fundVnd > 0);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { snapshot, fundVnd } = data;
  const isFund = fundVnd > 0;

  return (
    <div className="col">
      {isFund ? (
        <NeuCard style={{ background: 'var(--c-pink)', color: '#fff' }}>
          <strong>Quỹ quyên góp campaign</strong>
          <div className="mono" style={{ fontSize: 22, fontWeight: 700 }}>{formatVnd(fundVnd)}</div>
          <div style={{ fontSize: 12 }}>
            Tổng từ {formatNumber(data.receiptsCount)} người đóng góp · Quỹ Trái Tim Việt Nam 🇻🇳
          </div>
        </NeuCard>
      ) : (
        <NeuCard style={{ background: 'var(--c-green)', color: '#fff' }}>
          <strong>🎉 Đạt mục tiêu — Vote LED kích hoạt</strong>
        </NeuCard>
      )}

      {myReceipt && (
        <NeuCard flat>
          <strong>🧾 Biên lai của bạn</strong>
          <div className="spread" style={{ fontSize: 13, marginTop: 6 }}>
            <span className="muted">Gold đã vote</span>
            <span className="mono">{formatNumber(myReceipt.goldVoted)} 🟡</span>
          </div>
          <div className="spread" style={{ fontSize: 13 }}>
            <span className="muted">Đóng góp (×{myReceipt.donationRatioBps / 100}%)</span>
            <span className="mono" style={{ fontWeight: 700, color: 'var(--c-pink)' }}>{formatVnd(myReceipt.donatedVnd)}</span>
          </div>
          <div className="mono muted" style={{ fontSize: 11, marginTop: 4 }}>{myReceipt.receiptNo}</div>
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
