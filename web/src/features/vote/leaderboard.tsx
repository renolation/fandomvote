import { useState } from 'react';
import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { formatNumber } from '@/lib/format';
import type { Campaign, LeaderboardEntry } from '@/types/api';
import { useLeaderboard } from '@/features/campaign/use-campaign';
import { VoteDialog } from './vote-dialog';

export function Leaderboard({ campaign }: { campaign: Campaign }) {
  const votable = campaign.status === 'OPEN';
  const { data, isLoading, error, refetch } = useLeaderboard(campaign.id, votable);
  const [voteEntry, setVoteEntry] = useState<LeaderboardEntry | null>(null);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const entries = data ?? [];
  if (entries.length === 0)
    return <EmptyState message="Chưa có idol nào trong chiến dịch." />;

  return (
    <div className="col">
      {entries.map((e, i) => {
        const reached = e.totalVotes >= campaign.starGoal;
        return (
          <NeuCard key={e.campaignIdolId} flat>
            <div className="spread">
              <div className="row">
                <span className="mono" style={{ fontWeight: 700, width: 24 }}>
                  #{i + 1}
                </span>
                <div>
                  <strong>{e.name}</strong>
                  <div className="mono" style={{ fontSize: 13 }}>
                    {formatNumber(e.totalVotes)} / {formatNumber(campaign.starGoal)} ⭐
                  </div>
                </div>
              </div>
              <div className="col" style={{ alignItems: 'flex-end' }}>
                {reached && <NeuPill color="var(--c-green)">Đạt mốc</NeuPill>}
                {votable && (
                  <NeuButton size="sm" variant="green" onClick={() => setVoteEntry(e)}>
                    Vote
                  </NeuButton>
                )}
              </div>
            </div>
          </NeuCard>
        );
      })}
      <VoteDialog campaignId={campaign.id} entry={voteEntry} onClose={() => setVoteEntry(null)} />
    </div>
  );
}
