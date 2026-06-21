import { useState } from 'react';
import { NeuButton, NeuCard } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { formatNumber } from '@/lib/format';
import type { LeaderboardPeriod, LeaderboardType } from '@/types/api';
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

export function UserLeaderboard() {
  const [type, setType] = useState<LeaderboardType>('TOP_VOTER');
  const [period, setPeriod] = useState<LeaderboardPeriod>('WEEK');
  const { data, isLoading } = useBoard(type, period);
  const unit = type === 'TOP_VOTER' ? '⭐' : '🟡';

  return (
    <NeuCard>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
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
      {isLoading && <Loading />}
      {data && data.length === 0 && <EmptyState message="Chưa có dữ liệu kỳ này." />}
      <div className="col">
        {data?.map((e) => (
          <div key={e.userId} className="spread" style={{ padding: '6px 4px', borderBottom: '2px solid #efe9dc' }}>
            <span className="row">
              <b className="mono" style={{ width: 28 }}>#{e.rank}</b>
              <span>{e.name}</span>
            </span>
            <span className="mono" style={{ fontWeight: 700 }}>
              {formatNumber(e.score)} {unit}
            </span>
          </div>
        ))}
      </div>
    </NeuCard>
  );
}
