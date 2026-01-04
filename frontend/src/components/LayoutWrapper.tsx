'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { AntdProvider } from './AntdProvider';

export default function LayoutWrapper({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    // 判断是否是商家端或管理后台页面
    const isMerchant = pathname?.startsWith('/merchant');
    const isAdmin = pathname?.startsWith('/admin');

    // 商家端和管理后台使用Ant Design PC版
    if (isMerchant || isAdmin) {
        return <AntdProvider>{children}</AntdProvider>;
    }

    // 买手端使用移动端容器限制
    return (
        <div className="mobile-container">
            {children}
        </div>
    );
}
