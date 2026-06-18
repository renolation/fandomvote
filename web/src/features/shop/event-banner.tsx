import { NeuCard } from '@/components/neu';
import { countdownLabel } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import { useActiveEvents } from './use-shop';

export function EventBanner() {
  const { data } = useActiveEvents();
  const now = useNow();
  if (!data || data.length === 0) return null;
  return (
    <div className="col">
      {data.map((ev) => (
        <NeuCard key={ev.id} flat style={{ background: 'var(--c-yellow)' }}>
          <div className="spread">
            <strong>
              🔥 {ev.title} ×{(ev.multiplierBps / 10000).toFixed(1)}
            </strong>
            <span className="mono" style={{ fontSize: 13 }}>
              {countdownLabel(ev.endsAt, now)}
            </span>
          </div>
        </NeuCard>
      ))}
    </div>
  );
}
