'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface EmptyProps {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Empty({
  title = '暂无数据',
  description = '当前没有可显示的内容。',
  action,
  className,
}: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e5e7eb] bg-white px-6 py-10 text-center', className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f6] text-[#9ca3af]">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
        </svg>
      </div>
      {title && <h3 className="mt-4 text-base font-semibold text-[#1f2937]">{title}</h3>}
      {description && <p className="mt-2 text-sm text-[#f9fafb]0">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
