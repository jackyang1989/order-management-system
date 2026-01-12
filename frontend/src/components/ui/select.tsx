'use client';

import { useMemo } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = '请选择',
  disabled,
  className,
}: SelectProps) {
  const selectedLabel = useMemo(() => {
    if (!value) return '';
    return options.find((opt) => opt.value === value)?.label || '';
  }, [options, value]);

  const layoutClasses = className?.split(' ').filter(c => c.startsWith('w-') || c.startsWith('flex-') || c === 'grow' || c === 'shrink-0') || [];
  const containerClasses = layoutClasses.length > 0 ? layoutClasses.join(' ') : 'w-full';

  return (
    <div className={`relative ${containerClasses}`}>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          'w-full appearance-none rounded-2xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700',
          'transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm',
          'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
          !value && 'text-slate-400',
          className?.replace(layoutClasses[0] || '', '').trim()
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-slate-400">
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.937a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {value && !selectedLabel && (
        <span className="sr-only">{value}</span>
      )}
    </div>
  );
}
