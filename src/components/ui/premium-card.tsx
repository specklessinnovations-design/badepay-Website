import React from 'react';

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'bordered';
  children: React.ReactNode;
  interactive?: boolean;
}

export const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
  ({ className = '', variant = 'default', interactive = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]';

    const variantClasses = {
      default:
        'bg-[var(--card)] border border-[var(--border)] p-4 md:p-6 shadow-[var(--shadow-sm)] [box-shadow:var(--shadow-sm),var(--shadow-inner)]',
      elevated:
        'bg-[var(--surface-elevated)] border border-[var(--border)] p-4 md:p-6 shadow-[var(--shadow-md)] [box-shadow:var(--shadow-md),var(--shadow-inner)]',
      glass: 'glass-effect p-4 md:p-6 shadow-[var(--shadow-md)]',
      bordered: 'bg-transparent border-2 border-[var(--border)] p-4 md:p-6',
    };

    const interactiveClasses = interactive
      ? 'cursor-pointer hover:border-[var(--border-light)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 active:translate-y-0'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${interactiveClasses} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

PremiumCard.displayName = 'PremiumCard';

interface FinancialCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  amount?: string | number;
  currency?: string;
  status?: 'active' | 'inactive' | 'pending';
  children?: React.ReactNode;
}

export const FinancialCard = React.forwardRef<HTMLDivElement, FinancialCardProps>(
  ({ className = '', title, subtitle, amount, currency = '₦', status, children, ...props }, ref) => {
    const statusColors = {
      active: 'text-[#10B981]',
      inactive: 'text-[var(--text-tertiary)]',
      pending: 'text-[#F59E0B]',
    };

    return (
      <div
        ref={ref}
        className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface-secondary)] to-[var(--surface-tertiary)] p-6 md:p-8 shadow-[var(--shadow-md)] [box-shadow:var(--shadow-md),var(--shadow-inner)] ${className}`}
        {...props}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(111,232,214,0.2) 0%, transparent 70%)' }}
        />

        <div className="relative flex items-start justify-between mb-8">
          <div>
            {title && (
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                {title}
              </p>
            )}
            {subtitle && <p className="mt-1 text-xs text-[var(--text-tertiary)]">{subtitle}</p>}
          </div>
          {status && (
            <div className={`text-xs font-semibold uppercase ${statusColors[status]}`}>{status}</div>
          )}
        </div>

        {amount !== undefined && (
          <div className="relative mb-6">
            <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">Balance</p>
            <p className="text-4xl font-light tracking-tight text-[var(--text-primary)] md:text-5xl">
              <span className="text-xl">{currency}</span>{' '}
              {typeof amount === 'number' ? amount.toLocaleString() : amount}
            </p>
          </div>
        )}

        {children}
      </div>
    );
  }
);

FinancialCard.displayName = 'FinancialCard';
