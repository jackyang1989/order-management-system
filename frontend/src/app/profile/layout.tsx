import { ReactNode } from 'react';

export default function ProfileLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            {children}
        </div>
    );
}
