import { useState } from 'react';
import { NeuButton, NeuDialog } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { countdownLabel, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import type { Campaign, LeaderboardEntry } from '@/types/api';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { AddIdolDialog } from '@/features/idol/add-idol-dialog';
import { VoteDialog } from '@/features/vote/vote-dialog';
import { useLeaderboard } from './use-campaign';

const card: React.CSSProperties = {
  background: 'var(--c-white)',
  border: '3px solid var(--c-ink)',
  borderRadius: 14,
  boxShadow: '4px 4px 0 var(--c-ink)',
  padding: '15px 18px',
};

export function CampaignBoard({ campaign }: { campaign: Campaign }) {
  const votable = campaign.status === 'OPEN' && (!campaign.closeAt || new Date(campaign.closeAt).getTime() > Date.now());
  const { data, isLoading, error, refetch } = useLeaderboard(campaign.id, votable);
  const now = useNow();
  const gate = useAuthGate();
  const [voteEntry, setVoteEntry] = useState<LeaderboardEntry | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const goal = campaign.starGoal;
  const pct = (n: number) => (goal > 0 ? Math.min(100, Math.round((n / goal) * 100)) : 0);
  const entries = data ?? [];
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>{campaign.title}</h2>
        <div className="row">
          {campaign.rulesContent && (
            <NeuButton size="sm" variant="blue" onClick={() => setRulesOpen(true)}>
              📋 Thể lệ
            </NeuButton>
          )}
          {votable && (
            <NeuButton size="sm" onClick={() => gate(() => setAddOpen(true))}>
              + Thêm idol
            </NeuButton>
          )}
        </div>
      </div>

      {/* Countdown banner */}
      <div
        style={{
          background: 'var(--c-ink)',
          color: '#fff',
          borderRadius: 16,
          padding: '22px 26px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ fontSize: 13, color: 'var(--c-yellow)', fontWeight: 700, fontFamily: 'var(--font-head)', letterSpacing: '.05em' }}>
            {campaign.status === 'OPEN' ? 'CHIẾN DỊCH KẾT THÚC SAU' : `TRẠNG THÁI: ${campaign.status}`}
          </div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 40, lineHeight: 1.05, marginTop: 4 }}>
            {campaign.closeAt ? countdownLabel(campaign.closeAt, now) || '—' : '—'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 12, color: '#999' }}>STAR GOAL MỖI IDOL</div>
          <div className="mono" style={{ fontWeight: 700, fontSize: 26, marginTop: 4 }}>{formatNumber(goal)} ⭐</div>
        </div>
      </div>

      {/* Reward banner — chỉ hiện khi campaign có phần thưởng */}
      {campaign.prize && (
        <div
          style={{
            background: 'var(--c-yellow)',
            border: '3px solid var(--c-ink)',
            borderRadius: 16,
            boxShadow: '5px 5px 0 var(--c-ink)',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 34, flex: 'none' }}>🏆</div>
          <div style={{ minWidth: 0 }}>
            <div className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.08em', color: '#000' }}>
              GIẢI THƯỞNG CAMPAIGN
            </div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, lineHeight: 1.25, marginTop: 4 }}>
              {campaign.prize}
            </div>
          </div>
        </div>
      )}

      {isLoading && <Loading />}
      {error && <ErrorState error={error} onRetry={() => refetch()} />}

      {/* Podium */}
      {podiumOrder.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 1fr', gap: 14, alignItems: 'end', marginBottom: 26 }}>
          {podiumOrder.map((e) => {
            const rank = entries.findIndex((x) => x.campaignIdolId === e.campaignIdolId) + 1;
            const isTop = rank === 1;
            return (
              <div
                key={e.campaignIdolId}
                style={{ ...card, borderRadius: 16, boxShadow: isTop ? '6px 6px 0 var(--c-ink)' : '5px 5px 0 var(--c-ink)', outline: isTop ? '3px solid var(--c-yellow)' : undefined, outlineOffset: isTop ? -8 : undefined, textAlign: 'center' }}
              >
                {isTop && <div style={{ fontSize: 30 }}>👑</div>}
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={stripeStyle(colorForId(e.idolId), isTop ? 78 : 64)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
                  <div
                    className="mono"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 30,
                      height: 30,
                      border: '2px solid var(--c-ink)',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: 14,
                      background: isTop ? 'var(--c-yellow)' : '#f0ebdf',
                    }}
                  >
                    {rank}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, marginTop: 8 }}>{e.name}</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 14, color: '#444' }}>{formatNumber(e.totalVotes)} ⭐</div>
                {votable && (
                  <NeuButton style={{ marginTop: 12, width: '100%' }} onClick={() => gate(() => setVoteEntry(e))}>
                    VOTE
                  </NeuButton>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full leaderboard */}
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20, marginBottom: 14 }}>🏆 Bảng xếp hạng đầy đủ</div>
      <div className="col">
        {entries.map((e, i) => (
          <div key={e.campaignIdolId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="mono" style={{ width: 38, height: 38, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: '3px solid var(--c-ink)', borderRadius: 10, background: i === 0 ? 'var(--c-yellow)' : '#f0ebdf' }}>
              {i + 1}
            </div>
            <div style={stripeStyle(colorForId(e.idolId), 44)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="row">
                <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>{e.name}</span>
                {i === 0 && <span>👑</span>}
              </div>
              <div className="bar-track" style={{ marginTop: 7, maxWidth: 420 }}>
                <div className="bar-fill" style={{ width: `${pct(e.totalVotes)}%`, background: colorForId(e.idolId) }} />
              </div>
            </div>
            <div style={{ textAlign: 'right', flex: 'none' }}>
              <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{formatNumber(e.totalVotes)} ⭐</div>
              <div className="mono" style={{ fontSize: 11, color: '#999' }}>{pct(e.totalVotes)}% goal</div>
            </div>
            {votable && (
              <NeuButton style={{ flex: 'none' }} onClick={() => gate(() => setVoteEntry(e))}>
                VOTE
              </NeuButton>
            )}
          </div>
        ))}
      </div>

      <VoteDialog campaign={campaign} entry={voteEntry} onClose={() => setVoteEntry(null)} />
      <AddIdolDialog campaignId={campaign.id} open={addOpen} onClose={() => setAddOpen(false)} />
      <NeuDialog open={rulesOpen} onClose={() => setRulesOpen(false)} title="📋 Thể lệ campaign">
        <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>{campaign.rulesContent}</div>
      </NeuDialog>
    </div>
  );
}
