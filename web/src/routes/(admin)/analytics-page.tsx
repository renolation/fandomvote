import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber, formatVnd } from '@/lib/format';
import type { AnalyticsOverview } from '@/types/api';
import { useAnalyticsOverview } from '@/features/admin/use-admin';

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: 'warn' | 'ok' }) {
  const bg = tone === 'warn' ? 'var(--c-pink)' : tone === 'ok' ? 'var(--c-green)' : 'var(--c-white)';
  const fg = tone ? '#fff' : 'var(--c-ink)';
  return (
    <NeuCard style={{ background: bg, color: fg, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85 }}>{label}</div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, marginTop: 2, opacity: 0.85 }}>{sub}</div>}
    </NeuCard>
  );
}

const MCOLS = '92px repeat(7, 1fr)';

function CurrencyHealth({ h }: { h: AnalyticsOverview['currencyHealth'] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
      <Kpi
        label="Gold liability (chưa tiêu)"
        value={formatNumber(h.goldLiability)}
        sub="Tổng Gold đang lưu hành"
      />
      <Kpi
        label="Gold sink / source"
        value={h.goldSinkSource.toFixed(2)}
        sub={h.inflationWarning ? '⚠️ < 1 — lạm phát Gold' : '≥ 1 — cân bằng'}
        tone={h.inflationWarning ? 'warn' : 'ok'}
      />
      <Kpi label="Green sink / source" value={h.greenSinkSource.toFixed(2)} />
      <Kpi label="Tổng quỹ quyên góp" value={formatVnd(h.totalFundVnd)} />
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { data, isLoading, error, refetch } = useAnalyticsOverview();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
          💧 Sức khoẻ tiền tệ
        </div>
        <CurrencyHealth h={data.currencyHealth} />
      </div>

      <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '3px solid var(--c-ink)', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
          📈 Chỉ số theo ngày (gần đây)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <div className="mono" style={{ display: 'grid', gridTemplateColumns: MCOLS, gap: 10, padding: '11px 20px', borderBottom: '3px solid var(--c-ink)', background: '#f5f1e8', fontWeight: 700, fontSize: 11, color: '#555', minWidth: 720 }}>
            <span>NGÀY</span><span>DAU</span><span>USER MỚI</span><span>DOANH THU</span><span>GOLD PHÁT</span><span>GOLD TIÊU</span><span>LIABILITY</span><span>VOTE</span>
          </div>
          {data.recent.length === 0 ? (
            <div className="muted" style={{ padding: 40, textAlign: 'center', fontSize: 14 }}>
              Chưa có dữ liệu — job tổng hợp chạy lúc 00:05 hằng đêm (UTC+7).
            </div>
          ) : (
            data.recent.map((m) => (
              <div key={m.metricDate} className="mono" style={{ display: 'grid', gridTemplateColumns: MCOLS, gap: 10, padding: '11px 20px', borderBottom: '2px solid #efe9dc', fontSize: 12, minWidth: 720 }}>
                <span style={{ fontWeight: 700 }}>{m.metricDate}</span>
                <span>{formatNumber(m.dau)}</span>
                <span>{formatNumber(m.newUsers)}</span>
                <span>{formatVnd(m.revenueVnd)}</span>
                <span>{formatNumber(m.goldIssued)}</span>
                <span>{formatNumber(m.goldSpent)}</span>
                <span>{formatNumber(m.goldLiability)}</span>
                <span>{formatNumber(m.totalVotes)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
