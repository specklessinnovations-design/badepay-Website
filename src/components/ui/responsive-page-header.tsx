import React from 'react';

interface ResponsivePageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function ResponsivePageHeader({ title, description, action }: ResponsivePageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-display sm:text-3xl">{title}</h1>
        {description && <p className="text-subheading mt-1.5 sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
