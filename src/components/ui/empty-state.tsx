import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-14 text-center ${className}`}
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] shadow-[var(--shadow-sm)]">
        <Icon className="h-7 w-7 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold tracking-tight text-[var(--text-primary)]">{title}</h3>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
