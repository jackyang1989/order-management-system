'use client';

import { cn } from '../lib/utils';

interface ProfileContainerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * ProfileContainer - Mobile container with consistent padding
 * Full width on mobile, content centered with proper padding
 */
export function ProfileContainer({ children, className }: ProfileContainerProps) {
    return (
        <div className={cn('w-full px-4', className)}>
            {children}
        </div>
    );
}
