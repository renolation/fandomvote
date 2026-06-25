import { DeleteButton } from '@/components/delete-button';
import { NeuButton } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatDateTime, formatNumber } from '@/lib/format';
import type { LeaderboardSnapshot } from '@/types/api';
import { useDeleteAdmin } from '@/features/admin/use-admin';
import { usePendingRewards, useRewardAction } from '@/features/leaderboard/use-leaderboard';

const COLS = '120px 90px 70px 1.4fr 110px 130px auto';

const TYPE_LABEL: Record<LeaderboardSnapshot['boardType'], string> = {
  TOP_VOTER: '🗳️ Voter',
  TOP_EARNER: '💰 Earner',
};
const STATUS_STYLE: Record<LeaderboardSnapshot['rewardStatus'], { bg: string; fg: string }> = {
  PENDING: { bg: 'var(--c-yellow)', fg: 'var(--c-ink)' },
  APPROVED: { bg: 'var(--c-blue)', fg: '#fff' },
  SENT: { bg: 'var(--c-green)', fg: '#fff' },
};

export function AdminLeaderboardPage() {
  const { data, isLoading, error, refetch } = usePendingRewards();
  const action = useRewardAction();
  const del = useDeleteAdmin('leaderboardSnapshot');
  const toast = useToast();
  const rows = data ?? [];

  const act = async (id: number, kind: 'approve' | 'grant') => {
    try {
      await action.mutateAsync({ id, action: kind });
      toast.success(kind === 'approve' ? 'Đã duyệt thưởng' : 'Đã trao thưởng + gửi thông báo');
    } catch (e) {
      toast.error(e);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
      <div className="spread" style={{ padding: '16px 20px', borderBottom: '3px solid var(--c-ink)' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>Thưởng bảng xếp hạng chờ xử lý</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13, background: 'var(--c-yellow)', border: '2px solid var(--c-ink)', borderRadius: 8, padding: '4px 10px' }}>
          {rows.length} mục
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🏅</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, marginTop: 8 }}>Không có thưởng chờ xử lý</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Snapshot được tạo tự động cuối mỗi kỳ (ngày/tuần/tháng).</div>
        </div>
      ) : (
        <>
          <div className="mono" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 12, padding: '11px 20px', borderBottom: '3px solid var(--c-ink)', background: '#f5f1e8', fontWeight: 700, fontSize: 11, color: '#555' }}>
            <span>KỲ (BẮT ĐẦU)</span><span>BẢNG</span><span>HẠNG</span><span>USER</span><span>ĐIỂM</span><span>TRẠNG THÁI</span><span>HÀNH ĐỘNG</span>
          </div>
          {rows.map((s) => {
            const st = STATUS_STYLE[s.rewardStatus];
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 12, padding: '13px 20px', borderBottom: '2px solid #efe9dc', alignItems: 'center' }}>
                <div style={{ fontSize: 12 }}>
                  <div style={{ fontWeight: 700 }}>{s.period}</div>
                  <div className="mono muted" style={{ fontSize: 10 }}>{formatDateTime(s.periodStart).split(' ')[1] ?? formatDateTime(s.periodStart)}</div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{TYPE_LABEL[s.boardType]}</span>
                <span className="mono" style={{ fontWeight: 700 }}>#{s.rank}</span>
                <span className="mono" style={{ fontSize: 12 }}>{s.userId.slice(0, 8)}</span>
                <span className="mono" style={{ fontWeight: 700 }}>{formatNumber(s.score)}</span>
                <span className="mono" style={{ fontWeight: 700, fontSize: 11, background: st.bg, color: st.fg, border: '2px solid var(--c-ink)', borderRadius: 6, padding: '2px 8px', justifySelf: 'start' }}>
                  {s.rewardStatus}
                </span>
                <div className="row">
                  {s.rewardStatus === 'PENDING' && (
                    <NeuButton size="sm" variant="blue" disabled={action.isPending} onClick={() => act(s.id, 'approve')}>
                      Duyệt
                    </NeuButton>
                  )}
                  {s.rewardStatus === 'APPROVED' && (
                    <NeuButton size="sm" variant="green" disabled={action.isPending} onClick={() => act(s.id, 'grant')}>
                      Trao thưởng
                    </NeuButton>
                  )}
                  <DeleteButton
                    label={`Xoá snapshot #${s.rank} (${s.period})`}
                    successMessage="Đã xoá snapshot"
                    onConfirm={() => del.mutateAsync(String(s.id))}
                  />
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
