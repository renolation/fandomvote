import { useState } from 'react';
import { NeuButton, NeuCard } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { formatNumber } from '@/lib/format';
import type { LeaderboardPeriod, LeaderboardType } from '@/types/api';
import { useAuth } from '@/features/auth/auth-context';
import { useBoard } from './use-leaderboard';

const TYPES: { key: LeaderboardType; label: string }[] = [
  { key: 'TOP_VOTER', label: '🗳️ Top Voter' },
  { key: 'TOP_EARNER', label: '💰 Top Earner' },
];
const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'DAY', label: 'Ngày' },
  { key: 'WEEK', label: 'Tuần' },
  { key: 'MONTH', label: 'Tháng' },
];
const MEDALS = ['🥇', '🥈', '🥉'];

export function UserLeaderboard() {
  const { user } = useAuth();
  const [type, setType] = useState<LeaderboardType>('TOP_VOTER');
  const [period, setPeriod] = useState<LeaderboardPeriod>('WEEK');
  const { data, isLoading } = useBoard(type, period);
  const unit = type === 'TOP_VOTER' ? '⭐' : '🟡';

  return (
    <div>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 20 }}>
          🏅 Xếp hạng người dùng
        </span>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="row">
            {TYPES.map((t) => (
              <NeuButton key={t.key} size="sm" variant={type === t.key ? 'blue' : 'ghost'} onClick={() => setType(t.key)}>
                {t.label}
              </NeuButton>
            ))}
          </div>
          <div className="row">
            {PERIODS.map((p) => (
              <NeuButton key={p.key} size="sm" variant={period === p.key ? 'yellow' : 'ghost'} onClick={() => setPeriod(p.key)}>
                {p.label}
              </NeuButton>
            ))}
          </div>
        </div>
      </div>

      <NeuCard style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading && <div style={{ padding: 16 }}><Loading /></div>}
        {data && data.length === 0 && <div style={{ padding: 16 }}><EmptyState message="Chưa có dữ liệu kỳ này." /></div>}
        {data?.map((e, i) => {
          const me = !!user && user.id === e.userId;
          return (
            <div
              key={e.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                padding: '13px 16px',
                borderBottom: '2px solid #efe9dc',
                background: me ? '#FFF9E0' : undefined,
              }}
            >
              <span className="mono" style={{ width: 34, textAlign: 'center', fontSize: i < 3 ? 19 : 14, fontWeight: 700 }}>
                {i < 3 ? MEDALS[i] : `#${e.rank}`}
              </span>
              <div style={stripeStyle(colorForId(e.userId), 34)} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: me ? 700 : 500 }}>
                {e.name}
                {me && ' (bạn)'}
              </span>
              <span className="mono" style={{ fontWeight: 700, fontSize: 14 }}>
                {formatNumber(e.score)} {unit}
              </span>
            </div>
          );
        })}
      </NeuCard>

      <div style={{ fontSize: 12, color: '#777', marginTop: 8 }}>
        Hết kỳ → admin duyệt chống gian lận → trao thưởng; người thắng nhận thông báo cung cấp thông tin nhận quà qua email.
      </div>
    </div>
  );
}
