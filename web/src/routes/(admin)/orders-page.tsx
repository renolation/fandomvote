import { useState } from 'react';
import { NeuButton } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { formatDateTime } from '@/lib/format';
import type { AdminOrder } from '@/types/api';
import { useOrderAction, useOrders } from '@/features/admin/use-admin';

const COLS = '52px 1.5fr 1.1fr 200px 1.6fr auto';

// Bộ lọc trạng thái — ALL = tất cả item PHYSICAL.
const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;
type Filter = (typeof FILTERS)[number];
const FILTER_LABEL: Record<Filter, string> = {
  ALL: 'Tất cả',
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPED: 'Đang giao',
  DELIVERED: 'Đã giao',
};

// 3 bước giao hàng — tô đậm theo trạng thái hiện tại (PENDING chưa vào bước nào).
const STEPS = ['CONFIRMED', 'SHIPPED', 'DELIVERED'] as const;
const STEP_LABEL: Record<(typeof STEPS)[number], string> = {
  CONFIRMED: 'Xác nhận',
  SHIPPED: 'Giao hàng',
  DELIVERED: 'Đã nhận',
};
const STEP_RANK: Record<string, number> = { CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3 };

function ShippingTracker({ status }: { status: AdminOrder['status'] }) {
  if (status === 'PENDING') {
    return (
      <span className="mono muted" style={{ fontSize: 11 }}>
        chờ xác nhận địa chỉ
      </span>
    );
  }
  const current = STEP_RANK[status] ?? 0;
  return (
    <div className="row" style={{ gap: 6, alignItems: 'center' }}>
      {STEPS.map((step, i) => {
        const filled = current >= STEP_RANK[step];
        return (
          <span key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              className="mono"
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                border: '2px solid var(--c-ink)',
                background: filled ? 'var(--c-green)' : 'var(--c-white)',
                color: filled ? '#fff' : '#999',
              }}
            >
              {STEP_LABEL[step]}
            </span>
            {i < STEPS.length - 1 && (
              <span style={{ color: current > STEP_RANK[step] ? 'var(--c-ink)' : '#ccc', fontWeight: 700 }}>›</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function AddressCell({ address }: { address: AdminOrder['address'] }) {
  if (!address) return <span className="mono muted" style={{ fontSize: 12 }}>—</span>;
  return (
    <div style={{ fontSize: 12, minWidth: 0 }}>
      <div style={{ fontWeight: 700 }}>
        {address.recipient} · {address.phone}
      </div>
      <div
        className="mono muted"
        style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {address.line1}, {address.province}
      </div>
    </div>
  );
}

export function AdminOrdersPage() {
  const [filter, setFilter] = useState<Filter>('ALL');
  const { data, isLoading, error, refetch } = useOrders(filter);
  const action = useOrderAction();
  const toast = useToast();

  const rows = data ?? [];

  const act = async (o: AdminOrder, kind: 'ship' | 'deliver') => {
    try {
      await action.mutateAsync({ id: o.id, action: kind });
      toast.success(kind === 'ship' ? 'Đã chuyển sang trạng thái giao hàng' : 'Đã xác nhận giao thành công');
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        {FILTERS.map((f) => (
          <NeuButton key={f} size="sm" variant={filter === f ? 'blue' : 'ghost'} onClick={() => setFilter(f)}>
            {FILTER_LABEL[f]}
          </NeuButton>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div
          style={{
            background: 'var(--c-white)',
            border: '3px solid var(--c-ink)',
            borderRadius: 12,
            boxShadow: '5px 5px 0 var(--c-ink)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: COLS,
                gap: 14,
                padding: '11px 20px',
                borderBottom: '3px solid var(--c-ink)',
                background: '#f5f1e8',
                fontWeight: 700,
                fontSize: 11,
                color: '#555',
                minWidth: 880,
              }}
            >
              <span>ẢNH</span>
              <span>NGƯỜI NHẬN</span>
              <span>QUÀ</span>
              <span>TRẠNG THÁI</span>
              <span>ĐỊA CHỈ</span>
              <span>HÀNH ĐỘNG</span>
            </div>

            {rows.length === 0 ? (
              <div className="muted" style={{ padding: 48, textAlign: 'center', fontSize: 14 }}>
                Không có đơn hàng nào.
              </div>
            ) : (
              rows.map((o) => (
                <div
                  key={o.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: COLS,
                    gap: 14,
                    padding: '13px 20px',
                    borderBottom: '2px solid #efe9dc',
                    alignItems: 'center',
                    minWidth: 880,
                  }}
                >
                  <div style={stripeStyle(colorForId(o.user.id), 40)} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{o.user.displayName}</div>
                    <div
                      className="mono muted"
                      style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {o.user.email ?? o.user.id.slice(0, 8)}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{o.dealTitle ?? '—'}</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>
                      {formatDateTime(o.createdAt).split(' ').slice(-1)[0] ?? formatDateTime(o.createdAt)}
                    </div>
                  </div>
                  <ShippingTracker status={o.status} />
                  <AddressCell address={o.address} />
                  <div className="row">
                    {o.status === 'CONFIRMED' && (
                      <NeuButton size="sm" variant="blue" disabled={action.isPending} onClick={() => act(o, 'ship')}>
                        Giao hàng
                      </NeuButton>
                    )}
                    {o.status === 'SHIPPED' && (
                      <NeuButton size="sm" variant="green" disabled={action.isPending} onClick={() => act(o, 'deliver')}>
                        Đã nhận
                      </NeuButton>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
