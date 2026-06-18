import { Link, useParams } from 'react-router-dom';
import { ErrorState, Loading } from '@/components/state-views';
import { useCampaign } from '@/features/campaign/use-campaign';
import { CampaignBoard } from '@/features/campaign/campaign-board';
import { ResultView } from '@/features/campaign/result-view';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading, error, refetch } = useCampaign(id);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!campaign) return null;

  return (
    <div className="col">
      <Link to="/" style={{ fontSize: 13 }}>
        ← Tất cả chiến dịch
      </Link>
      {campaign.status === 'RESOLVED' ? (
        <ResultView campaignId={campaign.id} />
      ) : (
        <CampaignBoard campaign={campaign} />
      )}
    </div>
  );
}
