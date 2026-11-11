import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { forwardRef, SelectHTMLAttributes } from 'react';

export type SelectOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options: SelectOption[];
  error?: string;
  hint?: string;
  placeholder?: string;
  wrapperClassName?: string;
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, hint, placeholder, wrapperClassName, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
        {label && (
          <label htmlFor={selectId} className="text-caption font-medium text-text-dark">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              'w-full h-11 rounded-xl border border-border bg-white px-4 py-2.5 pr-9',
              'text-body text-text-dark appearance-none',
              'transition-all duration-DEFAULT',
              'focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-bg-muted',
              error && 'border-red-400 focus:ring-red-200 focus:border-red-400',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none"
            aria-hidden
          />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
        {!error && hint && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
