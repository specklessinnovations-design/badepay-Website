import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const buttonVariants = ({ variant = 'primary', size = 'md', fullWidth = false }: Partial<ButtonProps>) => {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[#6fe8d6] text-[#1a1a1a] shadow-[0_4px_16px_rgba(111,232,214,0.25)] hover:bg-[#5dd4c0] focus:ring-[#6fe8d6]',
    secondary:
      'bg-[var(--surface-secondary)] text-[var(--text-primary)] shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-[var(--surface-tertiary)] focus:ring-[var(--accent)]',
    outline:
      'border-2 border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:ring-[var(--accent)]',
    ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus:ring-[var(--accent)]',
    danger:
      'bg-[var(--color-danger)] text-white shadow-[0_2px_12px_rgba(239,68,68,0.25)] hover:bg-[#DC2626] focus:ring-[var(--color-danger)]',
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-14 px-8 text-base',
    icon: 'h-10 w-10',
  };

  return `${baseStyles} ${variants[variant as keyof typeof variants] || variants.primary} ${sizes[size as keyof typeof sizes] || sizes.md} ${fullWidth ? 'w-full' : ''}`;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, fullWidth = false, children, disabled, ...props }, ref) => {
    const classes = `${buttonVariants({ variant, size, fullWidth })} ${className}`;

    return (
      <button ref={ref} className={classes} disabled={isLoading || disabled} {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
