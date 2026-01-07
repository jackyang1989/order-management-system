'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    // 判断是否是商家端或管理后台页面
    const isMerchant = pathname?.startsWith('/merchant');
    const isAdmin = pathname?.startsWith('/admin');

    if (isMerchant || isAdmin) {
        return <>{children}</>;
    }

    // 买手端使用移动端容器限制
    return (
        <div className="relative mx-auto min-h-screen w-full max-w-[515px] bg-white ring-1 ring-slate-200">
            <div className="min-h-screen w-full bg-slate-50">
                {children}
            </div>
        </div>
    );
}
