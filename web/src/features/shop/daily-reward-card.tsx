import { NeuButton, NeuCard } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { useClaimDaily } from './use-shop';

export function DailyRewardCard() {
  const claim = useClaimDaily();
  const toast = useToast();
  const gate = useAuthGate();

  const onClaim = async () => {
    try {
      const r = await claim.mutateAsync();
      toast.success(`Điểm danh thành công +${r.greenAwarded} Green`);
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuCard flat style={{ background: 'var(--c-green)', color: '#fff' }}>
      <div className="spread">
        <div>
          <strong>Điểm danh hằng ngày</strong>
          <div style={{ fontSize: 12 }}>Nhận Green mỗi ngày (1 lần/ngày)</div>
        </div>
        <NeuButton variant="ghost" loading={claim.isPending} onClick={() => gate(onClaim)}>
          Nhận
        </NeuButton>
      </div>
    </NeuCard>
  );
}
