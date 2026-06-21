import { NeuCard } from '@/components/neu';
import { formatNumber } from '@/lib/format';
import { useMyRank } from './use-leaderboard';

function RankRow({ label, type }: { label: string; type: 'TOP_VOTER' | 'TOP_EARNER' }) {
  const { data } = useMyRank(type, 'WEEK');
  return (
    <div className="spread" style={{ padding: '6px 0' }}>
      <span>{label} (tuần)</span>
      <span className="mono" style={{ fontWeight: 700 }}>
        {data?.rank ? `#${data.rank}` : '—'} · {formatNumber(data?.score ?? 0)}
      </span>
    </div>
  );
}

export function MyRankCard() {
  return (
    <NeuCard>
      <strong>🏅 Xếp hạng của tôi</strong>
      <div style={{ marginTop: 8 }}>
        <RankRow label="🗳️ Top Voter" type="TOP_VOTER" />
        <RankRow label="💰 Top Earner" type="TOP_EARNER" />
      </div>
      <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
        Top Earner chỉ tính Gold cày (video/nhiệm vụ/offerwall).
      </p>
    </NeuCard>
  );
}
