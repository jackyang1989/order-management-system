'use client';

import { ReactNode, CSSProperties } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children?: ReactNode;
  variant?: 'solid' | 'soft' | 'outline';
  color?: 'slate' | 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md';
  className?: string;
  style?: CSSProperties;
}

export function Badge({ children, variant = 'soft', color = 'slate', size = 'md', className, style }: BadgeProps) {
  const base = 'inline-flex items-center gap-1 rounded-full font-medium';

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variants: Record<string, Record<string, string>> = {
    solid: {
      slate: 'bg-slate-900 text-white',
      blue: 'bg-blue-600 text-white',
      green: 'bg-emerald-600 text-white',
      amber: 'bg-amber-500 text-white',
      red: 'bg-red-600 text-white',
    },
    soft: {
      slate: 'bg-slate-100 text-slate-700',
      blue: 'bg-blue-50 text-blue-700',
      green: 'bg-emerald-50 text-emerald-700',
      amber: 'bg-amber-50 text-amber-700',
      red: 'bg-red-50 text-red-700',
    },
    outline: {
      slate: 'border border-slate-200 text-slate-700',
      blue: 'border border-blue-200 text-blue-700',
      green: 'border border-emerald-200 text-emerald-700',
      amber: 'border border-amber-200 text-amber-700',
      red: 'border border-red-200 text-red-700',
    },
  };

  return <span className={cn(base, sizes[size], variants[variant][color], className)} style={style}>{children}</span>;
}
