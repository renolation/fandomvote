import type {
  ButtonHTMLAttributes,
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

type Variant = 'yellow' | 'blue' | 'green' | 'pink' | 'ghost';

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}

export function NeuButton({
  variant = 'yellow',
  size = 'md',
  loading,
  disabled,
  className = '',
  children,
  ...rest
}: NeuButtonProps) {
  const v = variant === 'yellow' ? '' : `neu-btn--${variant}`;
  const s = size === 'sm' ? 'neu-btn--sm' : '';
  return (
    <button className={`neu-btn ${v} ${s} ${className}`} disabled={disabled || loading} {...rest}>
      {loading ? '…' : children}
    </button>
  );
}

export function NeuCard({
  children,
  flat,
  className = '',
  style,
}: {
  children: ReactNode;
  flat?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`neu-card ${flat ? 'neu-card--flat' : ''} ${className}`} style={style}>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}
export function NeuField({ label, error, children }: FieldProps) {
  return (
    <div className="neu-field">
      <label className="neu-label">{label}</label>
      {children}
      {error && <div style={{ color: 'var(--c-pink)', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

export function NeuInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = '', ...rest } = props;
  return <input className={`neu-input ${className}`} {...rest} />;
}

export function NeuTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = '', ...rest } = props;
  return <textarea className={`neu-textarea ${className}`} {...rest} />;
}

export function NeuSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = '', children, ...rest } = props;
  return (
    <select className={`neu-select ${className}`} {...rest}>
      {children}
    </select>
  );
}

export function NeuPill({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <span className="neu-pill" style={color ? { background: color, color: '#fff' } : undefined}>
      {children}
    </span>
  );
}

export function NeuDialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="neu-overlay" onClick={onClose}>
      <div className="neu-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <NeuButton size="sm" variant="ghost" onClick={onClose}>
            ✕
          </NeuButton>
        </div>
        {children}
        {footer && <div style={{ marginTop: 16 }}>{footer}</div>}
      </div>
    </div>
  );
}
