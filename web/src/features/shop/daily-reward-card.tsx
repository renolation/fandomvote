import { NeuButton, NeuCard } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { useAuthGate } from '@/features/auth/use-auth-gate';
import { useClaimDaily, useDailyRewardConfig, useDailyRewardStatus } from './use-shop';

// Dải 7 ngày điểm danh theo chuỗi thật (streak từ backend).
// Ngày đã qua trong chuỗi: xanh ✓ · ngày hiện tại chưa nhận: vàng · ngày tương lai: trắng.
export function DailyRewardCard() {
  const { data: config, isLoading } = useDailyRewardConfig();
  const { data: status } = useDailyRewardStatus();
  const claim = useClaimDaily();
  const toast = useToast();
  const gate = useAuthGate();

  const claimedToday = !!status?.claimedToday;
  const currentDay = status?.dayIndex ?? 1; // ngày chuỗi hôm nay (đã nhận, hoặc sẽ nhận)

  const onClaim = () =>
    gate(async () => {
      try {
        const r = await claim.mutateAsync();
        toast.success(`+${r.greenAwarded} Green · điểm danh ngày ${r.dayIndex}!`);
      } catch (e) {
        toast.error(e);
      }
    });

  const days = config ?? [];
  const todayAmount = days.find((d) => d.dayIndex === currentDay)?.greenAmount ?? 0;

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
              const isToday = d.dayIndex === currentDay;
              // Ngày trước ngày hiện tại đã nhận rồi; ngày hiện tại chỉ xong khi đã điểm danh.
              const done = d.dayIndex < currentDay || (isToday && claimedToday);
              const active = isToday && !claimedToday;
              const bg = done ? 'var(--c-green)' : active ? 'var(--c-yellow)' : 'var(--c-white)';
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
