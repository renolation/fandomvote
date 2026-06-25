import { DeleteButton } from '@/components/delete-button';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { countdownLabel } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useDeleteAdmin } from '@/features/admin/use-admin';
import { useActiveEvents } from '@/features/shop/use-shop';

const cell: React.CSSProperties = { background: '#fff', border: '2px solid var(--c-ink)', borderRadius: 8, padding: 10 };

export function AdminEventsPage() {
  const { data, isLoading, error, refetch } = useActiveEvents();
  const del = useDeleteAdmin('pointEvent');
  const now = useNow();

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmptyState message="Không có point event đang diễn ra." />;

  return (
    <div className="col" style={{ gap: 18 }}>
      <div className="muted" style={{ fontSize: 12 }}>Chỉ xem event đang active — tạo/sửa cần endpoint admin.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 18 }}>
        {data.map((e) => (
          <div key={e.id} style={{ background: 'var(--c-yellow)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
            <div className="spread" style={{ padding: '16px 18px', borderBottom: '3px solid var(--c-ink)' }}>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>{e.title}</span>
              <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                <span className="mono" style={{ background: 'var(--c-ink)', color: '#fff', fontWeight: 700, fontSize: 11, borderRadius: 6, padding: '3px 9px' }}>{e.type}</span>
                <DeleteButton
                  label={`Xoá event "${e.title}"`}
                  successMessage="Đã xoá event"
                  onConfirm={() => del.mutateAsync(e.id)}
                />
              </div>
            </div>
            <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
              <div style={cell}>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>HỆ SỐ</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 20 }}>×{(e.multiplierBps / 10000).toFixed(1)}</div>
              </div>
              <div style={cell}>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>TRẦN/USER</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{e.maxBonusPerUser ?? '—'}</div>
              </div>
              <div style={cell}>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>PRIORITY</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15 }}>{e.priority}</div>
              </div>
              <div style={cell}>
                <div className="mono" style={{ fontSize: 10, color: '#666' }}>CÒN LẠI</div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 15, color: 'var(--c-pink)' }}>{countdownLabel(e.endsAt, now)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
