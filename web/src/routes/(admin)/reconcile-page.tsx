import { useState } from 'react';
import { NeuButton, NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatDateTime, formatNumber, formatVnd } from '@/lib/format';
import type { AdminLedgerRow, SourceBreakdown } from '@/types/api';
import { useLedger, useReconcileSummary } from '@/features/admin/use-admin';

// Các nguồn của wallet_ledger (khớp enum backend) — dùng cho select filter sổ cái.
const LEDGER_SOURCES = [
  'CHECKIN',
  'EVENT_BONUS',
  'REFERRAL',
  'VIDEO',
  'TASK',
  'OFFERWALL',
  'IAP_DIAMOND',
  'DIAMOND_TO_GOLD',
  'VOTE',
  'VOTE_REVERSAL',
  'PURCHASE',
  'OFFERWALL_CHARGEBACK',
  'ADMIN_ADJUST',
  'REWARD',
] as const;

const SRC_COLS = '1.4fr 1fr 1fr 1.2fr 80px';
const TXN_COLS = '150px 1.3fr 90px 110px 1.2fr 1fr 1fr';

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

function SourceTable({ bySource }: { bySource: SourceBreakdown[] }) {
  return (
    <div
      style={{
        background: 'var(--c-white)',
        border: '3px solid var(--c-ink)',
        borderRadius: 12,
        boxShadow: '5px 5px 0 var(--c-ink)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '3px solid var(--c-ink)',
          fontFamily: 'var(--font-head)',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        🔀 Theo nguồn
      </div>
      <div style={{ overflowX: 'auto' }}>
        <div
          className="mono"
          style={{
            display: 'grid',
            gridTemplateColumns: SRC_COLS,
            gap: 10,
            padding: '11px 20px',
            borderBottom: '3px solid var(--c-ink)',
            background: '#f5f1e8',
            fontWeight: 700,
            fontSize: 11,
            color: '#555',
            minWidth: 640,
          }}
        >
          <span>NGUỒN</span>
          <span>CỘNG (+)</span>
          <span>TRỪ (−)</span>
          <span>GIÁ TRỊ VND</span>
          <span>SỐ DÒNG</span>
        </div>
        {bySource.length === 0 ? (
          <div className="muted" style={{ padding: 40, textAlign: 'center', fontSize: 14 }}>
            Chưa có dữ liệu sổ cái.
          </div>
        ) : (
          bySource.map((s) => (
            <div
              key={s.source}
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: SRC_COLS,
                gap: 10,
                padding: '11px 20px',
                borderBottom: '2px solid #efe9dc',
                fontSize: 12,
                minWidth: 640,
              }}
            >
              <span style={{ fontWeight: 700 }}>{s.source}</span>
              <span style={{ color: 'var(--c-green)' }}>{formatNumber(s.credited)}</span>
              <span style={{ color: 'var(--c-pink)' }}>{formatNumber(s.debited)}</span>
              <span>{formatVnd(s.realValueVnd)}</span>
              <span>{formatNumber(s.count)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LedgerSection() {
  const [source, setSource] = useState('ALL');
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useLedger(
    source === 'ALL' ? '' : source,
  );

  const rows: AdminLedgerRow[] = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div
      style={{
        background: 'var(--c-white)',
        border: '3px solid var(--c-ink)',
        borderRadius: 12,
        boxShadow: '5px 5px 0 var(--c-ink)',
        overflow: 'hidden',
      }}
    >
      <div className="spread" style={{ padding: '14px 20px', borderBottom: '3px solid var(--c-ink)', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>📒 Sổ cái giao dịch</span>
        <select className="neu-select" style={{ maxWidth: 220 }} value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="ALL">Tất cả nguồn</option>
          {LEDGER_SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <div
            className="mono"
            style={{
              display: 'grid',
              gridTemplateColumns: TXN_COLS,
              gap: 10,
              padding: '11px 20px',
              borderBottom: '3px solid var(--c-ink)',
              background: '#f5f1e8',
              fontWeight: 700,
              fontSize: 11,
              color: '#555',
              minWidth: 860,
            }}
          >
            <span>THỜI GIAN</span>
            <span>NGƯỜI DÙNG</span>
            <span>LOẠI TIỀN</span>
            <span>SỐ LƯỢNG</span>
            <span>NGUỒN</span>
            <span>GIÁ TRỊ VND</span>
            <span>THAM CHIẾU</span>
          </div>
          {rows.length === 0 ? (
            <div className="muted" style={{ padding: 40, textAlign: 'center', fontSize: 14 }}>
              Không có giao dịch nào.
            </div>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="mono"
                style={{
                  display: 'grid',
                  gridTemplateColumns: TXN_COLS,
                  gap: 10,
                  padding: '11px 20px',
                  borderBottom: '2px solid #efe9dc',
                  fontSize: 12,
                  alignItems: 'center',
                  minWidth: 860,
                }}
              >
                <span>{formatDateTime(r.createdAt)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.userName ?? r.userId.slice(0, 8)}
                </span>
                <span style={{ fontWeight: 700 }}>{r.currency}</span>
                <span style={{ fontWeight: 700, color: r.amount < 0 ? 'var(--c-pink)' : 'var(--c-green)' }}>
                  {r.amount > 0 ? `+${formatNumber(r.amount)}` : formatNumber(r.amount)}
                </span>
                <span>{r.source}</span>
                <span>{formatVnd(r.realValueVnd)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.refType ? `${r.refType}${r.refId ? `:${r.refId.slice(0, 8)}` : ''}` : '—'}
                </span>
              </div>
            ))
          )}

          {hasNextPage && (
            <div style={{ padding: 14, textAlign: 'center' }}>
              <NeuButton variant="ghost" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Tải thêm
              </NeuButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminReconcilePage() {
  const { data, isLoading, error, refetch } = useReconcileSummary();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17, marginBottom: 10 }}>
          💰 Tổng quan đối soát
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          <Kpi label="Doanh thu IAP" value={formatVnd(data.iapRevenueVnd)} sub="SUM real_value_vnd · IAP_DIAMOND" />
          <Kpi
            label="Gold offerwall đã phát"
            value={formatNumber(data.offerwallGoldIssued)}
            sub="Gold cộng từ offerwall"
          />
          <Kpi label="Quỹ quyên góp" value={formatVnd(data.donationFundVnd)} sub="SUM donated_vnd" />
          <Kpi
            label="User bị gắn cờ"
            value={formatNumber(data.flaggedUsers)}
            sub={data.flaggedUsers > 0 ? '⚠️ cần rà soát' : 'không có'}
            tone={data.flaggedUsers > 0 ? 'warn' : undefined}
          />
          <Kpi
            label="User Gold âm"
            value={formatNumber(data.negativeGoldUsers)}
            sub={data.negativeGoldUsers > 0 ? '⚠️ số dư âm' : 'không có'}
            tone={data.negativeGoldUsers > 0 ? 'warn' : undefined}
          />
        </div>
      </div>

      <SourceTable bySource={data.bySource} />

      <LedgerSection />
    </div>
  );
}
