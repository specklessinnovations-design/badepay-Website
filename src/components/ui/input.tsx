import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-bold tracking-tight text-[var(--text-primary)]">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-tertiary)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`block w-full rounded-xl border bg-[var(--card)] px-4 py-3 text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-all placeholder:text-[var(--text-muted)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)] ${
              error ? 'border-[#EF4444] focus:ring-[#EF4444]' : 'border-[var(--border)] hover:border-[var(--border-light)]'
            } ${icon ? 'pl-11' : ''} ${isPassword ? 'pr-11' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm font-bold text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
