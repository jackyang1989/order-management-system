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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">店铺管理</h1>
                <Button
                    onClick={() => router.push('/merchant/shops/new')}
                    className="flex items-center gap-1.5 rounded-[16px] bg-primary-600 px-5 text-base font-bold text-white shadow-none transition-all active:scale-95 hover:bg-primary-700"
                >
                    + 绑定新店铺
                </Button>
            </div>

            {/* Content */}
            <Card className="rounded-[24px] bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center font-medium text-slate-400">加载中...</div>
                ) : shops.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <div className="mb-4 text-5xl opacity-50">🏪</div>
                        <div className="mb-5 text-[14px] font-medium text-slate-400">暂无绑定店铺</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[700px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">平台</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">店铺名称</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">店铺账号</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">发件人</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shops.map((shop, index) => {
                                    const status = statusMap[shop.status] || { text: '未知', color: 'slate' as const };
                                    return (
                                        <tr
                                            key={shop.id}
                                            className={cn(
                                                "group border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                                                index === shops.length - 1 && "border-0"
                                            )}
                                        >
                                            <td className="px-6 py-5 font-bold text-slate-900">{shop.platform}</td>
                                            <td className="px-6 py-5 font-medium text-slate-700">{shop.shopName || '-'}</td>
                                            <td className="px-6 py-5 text-sm text-slate-500">{shop.accountName || '-'}</td>
                                            <td className="px-6 py-5 text-sm text-slate-500">{shop.contactName || '-'}</td>
                                            <td className="px-6 py-5">
                                                <Badge variant="soft" color={status.color} className="rounded-full px-2.5 font-bold">{status.text}</Badge>
                                                {shop.auditRemark && <div className="mt-1.5 text-xs font-medium text-danger-400">{shop.auditRemark}</div>}
                                            </td>
                                            <td className="px-6 py-5">
                                                <button onClick={() => router.push(`/merchant/shops/edit/${shop.id}`)} className="mr-3 text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">修改</button>
                                                <button onClick={() => handleDelete(shop.id)} className="text-sm font-bold text-danger-400 hover:text-danger-500 hover:underline">删除</button>
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
