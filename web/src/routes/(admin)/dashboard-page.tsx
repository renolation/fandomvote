import { Link } from 'react-router-dom';
import { NeuPill } from '@/components/neu';
import { colorForId, stripeStyle } from '@/lib/avatar';
import { useCampaigns } from '@/features/campaign/use-campaign';
import { useDeals } from '@/features/shop/use-shop';
import { usePendingIdols } from '@/features/admin/use-admin';

const card: React.CSSProperties = {
  background: 'var(--c-white)',
  border: '3px solid var(--c-ink)',
  borderRadius: 12,
  boxShadow: '5px 5px 0 var(--c-ink)',
};

function Kpi({ icon, value, label, bg }: { icon: string; value: string | number; label: string; bg: string }) {
  return (
    <div style={{ ...card, padding: 18, background: bg }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div className="mono" style={{ fontWeight: 700, fontSize: 28, marginTop: 14, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function AdminDashboardPage() {
  const { data: campaigns } = useCampaigns();
  const { data: pending } = usePendingIdols();
  const { data: deals } = useDeals();

  const all = campaigns ?? [];
  const open = all.filter((c) => c.status === 'OPEN').length;
  const pendingItems = pending?.items ?? [];

  return (
    <div className="col" style={{ gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
        <Kpi icon="🗳️" value={all.length} label="Tổng campaign" bg="var(--c-white)" />
        <Kpi icon="🟢" value={open} label="Đang mở (OPEN)" bg="var(--c-white)" />
        <Kpi icon="✅" value={pendingItems.length} label="Idol chờ duyệt" bg={pendingItems.length ? '#FFF3C4' : 'var(--c-white)'} />
        <Kpi icon="🎁" value={deals?.length ?? 0} label="Special deals" bg="var(--c-white)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        <div style={card}>
          <div className="spread" style={{ padding: '16px 18px', borderBottom: '3px solid var(--c-ink)' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>Đề cử chờ duyệt</span>
            <Link to="/admin/review" className="neu-pill" style={{ textDecoration: 'none' }}>Xem tất cả →</Link>
          </div>
          {pendingItems.length === 0 && <div className="muted" style={{ padding: 18 }}>Không có hồ sơ chờ duyệt.</div>}
          {pendingItems.slice(0, 5).map((idol) => (
            <div key={idol.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: '2px solid #efe9dc' }}>
              <div style={stripeStyle(colorForId(idol.id), 40)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{idol.name}</div>
                <div className="mono muted" style={{ fontSize: 12 }}>{idol.id.slice(0, 8)}</div>
              </div>
              <NeuPill>PENDING</NeuPill>
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ padding: '16px 18px', borderBottom: '3px solid var(--c-ink)', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16 }}>
            Chiến dịch gần đây
          </div>
          {all.slice(0, 6).map((c) => (
            <div key={c.id} className="spread" style={{ padding: '12px 18px', borderBottom: '2px solid #efe9dc' }}>
              <span style={{ fontSize: 14 }}>{c.title}</span>
              <NeuPill>{c.status}</NeuPill>
            </div>
          ))}
          {all.length > 0 && (
            <div style={{ padding: 14, textAlign: 'right' }}>
              <Link to="/admin/campaigns" style={{ fontSize: 13 }}>Quản lý campaign →</Link>
            </div>
          )}
          <div className="muted" style={{ padding: '0 18px 14px', fontSize: 12 }}>
            Tổng raised mỗi campaign xem trong mục Campaign.
          </div>
        </div>
      </div>
    </div>
  );
}
