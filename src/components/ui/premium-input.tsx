import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface PremiumInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
  (
    {
      className = '',
      label,
      error,
      success,
      hint,
      icon,
      rightIcon,
      size = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-3 py-2 text-sm h-9',
      md: 'px-4 py-2.5 text-sm h-11',
      lg: 'px-5 py-3 text-base h-12',
    };

    const baseClasses =
      'w-full rounded-xl border bg-[var(--surface-secondary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] shadow-[var(--shadow-xs)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/30 focus:border-[#6fe8d6] disabled:opacity-50 disabled:cursor-not-allowed';

    const borderClasses = error
      ? 'border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]'
      : success
        ? 'border-[#10B981] focus:ring-[#10B981]/30 focus:border-[#10B981]'
        : 'border-[var(--border)] hover:border-[var(--border-light)]';

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {label}
            {props.required && <span className="ml-1 text-[#EF4444]">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--text-tertiary)]">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            className={`${baseClasses} ${borderClasses} ${sizeClasses[size]} ${icon ? 'pl-11' : ''} ${rightIcon || error || success ? 'pr-11' : ''} ${className}`}
            disabled={disabled}
            {...props}
          />

          {(rightIcon || error || success) && (
            <div className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center text-[var(--text-tertiary)]">
              {error && <AlertCircle size={18} className="text-[#EF4444]" />}
              {success && <CheckCircle2 size={18} className="text-[#10B981]" />}
              {!error && !success && rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#EF4444]">{error}</p>
        )}
        {hint && !error && <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    );
  }
);

PremiumInput.displayName = 'PremiumInput';

interface PremiumTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  rows?: number;
}

export const PremiumTextarea = React.forwardRef<HTMLTextAreaElement, PremiumTextareaProps>(
  ({ className = '', label, error, success, hint, rows = 4, disabled, ...props }, ref) => {
    const baseClasses =
      'w-full resize-none rounded-xl border bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] shadow-[var(--shadow-xs)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#6fe8d6]/30 focus:border-[#6fe8d6] disabled:cursor-not-allowed disabled:opacity-50';

    const borderClasses = error
      ? 'border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]'
      : success
        ? 'border-[#10B981] focus:ring-[#10B981]/30 focus:border-[#10B981]'
        : 'border-[var(--border)] hover:border-[var(--border-light)]';

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-semibold tracking-tight text-[var(--text-primary)]">
            {label}
            {props.required && <span className="ml-1 text-[#EF4444]">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          className={`${baseClasses} ${borderClasses} ${className}`}
          rows={rows}
          disabled={disabled}
          {...props}
        />

        {error && <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>}
      </div>
    );
  }
);

PremiumTextarea.displayName = 'PremiumTextarea';
