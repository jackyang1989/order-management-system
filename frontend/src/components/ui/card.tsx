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
    <div className={cn('overflow-hidden rounded-[24px] border-none bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]', className)}>
      {(title || description || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 px-6 py-5">
          <div className="min-w-0">
            {title && <h3 className="text-lg font-bold text-slate-800">{title}</h3>}
            {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'px-6 pb-6 pt-0'}>{children}</div>
    </div>
  );
}
