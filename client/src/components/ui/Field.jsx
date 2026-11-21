import { useId } from 'react';
import { ChevronDown } from 'lucide-react';

const controlBase =
  'w-full rounded-[var(--radius-control)] border bg-surface text-ink placeholder:text-subtle ' +
  'focus:outline-none focus:ring-2 focus:ring-focus/30 focus:border-focus transition-colors';

const borderFor = (error) => (error ? 'border-danger' : 'border-line-strong');

export function Field({ label, hint, error, children, id, optional }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[14px] font-semibold text-ink">
          {label}
          {optional && <span className="ml-1 font-normal text-subtle">(વૈકલ્પિક)</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[13px] text-danger">{error}</p>
      ) : (
        hint && <p className="text-[13px] text-muted">{hint}</p>
      )}
    </div>
  );
}

export function TextField({ label, hint, error, optional, className = '', ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} id={id} optional={optional}>
      <input
        id={id}
        className={`${controlBase} ${borderFor(error)} h-12 px-3.5 ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

/**
 * Price input: numeric keyboard on phones, ₹ prefix, accepts decimals.
 * `auto` marks a value that was filled in automatically (still editable).
 */
export function PriceField({ label, hint, error, value, onChange, large, auto, hidden, ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hidden ? 'છુપાવેલ' : auto ? 'આપોઆપ' : hint} error={error} id={id}>
      <div className="relative">
        <span className="num pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-muted">₹</span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          placeholder="—"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, '');
            if (/^\d{0,7}(\.\d{0,2})?$/.test(v)) onChange(v);
          }}
          onFocus={(e) => e.target.select()}
          className={`${controlBase} ${borderFor(error)} num pl-6 pr-1.5 ${
            large ? 'h-13 text-[19px] font-semibold' : 'h-12 text-[17px] font-semibold'
          } ${hidden ? 'bg-surface-2 text-subtle line-through decoration-1' : auto ? 'border-dashed bg-brand-soft/50 text-brand-text' : ''}`}
          aria-invalid={Boolean(error)}
          {...props}
        />
      </div>
    </Field>
  );
}

export function SelectField({ label, hint, error, children, className = '', ...props }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <SelectInput id={id} error={error} className={className} {...props}>
        {children}
      </SelectInput>
    </Field>
  );
}

export function SelectInput({ error, className = '', children, ...props }) {
  return (
    <div className="relative">
      <select className={`${controlBase} ${borderFor(error)} h-12 appearance-none pl-3.5 pr-10 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 text-muted" />
    </div>
  );
}
