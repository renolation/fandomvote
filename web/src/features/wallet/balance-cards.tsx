import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber } from '@/lib/format';
import { useBalance } from './use-wallet';

const CARDS: { key: 'green' | 'gold' | 'diamond'; label: string; color: string; note: string }[] = [
  { key: 'green', label: 'GREEN', color: 'var(--c-green)', note: 'Hết hạn cuối ngày' },
  { key: 'gold', label: 'GOLD', color: 'var(--c-yellow)', note: '1 Gold = 1đ' },
  { key: 'diamond', label: 'DIAMOND', color: 'var(--c-blue)', note: '1 = 1.000 Gold' },
];

export function BalanceCards() {
  const { data, isLoading, error, refetch } = useBalance();
  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data) return null;

  return (
    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
      {CARDS.map((c) => (
        <NeuCard key={c.key} flat style={{ background: c.color, color: '#111' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{c.label}</div>
          <div className="mono" style={{ fontSize: 20, fontWeight: 700 }}>
            {formatNumber(data[c.key])}
          </div>
          <div style={{ fontSize: 10, opacity: 0.8 }}>{c.note}</div>
        </NeuCard>
      ))}
      {data.gold < 0 && (
        <div style={{ gridColumn: '1 / -1', color: 'var(--c-pink)', fontWeight: 600, fontSize: 13 }}>
          ⚠️ Tài khoản đang bị khoá chi tiêu (Gold âm).
        </div>
      )}
    </div>
  );
}
