'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, Shop, deleteShop } from '../../../services/shopService';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';

const statusMap: Record<number, { text: string; color: 'amber' | 'green' | 'red' | 'slate' }> = {
    0: { text: '待审核', color: 'amber' },
    1: { text: '已通过', color: 'green' },
    2: { text: '已拒绝', color: 'red' }
};

export default function MerchantShopsPage() {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadShops(); }, []);

    const loadShops = async () => { const data = await fetchShops(); setShops(data); setLoading(false); };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该店铺吗？')) return;
        const res = await deleteShop(id);
        if (res.success) { alert('删除成功'); loadShops(); }
        else alert(res.message);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-medium">店铺管理</h1>
                <Button onClick={() => router.push('/merchant/shops/new')}>+ 绑定新店铺</Button>
            </div>

            {/* Content */}
            <Card className="bg-white p-6">
                {loading ? (
                    <div className="text-slate-500">加载中...</div>
                ) : shops.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">暂无绑定店铺</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">平台</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">店铺名称</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">旺旺号</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">发件人</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">状态</th>
                                    <th className="border-b border-slate-100 px-4 py-4 text-left text-sm font-medium text-slate-600">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shops.map(shop => {
                                    const status = statusMap[shop.status] || { text: '未知', color: 'slate' as const };
                                    return (
                                        <tr key={shop.id} className="border-b border-slate-100">
                                            <td className="px-4 py-4 text-sm">{shop.platform}</td>
                                            <td className="px-4 py-4 text-sm">{shop.shopName}</td>
                                            <td className="px-4 py-4 text-sm">{shop.accountName}</td>
                                            <td className="px-4 py-4 text-sm">{shop.contactName}</td>
                                            <td className="px-4 py-4">
                                                <Badge variant="soft" color={status.color}>{status.text}</Badge>
                                                {shop.auditRemark && <div className="mt-1 text-xs text-red-500">{shop.auditRemark}</div>}
                                            </td>
                                            <td className="px-4 py-4">
                                                <button onClick={() => router.push(`/merchant/shops/edit/${shop.id}`)} className="mr-3 text-sm text-blue-500 hover:underline">修改</button>
                                                <button onClick={() => handleDelete(shop.id)} className="text-sm text-red-500 hover:underline">删除</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
}
