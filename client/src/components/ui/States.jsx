import { Loader2, WifiOff, RefreshCw } from 'lucide-react';
import Button from './Button';

export function Spinner({ className = 'size-6' }) {
  return <Loader2 className={`${className} animate-spin text-brand`} aria-label="લોડ થઈ રહ્યું છે" />;
}

export function PageLoader({ label = 'ભાવ યાદી લોડ થઈ રહી છે…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted">
      <Spinner className="size-8" />
      <p className="text-[15px]">{label}</p>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, message, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Icon className="size-7" />
        </div>
      )}
      <h3 className="text-[17px] font-semibold">{title}</h3>
      {message && <p className="mt-1 max-w-xs text-[15px] text-muted">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="માહિતી લાવી શકાઈ નહીં"
      message={message}
      action={
        onRetry && (
          <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
            ફરી પ્રયાસ કરો
          </Button>
        )
      }
    />
  );
}

export function StatusBadge({ available, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2 py-0.5 text-[12px]' : 'px-2.5 py-0.5 text-[13px]';
  return available ? (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-ok-soft font-semibold text-ok ${pad}`}>
      <span className="size-1.5 rounded-full bg-current" />
      સ્ટોકમાં છે
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-danger-soft font-semibold text-danger ${pad}`}>
      <span className="size-1.5 rounded-full bg-current" />
      સ્ટોક નથી
    </span>
  );
}
