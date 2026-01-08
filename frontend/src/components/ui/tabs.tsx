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
    sm: 'px-3 py-1.5 text-[13px]',
    md: 'px-4 py-2 text-[14px]',
  };

  return (
    <div className={cn('flex w-full items-center gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-1', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={() => onChange(item.key)}
          className={cn(
            'flex-1 rounded-md font-medium transition-colors',
            sizes[size],
            value === item.key
              ? 'bg-white text-[#3b4559] border border-[#e5e7eb]'
              : 'text-[#7c889a] hover:text-[#5a6577]',
            item.disabled && 'cursor-not-allowed text-[#94a3b8] hover:text-[#94a3b8]'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
