import { useState } from 'react';
import { NeuButton, NeuDialog } from '@/components/neu';
import { useToast } from '@/components/toast';

interface DeleteButtonProps {
  // Hàm thực hiện xoá — throw nếu lỗi (sẽ hiện toast lỗi).
  onConfirm: () => Promise<unknown>;
  // Mô tả ngắn đối tượng bị xoá, hiển thị trong dialog (vd "user Nguyễn A").
  label?: string;
  // Thông báo toast khi xoá thành công.
  successMessage?: string;
  disabled?: boolean;
}

// Nút xoá nhỏ (🗑) → mở dialog xác nhận → gọi onConfirm → toast.
// Dùng cho hard-delete admin: KHÔNG hoàn tác.
export function DeleteButton({ onConfirm, label, successMessage, disabled }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();

  const confirm = async () => {
    setPending(true);
    try {
      await onConfirm();
      toast.success(successMessage ?? 'Đã xoá vĩnh viễn.');
      setOpen(false);
    } catch (e) {
      toast.error(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <NeuButton
        size="sm"
        variant="pink"
        disabled={disabled}
        title="Xoá vĩnh viễn"
        onClick={() => setOpen(true)}
      >
        🗑
      </NeuButton>
      <NeuDialog
        open={open}
        onClose={() => (pending ? undefined : setOpen(false))}
        title="Xoá vĩnh viễn?"
        footer={
          <div className="row" style={{ gap: 10 }}>
            <NeuButton variant="ghost" style={{ flex: 1 }} disabled={pending} onClick={() => setOpen(false)}>
              Huỷ
            </NeuButton>
            <NeuButton variant="pink" style={{ flex: 1 }} loading={pending} onClick={confirm}>
              Xoá vĩnh viễn
            </NeuButton>
          </div>
        }
      >
        <div style={{ fontSize: 14, lineHeight: 1.5 }}>
          {label && (
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{label}</div>
          )}
          Hành động không hoàn tác (hard delete).
        </div>
      </NeuDialog>
    </>
  );
}
