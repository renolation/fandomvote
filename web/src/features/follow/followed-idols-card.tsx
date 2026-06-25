import { useState } from 'react';
import { NeuButton, NeuCard } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { FollowPickerDialog } from './follow-picker-dialog';
import { useFollows, useToggleFollow } from './use-follow';

const head: React.CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 700 };

export function FollowedIdolsCard() {
  const { data, isLoading } = useFollows();
  const toggle = useToggleFollow();
  const gate = useAuthGate();
  const [pickerOpen, setPickerOpen] = useState(false);

  const openPicker = () => gate(() => setPickerOpen(true));
  const idols = data ?? [];

  return (
    <NeuCard>
      <div className="spread" style={{ marginBottom: 13 }}>
        <span style={{ ...head, fontSize: 16 }}>⭐ Idol theo dõi</span>
        <NeuButton size="sm" variant="ghost" onClick={openPicker}>
          + Thêm
        </NeuButton>
      </div>

      {isLoading && <Loading />}

      {!isLoading && idols.length === 0 && (
        <EmptyState
          message="Bạn chưa theo dõi idol nào."
          action={
            <NeuButton size="sm" onClick={openPicker}>
              + Thêm
            </NeuButton>
          }
        />
      )}

      {idols.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 12 }}>
          {idols.map((idol) => (
            <div key={idol.id} style={{ position: 'relative', textAlign: 'center' }}>
              <button
                type="button"
                title="Bỏ theo dõi"
                disabled={toggle.isPending}
                onClick={() => toggle.mutate({ idolId: idol.id, following: true })}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: 2,
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: '2px solid var(--c-ink)',
                  background: 'var(--c-pink)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: 1,
                  cursor: 'pointer',
                  padding: 0,
                  zIndex: 1,
                }}
              >
                ✕
              </button>
              <div
                style={{
                  margin: '0 auto',
                  ...(idol.avatarUrl
                    ? {
                        width: 72,
                        height: 72,
                        flex: 'none',
                        border: '3px solid var(--c-ink)',
                        borderRadius: 14,
                        backgroundImage: `url(${idol.avatarUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : stripeStyle(colorForId(idol.id), 72)),
                }}
              />
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6, lineHeight: 1.2 }}>{idol.name}</div>
            </div>
          ))}
        </div>
      )}

      <FollowPickerDialog open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </NeuCard>
  );
}
