'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={label ? 'w-full' : 'w-auto'}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-[#3b4559]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={cn(
            'w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-[14px] text-[#3b4559] placeholder:text-[#9ca3af]',
            'transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            'disabled:cursor-not-allowed disabled:bg-[#f9fafb] disabled:text-[#6b7280]',
            error && 'border-danger-400 focus:border-danger-400 focus:ring-danger-400/20',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[13px] text-danger-400">{error}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export { DateInput };
