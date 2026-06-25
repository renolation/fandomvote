import { NeuDialog, NeuPill } from '@/components/neu';
import { countdownLabel, formatDateTime } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import type { PointEvent } from '@/types/api';

const TYPE_META: Record<PointEvent['type'], { icon: string; label: string }> = {
  EARN_MULTIPLIER: { icon: '⚡', label: 'Nhân điểm kiếm được' },
  TOPUP_MULTIPLIER: { icon: '💎', label: 'Nhân điểm nạp' },
};

export function EventDetailModal({ event, onClose }: { event: PointEvent | null; onClose: () => void }) {
  const now = useNow();
  if (!event) return null;

  const meta = TYPE_META[event.type];
  const multiplier = (event.multiplierBps / 10000).toLocaleString('vi-VN');
  const startMs = new Date(event.startsAt).getTime();
  const endMs = new Date(event.endsAt).getTime();

  let status: { note: string; target: string } ;
  if (now < startMs) status = { note: `🔜 Bắt đầu sau ${countdownLabel(event.startsAt, now)}`, target: event.startsAt };
  else if (now < endMs) status = { note: `🟢 Còn ${countdownLabel(event.endsAt, now)}`, target: event.endsAt };
  else status = { note: '✅ Sự kiện đã kết thúc', target: event.endsAt };

  return (
    <NeuDialog open={!!event} onClose={onClose} title={`${meta.icon} ${event.title}`}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <NeuPill color="#3B82F6">{meta.label}</NeuPill>
        <NeuPill color="#22C55E">×{multiplier}</NeuPill>
      </div>

      {event.bannerText && (
        <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.5 }}>{event.bannerText}</p>
      )}

      <div
        style={{
          border: '3px solid var(--c-ink)',
          borderRadius: 12,
          padding: '12px 14px',
          background: 'var(--c-cream)',
          fontWeight: 700,
          fontFamily: 'var(--font-head)',
          marginBottom: 12,
        }}
      >
        {status.note}
      </div>

      <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
        <div>Bắt đầu: {formatDateTime(event.startsAt)}</div>
        <div>Kết thúc: {formatDateTime(event.endsAt)}</div>
      </div>
    </NeuDialog>
  );
}
