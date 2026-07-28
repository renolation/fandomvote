import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuSelect, NeuTextarea } from '@/components/neu';
import { useToast } from '@/components/toast';
import type { CreateDealBody, DealCurrency, GiftItemType, ShopDeal } from '@/types/api';
import { useCreateDeal, useUpdateDeal } from './use-admin';

// Tạo mới (deal = null) hoặc sửa deal có sẵn. stock_sold không sửa được — chỉ tăng khi user đổi quà.
export function DealEditDialog({
  deal,
  open,
  onClose,
}: {
  deal: ShopDeal | null;
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateDeal();
  const update = useUpdateDeal();
  const toast = useToast();

  const [title, setTitle] = useState(deal?.title ?? '');
  const [description, setDescription] = useState(deal?.description ?? '');
  const [cost, setCost] = useState(String(deal?.cost ?? 1000));
  const [currency, setCurrency] = useState<DealCurrency>(
    deal?.currency === 'DIAMOND' ? 'DIAMOND' : 'GOLD',
  );
  const [itemType, setItemType] = useState<GiftItemType>(deal?.itemType ?? 'DIGITAL');
  const [stock, setStock] = useState(String(deal?.stock ?? 10));
  const [validityDays, setValidityDays] = useState(String(deal?.validityDays ?? ''));
  const [isActive, setIsActive] = useState(deal?.isActive ?? true);

  const pending = create.isPending || update.isPending;

  const submit = async () => {
    const parsedCost = parseInt(cost, 10);
    const parsedStock = parseInt(stock, 10);
    if (!title.trim()) return toast.error('Tên quà không được để trống');
    if (!Number.isFinite(parsedCost) || parsedCost < 1) return toast.error('Giá phải ≥ 1');
    if (!Number.isFinite(parsedStock) || parsedStock < 0) return toast.error('Kho phải ≥ 0');

    const days = parseInt(validityDays, 10);
    const body: CreateDealBody = {
      title: title.trim(),
      description: description.trim() || undefined,
      cost: parsedCost,
      currency,
      itemType,
      stock: parsedStock,
      validityDays: Number.isFinite(days) && days > 0 ? days : undefined,
      isActive,
    };

    try {
      if (deal) {
        await update.mutateAsync({ id: deal.id, body });
        toast.success('Đã cập nhật deal');
      } else {
        await create.mutateAsync(body);
        toast.success('Đã tạo deal');
      }
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={open}
      onClose={onClose}
      title={deal ? '✏️ Sửa deal' : '➕ Thêm deal'}
      footer={
        <NeuButton variant="green" style={{ width: '100%' }} loading={pending} onClick={submit}>
          {deal ? 'Lưu thay đổi' : 'Tạo deal'}
        </NeuButton>
      }
    >
      <NeuField label="Tên quà">
        <NeuInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Voucher Highlands 50k"
        />
      </NeuField>
      <NeuField label="Mô tả">
        <NeuTextarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </NeuField>
      <NeuField label="Giá (điểm)">
        <NeuInput inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value)} />
      </NeuField>
      <NeuField label="Loại điểm">
        <NeuSelect value={currency} onChange={(e) => setCurrency(e.target.value as DealCurrency)}>
          <option value="GOLD">🟡 Gold</option>
          <option value="DIAMOND">💎 Diamond</option>
        </NeuSelect>
      </NeuField>
      <NeuField label="Hình thức quà">
        <NeuSelect value={itemType} onChange={(e) => setItemType(e.target.value as GiftItemType)}>
          <option value="DIGITAL">DIGITAL — mã/voucher online</option>
          <option value="PHYSICAL">PHYSICAL — giao hàng tận nơi</option>
        </NeuSelect>
      </NeuField>
      <NeuField label="Số lượng kho">
        <NeuInput inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} />
      </NeuField>
      <NeuField label="Hạn dùng quà (số ngày — để trống nếu không hết hạn)">
        <NeuInput
          inputMode="numeric"
          value={validityDays}
          onChange={(e) => setValidityDays(e.target.value)}
          placeholder="VD: 30"
        />
      </NeuField>
      <NeuField label="Trạng thái">
        <NeuSelect value={isActive ? '1' : '0'} onChange={(e) => setIsActive(e.target.value === '1')}>
          <option value="1">Đang bán (hiện với user)</option>
          <option value="0">Đã tắt (ẩn khỏi shop)</option>
        </NeuSelect>
      </NeuField>
    </NeuDialog>
  );
}
