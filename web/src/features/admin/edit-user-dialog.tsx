import { useEffect, useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuSelect } from '@/components/neu';
import { useToast } from '@/components/toast';
import type { AdminUser, Role } from '@/types/api';
import { useUpdateUser } from './use-admin';

// Sửa thông tin user (admin): tên hiển thị, fandom, vai trò.
export function EditUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const update = useUpdateUser();
  const toast = useToast();
  const [displayName, setDisplayName] = useState('');
  const [fandom, setFandom] = useState('');
  const [role, setRole] = useState<Role>('USER');

  // Nạp giá trị hiện tại mỗi khi mở dialog cho 1 user khác.
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName);
    setFandom(user.fandom ?? '');
    setRole(user.role);
  }, [user]);

  const submit = async () => {
    if (!user) return;
    try {
      await update.mutateAsync({
        id: user.id,
        body: { displayName: displayName.trim(), fandom: fandom.trim(), role },
      });
      toast.success(`Đã cập nhật ${displayName.trim() || user.displayName}`);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={!!user}
      onClose={onClose}
      title="✏️ Sửa người dùng"
      footer={
        <NeuButton variant="green" style={{ width: '100%' }} loading={update.isPending} onClick={submit}>
          Lưu thay đổi
        </NeuButton>
      }
    >
      <NeuField label="Tên hiển thị">
        <NeuInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </NeuField>
      <NeuField label="Fandom">
        <NeuInput value={fandom} onChange={(e) => setFandom(e.target.value)} />
      </NeuField>
      <NeuField label="Vai trò">
        <NeuSelect value={role} onChange={(e) => setRole(e.target.value as Role)}>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </NeuSelect>
      </NeuField>
    </NeuDialog>
  );
}
