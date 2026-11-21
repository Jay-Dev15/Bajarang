import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = forwardRef(function SearchBar({ value, onChange, placeholder = 'વસ્તુ શોધો… (ગુજરાતી કે English)', autoFocus }, ref) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
      <input
        ref={ref}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onChange('');
          if (e.key === 'Enter') e.currentTarget.blur(); // hide keyboard on phones
        }}
        placeholder={placeholder}
        aria-label="શોધો"
        className="h-12 w-full rounded-xl border border-line-strong bg-surface pl-11 pr-11 text-[16px] text-ink placeholder:text-subtle focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-surface-2"
          aria-label="શોધ સાફ કરો"
        >
          <X className="size-5" />
        </button>
      )}
    </div>
  );
});

export default SearchBar;
