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
          <span key={`ellipsis-${index}`} className="px-2 text-[13px] text-[#94a3b8]">
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
      <span className="text-[13px] text-[#7c889a]">
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
        'rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
        disabled
          ? 'cursor-not-allowed border-[#e5eaef] text-[#94a3b8]'
          : 'border-[#e5eaef] text-[#5a6577] hover:border-[#d0d7e0] hover:bg-[#f6f8fb]',
        active && 'border-primary-500 bg-primary-500 text-white hover:bg-primary-600'
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
