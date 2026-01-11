'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MerchantRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/merchant/dashboard');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center">
            <div className="text-center">
                <div className="mb-4 text-lg text-gray-600">正在跳转到商户后台...</div>
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
            </div>
        </div>
    );
}
