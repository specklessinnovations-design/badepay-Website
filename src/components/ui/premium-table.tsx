import React from 'react';

interface PremiumTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

export const PremiumTable = React.forwardRef<HTMLTableElement, PremiumTableProps>(
  ({ className = '', striped = true, hoverable = true, children, ...props }, ref) => {
    return (
      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table
          ref={ref}
          className={`w-full text-sm text-[var(--text-primary)] ${className}`}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);

PremiumTable.displayName = 'PremiumTable';

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableHead = React.forwardRef<HTMLTableSectionElement, TableHeadProps>(
  ({ className = '', children, ...props }, ref) => (
    <thead
      ref={ref}
      className={`bg-[var(--surface-secondary)] border-b border-[var(--border)] ${className}`}
      {...props}
    >
      {children}
    </thead>
  )
);

TableHead.displayName = 'TableHead';

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', children, ...props }, ref) => (
    <tbody ref={ref} className={className} {...props}>
      {children}
    </tbody>
  )
);

TableBody.displayName = 'TableBody';

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  isHeader?: boolean;
}

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', striped = true, hoverable = true, isHeader = false, children, ...props }, ref) => {
    const hoverClasses = hoverable && !isHeader ? 'hover:bg-[var(--surface-secondary)] transition-colors' : '';
    const stripedClasses = striped && !isHeader ? 'odd:bg-[var(--surface-primary)] even:bg-[var(--surface-secondary)]/50' : '';

    return (
      <tr
        ref={ref}
        className={`border-b border-[var(--border)] ${hoverClasses} ${stripedClasses} ${className}`}
        {...props}
      >
        {children}
      </tr>
    );
  }
);

TableRow.displayName = 'TableRow';

interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
}

export const TableHeaderCell = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
  ({ className = '', sortable = false, sorted = null, children, ...props }, ref) => (
    <th
      ref={ref}
      className={`px-4 py-3 text-left font-semibold text-[var(--text-secondary)] uppercase text-xs tracking-wider ${sortable ? 'cursor-pointer hover:text-[var(--text-primary)] transition-colors' : ''} ${className}`}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <span className="text-[var(--text-tertiary)]">
            {sorted === 'asc' ? '↑' : sorted === 'desc' ? '↓' : '⇅'}
          </span>
        )}
      </div>
    </th>
  )
);

TableHeaderCell.displayName = 'TableHeaderCell';

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  numeric?: boolean;
  highlight?: boolean;
}

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className = '', numeric = false, highlight = false, children, ...props }, ref) => (
    <td
      ref={ref}
      className={`px-4 py-3 ${numeric ? 'text-right font-mono' : ''} ${highlight ? 'font-semibold text-[var(--accent)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </td>
  )
);

TableCell.displayName = 'TableCell';
