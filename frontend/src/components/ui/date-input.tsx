'use client';

import { forwardRef, InputHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, value = '', onChange, id, placeholder, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      // Remove non-numeric and non-dash characters
      val = val.replace(/[^\d-]/g, '');

      // Auto-format: add dashes after year and month
      if (val.length === 4 && !val.includes('-')) {
        val = val + '-';
      } else if (val.length === 7 && val.split('-').length === 2) {
        val = val + '-';
      }

      // Limit length
      if (val.length > 10) {
        val = val.slice(0, 10);
      }

      setInputValue(val);
      onChange?.({ target: { value: val } });
    };

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
          type="text"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder || 'YYYY-MM-DD'}
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
