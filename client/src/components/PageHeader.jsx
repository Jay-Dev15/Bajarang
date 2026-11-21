import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, back, actions }) {
  const navigate = useNavigate();
  return (
    <header className="mb-4 flex items-center gap-2">
      {back && (
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate(back))}
          className="-ml-2 flex size-10 shrink-0 items-center justify-center rounded-lg text-ink hover:bg-surface-2"
          aria-label="પાછા જાઓ"
        >
          <ArrowLeft className="size-6" />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[22px] font-bold">{title}</h1>
        {subtitle && <p className="text-[14px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
