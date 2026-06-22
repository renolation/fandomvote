import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuTextarea } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useDuplicateCheck, useNominateIdol } from './use-idol';

export function NominateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const dup = useDuplicateCheck(name);
  const nominate = useNominateIdol();
  const toast = useToast();
  const isDup = dup.data?.duplicate ?? false;
  const isValid = name.trim().length > 1 && !isDup;

  const submit = async () => {
    try {
      await nominate.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
      });
      toast.success('Đã gửi đề cử, chờ admin duyệt.');
      setName('');
      setBio('');
      setAvatarUrl('');
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={onClose}
      title="+ Đề cử Idol mới"
      footer={
        <NeuButton
          variant="green"
          style={{ width: '100%' }}
          disabled={!isValid || nominate.isPending}
          loading={nominate.isPending}
          onClick={submit}
        >
          Gửi đề cử
        </NeuButton>
      }
    >
      <NeuField label="Tên idol">
        <NeuInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên idol…" autoFocus />
      </NeuField>
      {dup.isFetching && <small className="muted">Đang kiểm tra trùng…</small>}
      {isDup && (
        <div style={{ color: 'var(--c-pink)', fontSize: 12, fontWeight: 700, marginTop: -6, marginBottom: 6 }}>
          ⚠ Idol đã tồn tại: <b>{dup.data?.idol?.name}</b> — hãy vote idol có sẵn.
        </div>
      )}
      {isValid && (
        <div style={{ color: '#22a24b', fontSize: 12, fontWeight: 700, marginTop: -6, marginBottom: 6 }}>✓ Tên hợp lệ</div>
      )}

      <NeuField label="Ảnh idol (URL, không bắt buộc)">
        <NeuInput value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
      </NeuField>

      <NeuField label="Mô tả (không bắt buộc)">
        <NeuTextarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Giới thiệu ngắn về idol…" />
      </NeuField>
    </NeuDialog>
  );
}
