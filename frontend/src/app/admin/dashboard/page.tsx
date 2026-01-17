'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { BASE_URL } from '../../../../apiConfig';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { toastSuccess, toastError } from '../../../lib/toast';

interface Stats {
    totalUsers: number;
    totalMerchants: number;
    totalTasks: number;
    totalOrders: number;
    pendingMerchants: number;
    pendingWithdrawals: number;
    todayUsers: number;
    todayOrders: number;
    todayWithdrawalAmount: number;
    todayRechargeAmount: number;
    todayTasks: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [passwordModal, setPasswordModal] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

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

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            toastError('请填写原密码和新密码');
            return;
        }
        if (newPassword.length < 6) {
            toastError('新密码至少6位');
            return;
        }
        if (newPassword !== confirmPassword) {
            toastError('两次密码不一致');
            return;
        }
        const token = localStorage.getItem('adminToken');
        setChangingPassword(true);
        try {
            const res = await fetch(`${BASE_URL}/admin-users/profile/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('密码修改成功');
                setPasswordModal(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toastError(json.message || '修改失败');
            }
        } catch (e) {
            toastError('修改失败');
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <svg className="h-8 w-8 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
            </div>
        );
    }

    const statCards = [
        { label: '总用户数', value: stats?.totalUsers || 0, icon: '👤', bgColor: 'bg-primary-50', textColor: 'text-primary-600' },
        { label: '总商家数', value: stats?.totalMerchants || 0, icon: '🏪', bgColor: 'bg-success-50', textColor: 'text-success-500' },
        { label: '总任务数', value: stats?.totalTasks || 0, icon: '📋', bgColor: 'bg-[#f5f0ff]', textColor: 'text-[#7c5ce0]' },
        { label: '总订单数', value: stats?.totalOrders || 0, icon: '📦', bgColor: 'bg-warning-50', textColor: 'text-warning-500' },
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
        { icon: '⚙️', label: '系统设置', path: '/admin/system/params' },
    ];

    return (
        <div className="space-y-6">
            {/* 欢迎卡片 */}
            <div className="overflow-hidden rounded-[24px] bg-gradient-to-r from-primary-600 to-indigo-600 px-8 py-8 text-white shadow-lg shadow-primary-600/20">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="mb-3 text-2xl font-bold">欢迎回来，管理员</h2>
                        <p className="text-white/90 text-sm font-medium">
                            今日新增用户 <strong className="text-xl mx-1">{stats?.todayUsers || 0}</strong> 人，新增订单 <strong className="text-xl mx-1">{stats?.todayOrders || 0}</strong> 单
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        className="rounded-full bg-white/20 px-6 text-white hover:bg-white/30 hover:text-white backdrop-blur-md border-none"
                        onClick={() => setPasswordModal(true)}
                    >
                        修改密码
                    </Button>
                </div>
            </div>

            {/* 统计卡片 */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item, idx) => (
                    <div
                        key={idx}
                        className="group relative overflow-hidden rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:translate-y-[-2px] hover:shadow-lg"
                    >
                        <div className="flex items-center gap-5">
                            <div className={cn('flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] text-3xl transition-transform group-hover:scale-110', item.bgColor)}>
                                {item.icon}
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                                <div className={cn('mt-1 text-3xl font-black tracking-tight', item.textColor)}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 快捷操作区 */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* 待处理事项 */}
                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between px-6 py-5">
                        <h3 className="text-lg font-bold text-slate-800">待处理事项</h3>
                        <span className="text-2xl">📈</span>
                    </div>
                    <div className="space-y-3 p-6 pt-0">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push(action.path)}
                                className="group flex w-full items-center justify-between rounded-[20px] bg-slate-50 px-5 py-4 transition-all hover:bg-white hover:shadow-md active:scale-[0.98]"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl transition-transform group-hover:scale-110">{action.icon}</span>
                                    <span className="text-sm font-bold text-slate-700">{action.label}</span>
                                </div>
                                <span
                                    className={cn(
                                        'flex h-7 min-w-7 items-center justify-center rounded-full px-2.5 text-xs font-bold text-white transition-transform group-hover:scale-110',
                                        action.count > 0 ? 'bg-warning-500 shadow-warning-500/30 shadow-sm' : 'bg-slate-300'
                                    )}
                                >
                                    {action.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 今日数据 */}
                <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="px-6 py-5">
                        <h3 className="text-lg font-bold text-slate-800">今日数据</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-6 pt-0 sm:grid-cols-3 lg:grid-cols-5">
                        <div className="rounded-[20px] bg-primary-50 p-4 text-center transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-primary-400">新增用户</div>
                            <div className="mt-1 text-xl font-black text-primary-600">{stats?.todayUsers || 0}</div>
                        </div>
                        <div className="rounded-[20px] bg-success-50 p-4 text-center transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-success-400">新增订单</div>
                            <div className="mt-1 text-xl font-black text-success-500">{stats?.todayOrders || 0}</div>
                        </div>
                        <div className="rounded-[20px] bg-[#f5f0ff] p-4 text-center transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-[#9d8bf5]">新增任务</div>
                            <div className="mt-1 text-xl font-black text-[#7c5ce0]">{stats?.todayTasks || 0}</div>
                        </div>
                        <div className="rounded-[20px] bg-warning-50 p-4 text-center transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-warning-400">今日提现</div>
                            <div className="mt-1 text-xl font-black text-warning-500">¥{(stats?.todayWithdrawalAmount || 0).toFixed(0)}</div>
                        </div>
                        <div className="rounded-[20px] bg-[#ecfdf5] p-4 text-center transition-transform hover:scale-105">
                            <div className="text-xs font-bold text-[#34d399]">今日充值</div>
                            <div className="mt-1 text-xl font-black text-[#10b981]">¥{(stats?.todayRechargeAmount || 0).toFixed(0)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快捷入口 */}
            <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="px-6 py-5">
                    <h3 className="text-lg font-bold text-slate-800">快捷入口</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 p-6 pt-0 sm:grid-cols-4 md:grid-cols-6">
                    {quickLinks.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className="group flex flex-col items-center gap-3 rounded-[20px] bg-slate-50 p-5 transition-all hover:bg-white hover:shadow-md hover:translate-y-[-2px] active:scale-[0.98]"
                        >
                            <span className="text-3xl transition-transform group-hover:scale-110">{item.icon}</span>
                            <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* 修改密码弹窗 */}
            <Modal
                title="修改密码"
                open={passwordModal}
                onClose={() => { setPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
            >
                <div className="space-y-4">
                    <Input
                        type="password"
                        label="原密码"
                        placeholder="请输入原密码"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="新密码"
                        placeholder="请输入新密码（至少6位）"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <Input
                        type="password"
                        label="确认新密码"
                        placeholder="请再次输入新密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setPasswordModal(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                            取消
                        </Button>
                        <Button loading={changingPassword} onClick={handleChangePassword}>
                            确认修改
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
