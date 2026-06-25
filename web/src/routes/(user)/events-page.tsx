import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NeuCard } from '@/components/neu';
import { EmptyState, ErrorState, Loading } from '@/components/state-views';
import { countdownLabel } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useCampaigns } from '@/features/campaign/use-campaign';
import { useAllEvents } from '@/features/events/use-events';
import { EventDetailModal } from '@/features/events/event-detail-modal';
import type { Campaign, PointEvent } from '@/types/api';

const head: React.CSSProperties = { fontFamily: 'var(--font-head)', fontWeight: 700 };

type Bucket = 'ongoing' | 'upcoming' | 'past';

interface FeedItem {
  key: string;
  bucket: Bucket;
  icon: string;
  title: string;
  subtitle: string;
  countdownIso: string | null;
  // exactly one of these:
  event?: PointEvent;
  to?: string;
}

const EVENT_ICON: Record<PointEvent['type'], string> = {
  EARN_MULTIPLIER: '⚡',
  TOPUP_MULTIPLIER: '💎',
};

const SECTIONS: { bucket: Bucket; title: string }[] = [
  { bucket: 'ongoing', title: '🟢 Đang diễn ra' },
  { bucket: 'upcoming', title: '🔜 Sắp tới' },
  { bucket: 'past', title: '✅ Đã diễn ra' },
];

function mapPointEvent(e: PointEvent, now: number): FeedItem {
  const startMs = new Date(e.startsAt).getTime();
  const endMs = new Date(e.endsAt).getTime();
  let bucket: Bucket;
  let countdownIso: string | null = null;
  if (e.isActive && startMs <= now && now < endMs) {
    bucket = 'ongoing';
    countdownIso = e.endsAt;
  } else if (startMs > now) {
    bucket = 'upcoming';
    countdownIso = e.startsAt;
  } else {
    bucket = 'past';
  }
  return {
    key: `event-${e.id}`,
    bucket,
    icon: EVENT_ICON[e.type],
    title: e.title,
    subtitle: `×${(e.multiplierBps / 10000).toLocaleString('vi-VN')}`,
    countdownIso,
    event: e,
  };
}

function mapCampaign(c: Campaign, now: number): FeedItem | null {
  let bucket: Bucket | null = null;
  let countdownIso: string | null = null;
  if (c.status === 'OPEN') {
    bucket = 'ongoing';
    countdownIso = c.closeAt;
  } else if (c.status === 'RESOLVED') {
    bucket = 'past';
  } else if (c.status === 'DRAFT' && c.openAt && new Date(c.openAt).getTime() > now) {
    bucket = 'upcoming';
    countdownIso = c.openAt;
  }
  if (!bucket) return null;
  return {
    key: `campaign-${c.id}`,
    bucket,
    icon: '🗳️',
    title: c.title,
    subtitle: 'Chiến dịch bình chọn',
    countdownIso,
    to: `/campaigns/${c.id}`,
  };
}

function EventCardInner({ item, now }: { item: FeedItem; now: number }) {
  return (
    <div className="row" style={{ gap: 12, width: '100%', textAlign: 'left' }}>
      <span style={{ fontSize: 26, lineHeight: 1 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...head, fontSize: 15 }}>{item.title}</div>
        <div className="muted" style={{ fontSize: 13 }}>{item.subtitle}</div>
      </div>
      {item.countdownIso && (
        <span className="mono" style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
          {item.bucket === 'upcoming' ? '🔜 ' : '⏳ '}
          {countdownLabel(item.countdownIso, now)}
        </span>
      )}
    </div>
  );
}

export function EventsPage() {
  const now = useNow();
  const events = useAllEvents();
  const campaigns = useCampaigns();
  const [selected, setSelected] = useState<PointEvent | null>(null);

  const items = useMemo<FeedItem[]>(() => {
    const out: FeedItem[] = [];
    for (const e of events.data ?? []) out.push(mapPointEvent(e, now));
    for (const c of campaigns.data ?? []) {
      const it = mapCampaign(c, now);
      if (it) out.push(it);
    }
    return out;
  }, [events.data, campaigns.data, now]);

  if (events.isLoading || campaigns.isLoading) return <Loading />;
  if (events.error) return <ErrorState error={events.error} onRetry={() => events.refetch()} />;
  if (campaigns.error) return <ErrorState error={campaigns.error} onRetry={() => campaigns.refetch()} />;

  return (
    <div className="col" style={{ gap: 28 }}>
      <div style={{ ...head, fontSize: 24 }}>📅 Sự kiện</div>

      {items.length === 0 && <EmptyState message="Chưa có sự kiện nào." />}

      {SECTIONS.map((section) => {
        const list = items.filter((i) => i.bucket === section.bucket);
        if (list.length === 0) return null;
        return (
          <div key={section.bucket} className="col" style={{ gap: 12 }}>
            <div style={{ ...head, fontSize: 18 }}>{section.title}</div>
            {list.map((item) =>
              item.to ? (
                <Link key={item.key} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <NeuCard style={{ cursor: 'pointer' }}>
                    <EventCardInner item={item} now={now} />
                  </NeuCard>
                </Link>
              ) : (
                <NeuCard key={item.key} style={{ cursor: 'pointer' }}>
                  <button
                    type="button"
                    onClick={() => item.event && setSelected(item.event)}
                    style={{ all: 'unset', display: 'block', width: '100%', cursor: 'pointer' }}
                  >
                    <EventCardInner item={item} now={now} />
                  </button>
                </NeuCard>
              ),
            )}
          </div>
        );
      })}

      <EventDetailModal event={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
