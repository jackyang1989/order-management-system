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
        { icon: '⚙️', label: '系统设置', path: '/admin/system' },
    ];

    return (
        <div className="space-y-6">
            {/* 欢迎卡片 */}
            <div className="overflow-hidden rounded-md bg-gradient-to-r from-primary-500 to-primary-600 px-8 py-7 text-white ">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="mb-2 text-xl font-semibold">欢迎回来，管理员</h2>
                        <p className="text-white/80">
                            今日新增用户 <strong className="text-white">{stats?.todayUsers || 0}</strong> 人，新增订单 <strong className="text-white">{stats?.todayOrders || 0}</strong> 单
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className="border-white/50 text-white hover:bg-white/20 hover:text-white"
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
                        className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white p-5  transition-shadow hover:"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn('flex h-12 w-12 items-center justify-center rounded-md text-xl', item.bgColor)}>
                                {item.icon}
                            </div>
                            <div>
                                <div className="text-[13px] text-[#6b7280]">{item.label}</div>
                                <div className={cn('text-2xl font-bold', item.textColor)}>{item.value}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 快捷操作区 */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* 待处理事项 */}
                <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white ">
                    <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
                        <h3 className="text-[15px] font-semibold text-[#3b4559]">待处理事项</h3>
                        <span className="text-lg">📈</span>
                    </div>
                    <div className="space-y-3 p-5">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => router.push(action.path)}
                                className="flex w-full items-center justify-between rounded-md border border-[#e5e7eb] bg-white px-4 py-3.5 transition-all hover:border-primary-200 hover:bg-primary-50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-lg">{action.icon}</span>
                                    <span className="text-[14px] text-[#3b4559]">{action.label}</span>
                                </div>
                                <span
                                    className={cn(
                                        'flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[12px] font-medium text-white',
                                        action.count > 0 ? 'bg-warning-400' : 'bg-[#9ca3af]'
                                    )}
                                >
                                    {action.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 今日数据 */}
                <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white ">
                    <div className="border-b border-[#e5e7eb] px-6 py-4">
                        <h3 className="text-[15px] font-semibold text-[#3b4559]">今日数据</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 lg:grid-cols-5">
                        <div className="rounded-md bg-primary-50 p-4 text-center">
                            <div className="text-[13px] text-[#6b7280]">新增用户</div>
                            <div className="mt-2 text-xl font-bold text-primary-600">{stats?.todayUsers || 0}</div>
                        </div>
                        <div className="rounded-md bg-success-50 p-4 text-center">
                            <div className="text-[13px] text-[#6b7280]">新增订单</div>
                            <div className="mt-2 text-xl font-bold text-success-500">{stats?.todayOrders || 0}</div>
                        </div>
                        <div className="rounded-md bg-[#f5f0ff] p-4 text-center">
                            <div className="text-[13px] text-[#6b7280]">新增任务</div>
                            <div className="mt-2 text-xl font-bold text-[#7c5ce0]">{stats?.todayTasks || 0}</div>
                        </div>
                        <div className="rounded-md bg-warning-50 p-4 text-center">
                            <div className="text-[13px] text-[#6b7280]">今日提现</div>
                            <div className="mt-2 text-xl font-bold text-warning-500">¥{(stats?.todayWithdrawalAmount || 0).toFixed(2)}</div>
                        </div>
                        <div className="rounded-md bg-[#ecfdf5] p-4 text-center">
                            <div className="text-[13px] text-[#6b7280]">今日充值</div>
                            <div className="mt-2 text-xl font-bold text-[#10b981]">¥{(stats?.todayRechargeAmount || 0).toFixed(2)}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 快捷入口 */}
            <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white ">
                <div className="border-b border-[#e5e7eb] px-6 py-4">
                    <h3 className="text-[15px] font-semibold text-[#3b4559]">快捷入口</h3>
                </div>
                <div className="grid grid-cols-3 gap-4 p-5 sm:grid-cols-4 md:grid-cols-6">
                    {quickLinks.map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className="flex flex-col items-center gap-2.5 rounded-md p-4 transition-all hover:bg-[#f9fafb]"
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-[13px] text-[#5a6577]">{item.label}</span>
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
