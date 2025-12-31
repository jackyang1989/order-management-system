'use client';

import { usePathname } from 'next/navigation';
import MerchantLayout from '../../components/MerchantLayout';

export default function MerchantRootLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // 登录与注册页不使用通用布局
    if (pathname === '/merchant/login' || pathname === '/merchant/register') {
        return <>{children}</>;
    }

    return <MerchantLayout>{children}</MerchantLayout>;
}
