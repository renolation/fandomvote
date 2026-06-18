import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { NeuButton, NeuCard, NeuDialog, NeuPill } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { formatNumber } from '@/lib/format';
import { useCampaign } from '@/features/campaign/use-campaign';
import { ResultView } from '@/features/campaign/result-view';
import { AddIdolDialog } from '@/features/idol/add-idol-dialog';
import { Leaderboard } from '@/features/vote/leaderboard';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading, error, refetch } = useCampaign(id);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!campaign) return null;

  const resolved = campaign.status === 'RESOLVED';

  return (
    <div className="col">
      <Link to="/" style={{ fontSize: 13 }}>
        ← Chiến dịch
      </Link>
      <NeuCard>
        <div className="spread">
          <h2 style={{ margin: 0 }}>{campaign.title}</h2>
          <NeuPill>{campaign.status}</NeuPill>
        </div>
        <div className="mono" style={{ fontSize: 13 }}>
          Mục tiêu: {formatNumber(campaign.starGoal)} ⭐
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          {campaign.rulesContent && (
            <NeuButton size="sm" variant="ghost" onClick={() => setRulesOpen(true)}>
              📋 Thể lệ
            </NeuButton>
          )}
          {campaign.status === 'OPEN' && (
            <NeuButton size="sm" onClick={() => setAddOpen(true)}>
              + Thêm idol
            </NeuButton>
          )}
        </div>
      </NeuCard>

      {resolved ? <ResultView campaignId={campaign.id} /> : <Leaderboard campaign={campaign} />}

      <NeuDialog open={rulesOpen} onClose={() => setRulesOpen(false)} title="Thể lệ">
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>{campaign.rulesContent}</div>
      </NeuDialog>
      <AddIdolDialog campaignId={campaign.id} open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
