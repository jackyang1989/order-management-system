'use client';

import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps {
  children?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function Card({ children, title, description, actions, className, noPadding }: CardProps) {
  return (
    <div className={cn('overflow-hidden rounded-xl border border-[#e5eaef] bg-white shadow-card', className)}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5eaef] px-6 py-4">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-[#3b4559]">{title}</h3>}
            {description && <p className="mt-1 text-[13px] text-[#7c889a]">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 py-5'}>{children}</div>
    </div>
  );
}
