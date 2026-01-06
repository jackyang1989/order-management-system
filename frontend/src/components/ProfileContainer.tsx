'use client';

import { cn } from '../lib/utils';

/**
 * ProfileContainer - Mobile container with consistent width and spacing
 * Fixed max-width on larger screens, full width on mobile
 */
export default function ProfileContainer({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    return (
        <main className={cn("min-h-screen bg-slate-50 pb-20", className)}>
            <div className={cn('mx-auto w-full max-w-[515px] px-4', className)}>
                {children}
            </div>
        </main>
    );
}
