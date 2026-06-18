import { NeuButton, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { colorForId } from '@/lib/avatar';
import { formatNumber } from '@/lib/format';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { useDeals, useRedeemDeal } from './use-shop';

export function DealList() {
  const { data, isLoading, error, refetch } = useDeals();
  const redeem = useRedeemDeal();
  const toast = useToast();
  const gate = useAuthGate();

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmptyState message="Chưa có ưu đãi nào." />;

  const onRedeem = async (id: string) => {
    try {
      await redeem.mutateAsync(id);
      toast.success('Đổi quà thành công! Xem ở Ví Quà.');
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
      {data.map((d) => {
        const left = d.stock - d.stockSold;
        const out = left <= 0;
        const c = colorForId(d.id);
        return (
          <div key={d.id} style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 14, boxShadow: '4px 4px 0 var(--c-ink)', overflow: 'hidden' }}>
            <div style={{ height: 120, borderBottom: '3px solid var(--c-ink)', background: `repeating-linear-gradient(45deg, ${c}, ${c} 8px, #0a0a0a 8px, #0a0a0a 12px)` }} />
            <div style={{ padding: 15 }}>
              <div className="spread" style={{ alignItems: 'flex-start', gap: 8 }}>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{d.title}</div>
                <NeuPill color={d.itemType === 'DIGITAL' ? '#3B82F6' : '#FB7185'}>{d.itemType}</NeuPill>
              </div>
              <div className="spread" style={{ marginTop: 14 }}>
                <div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                    {formatNumber(d.cost)} {d.currency === 'GOLD' ? '🟡' : '💎'}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: '#999' }}>còn {formatNumber(Math.max(0, left))}</div>
                </div>
                <NeuButton size="sm" disabled={out || redeem.isPending} onClick={() => gate(() => onRedeem(d.id))}>
                  {out ? 'Hết' : 'Đổi'}
                </NeuButton>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
