import { Link, useParams } from 'react-router-dom';
import { NeuCard } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { countdownLabel, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useCampaign } from '@/features/campaign/use-campaign';
import { CampaignBoard } from '@/features/campaign/campaign-board';
import { ResultView } from '@/features/campaign/result-view';

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const now = useNow();
  const { data: campaign, isLoading, error, refetch } = useCampaign(id);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!campaign) return null;

  // Chưa tới open_at → không dựng bảng bình chọn (backend cũng chặn vote), chỉ đếm ngược tới giờ mở.
  // Chặn cả khi vào trực tiếp bằng URL, vì campaign hẹn giờ không xuất hiện ở trang vote.
  const upcomingIso = campaign.openAt && new Date(campaign.openAt).getTime() > now ? campaign.openAt : null;

  return (
    <div className="col">
      <Link to="/" style={{ fontSize: 13 }}>
        ← Tất cả chiến dịch
      </Link>
      {upcomingIso ? (
        <UpcomingCard title={campaign.title} openAt={upcomingIso} now={now} />
      ) : campaign.status === 'RESOLVED' ? (
        <ResultView campaignId={campaign.id} />
      ) : (
        <CampaignBoard campaign={campaign} />
      )}
    </div>
  );
}

// Campaign đã hẹn giờ nhưng chưa mở: chỉ thông tin + đếm ngược, không có lối vào bình chọn.
function UpcomingCard({ title, openAt, now }: { title: string; openAt: string; now: number }) {
  return (
    <NeuCard>
      <div style={{ textAlign: 'center', padding: '20px 6px' }}>
        <div style={{ fontSize: 34, lineHeight: 1 }}>🔜</div>
        <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 19, margin: '10px 0 4px' }}>
          {title}
        </div>
        <div className="muted" style={{ fontSize: 14 }}>Chiến dịch chưa bắt đầu — chưa thể bình chọn.</div>
        <div className="mono" style={{ fontWeight: 700, fontSize: 22, marginTop: 14 }}>
          {countdownLabel(openAt, now)}
        </div>
        <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Mở lúc {formatDateTime(openAt)}</div>
      </div>
    </NeuCard>
  );
}
