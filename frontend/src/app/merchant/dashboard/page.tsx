'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

interface MerchantStats { balance: number; frozenBalance: number; totalTasks: number; activeTasks: number; completedOrders: number; }
interface Merchant { id: string; username: string; phone: string; companyName: string; balance: number; frozenBalance: number; }

const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-[#f9fafb]', text: 'text-[#6b7280]' },
    yellow: { bg: 'bg-[#f9fafb]', text: 'text-[#6b7280]' },
    blue: { bg: 'bg-[#f9fafb]', text: 'text-primary-600' },
    pink: { bg: 'bg-[#f9fafb]', text: 'text-[#6b7280]' },
};

export default function MerchantDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [merchant, setMerchant] = useState<Merchant | null>(null);
    const [stats, setStats] = useState<MerchantStats | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('merchantToken');
        if (!token) { router.push('/merchant/login'); return; }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('merchantToken');
            const [profileRes, statsRes] = await Promise.all([
                fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${BASE_URL}/merchant/stats`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const profileData = await profileRes.json();
            const statsData = await statsRes.json();
            if (profileData.success) setMerchant(profileData.data);
            if (statsData.success) setStats(statsData.data);
        } catch (error) { console.error('Load data error:', error); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                    <div className="mb-3 text-4xl">🏪</div>
                    <div className="text-[14px] text-[#7c889a]">加载数据中...</div>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon, colorKey }: { title: string; value: string | number; icon: string; colorKey: string }) => {
        const colors = colorMap[colorKey] || { bg: 'bg-[#f9fafb]', text: 'text-[#6b7280]' };
        return (
            <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-1.5 text-[13px] text-[#6b7280]">{title}</div>
                        <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-md text-xl ${colors.bg}`}>{icon}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="flex items-center justify-between overflow-hidden rounded-md border border-[#e5e7eb] bg-white px-8 py-6 text-[#3b4559]">
                <div>
                    <h2 className="mb-2 text-xl font-semibold">欢迎回来，{merchant?.username || merchant?.companyName || '商家'}</h2>
                    <p className="text-[14px] text-[#6b7280]">今天是 {formatDate(new Date())}，准备好处理新订单了吗？</p>
                </div>
                <Button onClick={() => router.push('/merchant/tasks/new')} className="flex items-center gap-2">
                    <span>+</span> 发布新任务
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="账户余额" value={`¥${(stats?.balance || 0).toFixed(2)}`} icon="💰" colorKey="green" />
                <StatCard title="冻结金额" value={`¥${(stats?.frozenBalance || 0).toFixed(2)}`} icon="🔒" colorKey="yellow" />
                <StatCard title="发布任务" value={stats?.totalTasks || 0} icon="📋" colorKey="blue" />
                <StatCard title="待审核订单" value={stats?.completedOrders || 0} icon="⏳" colorKey="pink" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
                        <h3 className="text-[15px] font-semibold text-[#3b4559]">最近任务</h3>
                        <span onClick={() => router.push('/merchant/tasks')} className="cursor-pointer text-[13px] text-primary-600 hover:text-primary-700">查看全部 →</span>
                    </div>
                    <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[14px] text-[#6b7280]">暂无任务，点击上方按钮发布新任务</div>
                </div>

                <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
                        <h3 className="text-[15px] font-semibold text-[#3b4559]">待审核订单</h3>
                        <span onClick={() => router.push('/merchant/orders')} className="cursor-pointer text-[13px] text-primary-600 hover:text-primary-700">查看全部 →</span>
                    </div>
                    <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[14px] text-[#6b7280]">暂无待审核订单</div>
                </div>
            </div>
        </div>
    );
}
