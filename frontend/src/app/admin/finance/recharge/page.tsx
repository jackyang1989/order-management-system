'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';

interface RechargeRecord {
    id: string;
    userId: string;
    username?: string;
    phone?: string;
    userType: string;
    moneyType?: number;
    amount: number;
    payType: string;
    status: number;
    orderNumber: string;
    tradeNo: string;
    createdAt: string;
    paidAt: string;
}

const statusLabels: Record<number, { text: string; color: 'amber' | 'green' | 'red' }> = {
    0: { text: '待支付', color: 'amber' },
    1: { text: '已完成', color: 'green' },
    2: { text: '已取消', color: 'red' },
};

const userTypeLabels: Record<string, string> = {
    buyer: '买手',
    merchant: '商家',
};

const moneyTypeLabels: Record<number, { text: string; color: 'green' | 'blue' }> = {
    1: { text: '本金', color: 'green' },
    2: { text: '银锭', color: 'blue' },
};

export default function AdminFinanceRechargePage() {
    const [records, setRecords] = useState<RechargeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [userTypeFilter, setUserTypeFilter] = useState<string>('');

    useEffect(() => {
        loadRecords();
    }, [page, statusFilter, userTypeFilter]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/recharge/admin/records?page=${page}&limit=20`;
            if (statusFilter) url += `&status=${statusFilter}`;
            if (userTypeFilter) url += `&userType=${userTypeFilter}`;
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
        <div className="space-y-4">
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">充值记录</span>
                    <span className="text-[#9ca3af]">共 {total} 条记录</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索用户名/手机号..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        className="w-52"
                    />
                    <Select
                        value={userTypeFilter}
                        onChange={v => { setUserTypeFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部用户' },
                            { value: 'buyer', label: '买手' },
                            { value: 'merchant', label: '商家' },
                        ]}
                        className="w-28"
                    />
                    <Select
                        value={statusFilter}
                        onChange={v => { setStatusFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: '0', label: '待支付' },
                            { value: '1', label: '已完成' },
                            { value: '2', label: '已取消' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                    <Button variant="secondary" onClick={loadRecords}>刷新</Button>
                </div>
            </Card>

            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-[#9ca3af]">加载中...</div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-[#9ca3af]">暂无充值记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[900px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">订单号</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">用户信息</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">用户类型</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">货币类型</th>
                                        <th className="px-4 py-3.5 text-right text-sm font-medium">金额</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">支付方式</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">状态</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-3.5 font-mono text-xs">{r.orderNumber}</td>
                                            <td className="px-4 py-3.5">
                                                <div className="font-medium text-[#3b4559]">{r.username || '-'}</div>
                                                <div className="text-xs text-[#9ca3af]">{r.phone || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3.5 text-[#6b7280]">{userTypeLabels[r.userType] || r.userType}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={moneyTypeLabels[r.moneyType || 1]?.color || 'green'}>
                                                    {moneyTypeLabels[r.moneyType || 1]?.text || '本金'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-right font-medium text-success-400">¥{Number(r.amount).toFixed(2)}</td>
                                            <td className="px-4 py-3.5 text-[#6b7280]">{r.payType}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={statusLabels[r.status]?.color || 'slate'}>
                                                    {statusLabels[r.status]?.text || '未知'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-[#9ca3af]">{new Date(r.createdAt).toLocaleString('zh-CN')}</td>
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
            </Card>
        </div>
    );
}
