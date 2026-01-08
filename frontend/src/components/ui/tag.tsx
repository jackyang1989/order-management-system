'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TagProps {
  children?: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
}

export function Tag({ children, tone = 'neutral', size = 'md', className }: TagProps) {
  const tones: Record<string, string> = {
    neutral: 'bg-[#f3f4f6] text-[#374151]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
  };

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn('inline-flex items-center rounded-full font-medium', tones[tone], sizes[size], className)}>
      {children}
    </span>
  );
}
