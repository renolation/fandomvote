import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { formatNumber } from '@/lib/format';
import type { LeaderboardEntry } from '@/types/api';
import { useBalance } from '@/features/wallet/use-wallet';
import { useCastVote } from './use-vote';

export function VoteDialog({
  campaignId,
  entry,
  onClose,
}: {
  campaignId: string;
  entry: LeaderboardEntry | null;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState(1);
  const cast = useCastVote(campaignId);
  const { data: balance } = useBalance();
  const toast = useToast();

  const submit = async () => {
    if (!entry) return;
    try {
      const r = await cast.mutateAsync({ campaignIdolId: entry.campaignIdolId, amount });
      toast.success(`Đã vote ${r.amount} (Green ${r.greenSpent} + Gold ${r.goldSpent})`);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  const available = (balance?.green ?? 0) + (balance?.gold ?? 0);

  return (
    <NeuDialog
      open={!!entry}
      onClose={onClose}
      title={`Vote ${entry?.name ?? ''}`}
      footer={
        <NeuButton
          variant="green"
          style={{ width: '100%' }}
          loading={cast.isPending}
          disabled={amount < 1 || amount > available}
          onClick={submit}
        >
          Vote {amount}
        </NeuButton>
      }
    >
      <p className="muted" style={{ fontSize: 13 }}>
        Trừ <b>Green trước → Gold sau</b> (backend xử lý). Khả dụng:{' '}
        <b className="mono">{formatNumber(available)}</b> (Green {formatNumber(balance?.green ?? 0)} +
        Gold {formatNumber(balance?.gold ?? 0)}).
      </p>
      <NeuField label="Số phiếu">
        <NeuInput
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
        />
      </NeuField>
      {amount > available && (
        <div style={{ color: 'var(--c-pink)', fontSize: 12 }}>Vượt số dư khả dụng.</div>
      )}
    </NeuDialog>
  );
}
