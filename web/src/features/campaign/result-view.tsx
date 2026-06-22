import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { colorForId } from '@/lib/avatar';
import { formatNumber, formatVnd } from '@/lib/format';
import { useCampaignResult, useMyReceipt } from './use-campaign';

export function ResultView({ campaignId }: { campaignId: string }) {
  const { data, isLoading, error, refetch } = useCampaignResult(campaignId);
  const isFund = !!data && data.fundVnd > 0;
  // Biên lai per-user chỉ fetch khi campaign có quỹ + user đã auth.
  const { data: myReceipt } = useMyReceipt(campaignId, isFund);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  const { campaign, snapshot, fundVnd } = data;
  const goal = campaign.starGoal;
  const winner = snapshot.find((s) => s.reachedValueAt) ?? null;
  const totalStars = snapshot.reduce((sum, s) => sum + s.totalVotes, 0);
  const pct = (n: number) => (goal > 0 ? Math.min(100, Math.round((n / goal) * 100)) : 0);

  // Outcome A: có idol đạt Star Goal → VOTE LED. B: có quỹ quyên góp (Gold ×ratio). C: không winner & không quỹ → an ủi.
  const outcome: 'A' | 'B' | 'C' = winner ? 'A' : fundVnd > 0 ? 'B' : 'C';

  return (
    <div className="col" style={{ gap: 20 }}>
      {outcome === 'A' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 30 }}>Đạt Star Goal!</div>
            <div style={{ fontSize: 14, color: '#185c33', fontWeight: 600, marginTop: 4 }}>
              Fandom đã hoàn thành mục tiêu. Vote LED được kích hoạt 🎤
            </div>
          </div>
          <div style={{ background: 'var(--c-ink)', border: '3px solid var(--c-ink)', borderRadius: 18, padding: 22 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, color: 'var(--c-yellow)', marginBottom: 14 }}>
              💡 VOTE LED · mở khoá
            </div>
            <div className="col" style={{ gap: 11 }}>
              {snapshot.map((s) => {
                const glow = colorForId(s.idolId);
                return (
                  <div key={s.id} className="row" style={{ gap: 12 }}>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 14, color: '#fff', width: 28 }}>#{s.rank}</span>
                    <div style={{ flex: 1, height: 16, background: '#222', border: `2px solid ${glow}`, borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct(s.totalVotes)}%`, background: glow, boxShadow: `0 0 10px ${glow}` }} />
                    </div>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 12, color: '#fff', width: 78, textAlign: 'right' }}>
                      {formatNumber(s.totalVotes)} ⭐
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {outcome === 'B' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 52 }}>💗</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26 }}>Chưa đạt mốc lần này</div>
            <div style={{ fontSize: 14, color: '#9a3050', fontWeight: 600, marginTop: 4 }}>
              Gold được quy đổi thành tiền ủng hộ Quỹ Trái Tim Việt Nam 🇻🇳
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {myReceipt ? (
              <NeuCard>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, borderBottom: '3px solid var(--c-ink)', paddingBottom: 11, marginBottom: 13 }}>
                  🧾 Biên lai của bạn
                </div>
                <div className="col" style={{ gap: 10, fontSize: 13 }}>
                  <div className="spread"><span className="muted">Gold của bạn</span><span className="mono" style={{ fontWeight: 700 }}>{formatNumber(myReceipt.goldVoted)} 🟡</span></div>
                  <div className="spread"><span className="muted">Tỉ lệ</span><span className="mono" style={{ fontWeight: 700 }}>×{(myReceipt.donationRatioBps / 10000).toFixed(2)}</span></div>
                  <div className="spread" style={{ borderTop: '2px dashed var(--c-ink)', paddingTop: 11 }}>
                    <span style={{ fontWeight: 700, fontFamily: 'var(--font-head)' }}>Đóng góp</span>
                    <span className="mono" style={{ fontWeight: 700, fontSize: 22, color: 'var(--c-pink)' }}>{formatVnd(myReceipt.donatedVnd)}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: '#999', textAlign: 'center' }}>{myReceipt.receiptNo}</div>
                </div>
              </NeuCard>
            ) : (
              <NeuCard flat>
                <div className="muted" style={{ fontSize: 13 }}>
                  Bạn chưa có biên lai trong campaign này (chỉ vote bằng Gold mới được quy đổi).
                </div>
              </NeuCard>
            )}
            <div style={{ background: 'var(--c-pink)', border: '3px solid var(--c-ink)', borderRadius: 16, boxShadow: '5px 5px 0 var(--c-ink)', padding: 20, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Tổng quỹ campaign này</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 32, marginTop: 6 }}>{formatVnd(fundVnd)}</div>
              <div style={{ fontSize: 12, marginTop: 6, opacity: 0.9 }}>từ {formatNumber(data.receiptsCount)} người · Quỹ Trái Tim Việt Nam 🇻🇳</div>
            </div>
          </div>
        </>
      )}

      {outcome === 'C' && (
        <>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 50 }}>🤍</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 26 }}>Gửi fandom thân yêu</div>
          </div>
          <NeuCard style={{ fontSize: 15, lineHeight: 1.7, color: '#333' }}>
            <p style={{ margin: '0 0 14px' }}>
              Idol của bạn chưa giành chiến thắng lần này, nhưng <strong>{formatNumber(totalStars)} sao</strong> mà các bạn
              gửi gắm là minh chứng cho một fandom tuyệt vời.
            </p>
            <p style={{ margin: '0 0 14px' }}>
              Mỗi lá phiếu đều được ghi nhận. Hành trình còn dài — và FandomVote luôn ở đây cùng các bạn cho mùa tiếp theo.
            </p>
            <p style={{ margin: 0, fontFamily: 'var(--font-head)', fontWeight: 700 }}>— Đội ngũ FandomVote 💛</p>
          </NeuCard>
        </>
      )}

      {/* Bảng xếp hạng chốt — luôn hiển thị để minh bạch kết quả */}
      <div>
        <strong>Bảng xếp hạng chốt</strong>
        <div className="col" style={{ marginTop: 8 }}>
          {snapshot.map((s) => (
            <NeuCard key={s.id} flat>
              <div className="spread">
                <span><b className="mono">#{s.rank}</b></span>
                <span className="mono">{formatNumber(s.totalVotes)} ⭐</span>
              </div>
            </NeuCard>
          ))}
        </div>
      </div>
    </div>
  );
}
