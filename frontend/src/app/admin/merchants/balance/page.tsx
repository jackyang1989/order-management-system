'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';

interface BalanceRecord {
    id: string;
    userId: string;
    merchantNo: string;
    userType: number;
    moneyType: number;
    changeType: string;
    amount: number;
    beforeBalance: number;
    afterBalance: number;
    remark: string;
    orderId: string;
    taskId: string;
    createdAt: string;
}

const changeTypeLabels: Record<string, string> = {
    'TASK_COMMISSION': '任务佣金',
    'WITHDRAW': '提现',
    'RECHARGE': '充值',
    'ADMIN_ADD': '管理员充值',
    'ADMIN_DEDUCT': '管理员扣款',
    'ORDER_FROZEN': '订单冻结',
    'ORDER_UNFROZEN': '订单解冻',
    'ORDER_REFUND': '订单退款',
    'REFERRAL_REWARD': '推荐奖励',
    'VIP_PURCHASE': 'VIP购买',
    'TASK_PUBLISH': '发布任务',
    'TASK_CANCEL': '任务取消退款',
    'SERVICE_FEE': '服务费',
    'DEPOSIT': '押金',
};

const moneyTypeLabels: Record<number, { text: string; color: 'green' | 'blue' }> = {
    1: { text: '本金', color: 'green' },
    2: { text: '银锭', color: 'blue' },
};

export default function AdminMerchantsBalancePage() {
    const [records, setRecords] = useState<BalanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [moneyTypeFilter, setMoneyTypeFilter] = useState<string>('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadRecords();
    }, [page, moneyTypeFilter]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/finance-records/admin/all?page=${page}&limit=20&userType=2`;
            if (moneyTypeFilter) url += `&moneyType=${moneyTypeFilter}`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setRecords(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadRecords();
    };

    return (
        <div className="space-y-6">
            {/* Unified Card */}
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">商家余额记录</span>
                    <span className="text-[#6b7280]">共 {total} 条记录</span>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索商户ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-52"
                    />
                    <Select
                        value={moneyTypeFilter}
                        onChange={v => { setMoneyTypeFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部类型' },
                            { value: '1', label: '本金' },
                            { value: '2', label: '银锭' },
                        ]}
                        className="w-32"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                </div>

                <div className="overflow-hidden">
                    {loading ? (
                        <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                    ) : records.length === 0 ? (
                        <div className="py-12 text-center text-[#9ca3af]">暂无记录</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-[1000px] w-full border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">商户ID</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">类型</th>
                                            <th className="px-4 py-3.5 text-center text-sm font-medium">账户</th>
                                            <th className="px-4 py-3.5 text-right text-sm font-medium">变动金额</th>
                                            <th className="px-4 py-3.5 text-right text-sm font-medium">变动前</th>
                                            <th className="px-4 py-3.5 text-right text-sm font-medium">变动后</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">备注</th>
                                            <th className="px-4 py-3.5 text-left text-sm font-medium">时间</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map(r => (
                                            <tr key={r.id} className="border-b border-[#f3f4f6]">
                                                <td className="px-4 py-3.5 text-sm font-medium text-[#374151]">{r.merchantNo || '-'}</td>
                                                <td className="px-4 py-3.5 text-sm text-[#6b7280]">{changeTypeLabels[r.changeType] || r.changeType}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <Badge variant="soft" color={moneyTypeLabels[r.moneyType]?.color || 'slate'}>
                                                        {moneyTypeLabels[r.moneyType]?.text || '未知'}
                                                    </Badge>
                                                </td>
                                                <td className={cn('px-4 py-3.5 text-right text-sm font-medium', Number(r.amount) > 0 ? 'text-success-400' : 'text-danger-400')}>
                                                    {Number(r.amount) > 0 ? '+' : ''}{Number(r.amount).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3.5 text-right text-sm text-[#9ca3af]">{Number(r.beforeBalance || 0).toFixed(2)}</td>
                                                <td className="px-4 py-3.5 text-right text-sm text-[#374151]">{Number(r.afterBalance || 0).toFixed(2)}</td>
                                                <td className="max-w-[150px] truncate px-4 py-3.5 text-sm text-[#6b7280]">{r.remark || '-'}</td>
                                                <td className="px-4 py-3.5 text-sm text-[#9ca3af]">{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}</td>
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
                                <span className="px-3 text-sm text-[#6b7280]">第 {page} 页</span>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={records.length < 20}
                                    className={cn(records.length < 20 && 'cursor-not-allowed opacity-50')}
                                >
                                    下一页
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
