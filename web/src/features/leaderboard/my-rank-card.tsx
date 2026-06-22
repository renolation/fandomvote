import { useMyRank } from './use-leaderboard';

function RankTile({ label, rank, bg }: { label: string; rank: number | null; bg: string }) {
  return (
    <div style={{ background: bg, border: '3px solid var(--c-ink)', borderRadius: 14, boxShadow: '4px 4px 0 var(--c-ink)', padding: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div className="mono" style={{ fontWeight: 700, fontSize: 30, marginTop: 5 }}>{rank ? `#${rank}` : '—'}</div>
    </div>
  );
}

export function MyRankCard() {
  const voter = useMyRank('TOP_VOTER', 'WEEK');
  const earner = useMyRank('TOP_EARNER', 'WEEK');
  return (
    <div>
      <div className="row" style={{ gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 22 }}>🏅 Xếp hạng của tôi</span>
        <span className="mono" style={{ fontSize: 11, color: '#888', background: 'var(--c-white)', border: '2px solid var(--c-ink)', borderRadius: 20, padding: '3px 10px' }}>
          TUẦN NÀY
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <RankTile label="🗳️ Top Voter" rank={voter.data?.rank ?? null} bg="#FFF4D6" />
        <RankTile label="💰 Top Earner" rank={earner.data?.rank ?? null} bg="#E0EDFF" />
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        Top Earner chỉ tính Gold cày (video / nhiệm vụ / offerwall).
      </p>
    </div>
  );
}
