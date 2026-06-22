import { useState } from 'react';
import { NeuButton, NeuCard } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { colorForId, stripeStyle } from '@/lib/avatar';
import type { IdolStatus } from '@/types/api';
import { NominateDialog } from './nominate-dialog';
import { useMyNominations } from './use-idol';

const STATUS_COLOR: Record<IdolStatus, string> = {
  APPROVED: '#22C55E',
  PENDING: '#F59E0B',
  REJECTED: '#FB7185',
};

export function MyNominationsCard() {
  const { data, isLoading } = useMyNominations();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>🏆 Đề cử của tôi</span>
        <NeuButton size="sm" onClick={() => setOpen(true)}>+ Đề cử idol mới</NeuButton>
      </div>
      {isLoading ? (
        <Loading />
      ) : !data || data.length === 0 ? (
        <EmptyState message="Bạn chưa đề cử idol nào." />
      ) : (
        <div className="col" style={{ gap: 12 }}>
          {data.map((n) => (
            <NeuCard key={n.id} flat style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={stripeStyle(colorForId(n.id), 44)} />
              <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{n.name}</span>
              <span
                className="mono"
                style={{ background: STATUS_COLOR[n.status], color: '#fff', border: '2px solid var(--c-ink)', borderRadius: 6, padding: '3px 9px', fontWeight: 700, fontSize: 10 }}
              >
                {n.status}
              </span>
            </NeuCard>
          ))}
        </div>
      )}
      <NominateDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
