/** Accessible on/off switch with a large touch target. */
export default function Toggle({ checked, onChange, label, disabled, size = 'md', ...props }) {
  const track = size === 'sm' ? 'h-6 w-10' : 'h-7 w-12';
  const knob = size === 'sm' ? 'size-5' : 'size-6';
  const shift = size === 'sm' ? 'translate-x-4' : 'translate-x-5';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex shrink-0 items-center p-2 -m-2 disabled:opacity-50"
      {...props}
    >
      <span className={`${track} flex items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-brand' : 'bg-line-strong'}`}>
        <span
          className={`${knob} rounded-full bg-white shadow-sm transition-transform ${checked ? shift : 'translate-x-0'}`}
        />
      </span>
    </button>
  );
}
