import { useState } from 'react';
import { Link } from 'react-router-dom';
import { NeuButton, NeuCard, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useCampaigns } from '@/features/campaign/use-campaign';
import { NominateDialog } from '@/features/idol/nominate-dialog';
import type { CampaignStatus } from '@/types/api';

const STATUS_COLOR: Partial<Record<CampaignStatus, string>> = {
  OPEN: 'var(--c-green)',
  CLOSED: 'var(--c-pink)',
  RESOLVED: 'var(--c-blue)',
};

export function VotePage() {
  const { data, isLoading, error, refetch } = useCampaigns();
  const [nominateOpen, setNominateOpen] = useState(false);

  return (
    <div className="col">
      <div className="spread">
        <h2 style={{ margin: 0 }}>Chiến dịch</h2>
        <NeuButton size="sm" onClick={() => setNominateOpen(true)}>
          + Đề cử idol
        </NeuButton>
      </div>

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}
      {data && data.length === 0 && <EmptyState message="Chưa có chiến dịch nào." />}

      {data?.map((c) => (
        <Link key={c.id} to={`/campaigns/${c.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <NeuCard>
            <div className="spread">
              <strong>{c.title}</strong>
              <NeuPill color={STATUS_COLOR[c.status]}>{c.status}</NeuPill>
            </div>
            {c.description && (
              <div className="muted" style={{ fontSize: 13 }}>
                {c.description}
              </div>
            )}
          </NeuCard>
        </Link>
      ))}

      <NominateDialog open={nominateOpen} onClose={() => setNominateOpen(false)} />
    </div>
  );
}
