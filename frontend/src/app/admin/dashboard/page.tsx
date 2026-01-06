'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { BASE_URL } from '../../../apiConfig';

interface Stats {
    totalUsers: number;
    totalMerchants: number;
    totalTasks: number;
    totalOrders: number;
    pendingMerchants: number;
    pendingWithdrawals: number;
    todayUsers: number;
    todayOrders: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    const statCards = [
        { label: '总用户数', value: stats?.totalUsers || 0, icon: '👤', color: 'text-blue-500', bgColor: 'bg-blue-50' },
        { label: '总商家数', value: stats?.totalMerchants || 0, icon: '🏪', color: 'text-green-500', bgColor: 'bg-green-50' },
        { label: '总任务数', value: stats?.totalTasks || 0, icon: '📋', color: 'text-purple-500', bgColor: 'bg-purple-50' },
        { label: '总订单数', value: stats?.totalOrders || 0, icon: '📦', color: 'text-orange-500', bgColor: 'bg-orange-50' },
    ];

    const quickActions = [
        { label: '审核商家', count: stats?.pendingMerchants || 0, path: '/admin/merchants', icon: '✅' },
        { label: '审核提现', count: stats?.pendingWithdrawals || 0, path: '/admin/withdrawals', icon: '💵' },
    ];

    const quickLinks = [
        { icon: '👤', label: '买手列表', path: '/admin/users' },
        { icon: '🏪', label: '商家列表', path: '/admin/merchants' },
        { icon: '📋', label: '任务列表', path: '/admin/tasks' },
        { icon: '📦', label: '订单列表', path: '/admin/orders' },
        { icon: '💵', label: '提现审核', path: '/admin/withdrawals' },
        { icon: '⚙️', label: '系统设置', path: '/admin/system' },
    ];

    return (
        <div className="space-y-6">
            {/* 欢迎卡片 */}
            <div className="rounded-xl bg-gradient-to-r from-primary to-blue-700 px-8 py-6 text-white shadow-lg">
                <h2 className="mb-2 text-xl font-semibold">欢迎回来，管理员</h2>
                <p className="text-white/85">
                    今日新增用户 <strong>{stats?.todayUsers || 0}</strong> 人，新增订单 <strong>{stats?.todayOrders || 0}</strong> 单
                </p>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item, idx) => (
                    <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="flex items-center gap-3">
                            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg text-xl', item.bgColor)}>
                                {item.icon}
                            </div>
                            <div>
                                <div className="text-sm text-slate-500">{item.label}</div>
                                <div className={cn('text-2xl font-bold', item.color)}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 快捷操作区 */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* 待处理事项 */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <h3 className="font-medium text-slate-800">待处理事项</h3>
                        <span className="text-lg">📈</span>
                    </div>
                    <div className="space-y-3 p-5">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push(action.path)}
                                className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:bg-slate-50"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{action.icon}</span>
                                    <span className="text-slate-700">{action.label}</span>
                                </div>
                                <span
                                    className={cn(
                                        'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-medium text-white',
                                        action.count > 0 ? 'bg-amber-500' : 'bg-slate-300'
                                    )}
                                >
                                    {action.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 今日数据 */}
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-5 py-4">
                        <h3 className="font-medium text-slate-800">今日数据</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-5">
                        <div className="rounded-lg bg-blue-50 p-4 text-center">
                            <div className="text-sm text-slate-500">新增用户</div>
                            <div className="mt-1 text-2xl font-bold text-primary">{stats?.todayUsers || 0}</div>
                        </div>
                        <div className="rounded-lg bg-green-50 p-4 text-center">
                            <div className="text-sm text-slate-500">新增订单</div>
                            <div className="mt-1 text-2xl font-bold text-green-600">{stats?.todayOrders || 0}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快捷入口 */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                    <h3 className="font-medium text-slate-800">快捷入口</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 p-5 sm:grid-cols-4 md:grid-cols-6">
                    {quickLinks.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className="flex flex-col items-center gap-2 rounded-lg p-4 transition-colors hover:bg-slate-50"
                        >
                            <span className="text-2xl text-primary">{item.icon}</span>
                            <span className="text-sm text-slate-600">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
