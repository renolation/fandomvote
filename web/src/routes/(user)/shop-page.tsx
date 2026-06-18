import { EventBanner } from '@/features/shop/event-banner';
import { DailyRewardCard } from '@/features/shop/daily-reward-card';
import { DealList } from '@/features/shop/deal-list';

export function ShopPage() {
  return (
    <div className="col">
      <h2 style={{ margin: 0 }}>Shop</h2>
      <EventBanner />
      <DailyRewardCard />
      <h3 style={{ margin: '8px 0 0' }}>Special Deals</h3>
      <DealList />
      <p className="muted" style={{ fontSize: 12 }}>
        Nạp IAP / Offer Wall: điểm cộng sau khi backend xác nhận — số dư tự cập nhật.
      </p>
    </div>
  );
}
