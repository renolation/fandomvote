import type { ReactNode } from 'react';
import { errorMessage } from '@/lib/error-messages';
import { NeuButton } from './neu';

export function Loading({ label = 'Đang tải…' }: { label?: string }) {
  return <div className="muted" style={{ padding: 24, textAlign: 'center' }}>{label}</div>;
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div className="muted" style={{ marginBottom: 8 }}>
        {message}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <div style={{ color: 'var(--c-pink)', fontWeight: 600, marginBottom: 8 }}>
        {errorMessage(error)}
      </div>
      {onRetry && (
        <NeuButton size="sm" variant="ghost" onClick={onRetry}>
          Thử lại
        </NeuButton>
      )}
    </div>
  );
}
