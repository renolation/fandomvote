import { DeleteButton } from '@/components/delete-button';
import { NeuButton } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useApproveIdol, useDeleteAdmin, usePendingIdols } from '@/features/admin/use-admin';

const COLS = '64px 1.4fr 1fr 1.4fr auto';

export function AdminReviewPage() {
  const { data, isLoading, error, refetch } = usePendingIdols();
  const approve = useApproveIdol();
  const del = useDeleteAdmin('idol');
  const toast = useToast();
  const rows = data?.items ?? [];

  const act = async (id: string, yes: boolean, name: string) => {
    try {
      await approve.mutateAsync({ id, approve: yes });
      toast.success(`${name} → ${yes ? 'DUYỆT' : 'TỪ CHỐI'}`);
    } catch (e) {
      toast.error(e);
    }
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;

  return (
    <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
      <div className="spread" style={{ padding: '16px 20px', borderBottom: '3px solid var(--c-ink)' }}>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>Idol chờ duyệt</span>
        <span className="mono" style={{ fontWeight: 700, fontSize: 13, background: 'var(--c-yellow)', border: '2px solid var(--c-ink)', borderRadius: 8, padding: '4px 10px' }}>
          {rows.length} hồ sơ
        </span>
      </div>

      {rows.length === 0 ? (
        <div style={{ padding: 56, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 18, marginTop: 8 }}>Hết hồ sơ chờ duyệt!</div>
          <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>Mọi đề cử đã được xử lý.</div>
        </div>
      ) : (
        <>
          <div className="mono" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 14, padding: '11px 20px', borderBottom: '3px solid var(--c-ink)', background: '#f5f1e8', fontWeight: 700, fontSize: 11, color: '#555' }}>
            <span>ẢNH</span><span>TÊN IDOL</span><span>NGƯỜI ĐỀ CỬ</span><span>ALIASES</span><span>HÀNH ĐỘNG</span>
          </div>
          {rows.map((idol) => (
            <div key={idol.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 14, padding: '14px 20px', borderBottom: '2px solid #efe9dc', alignItems: 'center' }}>
              <div style={stripeStyle(colorForId(idol.id), 44)} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{idol.name}</div>
                <div className="mono muted" style={{ fontSize: 11 }}>{idol.id.slice(0, 8)}</div>
              </div>
              <div className="mono" style={{ fontSize: 13 }}>{idol.nominatedBy ? idol.nominatedBy.slice(0, 8) : '—'}</div>
              <div style={{ fontSize: 13, color: '#444' }}>{idol.aliases?.join(', ') || '—'}</div>
              <div className="row">
                <NeuButton size="sm" variant="green" disabled={approve.isPending} onClick={() => act(idol.id, true, idol.name)}>
                  ✓ Duyệt
                </NeuButton>
                <NeuButton size="sm" variant="pink" disabled={approve.isPending} onClick={() => act(idol.id, false, idol.name)}>
                  ✕ Từ chối
                </NeuButton>
                <DeleteButton
                  label={`Xoá idol ${idol.name}`}
                  successMessage={`Đã xoá ${idol.name}`}
                  onConfirm={() => del.mutateAsync(idol.id)}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
