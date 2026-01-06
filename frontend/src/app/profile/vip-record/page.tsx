'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { isAuthenticated } from '../../../services/authService';
import { fetchVipRecords, VipPurchase } from '../../../services/vipService';

export default function VipRecordsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<VipPurchase[]>([]);

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadRecords(); }, []);

    const loadRecords = async () => {
        setLoading(true);
        try { const result = await fetchVipRecords(); setRecords(result.list); }
        catch (error) { console.error('Load VIP records error:', error); }
        finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">VIP开通记录</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {loading ? (
                    <div className="py-12 text-center text-slate-400">加载中...</div>
                ) : records.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400 shadow-sm">
                        <div className="mb-3 text-4xl">💎</div>
                        <p className="text-sm">暂无VIP开通记录</p>
                        <Button className="mt-4 bg-blue-500" onClick={() => router.push('/vip')}>去开通会员</Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map(record => (
                            <Card key={record.id} className="border-slate-200 p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-xl">🎖️</div>
                                        <div>
                                            <div className="font-bold text-slate-800">{record.packageName}</div>
                                            <div className="text-[10px] text-slate-400">支付方式: {record.paymentMethod === 'silver' ? '银锭' : '本金'}</div>
                                        </div>
                                    </div>
                                    <Badge variant="soft" color={record.status === 'paid' ? 'green' : 'amber'}>
                                        {record.status === 'paid' ? '已支付' : '待支付'}
                                    </Badge>
                                </div>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                                    <div className="text-sm font-bold text-blue-500">{record.paymentMethod === 'silver' ? `${record.amount} 银锭` : `¥${record.amount}`}</div>
                                    <div className="text-[10px] text-slate-400">{new Date(record.paidAt || record.createdAt).toLocaleString()}</div>
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400">有效期: {new Date(record.vipStartAt).toLocaleDateString()} ~ {new Date(record.vipEndAt).toLocaleDateString()}</div>
                            </Card>
                        ))}
                    </div>
                )}
            </ProfileContainer>
        </div>
    );
}
