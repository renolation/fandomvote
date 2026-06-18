import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput } from '@/components/neu';
import { useToast } from '@/components/toast';
import { useConvertDiamond } from './use-wallet';

export function ConvertDiamondDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [diamonds, setDiamonds] = useState(1);
  const convert = useConvertDiamond();
  const toast = useToast();

  const submit = async () => {
    try {
      await convert.mutateAsync(diamonds);
      toast.success(`Đã đổi ${diamonds} Diamond → ${diamonds * 1000} Gold`);
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={onClose}
      title="Đổi Diamond → Gold"
      footer={
        <NeuButton variant="blue" style={{ width: '100%' }} loading={convert.isPending} onClick={submit}>
          Đổi {diamonds} Diamond = {diamonds * 1000} Gold
        </NeuButton>
      }
    >
      <p className="muted" style={{ fontSize: 13 }}>
        Một chiều, không hoàn. 1 Diamond = 1.000 Gold.
      </p>
      <NeuField label="Số Diamond">
        <NeuInput
          type="number"
          min={1}
          value={diamonds}
          onChange={(e) => setDiamonds(Math.max(1, Number(e.target.value) || 1))}
        />
      </NeuField>
    </NeuDialog>
  );
}
