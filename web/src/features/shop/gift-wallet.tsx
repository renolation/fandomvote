import { useState } from 'react';
import { NeuButton, NeuCard, NeuDialog, NeuField, NeuInput, NeuPill, NeuSelect } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { countdownLabel } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import type { GiftWalletItem } from '@/types/api';
import { useAddresses, useConfirmGift, useCreateAddress, useGifts, useUseGift } from './use-shop';

function ConfirmDialog({ item, onClose }: { item: GiftWalletItem | null; onClose: () => void }) {
  const { data: addresses } = useAddresses();
  const createAddr = useCreateAddress();
  const confirm = useConfirmGift();
  const toast = useToast();
  const [addrId, setAddrId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [phone, setPhone] = useState('');
  const [line1, setLine1] = useState('');
  const [province, setProvince] = useState('');

  const submit = async () => {
    if (!item) return;
    try {
      let id = addrId;
      if (!id) {
        const created = await createAddr.mutateAsync({ recipient, phone, line1, province });
        id = created.id;
      }
      await confirm.mutateAsync({ id: item.id, shippingAddressId: id });
      toast.success('Đã xác nhận nhận quà.');
      onClose();
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <NeuDialog
      open={!!item}
      onClose={onClose}
      title="Xác nhận nhận quà"
      footer={
        <NeuButton variant="green" style={{ width: '100%' }} loading={confirm.isPending} onClick={submit}>
          Xác nhận
        </NeuButton>
      }
    >
      {addresses && addresses.length > 0 && (
        <NeuField label="Chọn địa chỉ có sẵn">
          <NeuSelect value={addrId} onChange={(e) => setAddrId(e.target.value)}>
            <option value="">— Nhập địa chỉ mới —</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.recipient} · {a.line1}, {a.province}
              </option>
            ))}
          </NeuSelect>
        </NeuField>
      )}
      {!addrId && (
        <>
          <NeuField label="Người nhận">
            <NeuInput value={recipient} onChange={(e) => setRecipient(e.target.value)} />
          </NeuField>
          <NeuField label="Điện thoại">
            <NeuInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </NeuField>
          <NeuField label="Địa chỉ">
            <NeuInput value={line1} onChange={(e) => setLine1(e.target.value)} />
          </NeuField>
          <NeuField label="Tỉnh/Thành">
            <NeuInput value={province} onChange={(e) => setProvince(e.target.value)} />
          </NeuField>
        </>
      )}
    </NeuDialog>
  );
}

export function GiftWallet() {
  const { data, isLoading, error, refetch } = useGifts();
  const useGift = useUseGift();
  const toast = useToast();
  const now = useNow(30_000);
  const [confirmItem, setConfirmItem] = useState<GiftWalletItem | null>(null);

  if (isLoading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmptyState message="Ví quà trống." />;

  const onUse = async (id: string) => {
    try {
      await useGift.mutateAsync(id);
      toast.success('Đã dùng quà.');
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div className="col">
      {data.map((g) => (
        <NeuCard key={g.id} flat>
          <div className="spread">
            <div>
              <NeuPill>{g.itemType}</NeuPill> <NeuPill>{g.status}</NeuPill>
              {g.code && (
                <div className="mono" style={{ fontSize: 13, marginTop: 4 }}>
                  {g.code}
                </div>
              )}
              {g.expiresAt && (g.status === 'ACTIVE' || g.status === 'PENDING') && (
                <div className="muted" style={{ fontSize: 12 }}>
                  Hết hạn: {countdownLabel(g.expiresAt, now)}
                </div>
              )}
            </div>
            {g.itemType === 'DIGITAL' && g.status === 'ACTIVE' && (
              <NeuButton size="sm" onClick={() => onUse(g.id)} disabled={useGift.isPending}>
                Dùng
              </NeuButton>
            )}
            {g.itemType === 'PHYSICAL' && g.status === 'PENDING' && (
              <NeuButton size="sm" variant="green" onClick={() => setConfirmItem(g)}>
                Xác nhận
              </NeuButton>
            )}
          </div>
        </NeuCard>
      ))}
      <ConfirmDialog item={confirmItem} onClose={() => setConfirmItem(null)} />
    </div>
  );
}
