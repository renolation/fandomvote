import { NeuButton, NeuCard } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/features/auth/auth-context';
import { useLiveOffers, useOffers } from './use-shop';

interface OfferItem {
  id: string;
  title: string;
  rewardGold: number;
  actionUrl: string | null;
  imageUrl?: string | null;
  icon?: string | null;
  iconBg?: string | null;
}

// Offer wall: đã đăng nhập → offer LIVE (Lootably, backend fallback offer tĩnh nếu chưa cấu hình);
// chưa đăng nhập → danh mục tĩnh. Gold cộng qua postback của mạng sau khi hoàn thành (không tại client).
export function OfferWall() {
  const { isAuthed } = useAuth();
  const live = useLiveOffers();
  const staticQ = useOffers();
  const toast = useToast();

  const isLoading = isAuthed ? live.isLoading : staticQ.isLoading;
  const items: OfferItem[] = isAuthed
    ? (live.data ?? []).map((o) => ({ id: o.id, title: o.title, rewardGold: o.rewardGold, actionUrl: o.actionUrl, imageUrl: o.imageUrl, icon: o.icon, iconBg: o.iconBg }))
    : (staticQ.data ?? []).map((o) => ({ id: o.id, title: o.title, rewardGold: o.rewardGold, actionUrl: o.actionUrl, icon: o.icon, iconBg: o.iconBg }));

  const start = (o: OfferItem) => {
    if (o.actionUrl) window.open(o.actionUrl, '_blank', 'noopener,noreferrer');
    else toast.show('Nhiệm vụ sẽ sớm khả dụng — Gold cộng sau khi hoàn thành.', 'info');
  };

  if (isLoading) return <Loading />;
  if (items.length === 0) return null;

  return (
    <div>
      <h3 style={{ margin: '0 0 13px' }}>⚡ Kiếm Gold (Offer Wall)</h3>
      <div className="col" style={{ gap: 12 }}>
        {items.map((o) => (
          <NeuCard key={o.id} flat style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div
              style={{
                width: 46,
                height: 46,
                flex: 'none',
                border: '2px solid var(--c-ink)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                overflow: 'hidden',
                background: o.imageUrl
                  ? `center / cover no-repeat url("${o.imageUrl}")`
                  : o.iconBg ?? 'var(--c-yellow)',
              }}
            >
              {!o.imageUrl && (o.icon ?? '⚡')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{o.title}</div>
              <div className="mono" style={{ fontWeight: 700, fontSize: 13, color: '#22a24b' }}>
                +{formatNumber(o.rewardGold)} Gold
              </div>
            </div>
            <NeuButton variant="green" size="sm" onClick={() => start(o)}>
              Bắt đầu
            </NeuButton>
          </NeuCard>
        ))}
      </div>
    </div>
  );
}
