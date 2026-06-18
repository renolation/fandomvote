import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import { useDeals, useRedeemDeal } from './use-shop';

export function DealList() {
  const { data, isLoading, error, refetch } = useDeals();
  const redeem = useRedeemDeal();
  const toast = useToast();

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
    <div className="col">
      {data.map((d) => {
        const left = d.stock - d.stockSold;
        const out = left <= 0;
        return (
          <NeuCard key={d.id} flat>
            <div className="spread">
              <div>
                <strong>{d.title}</strong>
                <div className="mono" style={{ fontSize: 13 }}>
                  {formatNumber(d.cost)} {d.currency}
                </div>
                <NeuPill>{d.itemType}</NeuPill>{' '}
                <span className="muted" style={{ fontSize: 12 }}>
                  còn {formatNumber(Math.max(0, left))}
                </span>
              </div>
              <NeuButton
                size="sm"
                variant="pink"
                disabled={out || redeem.isPending}
                onClick={() => onRedeem(d.id)}
              >
                {out ? 'Hết' : 'Đổi'}
              </NeuButton>
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}
