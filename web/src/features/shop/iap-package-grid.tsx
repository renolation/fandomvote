import { NeuButton } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatNumber, formatVnd } from '@/lib/format';
import { useIapPackages } from './use-shop';

// Gói nạp Diamond. Web KHÔNG xử lý mua IAP (qua App Store / Google Play) → nút chỉ thông tin.
export function IapPackageGrid() {
  const { data, isLoading } = useIapPackages();
  const toast = useToast();

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) return null;

  return (
    <div>
      <h3 style={{ margin: '0 0 13px' }}>💎 Nạp Diamond</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
        {data.map((p) => {
          const total = p.diamondAmount + p.bonusDiamond;
          return (
            <div
              key={p.id}
              style={{
                border: '3px solid var(--c-ink)',
                borderRadius: 12,
                boxShadow: '3px 3px 0 var(--c-ink)',
                padding: 16,
                position: 'relative',
                background: 'var(--c-white)',
              }}
            >
              {p.bonusDiamond > 0 && (
                <span
                  className="mono"
                  style={{
                    position: 'absolute',
                    top: -11,
                    right: 11,
                    background: 'var(--c-pink)',
                    color: '#fff',
                    border: '2px solid var(--c-ink)',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 10,
                    padding: '1px 7px',
                  }}
                >
                  +{formatNumber(p.bonusDiamond)}💎
                </span>
              )}
              <div className="mono" style={{ fontWeight: 700, fontSize: 22 }}>{formatNumber(total)}💎</div>
              <NeuButton
                variant="blue"
                style={{ marginTop: 10, width: '100%' }}
                onClick={() => toast.show('Nạp Diamond qua ứng dụng di động (App Store / Google Play).', 'info')}
              >
                {formatVnd(p.priceVnd)}
              </NeuButton>
            </div>
          );
        })}
      </div>
    </div>
  );
}
