'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';

interface Shop {
    id: string;
    platform: string;
    shopName: string;
    accountName: string;
    contactName: string;
    status: number;
    merchant: { username: string; companyName: string };
    createdAt: string;
}

const statusConfig: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '正常', color: 'green' },
    2: { text: '已拒绝', color: 'red' },
};

export default function AdminShopsPage() {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => { loadShops(); }, [statusFilter]);

    const loadShops = async () => {
        setLoading(true);
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const res = await fetch(`${BASE_URL}/admin/shops${query}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const json = await res.json();
        if (json.list) setShops(json.list);
        setLoading(false);
    };

    const handleReview = async (id: string, status: number, remark?: string) => {
        if (!confirm(status === 1 ? '确认通过审核？' : '确认拒绝？')) return;
        const res = await fetch(`${BASE_URL}/admin/shops/${id}/review`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ status, remark })
        });
        const json = await res.json();
        if (res.ok) { alert('操作成功'); loadShops(); }
        else alert(json.message || '操作失败');
    };

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-2xl font-medium">店铺审核</h1>

            <div className="flex items-center gap-3">
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={[
                        { value: '', label: '全部状态' },
                        { value: '0', label: '待审核' },
                        { value: '1', label: '正常' },
                        { value: '2', label: '已拒绝' },
                    ]}
                    className="w-32"
                />
                <Button onClick={loadShops}>刷新</Button>
            </div>

            <Card className="overflow-hidden bg-white p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-[1000px] w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50">
                                <th className="px-3 py-3 text-left text-sm font-medium">所属商家</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">平台</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">店铺名</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">旺旺号</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">联系人</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">状态</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">申请时间</th>
                                <th className="px-3 py-3 text-left text-sm font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shops.map(shop => (
                                <tr key={shop.id} className="border-b border-slate-100">
                                    <td className="px-3 py-3">
                                        <div>{shop.merchant?.companyName || '--'}</div>
                                        <div className="text-xs text-slate-400">{shop.merchant?.username}</div>
                                    </td>
                                    <td className="px-3 py-3">{shop.platform}</td>
                                    <td className="px-3 py-3">{shop.shopName}</td>
                                    <td className="px-3 py-3">{shop.accountName}</td>
                                    <td className="px-3 py-3">{shop.contactName}</td>
                                    <td className="px-3 py-3">
                                        <Badge variant="soft" color={statusConfig[shop.status]?.color || 'slate'}>
                                            {statusConfig[shop.status]?.text || '未知'}
                                        </Badge>
                                    </td>
                                    <td className="px-3 py-3 text-xs text-slate-500">{new Date(shop.createdAt).toLocaleString()}</td>
                                    <td className="px-3 py-3">
                                        {shop.status === 0 ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleReview(shop.id, 1)} className="cursor-pointer border-none bg-transparent text-sm text-green-600 hover:underline">通过</button>
                                                <button onClick={() => { const reason = prompt('请输入拒绝原因：'); if (reason) handleReview(shop.id, 2, reason); }} className="cursor-pointer border-none bg-transparent text-sm text-red-500 hover:underline">拒绝</button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">已审核</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {shops.length === 0 && !loading && <div className="py-10 text-center text-slate-400">暂无数据</div>}
            </Card>
        </div>
    );
}
