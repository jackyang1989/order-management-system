'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface TabsItem {
  key: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabsItem[];
  value: string;
  onChange: (value: string) => void;
  size?: 'sm' | 'md';
  className?: string;
  variant?: 'default' | 'pills';
}

export function Tabs({ items, value, onChange, size = 'md', className, variant = 'default' }: TabsProps) {
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-4 py-2 text-[13px]',
  };

  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => onChange(item.key)}
            className={cn(
              'rounded-full font-medium transition-all',
              sizes[size],
              value === item.key
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              item.disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-2xl bg-slate-100 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange(item.key)}
          className={cn(
            'rounded-xl font-medium transition-all',
            sizes[size],
            value === item.key
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
            item.disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
