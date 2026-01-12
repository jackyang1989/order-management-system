'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MerchantRootPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/merchant/dashboard');
    }, [router]);

    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center">
                <div className="relative mb-6 h-16 w-16">
                    <div className="absolute h-full w-full animate-ping rounded-full bg-primary-200 opacity-75"></div>
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-primary-500 text-2xl shadow-lg">
                        🏪
                    </div>
                </div>
                <div className="text-lg font-bold text-slate-600">正在进入商户后台...</div>
            </div>
        </div>
    );
}
