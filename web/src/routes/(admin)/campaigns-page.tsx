import { Link } from 'react-router-dom';
import { NeuButton, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { colorForId } from '@/lib/avatar';
import { formatNumber } from '@/lib/format';
import type { Campaign, CampaignStatus } from '@/types/api';
import { useCampaigns, useLeaderboard } from '@/features/campaign/use-campaign';
import { useCampaignAction } from '@/features/admin/use-admin';

const STATUS_COLOR: Partial<Record<CampaignStatus, string>> = {
  OPEN: 'var(--c-green)',
  DRAFT: '#9ca3af',
  CLOSED: 'var(--c-pink)',
  RESOLVED: 'var(--c-blue)',
  RESOLVING: 'var(--c-yellow)',
};

const card: React.CSSProperties = {
  background: 'var(--c-white)',
  border: '3px solid var(--c-ink)',
  borderRadius: 12,
  boxShadow: '5px 5px 0 var(--c-ink)',
  overflow: 'hidden',
};
const stat: React.CSSProperties = { border: '2px solid var(--c-ink)', borderRadius: 8, padding: 8 };

function CampaignAdminCard({ campaign }: { campaign: Campaign }) {
  const { data: board } = useLeaderboard(campaign.id, false);
  const action = useCampaignAction();
  const toast = useToast();
  const raised = (board ?? []).reduce((s, e) => s + e.totalVotes, 0);
  const pct = campaign.starGoal > 0 ? Math.min(100, Math.round((raised / campaign.starGoal) * 100)) : 0;

  const run = async (act: 'open' | 'close' | 'resolve' | 'reverse') => {
    try {
      const res = await action.mutateAsync({ id: campaign.id, action: act });
      if (res && 'outcome' in res) toast.success(`Kết quả ${res.outcome}${res.fundVnd != null ? ` · quỹ ${formatNumber(res.fundVnd)}đ` : ''}`);
      else toast.success('Thực hiện thành công.');
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div style={card}>
      <div className="spread" style={{ padding: '16px 18px', borderBottom: '3px solid var(--c-ink)' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>{campaign.title}</span>
        <NeuPill color={STATUS_COLOR[campaign.status]}>{campaign.status}</NeuPill>
      </div>
      <div style={{ padding: 18 }}>
        <div className="spread" style={{ fontSize: 13, marginBottom: 6 }}>
          <span style={{ fontWeight: 600 }}>Tiến độ Star Goal</span>
          <span className="mono" style={{ fontWeight: 700 }}>{pct}%</span>
        </div>
        <div className="bar-track" style={{ height: 18, borderWidth: 3 }}>
          <div className="bar-fill" style={{ width: `${pct}%`, background: colorForId(campaign.id), borderRightWidth: 3 }} />
        </div>
        <div className="spread mono" style={{ fontSize: 12, marginTop: 6, color: '#555' }}>
          <span>{formatNumber(raised)} ⭐</span>
          <span>mục tiêu {formatNumber(campaign.starGoal)}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 16 }}>
          <div style={stat}>
            <div className="mono" style={{ fontSize: 10, color: '#777' }}>DONATE</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{campaign.donationRatioBps / 100}%</div>
          </div>
          <div style={stat}>
            <div className="mono" style={{ fontSize: 10, color: '#777' }}>IDOLS</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 14 }}>{(board ?? []).length}</div>
          </div>
          <div style={stat}>
            <div className="mono" style={{ fontSize: 10, color: '#777' }}>TRẠNG THÁI</div>
            <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{campaign.status}</div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
          {campaign.status === 'DRAFT' && (
            <NeuButton size="sm" variant="green" disabled={action.isPending} onClick={() => run('open')}>Mở</NeuButton>
          )}
          {campaign.status === 'OPEN' && (
            <NeuButton size="sm" disabled={action.isPending} onClick={() => run('close')}>Đóng + snapshot</NeuButton>
          )}
          {campaign.status === 'CLOSED' && (
            <NeuButton size="sm" variant="blue" disabled={action.isPending} onClick={() => run('resolve')}>Kết thúc &amp; resolution</NeuButton>
          )}
          {campaign.status !== 'RESOLVED' && campaign.status !== 'ARCHIVED' && (
            <NeuButton size="sm" variant="pink" disabled={action.isPending} onClick={() => run('reverse')}>Hủy + hoàn vote</NeuButton>
          )}
        </div>
      </div>
    </div>
  );
}

export function AdminCampaignsPage() {
  const { data, isLoading, error, refetch } = useCampaigns();

  return (
    <div className="col" style={{ gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Link to="/admin/campaigns/new" style={{ textDecoration: 'none' }}>
          <NeuButton>+ Tạo campaign mới</NeuButton>
        </Link>
      </div>
      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && data.length === 0 && <EmptyState message="Chưa có campaign." />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
        {data?.map((c) => <CampaignAdminCard key={c.id} campaign={c} />)}
      </div>
    </div>
  );
}
