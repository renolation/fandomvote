import { Link } from 'react-router-dom';
import { NeuButton, NeuDialog, NeuPill } from '@/components/neu';
import { Loading } from '@/components/state-views';
import { formatDate } from '@/lib/format';
import type { Campaign } from '@/types/api';
import { useLeaderboard } from '@/features/campaign/use-campaign';

const headLabel: React.CSSProperties = {
  fontFamily: 'var(--font-head)',
  fontWeight: 700,
  fontSize: 14,
  margin: '18px 0 10px',
};

// Popup thông tin campaign trong feed Sự kiện: period + phần thưởng + ứng viên (idol).
// Tách Inner để hook useLeaderboard chỉ chạy khi có campaign (tránh hook điều kiện).
export function CampaignEventModal({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  if (!campaign) return null;
  return <CampaignEventModalInner campaign={campaign} onClose={onClose} />;
}

function CampaignEventModalInner({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const { data: board, isLoading } = useLeaderboard(campaign.id, false);
  const candidates = (board ?? []).map((e) => e.name);
  const period =
    campaign.openAt || campaign.closeAt ? `${formatDate(campaign.openAt)} – ${formatDate(campaign.closeAt)}` : null;

  // CTA theo trạng thái: OPEN → vào bình chọn; RESOLVED → xem kết quả; sắp mở (DRAFT) → không có.
  const cta =
    campaign.status === 'OPEN'
      ? { label: '⭐ Vào bình chọn', variant: 'green' as const }
      : campaign.status === 'RESOLVED'
        ? { label: '🏁 Xem kết quả', variant: 'blue' as const }
        : null;

  return (
    <NeuDialog
      open
      onClose={onClose}
      title={`🗳️ ${campaign.title}`}
      footer={
        cta ? (
          <Link to={`/campaigns/${campaign.id}`} style={{ textDecoration: 'none' }} onClick={onClose}>
            <NeuButton variant={cta.variant} style={{ width: '100%' }}>
              {cta.label}
            </NeuButton>
          </Link>
        ) : undefined
      }
    >
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <NeuPill color="var(--c-pink)">VOTE</NeuPill>
        {period && <NeuPill color="var(--c-white)">📅 {period}</NeuPill>}
      </div>

      {campaign.description && (
        <p style={{ margin: '0 0 4px', fontSize: 15, lineHeight: 1.6 }}>{campaign.description}</p>
      )}

      {campaign.prize && (
        <>
          <div style={headLabel}>🎁 Phần thưởng</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: '3px solid var(--c-ink)',
              borderRadius: 11,
              boxShadow: '3px 3px 0 var(--c-ink)',
              padding: '12px 14px',
            }}
          >
            <span style={{ fontSize: 22 }}>🏆</span>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{campaign.prize}</div>
          </div>
        </>
      )}

      <div style={headLabel}>
        🎤 Ứng viên{' '}
        <span style={{ fontWeight: 500, color: '#888', fontSize: 12 }}>(có thể thay đổi trong thời gian bỏ phiếu)</span>
      </div>
      {isLoading ? (
        <Loading />
      ) : candidates.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {candidates.map((name, i) => (
            <span
              key={i}
              style={{
                border: '2px solid var(--c-ink)',
                borderRadius: 20,
                padding: '6px 13px',
                fontSize: 13,
                fontWeight: 600,
                background: 'var(--c-white)',
              }}
            >
              {name}
            </span>
          ))}
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13 }}>Chưa có ứng viên.</div>
      )}

      <div
        style={{
          marginTop: 16,
          background: 'var(--c-yellow)',
          border: '3px solid var(--c-ink)',
          borderRadius: 11,
          padding: '12px 14px',
          fontSize: 13,
          fontWeight: 600,
          lineHeight: 1.5,
        }}
      >
        ⚠ Sự kiện có thể thay đổi hoặc hoãn lại mà không cần thông báo trước do điều kiện vận hành.
      </div>
    </NeuDialog>
  );
}
