import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber } from '@/lib/format';
import { useBalance } from './use-wallet';

const ROWS: { key: 'green' | 'gold' | 'diamond'; label: string; bg: string; fg: string }[] = [
  { key: 'green', label: '🟢 Green', bg: '#22C55E', fg: '#fff' },
  { key: 'gold', label: '🟡 Gold', bg: '#FFD60A', fg: '#0a0a0a' },
  { key: 'diamond', label: '💎 Diamond', bg: '#3B82F6', fg: '#fff' },
];

export function BalanceCards() {
  const { data, isLoading, error, refetch } = useBalance();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="col" style={{ gap: 9 }}>
      {ROWS.map((r) => (
        <div
          key={r.key}
          className="spread"
          style={{ background: r.bg, color: r.fg, border: '2px solid var(--c-ink)', borderRadius: 10, padding: '10px 13px' }}
        >
          <span style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>{r.label}</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{formatNumber(data[r.key])}</span>
        </div>
      ))}
      <div style={{ marginTop: 2, background: '#FFE08A', border: '2px solid var(--c-ink)', borderRadius: 9, padding: '9px 12px', fontSize: 12, fontWeight: 600 }}>
        🟢 Green hết hạn vào cuối ngày — hãy dùng sớm.
      </div>
      {data.gold < 0 && (
        <div style={{ color: 'var(--c-pink)', fontWeight: 600, fontSize: 13 }}>
          ⚠️ Tài khoản đang bị khoá chi tiêu (Gold âm).
        </div>
      )}
      <div className="mono" style={{ fontSize: 10, color: '#999', textAlign: 'center', marginTop: 2 }}>
        1 🟡 = 1đ · 1 💎 = 1.000 🟡 · 🟢 hết hạn cuối ngày
      </div>
    </div>
  );
}
