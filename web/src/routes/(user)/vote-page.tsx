import { useState } from 'react';
import { NeuButton } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { useCampaigns } from '@/features/campaign/use-campaign';
import { CampaignBoard } from '@/features/campaign/campaign-board';
import { NominateDialog } from '@/features/idol/nominate-dialog';
import { VoteSidebar } from '@/features/vote/vote-sidebar';
import { UserLeaderboard } from '@/features/leaderboard/user-leaderboard';

const chip = (active: boolean): React.CSSProperties => ({
  border: '2px solid var(--c-ink)',
  borderRadius: 20,
  padding: '8px 16px',
  fontWeight: 700,
  fontSize: 13,
  fontFamily: 'var(--font-head)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  background: active ? 'var(--c-ink)' : 'var(--c-white)',
  color: active ? '#fff' : 'var(--c-ink)',
});

export function VotePage() {
  const { data, isLoading, error, refetch } = useCampaigns();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nominateOpen, setNominateOpen] = useState(false);
  const gate = useAuthGate();

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  const campaigns = data ?? [];
  if (campaigns.length === 0) return <EmptyState message="Chưa có chiến dịch nào." />;

  const selected =
    campaigns.find((c) => c.id === selectedId) ??
    campaigns.find((c) => c.status === 'OPEN') ??
    campaigns[0];

  return (
    <div className="col">
      <div className="spread" style={{ gap: 16, flexWrap: 'wrap' }}>
        <div className="row" style={{ flexWrap: 'wrap', gap: 9 }}>
          {campaigns.map((c) => (
            <button key={c.id} style={chip(c.id === selected.id)} onClick={() => setSelectedId(c.id)}>
              {c.title}
            </button>
          ))}
        </div>
        <NeuButton size="sm" onClick={() => gate(() => setNominateOpen(true))}>
          + Đề cử idol
        </NeuButton>
      </div>

      <div className="split-sidebar">
        <div className="col" style={{ gap: 28 }}>
          <CampaignBoard campaign={selected} />
          <UserLeaderboard />
        </div>
        <VoteSidebar />
      </div>

      <NominateDialog open={nominateOpen} onClose={() => setNominateOpen(false)} />
    </div>
  );
}
