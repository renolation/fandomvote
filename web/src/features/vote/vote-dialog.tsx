import { useState } from 'react';
import { NeuButton, NeuDialog } from '@/components/neu';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import type { Campaign, LeaderboardEntry } from '@/types/api';
import { useBalance } from '@/features/wallet/use-wallet';
import { useCastVote } from './use-vote';

const QUICK = [50, 100, 500, 1000];

export function VoteDialog({
  campaign,
  entry,
  onClose,
}: {
  campaign: Campaign;
  entry: LeaderboardEntry | null;
  onClose: () => void;
}) {
  const [stars, setStars] = useState(0);
  const cast = useCastVote(campaign.id);
  const { data: balance } = useBalance();
  const toast = useToast();

  const green = balance?.green ?? 0;
  const gold = balance?.gold ?? 0;
  // Ước tính hiển thị Green-trước-Gold-sau (backend mới là người trừ thật).
  const useGreen = Math.min(stars, green);
  const useGold = Math.max(0, stars - useGreen);
  const short = stars <= 0 || useGold > gold;

  const submit = async () => {
    if (!entry || short) return;
    try {
      const r = await cast.mutateAsync({ campaignIdolId: entry.campaignIdolId, amount: stars });
      toast.success(`Đã vote ${formatNumber(r.amount)}⭐ cho ${entry.name}`);
      setStars(0);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog open={!!entry} onClose={onClose} title={`⭐ Vote ${entry?.name ?? ''}`}>
      <input
        inputMode="numeric"
        value={stars || ''}
        onChange={(e) => setStars(Math.max(0, parseInt(e.target.value, 10) || 0))}
        placeholder="0"
        style={{
          width: '100%',
          textAlign: 'center',
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: 38,
          padding: 14,
          border: '3px solid var(--c-ink)',
          borderRadius: 12,
          background: 'var(--c-navbg)',
        }}
      />
      <div className="row" style={{ marginTop: 12 }}>
        {QUICK.map((q) => (
          <NeuButton key={q} size="sm" variant="ghost" style={{ flex: 1 }} onClick={() => setStars((s) => s + q)}>
            +{q}
          </NeuButton>
        ))}
      </div>

      <div style={{ background: 'var(--c-navbg)', border: '3px solid var(--c-ink)', borderRadius: 12, padding: 16, marginTop: 16 }} className="col">
        <div className="spread" style={{ fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>🟢 Trừ Green (trước)</span>
          <span className="mono" style={{ fontWeight: 700 }}>−{formatNumber(useGreen)}</span>
        </div>
        <div className="spread" style={{ fontSize: 14 }}>
          <span style={{ fontWeight: 600 }}>🟡 Trừ Gold (sau)</span>
          <span className="mono" style={{ fontWeight: 700 }}>−{formatNumber(useGold)}</span>
        </div>
        <div className="spread" style={{ borderTop: '2px solid #e2dccc', paddingTop: 9 }}>
          <span style={{ fontWeight: 700, fontFamily: 'var(--font-head)' }}>Tổng sao</span>
          <span className="mono" style={{ fontWeight: 700, fontSize: 17 }}>{formatNumber(stars)} ⭐</span>
        </div>
      </div>

      {short && stars > 0 && (
        <div style={{ marginTop: 11, background: '#FFD0D8', border: '2px solid var(--c-ink)', borderRadius: 9, padding: 10, fontSize: 13, fontWeight: 600 }}>
          ⚠ Không đủ số dư. Cần thêm Gold hoặc nạp Diamond.
        </div>
      )}

      <NeuButton variant="green" style={{ marginTop: 16, width: '100%' }} disabled={short} loading={cast.isPending} onClick={submit}>
        ⭐ Xác nhận vote
      </NeuButton>
    </NeuDialog>
  );
}
