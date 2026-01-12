'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { formatDate } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';

interface MerchantStats { balance: number; frozenBalance: number; totalTasks: number; activeTasks: number; completedOrders: number; }
interface Merchant { id: string; username: string; phone: string; companyName: string; balance: number; frozenBalance: number; }

const colorMap: Record<string, { bg: string; text: string }> = {
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-primary-600' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
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
                    <div className="mb-3 text-4xl animate-bounce">🏪</div>
                    <div className="text-[14px] font-medium text-slate-400">加载数据中...</div>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon, colorKey }: { title: string; value: string | number; icon: string; colorKey: string }) => {
        const colors = colorMap[colorKey] || { bg: 'bg-slate-50', text: 'text-slate-600' };
        return (
            <div className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
                        <div className={`text-2xl font-black tracking-tight ${colors.text}`}>{value}</div>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl transition-transform group-hover:scale-110 ${colors.bg}`}>{icon}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="flex items-center justify-between overflow-hidden rounded-[24px] bg-white px-8 py-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div>
                    <h2 className="mb-1 text-2xl font-black text-slate-900">欢迎回来，{merchant?.username || merchant?.companyName || '商家'}</h2>
                    <p className="text-[14px] font-medium text-slate-400">今天是 {formatDate(new Date())}，准备好处理新订单了吗？</p>
                </div>
                <Button
                    onClick={() => router.push('/merchant/tasks/new')}
                    className="h-12 rounded-[20px] bg-primary-600 px-6 text-base font-bold text-white shadow-none transition-all active:scale-95"
                >
                    <span className="mr-2 text-xl">+</span> 发布新任务
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
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
                        <h3 className="text-lg font-bold text-slate-900">最近任务</h3>
                        <span onClick={() => router.push('/merchant/tasks')} className="cursor-pointer text-[13px] font-bold text-primary-600 hover:text-primary-700">查看全部 →</span>
                    </div>
                    <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[14px] font-medium text-slate-400">暂无任务，点击上方按钮发布新任务</div>
                </div>

                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between border-b border-slate-50 px-8 py-6">
                        <h3 className="text-lg font-bold text-slate-900">待审核订单</h3>
                        <span onClick={() => router.push('/merchant/orders')} className="cursor-pointer text-[13px] font-bold text-primary-600 hover:text-primary-700">查看全部 →</span>
                    </div>
                    <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-[14px] font-medium text-slate-400">暂无待审核订单</div>
                </div>
            </div>
        </div>
    );
}
