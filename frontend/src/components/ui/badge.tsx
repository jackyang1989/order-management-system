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
  const base = 'inline-flex items-center gap-1 rounded-md font-medium';

  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-[12px]',
  };

  const variants: Record<string, Record<string, string>> = {
    solid: {
      slate: 'bg-[#5a6577] text-white',
      blue: 'bg-primary-500 text-white',
      green: 'bg-success-400 text-white',
      amber: 'bg-warning-400 text-white',
      red: 'bg-danger-400 text-white',
    },
    soft: {
      slate: 'bg-[#f0f3f7] text-[#5a6577]',
      blue: 'bg-primary-50 text-primary-600',
      green: 'bg-success-50 text-success-600',
      amber: 'bg-warning-50 text-warning-600',
      red: 'bg-danger-50 text-danger-500',
    },
    outline: {
      slate: 'border border-[#e5eaef] text-[#5a6577]',
      blue: 'border border-primary-200 text-primary-600',
      green: 'border border-success-200 text-success-600',
      amber: 'border border-warning-200 text-warning-600',
      red: 'border border-danger-200 text-danger-500',
    },
  };

  return <span className={cn(base, sizes[size], variants[variant][color], className)} style={style}>{children}</span>;
}
