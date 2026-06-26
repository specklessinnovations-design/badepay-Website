import React, { useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onRowClick?: (row: any) => void;
  rowClassName?: string;
}

function getHeaderLabel<TData, TValue>(column: ColumnDef<TData, TValue>): string {
  if (typeof column.header === 'string') return column.header;
  if ('accessorKey' in column && typeof column.accessorKey === 'string') {
    return column.accessorKey.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
  }
  return 'Field';
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onRowClick,
  rowClassName,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  });

  const rows = table.getRowModel().rows;

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: 'rgba(7, 26, 22, 0.95)',
        border: '1px solid rgba(111, 232, 214, 0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {/* Mobile card view */}
      <div className="md:hidden">
        {rows.length ? (
          rows.map((row) => (
            <div
              key={row.id}
              className={`space-y-3 p-4 ${rowClassName || ''}`}
              style={{ borderBottom: '1px solid rgba(111,232,214,0.07)' }}
              onClick={() => onRowClick?.(row)}
            >
              {row.getVisibleCells().map((cell, idx) => {
                const col = columns[cell.column.getIndex()];
                if (col.id === 'actions') {
                  return (
                    <div key={cell.id} className="pt-1">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                }
                const label = getHeaderLabel(col);
                return (
                  <div
                    key={cell.id}
                    className={`flex items-start justify-between gap-3 ${idx === 0 ? 'pb-3' : ''}`}
                    style={idx === 0 ? { borderBottom: '1px solid rgba(111,232,214,0.07)' } : {}}
                  >
                    <span
                      className="shrink-0 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: '#3d7068' }}
                    >
                      {label}
                    </span>
                    <div
                      className="min-w-0 text-right text-sm font-medium"
                      style={{ color: '#d4eae7' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-sm font-bold" style={{ color: '#3d7068' }}>
            No records found.
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="custom-scrollbar hidden overflow-x-auto md:block">
        <table className="w-full text-left text-sm">
          <thead
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(111,232,214,0.04)',
              borderBottom: '1px solid rgba(111,232,214,0.1)',
              color: '#3d7068',
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="whitespace-nowrap px-6 py-4">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`transition-colors duration-150 hover:bg-[rgba(111,232,214,0.04)] ${rowClassName || ''}`}
                  style={{
                    borderBottom:
                      i < rows.length - 1 ? '1px solid rgba(111,232,214,0.06)' : 'none',
                  }}
                  onClick={() => onRowClick?.(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="whitespace-nowrap px-6 py-4 font-medium"
                      style={{ color: '#d4eae7' }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="h-32 text-center font-bold"
                  style={{ color: '#3d7068' }}
                >
                  No records found in this dataset.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-5"
        style={{
          borderTop: '1px solid rgba(111,232,214,0.1)',
          background: 'rgba(5, 18, 14, 0.6)',
        }}
      >
        <span
          className="text-center text-xs font-bold uppercase tracking-wider sm:text-left"
          style={{ color: '#3d7068' }}
        >
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
        <div className="flex justify-center gap-3 sm:justify-end">
          <button
            type="button"
            className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{
              background: 'rgba(111,232,214,0.08)',
              border: '1px solid rgba(111,232,214,0.15)',
              color: '#6fe8d6',
            }}
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-xl px-5 py-2.5 text-xs font-bold transition-all disabled:opacity-40 active:scale-[0.98]"
            style={{
              background: 'rgba(111,232,214,0.08)',
              border: '1px solid rgba(111,232,214,0.15)',
              color: '#6fe8d6',
            }}
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
