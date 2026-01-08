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

  return (
    <div className={cn('relative', className)}>
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          'w-full appearance-none rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] text-[#3b4559]',
          'transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
          'disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]',
          !value && 'text-[#9ca3af]'
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
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[#94a3b8]">
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
