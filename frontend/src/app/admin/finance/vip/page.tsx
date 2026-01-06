'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Select } from '../../../../components/ui/select';

interface VipRecord {
    id: string;
    userId: string;
    username: string;
    userType: number;
    vipLevel: number;
    days: number;
    price: number;
    expireAt: string;
    sourceType: string;
    operatorId: string;
    remark: string;
    createdAt: string;
}

const userTypeLabels: Record<number, { text: string; color: 'blue' | 'amber' }> = {
    1: { text: '买手', color: 'blue' },
    2: { text: '商家', color: 'amber' },
};

const sourceTypeLabels: Record<string, string> = {
    'PURCHASE': '购买',
    'ADMIN_SET': '管理员设置',
    'GIFT': '赠送',
    'ACTIVITY': '活动奖励',
};

export default function AdminFinanceVipPage() {
    const [records, setRecords] = useState<VipRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [userTypeFilter, setUserTypeFilter] = useState<string>('');

    useEffect(() => {
        loadRecords();
    }, [page, userTypeFilter]);

    const loadRecords = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/vip/admin/records?page=${page}&limit=20`;
            if (userTypeFilter) url += `&userType=${userTypeFilter}`;

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

    return (
        <div className="space-y-4">
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">会员记录</span>
                    <span className="text-slate-500">共 {total} 条记录</span>
                </div>
                <div className="flex items-center gap-3">
                    <Select
                        value={userTypeFilter}
                        onChange={v => { setUserTypeFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部用户类型' },
                            { value: '1', label: '买手' },
                            { value: '2', label: '商家' },
                        ]}
                        className="w-40"
                    />
                </div>
            </Card>

            <Card className="overflow-hidden bg-white p-0">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : records.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">暂无会员记录</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-[1000px] w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50">
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">用户</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">用户类型</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">VIP等级</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium">天数</th>
                                        <th className="px-4 py-3.5 text-right text-sm font-medium">金额</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">来源</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">到期时间</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium">创建时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map(r => (
                                        <tr key={r.id} className="border-b border-slate-100">
                                            <td className="px-4 py-3.5 font-medium">{r.username || r.userId.slice(0, 8)}</td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color={userTypeLabels[r.userType]?.color || 'slate'}>
                                                    {userTypeLabels[r.userType]?.text || '未知'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-center">
                                                <Badge variant="soft" color="amber">VIP{r.vipLevel}</Badge>
                                            </td>
                                            <td className="px-4 py-3.5 text-center text-slate-500">{r.days}天</td>
                                            <td className="px-4 py-3.5 text-right font-medium text-green-600">¥{Number(r.price || 0).toFixed(2)}</td>
                                            <td className="px-4 py-3.5 text-slate-500">{sourceTypeLabels[r.sourceType] || r.sourceType}</td>
                                            <td className="px-4 py-3.5 text-slate-500">{r.expireAt ? new Date(r.expireAt).toLocaleDateString('zh-CN') : '-'}</td>
                                            <td className="px-4 py-3.5 text-xs text-slate-400">{r.createdAt ? new Date(r.createdAt).toLocaleString('zh-CN') : '-'}</td>
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
                            <span className="px-3 text-sm text-slate-500">第 {page} 页</span>
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
