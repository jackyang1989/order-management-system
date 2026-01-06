'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';

interface MerchantStats { balance: number; frozenBalance: number; totalTasks: number; activeTasks: number; completedOrders: number; }
interface Merchant { id: string; username: string; phone: string; companyName: string; balance: number; frozenBalance: number; }

const colorMap: Record<string, string> = { green: 'bg-green-100', yellow: 'bg-amber-100', blue: 'bg-blue-100', pink: 'bg-pink-100' };

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
                    <div className="text-slate-500">加载数据中...</div>
                </div>
            </div>
        );
    }

    const StatCard = ({ title, value, icon, colorKey }: { title: string; value: string | number; icon: string; colorKey: string }) => (
        <Card className="bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <div className="mb-2 text-sm text-slate-500">{title}</div>
                    <div className="text-3xl font-bold text-slate-800">{value}</div>
                </div>
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl ${colorMap[colorKey] || 'bg-slate-100'}`}>{icon}</div>
            </div>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Welcome Banner */}
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 px-10 py-8 text-white shadow-lg">
                <div>
                    <h2 className="mb-2 text-2xl font-bold">欢迎回来，{merchant?.username || merchant?.companyName || '商家'} 👋</h2>
                    <p className="text-sm opacity-90">今天是 {new Date().toLocaleDateString('zh-CN')}，准备好处理新订单了吗？</p>
                </div>
                <Button onClick={() => router.push('/merchant/tasks/new')} className="flex items-center gap-2 bg-white font-semibold text-indigo-500 shadow hover:bg-slate-50">
                    <span>+</span> 发布新任务
                </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-5">
                <StatCard title="账户余额" value={`¥${(stats?.balance || 0).toFixed(2)}`} icon="💰" colorKey="green" />
                <StatCard title="冻结金额" value={`¥${(stats?.frozenBalance || 0).toFixed(2)}`} icon="🔒" colorKey="yellow" />
                <StatCard title="发布任务" value={stats?.totalTasks || 0} icon="📋" colorKey="blue" />
                <StatCard title="待审核订单" value={stats?.completedOrders || 0} icon="⏳" colorKey="pink" />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-5">
                <Card className="bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">最近任务</h3>
                        <span onClick={() => router.push('/merchant/tasks')} className="cursor-pointer text-sm text-indigo-600">查看全部 →</span>
                    </div>
                    <div className="py-10 text-center text-sm text-slate-500">暂无任务，点击上方按钮发布新任务</div>
                </Card>

                <Card className="bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">待审核订单</h3>
                        <span onClick={() => router.push('/merchant/orders')} className="cursor-pointer text-sm text-indigo-600">查看全部 →</span>
                    </div>
                    <div className="py-10 text-center text-sm text-slate-500">暂无待审核订单</div>
                </Card>
            </div>
        </div>
    );
}
