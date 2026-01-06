'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  title: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: (row: T) => string | number;
  className?: string;
  onRowSelect?: (selectedKeys: Array<string | number>) => void;
  selectedKeys?: Array<string | number>;
  getRowDisabled?: (row: T) => boolean;
  selectable?: boolean;
}

export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyText = '暂无数据',
  rowKey,
  className,
  onRowSelect,
  selectedKeys = [],
  getRowDisabled,
  selectable,
}: TableProps<T>) {
  const getKey = (row: T, idx: number) => (rowKey ? rowKey(row) : idx);

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-12 text-slate-500', className)}>
        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        加载中...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={cn('py-12 text-center text-slate-500', className)}>{emptyText}</div>
    );
  }

  const selectedSet = new Set(selectedKeys);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-slate-200 bg-white', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {selectable && (
              <th className="w-10 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <span className="sr-only">选择</span>
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
                  col.className
                )}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const key = getKey(row, idx);
            const disabled = getRowDisabled?.(row) ?? false;
            const checked = selectedSet.has(key);
            return (
              <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                {selectable && (
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/20"
                      disabled={disabled}
                      checked={checked}
                      onChange={(event) => {
                        if (!onRowSelect) return;
                        const next = new Set(selectedSet);
                        if (event.target.checked) {
                          next.add(key);
                        } else {
                          next.delete(key);
                        }
                        onRowSelect(Array.from(next));
                      }}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3 text-slate-700', col.className)}>
                    {col.render ? col.render(row, idx) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
