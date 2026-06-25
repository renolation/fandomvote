import { useState } from 'react';
import { DeleteButton } from '@/components/delete-button';
import { NeuButton } from '@/components/neu';
import { ErrorState, Loading } from '@/components/state-views';
import { useToast } from '@/components/toast';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { formatDateTime } from '@/lib/format';
import { useDebounce } from '@/lib/use-debounce';
import type { AdminUser } from '@/types/api';
import { useAdminUsers, useDeleteAdmin, useFlagUser } from '@/features/admin/use-admin';

const COLS = '52px 1.6fr 90px 130px 120px auto';

function VerifyCell({ u }: { u: AdminUser }) {
  const parts: string[] = [];
  if (u.emailVerifiedAt) parts.push('✉');
  if (u.phoneVerifiedAt) parts.push('📱');
  return (
    <span className="mono" style={{ fontSize: 12 }}>
      {parts.length ? `✓ ${parts.join(' ')}` : <span style={{ color: '#bbb' }}>chưa xác thực</span>}
    </span>
  );
}

export function AdminUsersPage() {
  const [searchInput, setSearchInput] = useState('');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const search = useDebounce(searchInput.trim(), 400);
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useAdminUsers(
    search,
    flaggedOnly,
  );
  const flag = useFlagUser();
  const del = useDeleteAdmin('user');
  const toast = useToast();

  const rows = data?.pages.flatMap((p) => p.items) ?? [];

  const act = async (u: AdminUser) => {
    try {
      await flag.mutateAsync({ id: u.id, flag: !u.isFlagged });
      toast.success(`${u.displayName} → ${u.isFlagged ? 'BỎ CỜ' : 'GẮN CỜ'}`);
    } catch (e) {
      toast.error(e);
    }
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
        <input
          className="neu-input"
          style={{ maxWidth: 320 }}
          placeholder="🔍 Tìm theo email / SĐT / tên…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <NeuButton size="sm" variant={flaggedOnly ? 'pink' : 'ghost'} onClick={() => setFlaggedOnly((v) => !v)}>
          {flaggedOnly ? '🚩 Chỉ user bị gắn cờ' : 'Tất cả user'}
        </NeuButton>
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : (
        <div style={{ background: 'var(--c-white)', border: '3px solid var(--c-ink)', borderRadius: 12, boxShadow: '5px 5px 0 var(--c-ink)', overflow: 'hidden' }}>
          <div className="mono" style={{ display: 'grid', gridTemplateColumns: COLS, gap: 14, padding: '11px 20px', borderBottom: '3px solid var(--c-ink)', background: '#f5f1e8', fontWeight: 700, fontSize: 11, color: '#555' }}>
            <span>ẢNH</span><span>NGƯỜI DÙNG</span><span>VAI TRÒ</span><span>XÁC THỰC</span><span>NGÀY TẠO</span><span>HÀNH ĐỘNG</span>
          </div>

          {rows.length === 0 ? (
            <div className="muted" style={{ padding: 48, textAlign: 'center', fontSize: 14 }}>Không có user nào.</div>
          ) : (
            rows.map((u) => (
              <div key={u.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 14, padding: '13px 20px', borderBottom: '2px solid #efe9dc', alignItems: 'center', background: u.isFlagged ? '#FFF0F2' : undefined }}>
                <div style={stripeStyle(colorForId(u.id), 40)} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {u.displayName}
                    {u.isFlagged && (
                      <span className="mono" style={{ background: 'var(--c-pink)', color: '#fff', border: '2px solid var(--c-ink)', borderRadius: 6, padding: '0 6px', fontSize: 10, fontWeight: 700 }}>FLAGGED</span>
                    )}
                  </div>
                  <div className="mono muted" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.email ?? u.phone ?? u.id.slice(0, 8)}
                  </div>
                </div>
                <span className="mono" style={{ fontWeight: 700, fontSize: 11, justifySelf: 'start', background: u.role === 'ADMIN' ? 'var(--c-yellow)' : 'var(--c-white)', border: '2px solid var(--c-ink)', borderRadius: 6, padding: '2px 8px' }}>
                  {u.role}
                </span>
                <VerifyCell u={u} />
                <span className="mono" style={{ fontSize: 12 }}>{formatDateTime(u.createdAt).split(' ').slice(-1)[0] ?? formatDateTime(u.createdAt)}</span>
                <div className="row" style={{ gap: 6 }}>
                  <NeuButton size="sm" variant={u.isFlagged ? 'green' : 'pink'} disabled={flag.isPending} onClick={() => act(u)}>
                    {u.isFlagged ? 'Bỏ cờ' : 'Gắn cờ'}
                  </NeuButton>
                  <DeleteButton
                    label={`Xoá user ${u.displayName}`}
                    successMessage={`Đã xoá ${u.displayName}`}
                    onConfirm={() => del.mutateAsync(u.id)}
                  />
                </div>
              </div>
            ))
          )}

          {hasNextPage && (
            <div style={{ padding: 14, textAlign: 'center' }}>
              <NeuButton variant="ghost" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Tải thêm
              </NeuButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
