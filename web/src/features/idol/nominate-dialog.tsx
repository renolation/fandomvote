import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useDuplicateCheck, useNominateIdol } from './use-idol';

export function NominateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const dup = useDuplicateCheck(name);
  const nominate = useNominateIdol();
  const toast = useToast();
  const isDup = dup.data?.duplicate ?? false;

  const submit = async () => {
    try {
      await nominate.mutateAsync({ name: name.trim() });
      toast.success('Đã gửi đề cử, chờ admin duyệt.');
      setName('');
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={onClose}
      title="Đề cử idol mới"
      footer={
        <NeuButton
          variant="blue"
          style={{ width: '100%' }}
          disabled={!name.trim() || isDup || nominate.isPending}
          loading={nominate.isPending}
          onClick={submit}
        >
          Gửi đề cử
        </NeuButton>
      }
    >
      <NeuField label="Tên idol">
        <NeuInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </NeuField>
      {dup.isFetching && <small className="muted">Đang kiểm tra trùng…</small>}
      {isDup && (
        <div style={{ color: 'var(--c-pink)', fontSize: 13 }}>
          Idol đã tồn tại: <b>{dup.data?.idol?.name}</b> — hãy vote idol có sẵn.
        </div>
      )}
    </NeuDialog>
  );
}
