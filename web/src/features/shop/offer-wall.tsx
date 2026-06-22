import { NeuButton, NeuCard } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import type { OfferTask } from '@/types/api';
import { useOffers } from './use-shop';

// Offer wall: danh mục nhiệm vụ. Gold cộng qua webhook offerwall postback sau khi hoàn thành.
export function OfferWall() {
  const { data, isLoading } = useOffers();
  const toast = useToast();

  const start = (o: OfferTask) => {
    if (o.actionUrl) window.open(o.actionUrl, '_blank', 'noopener,noreferrer');
    else toast.show('Nhiệm vụ sẽ sớm khả dụng — Gold cộng sau khi hoàn thành.', 'info');
  };

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return null;

  return (
    <div>
      <h3 style={{ margin: '0 0 13px' }}>⚡ Kiếm Gold (Offer Wall)</h3>
      <div className="col" style={{ gap: 12 }}>
        {data.map((o) => (
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
                background: o.iconBg ?? 'var(--c-yellow)',
              }}
            >
              {o.icon ?? '⚡'}
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
