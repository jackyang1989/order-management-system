'use client';

import { cn } from '../../lib/utils';

export interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ current, total, pageSize = 10, onChange, className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safeCurrent = Math.min(Math.max(1, current), totalPages);

  const pages = getPages(safeCurrent, totalPages);

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <PageButton
        label="上一页"
        onClick={() => onChange(safeCurrent - 1)}
        disabled={safeCurrent <= 1}
      />
      {pages.map((page, index) =>
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-slate-400">
            ...
          </span>
        ) : (
          <PageButton
            key={`page-${page}`}
            label={String(page)}
            active={page === safeCurrent}
            onClick={() => onChange(page)}
          />
        )
      )}
      <PageButton
        label="下一页"
        onClick={() => onChange(safeCurrent + 1)}
        disabled={safeCurrent >= totalPages}
      />
      <span className="text-sm text-slate-500">
        共 {totalPages} 页
      </span>
    </div>
  );
}

function PageButton({
  label,
  onClick,
  disabled,
  active,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary/20',
        disabled
          ? 'cursor-not-allowed border-slate-200 text-slate-300'
          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
        active && 'border-primary bg-primary text-white hover:bg-blue-700'
      )}
    >
      {label}
    </button>
  );
}

function getPages(current: number, totalPages: number) {
  const pages: Array<number | '...'> = [];
  const windowSize = 5;
  const half = Math.floor(windowSize / 2);

  let start = Math.max(1, current - half);
  let end = Math.min(totalPages, current + half);

  if (end - start < windowSize - 1) {
    if (start === 1) {
      end = Math.min(totalPages, start + windowSize - 1);
    } else if (end === totalPages) {
      start = Math.max(1, end - windowSize + 1);
    }
  }

  if (start > 1) {
    pages.push(1);
    if (start > 2) pages.push('...');
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  return pages;
}
