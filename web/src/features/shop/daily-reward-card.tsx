import { NeuButton, NeuCard } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { useClaimDaily, useDailyRewardConfig, useDailyRewardStatus } from './use-shop';

// Dải 7 ngày điểm danh. Ngày 1 = hôm nay: vàng (chưa điểm danh) → xanh ✓ (đã điểm danh).
export function DailyRewardCard() {
  const { data: config, isLoading } = useDailyRewardConfig();
  const { data: status } = useDailyRewardStatus();
  const claim = useClaimDaily();
  const toast = useToast();
  const gate = useAuthGate();

  const claimedToday = !!status?.claimedToday;

  const onClaim = () =>
    gate(async () => {
      try {
        const r = await claim.mutateAsync();
        toast.success(`+${r.greenAwarded} Green · điểm danh!`);
      } catch (e) {
        toast.error(e);
      }
    });

  const days = config ?? [];
  const todayAmount = days[0]?.greenAmount ?? 0;

  return (
    <NeuCard>
      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, marginBottom: 14 }}>
        📅 Điểm danh hằng ngày
      </div>
      {isLoading ? (
        <Loading />
      ) : (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
            {days.map((d) => {
              const isToday = d.dayIndex === 1; // demo: chưa có streak thật → ngày 1 = hôm nay
              const done = isToday && claimedToday;
              const bg = done ? 'var(--c-green)' : isToday ? 'var(--c-yellow)' : 'var(--c-white)';
              const fg = done ? '#fff' : '#000';
              return (
                <div
                  key={d.id}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    border: '2px solid var(--c-ink)',
                    borderRadius: 10,
                    padding: '12px 4px',
                    background: bg,
                    color: fg,
                  }}
                >
                  <div className="mono" style={{ fontSize: 11 }}>Ngày {d.dayIndex}</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 16, marginTop: 3 }}>
                    {done ? '✓' : `+${d.greenAmount}`}
                  </div>
                </div>
              );
            })}
          </div>
          <NeuButton variant="green" disabled={claimedToday} loading={claim.isPending} onClick={onClaim}>
            {claimedToday ? '✓ Đã điểm danh' : `Điểm danh +${todayAmount} Green`}
          </NeuButton>
        </div>
      )}
    </NeuCard>
  );
}
