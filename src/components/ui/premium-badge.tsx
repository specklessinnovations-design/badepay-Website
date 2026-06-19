import React from 'react';

type BadgeVariant = 'default' | 'success' | 'error' | 'warning' | 'info' | 'pending' | 'accent';
type BadgeSize = 'sm' | 'md' | 'lg';

interface PremiumBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
}

export const PremiumBadge = React.forwardRef<HTMLSpanElement, PremiumBadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, icon, dot = false, ...props }, ref) => {
    const variantClasses = {
      default: 'bg-[var(--surface-tertiary)] text-[var(--text-primary)] border border-[var(--border)]',
      success: 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20',
      error: 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20',
      warning: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
      info: 'bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20',
      pending: 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20',
      accent: 'bg-[var(--accent-bg)] text-[var(--accent-text)] border border-[var(--accent-border)]',
    };

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs font-medium',
      md: 'px-3 py-1.5 text-sm font-medium',
      lg: 'px-4 py-2 text-base font-medium',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 rounded-full ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {dot && <span className={`w-2 h-2 rounded-full bg-current`} />}
        {icon && <span className="flex items-center justify-center">{icon}</span>}
        {children}
      </span>
    );
  }
);

PremiumBadge.displayName = 'PremiumBadge';

// Status Badge Component
interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'failed' | 'processing';
  size?: BadgeSize;
}

export const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ className = '', status, size = 'md', ...props }, ref) => {
    const statusConfig = {
      active: { variant: 'success' as BadgeVariant, label: 'Active' },
      inactive: { variant: 'default' as BadgeVariant, label: 'Inactive' },
      pending: { variant: 'warning' as BadgeVariant, label: 'Pending' },
      completed: { variant: 'success' as BadgeVariant, label: 'Completed' },
      failed: { variant: 'error' as BadgeVariant, label: 'Failed' },
      processing: { variant: 'info' as BadgeVariant, label: 'Processing' },
    };

    const config = statusConfig[status];

    return (
      <PremiumBadge
        ref={ref}
        variant={config.variant}
        size={size}
        dot
        className={className}
        {...props}
      >
        {config.label}
      </PremiumBadge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
