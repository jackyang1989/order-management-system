'use client';

import { forwardRef, InputHTMLAttributes, useRef } from 'react';
import { cn } from '../../lib/utils';

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, label, error, id, value, onChange, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const hiddenDateRef = useRef<HTMLInputElement>(null);

    // 点击任意位置时触发隐藏的原生日期选择器
    const handleClick = () => {
      hiddenDateRef.current?.showPicker?.();
    };

    // 隐藏日期选择器选择日期后，更新显示值
    const handleHiddenDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    // 格式化显示日期 YYYY-MM-DD
    const displayValue = value?.toString() || '';

    return (
      <div className={label ? 'w-full' : 'w-auto'}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-medium text-[#3b4559]">
            {label}
          </label>
        )}
        <div className="relative">
          {/* 显示框 - 只读，点击触发日期选择器 */}
          <div
            onClick={handleClick}
            className={cn(
              'w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 pr-10 text-[14px] cursor-pointer',
              'transition-all hover:border-[#d1d5db]',
              'focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20',
              displayValue ? 'text-[#3b4559]' : 'text-[#9ca3af]',
              error && 'border-danger-400',
              className
            )}
          >
            {displayValue || 'YYYY-MM-DD'}
          </div>
          {/* 隐藏的原生日期选择器 */}
          <input
            ref={hiddenDateRef}
            id={inputId}
            type="date"
            value={displayValue}
            onChange={handleHiddenDateChange}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
            {...props}
          />
          {/* 日历图标 */}
          <div
            onClick={handleClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#9ca3af] cursor-pointer hover:text-[#6b7280]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-[13px] text-danger-400">{error}</p>}
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';

export { DateInput };
