import { useState } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuTextarea } from '@/components/neu';
import { useToast } from '@/components/toast';
import { uploadFile } from '@/lib/upload-api';
import { useDuplicateCheck, useNominateIdol } from './use-idol';

export function NominateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false); // bao trùm cả upload + nominate
  const dup = useDuplicateCheck(name);
  const nominate = useNominateIdol();
  const toast = useToast();
  const isDup = dup.data?.duplicate ?? false;
  const isValid = name.trim().length > 1 && !isDup;

  const reset = () => {
    setName('');
    setBio('');
    setImageFile(null);
  };

  const submit = async () => {
    if (!isValid || busy) return;
    setBusy(true);
    try {
      // Upload ảnh CHỈ khi bấm gửi (không upload lúc chọn file).
      let avatarUrl: string | undefined;
      if (imageFile) {
        const res = await uploadFile(imageFile);
        avatarUrl = res.url;
      }
      await nominate.mutateAsync({ name: name.trim(), bio: bio.trim() || undefined, avatarUrl });
      toast.success('Đã gửi đề cử, chờ admin duyệt.');
      reset();
      onClose();
    } catch (e) {
      toast.error(e);
    } finally {
      setBusy(false);
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
          disabled={!isValid || busy}
          loading={busy}
          onClick={submit}
        >
          {busy && imageFile ? 'Đang tải ảnh…' : 'Gửi đề cử'}
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

      <NeuField label="Ảnh idol (không bắt buộc)">
        <ImageUpload file={imageFile} onChange={setImageFile} disabled={busy} />
      </NeuField>

      <NeuField label="Mô tả (không bắt buộc)">
        <NeuTextarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Giới thiệu ngắn về idol…" />
      </NeuField>
    </NeuDialog>
  );
}
