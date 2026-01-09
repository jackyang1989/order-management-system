'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import { Modal } from '../../../../../components/ui/modal';
import { toastSuccess, toastError } from '../../../../../lib/toast';

interface BalanceRecord {
    id: string;
    userId: string;
    type: 'principal' | 'silver';
    action: 'in' | 'out';
    amount: number;
    balance: number;
    description: string;
    orderId?: string;
    withdrawalId?: string;
    relatedUserId?: string;
    createdAt: string;
}

interface UserInfo {
    id: string;
    username: string;
    phone: string;
    balance: number;
    silver: number;
}

function UserDepositPageContent() {
    const params = useParams();
    const userId = params.id as string;

    const [user, setUser] = useState<UserInfo | null>(null);
    const [records, setRecords] = useState<BalanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [descSearch, setDescSearch] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // 充值/扣款弹窗
    const [adjustModal, setAdjustModal] = useState<{
        type: 'balance' | 'silver';
        action: 'add' | 'deduct';
    } | null>(null);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => {
        loadUserInfo();
        loadRecords();
    }, [userId, page]);

    const loadUserInfo = async () => {
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.data);
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    };

    const loadRecords = async () => {
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users/${userId}/balance-logs?page=${page}&limit=10`;
            if (descSearch) url += `&describe=${encodeURIComponent(descSearch)}`;
            if (dateRange.start && dateRange.end) {
                url += `&startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (data.success) {
                setRecords(data.data || []);
                setTotal(data.total || 0);
            }
        } catch (error) {
            console.error('获取记录失败:', error);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        setPage(1);
        loadRecords();
    };

    const handleAdjust = async () => {
        if (!adjustModal || !adjustAmount || !adjustReason) {
            toastError('请填写金额和原因');
            return;
        }
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${userId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({
                    type: adjustModal.type,
                    action: adjustModal.action,
                    amount: Number(adjustAmount),
                    reason: adjustReason
                })
            });
            const data = await res.json();
            if (data.success) {
                toastSuccess('操作成功');
                setAdjustModal(null);
                setAdjustAmount('');
                setAdjustReason('');
                loadUserInfo();
                loadRecords();
            } else {
                toastError(data.message || '操作失败');
            }
        } catch (error) {
            toastError('操作失败');
        }
    };

    return (
        <div className="space-y-4">
            {/* 用户信息卡片 */}
            <Card className="bg-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">
                            押金 - {user?.username || '加载中...'}
                        </h2>
                        <p className="text-sm text-[#6b7280]">
                            手机: {user?.phone || '-'} | 本金余额: ¥{(user?.balance || 0).toFixed(2)} | 银锭: {(user?.silver || 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="success" onClick={() => setAdjustModal({ type: 'balance', action: 'add' })}>
                            充值本金
                        </Button>
                        <Button variant="warning" onClick={() => setAdjustModal({ type: 'balance', action: 'deduct' })}>
                            扣除本金
                        </Button>
                        <Button variant="secondary" onClick={() => window.history.back()}>
                            返回
                        </Button>
                    </div>
                </div>
            </Card>

            {/* 搜索筛选 */}
            <Card className="bg-white">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-[#6b7280]">描述：</label>
                        <Input
                            placeholder="描述"
                            value={descSearch}
                            onChange={(e) => setDescSearch(e.target.value)}
                            className="w-40"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-[#6b7280]">本金财务日期：</label>
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-36"
                        />
                        <span className="text-[#6b7280]">~</span>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-36"
                        />
                    </div>
                    <Button onClick={handleSearch}>
                        搜 索
                    </Button>
                </div>
            </Card>

            {/* 记录列表 */}
            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-[#9ca3af]">暂无记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        <th className="px-4 py-3 text-center text-sm font-medium">序号</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">用户名</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">手机号码</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">金额</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">余额</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">财务描述</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium">添加时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r, index) => (
                                        <tr key={r.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-3 text-center">{(page - 1) * 10 + index + 1}</td>
                                            <td className="px-4 py-3 text-center">{user?.username || '-'}</td>
                                            <td className="px-4 py-3 text-center">{user?.phone || '-'}</td>
                                            <td className={cn(
                                                'px-4 py-3 text-center font-medium',
                                                r.action === 'in' ? 'text-success-500' : 'text-danger-500'
                                            )}>
                                                {r.action === 'in' ? '+' : '-'}{Number(r.amount).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-center">{Number(r.balance || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center text-[#6b7280]">
                                                {r.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-[#9ca3af]">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-end gap-2 p-4">
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className={cn(page === 1 && 'cursor-not-allowed opacity-50')}
                            >
                                上一页
                            </Button>
                            <span className="px-3 text-sm text-[#6b7280]">
                                第 {page} 页 / 共 {Math.ceil(total / 10)} 页
                            </span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => setPage(p => p + 1)}
                                disabled={records.length < 10}
                                className={cn(records.length < 10 && 'cursor-not-allowed opacity-50')}
                            >
                                下一页
                            </Button>
                        </div>
                    </>
                )}
            </Card>

            {/* 充值/扣款弹窗 */}
            <Modal
                title={`${adjustModal?.action === 'add' ? '充值' : '扣除'}${adjustModal?.type === 'balance' ? '本金' : '银锭'} - ${user?.username}`}
                open={!!adjustModal}
                onClose={() => { setAdjustModal(null); setAdjustAmount(''); setAdjustReason(''); }}
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">
                            {adjustModal?.action === 'add' ? '充值' : '扣除'}金额
                        </label>
                        <Input
                            type="number"
                            placeholder="请输入金额"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-[#374151]">操作原因</label>
                        <Input
                            placeholder="请输入操作原因"
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={() => { setAdjustModal(null); setAdjustAmount(''); setAdjustReason(''); }}>
                            取消
                        </Button>
                        <Button
                            onClick={handleAdjust}
                            variant={adjustModal?.action === 'add' ? 'success' : 'warning'}
                        >
                            确认{adjustModal?.action === 'add' ? '充值' : '扣款'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default function UserDepositPage() {
    return (
        <Suspense fallback={<div className="py-10 text-center text-[#9ca3af]">加载中...</div>}>
            <UserDepositPageContent />
        </Suspense>
    );
}
