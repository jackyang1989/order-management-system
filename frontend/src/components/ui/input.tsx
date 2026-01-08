'use client';

import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leading, trailing, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const layoutClasses = className?.split(' ').filter(c => c.startsWith('w-') || c.startsWith('flex-') || c === 'grow' || c === 'shrink-0') || [];
    const containerClasses = layoutClasses.length > 0 ? layoutClasses.join(' ') : (label ? 'w-full' : 'w-auto');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-[#3b4559]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leading && <span className="absolute left-3 text-[#94a3b8]">{leading}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] text-[#3b4559] placeholder:text-[#9ca3af]',
              'transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
              'disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]',
              leading && 'pl-10',
              trailing && 'pr-10',
              error && 'border-danger-400 focus:border-danger-400 focus:ring-danger-400/20',
              className?.replace(layoutClasses[0] || '', '').trim()
            )}
            {...props}
          />
          {trailing && <span className="absolute right-3 text-[#94a3b8]">{trailing}</span>}
        </div>
        {error && <p className="mt-1.5 text-[13px] text-danger-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
