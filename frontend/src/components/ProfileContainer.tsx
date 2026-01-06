'use client';

import { cn } from '../lib/utils';

interface ProfileContainerProps {
    children: React.ReactNode;
    className?: string;
    /** Use 'wide' for pages needing more space like tables */
    size?: 'default' | 'wide';
}

/**
 * ProfileContainer - Centers and constrains profile page content
 * Prevents full-width stretch on desktop/iPad while maintaining mobile full-width
 */
export function ProfileContainer({ children, className, size = 'default' }: ProfileContainerProps) {
    return (
        <div
            className={cn(
                'mx-auto w-full px-4 md:px-6',
                size === 'wide' ? 'max-w-5xl' : 'max-w-4xl',
                className
            )}
        >
            {children}
        </div>
    );
}
