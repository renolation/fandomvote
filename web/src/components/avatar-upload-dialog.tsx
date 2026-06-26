import { useState } from 'react';
import { ImageUpload } from '@/components/image-upload';
import { NeuButton, NeuDialog } from '@/components/neu';
import { useToast } from '@/components/toast';
import { uploadFile } from '@/lib/upload-api';
import { authApi } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-context';

// Đổi ảnh đại diện: chọn file (preview cục bộ) → upload R2 → cập nhật profile → refresh user.
export function AvatarUploadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { refreshUser } = useAuth();
  const toast = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setFile(null);
    onClose();
  };

  const save = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const { url } = await uploadFile(file);
      await authApi.updateProfile({ avatarUrl: url });
      await refreshUser();
      toast.success('Đã cập nhật ảnh đại diện');
      setFile(null);
      onClose();
    } catch (e) {
      toast.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={close}
      title="📷 Đổi ảnh đại diện"
      footer={
        <NeuButton variant="green" style={{ width: '100%' }} disabled={!file} loading={saving} onClick={save}>
          Lưu
        </NeuButton>
      }
    >
      <ImageUpload file={file} onChange={setFile} disabled={saving} />
    </NeuDialog>
  );
}
