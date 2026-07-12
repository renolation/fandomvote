import { useState } from 'react';
import { NeuButton, NeuDialog } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { avatarStyle, colorForId, stripeStyle } from '@/lib/avatar';
import { CAMPAIGN_RULES } from '@/lib/campaign-rules';
import { countdownLabel, formatNumber } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import type { Campaign, LeaderboardEntry, LeaderboardPeriod, LeaderboardType } from '@/types/api';
import { useAuth } from '@/features/auth/auth-context';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { AddIdolDialog } from '@/features/idol/add-idol-dialog';
import { VoteDialog } from '@/features/vote/vote-dialog';
import { useBoard } from '@/features/leaderboard/use-leaderboard';
import { useLeaderboard } from './use-campaign';

const card: React.CSSProperties = {
  background: 'var(--c-white)',
  border: '3px solid var(--c-ink)',
  borderRadius: 14,
  boxShadow: '4px 4px 0 var(--c-ink)',
  padding: '15px 18px',
};

// Bảng xếp hạng gộp: Idol = BXH vote của campaign; Top Voter/Earner = tích luỹ theo kỳ.
type BoardTab = 'IDOL' | LeaderboardType;
const BOARD_TABS: { key: BoardTab; label: string }[] = [
  { key: 'IDOL', label: '🏆 Idol' },
  { key: 'TOP_VOTER', label: '🗳️ Top Voter' },
  { key: 'TOP_EARNER', label: '💰 Top Earner' },
];
const BOARD_PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'DAY', label: '📅 Ngày' },
  { key: 'WEEK', label: '📅 Tuần' },
  { key: 'MONTH', label: '📅 Tháng' },
];
// Tab Idol có thêm "Tất cả" (all-time) ngoài các kỳ.
type IdolPeriod = 'ALL' | LeaderboardPeriod;
const IDOL_PERIODS: { key: IdolPeriod; label: string }[] = [
  { key: 'ALL', label: '📅 Tất cả' },
  { key: 'DAY', label: '📅 Ngày' },
  { key: 'WEEK', label: '📅 Tuần' },
  { key: 'MONTH', label: '📅 Tháng' },
];
const MEDALS = ['🥇', '🥈', '🥉'];
const periodSelectStyle: React.CSSProperties = {
  border: '3px solid var(--c-ink)',
  borderRadius: 10,
  padding: '9px 14px',
  fontWeight: 700,
  fontFamily: 'var(--font-head)',
  fontSize: 14,
  background: 'var(--c-white)',
  cursor: 'pointer',
  boxShadow: '3px 3px 0 var(--c-ink)',
};
const segStyle = (active: boolean): React.CSSProperties => ({
  border: 'none',
  padding: '8px 14px',
  fontWeight: 700,
  fontSize: 12,
  fontFamily: 'var(--font-head)',
  cursor: 'pointer',
  background: active ? 'var(--c-ink)' : 'var(--c-white)',
  color: active ? '#fff' : 'var(--c-ink)',
});

export function CampaignBoard({ campaign }: { campaign: Campaign }) {
  const votable = campaign.status === 'OPEN' && (!campaign.closeAt || new Date(campaign.closeAt).getTime() > Date.now());
  const { data, isLoading, error, refetch } = useLeaderboard(campaign.id, votable);
  const now = useNow();
  const gate = useAuthGate();
  const [voteEntry, setVoteEntry] = useState<LeaderboardEntry | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const { user } = useAuth();
  const [boardTab, setBoardTab] = useState<BoardTab>('IDOL');
  const [boardPeriod, setBoardPeriod] = useState<LeaderboardPeriod>('WEEK');
  const [idolPeriod, setIdolPeriod] = useState<IdolPeriod>('ALL');
  const isIdolBoard = boardTab === 'IDOL';
  // useBoard luôn được gọi (hook rule); chỉ dùng kết quả khi không ở tab Idol.
  const userBoard = useBoard(isIdolBoard ? 'TOP_VOTER' : boardTab, boardPeriod);
  // BXH Idol lọc theo kỳ (ALL = all-time → dùng chung cache với podium).
  const idolBoard = useLeaderboard(campaign.id, votable, idolPeriod === 'ALL' ? undefined : idolPeriod);
  const idolEntries = idolBoard.data ?? [];
  const boardUnit = boardTab === 'TOP_EARNER' ? '🟡' : '⭐';

  const goal = campaign.starGoal;
  const pct = (n: number) => (goal > 0 ? Math.min(100, Math.round((n / goal) * 100)) : 0);
  const entries = data ?? [];
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean) as LeaderboardEntry[];

  return (
    <div>
      <div className="spread" style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0 }}>{campaign.title}</h2>
        <div className="row">
          <NeuButton size="sm" variant="blue" onClick={() => setRulesOpen(true)}>
            📋 Thể lệ
          </NeuButton>
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
                  <div style={avatarStyle(e.avatarUrl, e.idolId, isTop ? 78 : 64)} />
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

      {/* Bảng xếp hạng gộp: Idol (BXH vote campaign) + Top Voter/Earner (tích luỹ theo kỳ) */}
      <div className="spread" style={{ flexWrap: 'wrap', gap: 12, margin: '4px 0 16px' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>🏅 Bảng xếp hạng</span>
        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '3px solid var(--c-ink)', borderRadius: 10, overflow: 'hidden' }}>
            {BOARD_TABS.map((t) => (
              <button key={t.key} style={segStyle(boardTab === t.key)} onClick={() => setBoardTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
          {isIdolBoard ? (
            <select value={idolPeriod} onChange={(e) => setIdolPeriod(e.target.value as IdolPeriod)} style={periodSelectStyle}>
              {IDOL_PERIODS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          ) : (
            <select value={boardPeriod} onChange={(e) => setBoardPeriod(e.target.value as LeaderboardPeriod)} style={periodSelectStyle}>
              {BOARD_PERIODS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {isIdolBoard ? (
        // Tab Idol = bảng xếp hạng vote của campaign (lọc theo kỳ) — có progress + nút VOTE
        <div className="col">
          {idolBoard.isLoading && idolEntries.length === 0 && <Loading />}
          {idolEntries.map((e, i) => (
            <div key={e.campaignIdolId} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="mono" style={{ width: 38, height: 38, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, border: '3px solid var(--c-ink)', borderRadius: 10, background: i === 0 ? 'var(--c-yellow)' : '#f0ebdf' }}>
                {i + 1}
              </div>
              <div style={avatarStyle(e.avatarUrl, e.idolId, 44)} />
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
      ) : (
        // Tab Top Voter / Top Earner = tích luỹ người dùng theo kỳ
        <>
          <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 14, boxShadow: '4px 4px 0 var(--c-ink)', overflow: 'hidden' }}>
            {userBoard.isLoading && <div style={{ padding: 16 }}><Loading /></div>}
            {userBoard.data && userBoard.data.length === 0 && (
              <div style={{ padding: 16 }}><EmptyState message="Chưa có dữ liệu kỳ này." /></div>
            )}
            {userBoard.data?.map((u, i) => {
              const me = !!user && user.id === u.userId;
              return (
                <div key={u.userId} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', borderBottom: '2px solid #efe9dc', background: me ? '#FFF9E0' : undefined }}>
                  <span className="mono" style={{ width: 34, textAlign: 'center', fontSize: i < 3 ? 19 : 14, fontWeight: 700 }}>
                    {i < 3 ? MEDALS[i] : `#${u.rank}`}
                  </span>
                  <div style={stripeStyle(colorForId(u.userId), 34)} />
                  <span style={{ flex: 1, fontSize: 15, fontWeight: me ? 700 : 500 }}>
                    {u.name}
                    {me && ' (bạn)'}
                  </span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                    {formatNumber(u.score)} {boardUnit}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
            Hết kỳ → admin duyệt chống gian lận → trao thưởng; người thắng nhận thông báo cung cấp thông tin nhận quà qua email.
          </div>
        </>
      )}

      <VoteDialog campaign={campaign} entry={voteEntry} onClose={() => setVoteEntry(null)} />
      <AddIdolDialog campaignId={campaign.id} open={addOpen} onClose={() => setAddOpen(false)} />
      <NeuDialog open={rulesOpen} onClose={() => setRulesOpen(false)} title="📋 Thể lệ campaign">
        <div className="col" style={{ gap: 13 }}>
          {CAMPAIGN_RULES.map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div
                className="mono"
                style={{ width: 28, height: 28, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, background: 'var(--c-yellow)', border: '2px solid var(--c-ink)', borderRadius: 8 }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.5, paddingTop: 3 }}>{text}</div>
            </div>
          ))}
          {campaign.rulesContent && (
            <div style={{ marginTop: 6, paddingTop: 12, borderTop: '2px solid #e2dccc' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>📌 Ghi chú campaign này</div>
              <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6 }}>{campaign.rulesContent}</div>
            </div>
          )}
        </div>
      </NeuDialog>
    </div>
  );
}
