import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-hover',
  secondary: 'bg-surface text-ink border border-line-strong hover:bg-surface-2',
  soft: 'bg-brand-soft text-brand-text hover:brightness-95',
  ghost: 'text-ink hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
  'danger-outline': 'border border-danger/40 text-danger hover:bg-danger-soft',
};

const SIZES = {
  sm: 'h-9 px-3 text-[14px] gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-13 px-5 text-[16px] gap-2',
  icon: 'size-11 justify-center',
  'icon-sm': 'size-9 justify-center',
};

export function buttonClass({ variant = 'primary', size = 'md', className = '' } = {}) {
  return [
    'inline-flex items-center justify-center rounded-[var(--radius-control)] font-semibold whitespace-nowrap',
    'transition-colors disabled:opacity-50 disabled:pointer-events-none select-none',
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(' ');
}

export default function Button({ variant, size, className, loading, icon: Icon, children, to, type = 'button', ...props }) {
  const cls = buttonClass({ variant, size, className });
  const content = (
    <>
      {loading ? <Loader2 className="size-5 animate-spin" /> : Icon && <Icon className="size-5 shrink-0" />}
      {children}
    </>
  );
  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {content}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} disabled={loading || props.disabled} {...props}>
      {content}
    </button>
  );
}
