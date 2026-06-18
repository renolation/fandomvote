import { useState } from 'react';
import { NeuButton, NeuCard, NeuField, NeuInput, NeuPill } from '@/components/neu';
import { EmptyState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { useApprovedIdols } from '@/features/idol/use-idol';
import { useApproveIdol } from '@/features/admin/use-admin';

export function AdminIdolsPage() {
  const [idolId, setIdolId] = useState('');
  const approve = useApproveIdol();
  const toast = useToast();
  const approved = useApprovedIdols('');

  const act = async (yes: boolean) => {
    if (!idolId.trim()) return;
    try {
      const idol = await approve.mutateAsync({ id: idolId.trim(), approve: yes });
      toast.success(`Idol "${idol.name}" → ${idol.status}`);
      setIdolId('');
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div className="col">
      <h2 style={{ margin: 0 }}>Duyệt Idol</h2>
      <NeuCard>
        <NeuField label="Idol ID (đề cử PENDING)">
          <NeuInput value={idolId} onChange={(e) => setIdolId(e.target.value)} placeholder="uuid" />
        </NeuField>
        <div className="row">
          <NeuButton variant="green" disabled={!idolId.trim() || approve.isPending} onClick={() => act(true)}>
            Duyệt
          </NeuButton>
          <NeuButton variant="pink" disabled={!idolId.trim() || approve.isPending} onClick={() => act(false)}>
            Từ chối
          </NeuButton>
        </div>
        <p className="muted" style={{ fontSize: 12, marginBottom: 0 }}>
          Lưu ý: backend chưa có endpoint liệt kê idol PENDING — duyệt theo ID. Cần bổ sung
          `GET /admin/idols?status=PENDING` để hiển thị danh sách chờ duyệt.
        </p>
      </NeuCard>

      <h3 style={{ margin: '8px 0 0' }}>Idol đã duyệt</h3>
      {approved.isLoading && <Loading />}
      {approved.data && approved.data.items.length === 0 && (
        <EmptyState message="Chưa có idol đã duyệt." />
      )}
      {approved.data?.items.map((idol) => (
        <NeuCard key={idol.id} flat>
          <div className="spread">
            <strong>{idol.name}</strong>
            <NeuPill color="var(--c-green)">{idol.status}</NeuPill>
          </div>
          <code className="mono muted" style={{ fontSize: 11 }}>
            {idol.id}
          </code>
        </NeuCard>
      ))}
    </div>
  );
}
