import { useMemo, useState } from 'react';
import { NeuButton, NeuDialog, NeuInput } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useApprovedIdols } from '@/features/idol/use-idol';
import { useFollows, useToggleFollow } from './use-follow';

export function FollowPickerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useApprovedIdols(search);
  const { data: follows } = useFollows();
  const toggle = useToggleFollow();

  const followedIds = useMemo(() => new Set((follows ?? []).map((f) => f.id)), [follows]);
  const idols = data?.items ?? [];

  return (
    <NeuDialog open={open} onClose={onClose} title="⭐ Theo dõi idol">
      <NeuInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm idol theo tên…"
        style={{ marginBottom: 12 }}
      />
      <div className="thin-scroll" style={{ height: 360, overflowY: 'auto' }}>
        {isLoading && <Loading />}
        {data && idols.length === 0 && <EmptyState message="Không tìm thấy idol nào." />}
        {idols.map((idol) => {
          const following = followedIds.has(idol.id);
          return (
            <div
              key={idol.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 2px',
                borderBottom: '2px solid #efe9dc',
              }}
            >
              <div style={stripeStyle(colorForId(idol.id), 38)} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600 }}>{idol.name}</span>
              <NeuButton
                size="sm"
                variant={following ? 'ghost' : 'green'}
                disabled={following || toggle.isPending}
                onClick={() => toggle.mutate({ idolId: idol.id, following: false })}
              >
                {following ? '✓ Đang theo dõi' : 'Theo dõi'}
              </NeuButton>
            </div>
          );
        })}
      </div>
    </NeuDialog>
  );
}
