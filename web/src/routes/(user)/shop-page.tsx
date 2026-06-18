import { Link } from 'react-router-dom';
import { countdownLabel } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { DailyRewardCard } from '@/features/shop/daily-reward-card';
import { DealList } from '@/features/shop/deal-list';
import { useActiveEvents } from '@/features/shop/use-shop';

function EventHero() {
  const { data } = useActiveEvents();
  const now = useNow();
  const ev = data?.[0];
  if (!ev) return null;
  return (
    <div
      className="spread"
      style={{ background: 'var(--c-yellow)', border: '3px solid var(--c-ink)', borderRadius: 16, boxShadow: '5px 5px 0 var(--c-ink)', padding: '24px 28px' }}
    >
      <div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 30 }}>
          {ev.title} ×{(ev.multiplierBps / 10000).toFixed(1)}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
          Hoàn thành giao dịch trong thời gian sự kiện để nhận thưởng nhân đôi.
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div className="mono" style={{ fontSize: 12, fontWeight: 700 }}>KẾT THÚC SAU</div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 30, background: 'var(--c-ink)', color: 'var(--c-yellow)', borderRadius: 10, padding: '6px 16px', marginTop: 5 }}>
          {countdownLabel(ev.endsAt, now)}
        </div>
      </div>
    </div>
  );
}

export function ShopPage() {
  return (
    <div className="col" style={{ gap: 24 }}>
      <div className="spread">
        <h2 style={{ margin: 0, fontSize: 26 }}>🛒 Cửa hàng</h2>
        <Link to="/profile" className="neu-pill" style={{ textDecoration: 'none', padding: '8px 14px' }}>
          👛 Ví quà của tôi
        </Link>
      </div>

      <EventHero />
      <DailyRewardCard />

      <div>
        <h3 style={{ margin: '0 0 13px' }}>🎁 Ưu đãi đối tác</h3>
        <DealList />
      </div>

      <p className="muted" style={{ fontSize: 12 }}>
        💎 Nạp Diamond / ⚡ Offer Wall: điểm được cộng sau khi backend xác nhận (webhook/postback). Số dư tự cập nhật.
      </p>
    </div>
  );
}
