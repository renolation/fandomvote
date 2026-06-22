import { useState } from 'react';
import { NeuButton, NeuDialog, NeuField, NeuInput, NeuSelect } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { formatDateTime } from '@/lib/format';
import type { GiftItemStatus, GiftWalletItem } from '@/types/api';
import { useAddresses, useConfirmGift, useCreateAddress, useGifts, useUseGift } from './use-shop';

type Filter = 'all' | 'digital' | 'physical';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'digital', label: 'Digital' },
  { key: 'physical', label: 'Physical' },
];

const STATUS_COLOR: Record<GiftItemStatus, string> = {
  ACTIVE: '#22C55E',
  DELIVERED: '#22C55E',
  SHIPPED: '#3B82F6',
  CONFIRMED: '#3B82F6',
  PENDING: '#F59E0B',
  USED: '#999',
  EXPIRED: '#999',
};
const STEPS: GiftItemStatus[] = ['PENDING', 'SHIPPED', 'DELIVERED'];
function physicalStep(status: GiftItemStatus): number {
  if (status === 'DELIVERED') return 3;
  if (status === 'SHIPPED') return 2;
  return 1; // PENDING / CONFIRMED
}

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

function StatusBadge({ status }: { status: GiftItemStatus }) {
  return (
    <span
      className="mono"
      style={{ background: STATUS_COLOR[status], color: '#fff', border: '2px solid var(--c-ink)', borderRadius: 6, padding: '2px 8px', fontWeight: 700, fontSize: 10 }}
    >
      {status}
    </span>
  );
}

export function GiftWallet() {
  const { data, isLoading, error, refetch } = useGifts();
  const useGift = useUseGift();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
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

  const gifts = data.filter(
    (g) => filter === 'all' || (filter === 'digital' && g.itemType === 'DIGITAL') || (filter === 'physical' && g.itemType === 'PHYSICAL'),
  );

  return (
    <div className="col" style={{ gap: 14 }}>
      <div className="row" style={{ border: '3px solid var(--c-ink)', borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start', gap: 0 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              border: 'none',
              padding: '8px 14px',
              fontWeight: 700,
              fontSize: 12,
              fontFamily: 'var(--font-head)',
              cursor: 'pointer',
              background: filter === f.key ? 'var(--c-ink)' : 'var(--c-white)',
              color: filter === f.key ? '#fff' : 'var(--c-ink)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {gifts.map((g) => (
        <div key={g.id} style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 14, boxShadow: '4px 4px 0 var(--c-ink)', padding: 15 }}>
          <div className="spread" style={{ alignItems: 'flex-start', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 15 }}>
              {g.itemType === 'DIGITAL' ? '🎫 Quà digital' : '📦 Quà vật lý'}
            </div>
            <StatusBadge status={g.status} />
          </div>

          {g.itemType === 'DIGITAL' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12, background: 'var(--c-navbg)', border: '2px dashed var(--c-ink)', borderRadius: 10, padding: 11 }}>
              <div style={{ width: 52, height: 52, flex: 'none', border: '2px solid var(--c-ink)', borderRadius: 7, background: 'repeating-conic-gradient(#000 0 25%, #fff 0 50%) 50% / 9px 9px' }} />
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontWeight: 700, fontSize: 16, letterSpacing: 1, wordBreak: 'break-all' }}>{g.code ?? '—'}</div>
                {g.expiresAt && <div className="mono" style={{ fontSize: 11, color: '#888' }}>HSD: {formatDateTime(g.expiresAt)}</div>}
              </div>
            </div>
          )}

          {g.itemType === 'PHYSICAL' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {STEPS.map((label, i) => {
                  const lit = i < physicalStep(g.status);
                  return (
                    <div
                      key={label}
                      className="mono"
                      style={{ flex: 1, textAlign: 'center', border: '2px solid var(--c-ink)', borderRadius: 7, padding: '6px 2px', fontWeight: 700, fontSize: 10, background: lit ? '#3B82F6' : '#fff', color: lit ? '#fff' : '#000' }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              {g.status === 'PENDING' && (
                <div style={{ marginTop: 9, background: '#FFE08A', border: '2px solid var(--c-ink)', borderRadius: 8, padding: '8px 11px', fontSize: 12, fontWeight: 600 }}>
                  ⚠ Xác nhận địa chỉ để được giao hàng.
                </div>
              )}
            </div>
          )}

          <div className="row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
            {g.itemType === 'DIGITAL' && g.status === 'ACTIVE' && (
              <NeuButton size="sm" onClick={() => onUse(g.id)} disabled={useGift.isPending}>
                Dùng
              </NeuButton>
            )}
            {g.itemType === 'PHYSICAL' && g.status === 'PENDING' && (
              <NeuButton size="sm" variant="green" onClick={() => setConfirmItem(g)}>
                Xác nhận địa chỉ
              </NeuButton>
            )}
          </div>
        </div>
      ))}

      <ConfirmDialog item={confirmItem} onClose={() => setConfirmItem(null)} />
    </div>
  );
}
