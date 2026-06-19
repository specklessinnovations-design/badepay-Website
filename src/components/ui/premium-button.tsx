import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_2px_12px_rgba(111,232,214,0.25)] hover:bg-[#4dd4c0] hover:shadow-[0_4px_20px_rgba(111,232,214,0.35)] focus-visible:outline-[#6fe8d6]',
        secondary:
          'bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)] shadow-[var(--shadow-xs)] hover:bg-[var(--surface-elevated)] hover:border-[var(--border-light)] focus-visible:outline-[var(--accent)]',
        tertiary:
          'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus-visible:outline-[var(--accent)]',
        danger:
          'bg-[#EF4444] text-white shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:bg-[#DC2626] focus-visible:outline-[#EF4444]',
        success:
          'bg-[#10B981] text-white shadow-[0_2px_12px_rgba(16,185,129,0.25)] hover:bg-[#059669] focus-visible:outline-[#10B981]',
        ghost:
          'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus-visible:outline-[var(--accent)]',
        outline:
          'border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[#6fe8d6]/10 focus-visible:outline-[var(--accent)]',
      },
      size: {
        xs: 'px-3 py-1.5 text-xs h-7',
        sm: 'px-4 py-2 text-sm h-9',
        md: 'px-5 py-2.5 text-sm h-11',
        lg: 'px-6 py-3 text-base h-12',
        xl: 'px-8 py-4 text-base h-14',
        icon: 'h-11 w-11 p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

interface PremiumButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const PremiumButton = React.forwardRef<HTMLButtonElement, PremiumButtonProps>(
  ({ className, variant, size, fullWidth, isLoading, icon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, fullWidth, className })}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          <>
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';
