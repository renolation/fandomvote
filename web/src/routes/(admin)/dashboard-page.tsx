import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { useCampaigns } from '@/features/campaign/use-campaign';
import { useCampaignAction } from '@/features/admin/use-admin';
import type { Campaign } from '@/types/api';

export function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useCampaigns();
  const action = useCampaignAction();
  const toast = useToast();

  const run = async (id: string, act: 'open' | 'close' | 'resolve' | 'reverse') => {
    try {
      const res = await action.mutateAsync({ id, action: act });
      if (res && 'outcome' in res) {
        toast.success(
          `Kết quả ${res.outcome}${res.fundVnd != null ? ` · quỹ ${res.fundVnd}đ` : ''}`,
        );
      } else {
        toast.success('Thực hiện thành công.');
      }
    } catch (e) {
      toast.error(e);
    }
  };

  const actionsFor = (c: Campaign) => {
    const busy = action.isPending;
    return (
      <div className="row" style={{ flexWrap: 'wrap' }}>
        {c.status === 'DRAFT' && (
          <NeuButton size="sm" variant="green" disabled={busy} onClick={() => run(c.id, 'open')}>
            Mở
          </NeuButton>
        )}
        {c.status === 'OPEN' && (
          <NeuButton size="sm" disabled={busy} onClick={() => run(c.id, 'close')}>
            Đóng + snapshot
          </NeuButton>
        )}
        {c.status === 'CLOSED' && (
          <NeuButton size="sm" variant="blue" disabled={busy} onClick={() => run(c.id, 'resolve')}>
            Resolve
          </NeuButton>
        )}
        {c.status !== 'RESOLVED' && c.status !== 'ARCHIVED' && (
          <NeuButton size="sm" variant="pink" disabled={busy} onClick={() => run(c.id, 'reverse')}>
            Hủy + hoàn vote
          </NeuButton>
        )}
      </div>
    );
  };

  return (
    <div className="col">
      <h2 style={{ margin: 0 }}>Quản lý chiến dịch</h2>
      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && data.length === 0 && <EmptyState message="Chưa có chiến dịch." />}
      {data?.map((c) => (
        <NeuCard key={c.id} flat>
          <div className="spread">
            <div>
              <strong>{c.title}</strong>{' '}
              <span className="mono muted" style={{ fontSize: 12 }}>
                ⭐ {c.starGoal} · {c.donationRatioBps / 100}%
              </span>
            </div>
            <NeuPill>{c.status}</NeuPill>
          </div>
          <div style={{ marginTop: 8 }}>{actionsFor(c)}</div>
        </NeuCard>
      ))}
    </div>
  );
}
