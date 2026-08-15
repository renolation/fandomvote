import { useState } from 'react';
import { DeleteButton } from '@/components/delete-button';
import { NeuButton, NeuPill } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { colorForId } from '@/lib/avatar';
import { formatNumber } from '@/lib/format';
import { AdRewardConfigCard } from '@/features/admin/ad-reward-config-card';
import { DealEditDialog } from '@/features/admin/deal-edit-dialog';
import { useAdminDeals, useDeleteAdmin } from '@/features/admin/use-admin';
import type { ShopDeal } from '@/types/api';

const COLS = '56px 1.5fr .9fr .8fr .9fr .8fr 92px';

export function AdminShopPage() {
  const { data, isLoading, error, refetch } = useAdminDeals();
  const del = useDeleteAdmin('deal');
  // null = đang tạo mới, ShopDeal = đang sửa, undefined = dialog đóng.
  const [editing, setEditing] = useState<ShopDeal | null | undefined>(undefined);

  return (
    <>
      <AdRewardConfigCard />

      <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
        <div className="spread" style={{ padding: '16px 20px', borderBottom: '3px solid var(--c-ink)' }}>
          <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 17 }}>🎁 Special Deals (đối tác)</span>
          <NeuButton variant="yellow" onClick={() => setEditing(null)}>+ Thêm deal</NeuButton>
        </div>

        {isLoading && <Loading />}
        {error && <ErrorState error={error} onRetry={() => refetch()} />}
        {data && data.length === 0 && <EmptyState message="Chưa có deal." />}

        {data && data.length > 0 && (
          <>
            <div className="mono" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 12, padding: '11px 20px', borderBottom: '3px solid var(--c-ink)', background: '#f5f1e8', fontWeight: 700, fontSize: 11, color: '#555' }}>
              <span>ẢNH</span><span>QUÀ</span><span>GIÁ</span><span>KHO</span><span>LOẠI</span><span>TRẠNG THÁI</span><span></span>
            </div>
            {data.map((d) => {
              const c = colorForId(d.id);
              return (
                <div key={d.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 12, padding: '13px 20px', borderBottom: '2px solid #efe9dc', alignItems: 'center', opacity: d.isActive ? 1 : 0.55 }}>
                  {/* Có ảnh → hiện ảnh; chưa có → ô sọc theo id như cũ. */}
                  {d.imageUrl ? (
                    <img src={d.imageUrl} alt={d.title} style={{ width: 48, height: 40, objectFit: 'cover', border: '2px solid var(--c-ink)', borderRadius: 8 }} />
                  ) : (
                    <div style={{ width: 48, height: 40, border: '2px solid var(--c-ink)', borderRadius: 8, background: `repeating-linear-gradient(45deg, ${c}, ${c} 6px, #0a0a0a 6px, #0a0a0a 9px)` }} />
                  )}
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{d.title}</div>
                  <div className="mono" style={{ fontWeight: 700, fontSize: 13 }}>{formatNumber(d.cost)} {d.currency === 'GOLD' ? '🟡' : '💎'}</div>
                  <div className="mono" style={{ fontSize: 13 }}>{d.stock - d.stockSold}/{d.stock}</div>
                  <NeuPill color={d.itemType === 'DIGITAL' ? '#3B82F6' : '#FB7185'}>{d.itemType}</NeuPill>
                  <NeuPill color={d.isActive ? '#22C55E' : '#9ca3af'}>{d.isActive ? 'ĐANG BÁN' : 'ĐÃ TẮT'}</NeuPill>
                  <div className="row" style={{ gap: 6 }}>
                    <NeuButton onClick={() => setEditing(d)}>✏️</NeuButton>
                    <DeleteButton
                      label={`Xoá deal "${d.title}"`}
                      successMessage="Đã xoá deal"
                      onConfirm={() => del.mutateAsync(d.id)}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* key: reset state form khi đổi deal đang sửa */}
      {editing !== undefined && (
        <DealEditDialog
          key={editing?.id ?? 'new'}
          deal={editing}
          open
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
