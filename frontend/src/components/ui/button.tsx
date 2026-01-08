'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<string, string> = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm',
      secondary: 'bg-[#f6f8fb] text-[#3b4559] hover:bg-[#eef1f6] focus:ring-[#94a3b8] border border-[#e5eaef]',
      ghost: 'bg-transparent text-[#5a6577] hover:bg-[#f6f8fb] hover:text-[#3b4559] focus:ring-[#94a3b8]',
      destructive: 'bg-danger-400 text-white hover:bg-danger-500 focus:ring-danger-400 shadow-sm',
      outline: 'bg-white text-primary-500 border border-primary-500 hover:bg-primary-50 focus:ring-primary-500',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
      md: 'h-10 px-4 text-[14px] rounded-lg gap-2',
      lg: 'h-12 px-6 text-[15px] rounded-xl gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
