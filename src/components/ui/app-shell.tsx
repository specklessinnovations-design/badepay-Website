

import React from 'react';

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Ambient gradient background wrapper for personal & merchant app surfaces */
export function AppShell({ children, className = '' }: AppShellProps) {
  return <div className={`app-shell ${className}`}>{children}</div>;
}
