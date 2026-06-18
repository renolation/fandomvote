import { Link } from 'react-router-dom';
import { NeuButton } from '@/components/neu';
import { countdownLabel, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useAuth } from '@/features/auth/auth-context';
import { useBalance } from '@/features/wallet/use-wallet';
import { useActiveEvents } from '@/features/shop/use-shop';

const card: React.CSSProperties = {
  background: 'var(--c-white)',
  border: '3px solid var(--c-ink)',
  borderRadius: 16,
  boxShadow: '5px 5px 0 var(--c-ink)',
  padding: 18,
};
const ROWS = [
  { key: 'green' as const, label: '🟢 Green', bg: '#22C55E', fg: '#fff' },
  { key: 'gold' as const, label: '🟡 Gold', bg: '#FFD60A', fg: '#0a0a0a' },
  { key: 'diamond' as const, label: '💎 Diamond', bg: '#3B82F6', fg: '#fff' },
];

export function VoteSidebar() {
  const { isAuthed } = useAuth();
  const { data: balance } = useBalance();
  const { data: events } = useActiveEvents();
  const now = useNow();
  const ev = events?.[0];

  return (
    <aside className="col" style={{ gap: 18, position: 'sticky', top: 98 }}>
      <div style={card}>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginBottom: 13 }}>💼 Ví của bạn</div>
        {isAuthed && balance ? (
          <div className="col" style={{ gap: 9 }}>
            {ROWS.map((r) => (
              <div key={r.key} className="spread" style={{ background: r.bg, color: r.fg, border: '2px solid var(--c-ink)', borderRadius: 10, padding: '9px 13px' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</span>
                <span className="mono" style={{ fontWeight: 700, fontSize: 16 }}>{formatNumber(balance[r.key])}</span>
              </div>
            ))}
            <Link to="/shop" style={{ textDecoration: 'none' }}>
              <NeuButton variant="ghost" style={{ width: '100%', marginTop: 4 }}>
                + Nạp / Kiếm thêm
              </NeuButton>
            </Link>
          </div>
        ) : (
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <NeuButton variant="blue" style={{ width: '100%' }}>
              Đăng nhập để xem ví
            </NeuButton>
          </Link>
        )}
      </div>

      {ev && (
        <div style={{ ...card, background: 'var(--c-yellow)' }}>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18 }}>
            ⚡ {ev.title} ×{(ev.multiplierBps / 10000).toFixed(1)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3 }}>Sự kiện điểm thưởng đang diễn ra</div>
          <div className="row" style={{ marginTop: 12 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>CÒN</span>
            <span className="mono" style={{ fontWeight: 700, fontSize: 17, background: 'var(--c-ink)', color: 'var(--c-yellow)', borderRadius: 8, padding: '3px 10px' }}>
              {countdownLabel(ev.endsAt, now)}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
