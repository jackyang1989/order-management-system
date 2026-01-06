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
}

export function Tabs({ items, value, onChange, size = 'md', className }: TabsProps) {
  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
  };

  return (
    <div className={cn('flex w-full items-center gap-2 rounded-xl bg-slate-100 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex-1 rounded-lg font-medium transition-colors',
            sizes[size],
            value === item.key
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700',
            item.disabled && 'cursor-not-allowed text-slate-400 hover:text-slate-400'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
