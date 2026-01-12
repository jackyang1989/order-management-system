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
          {leading && <span className="absolute left-3.5 z-10 text-slate-400">{leading}</span>}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-2xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 placeholder:text-slate-400',
              'transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm',
              'disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400',
              leading && 'pl-10',
              trailing && 'pr-10',
              error && 'ring-2 ring-danger-400/20 bg-danger-50 text-danger-600 placeholder:text-danger-300',
              className?.replace(layoutClasses[0] || '', '').trim()
            )}
            {...props}
          />
          {trailing && <span className="absolute right-3.5 z-10 text-slate-400">{trailing}</span>}
        </div>
        {error && <p className="mt-1.5 text-[13px] text-danger-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
