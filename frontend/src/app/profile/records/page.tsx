'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchFundRecords, FundRecord } from '../../../services/userService';

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    RECHARGE: { label: '充值', icon: '💰', color: 'text-emerald-500' },
    WITHDRAW: { label: '提现', icon: '💸', color: 'text-rose-500' },
    COMMISSION: { label: '分佣', icon: '🎁', color: 'text-blue-500' },
    TASK_REWARD: { label: '任务奖励', icon: '⭐', color: 'text-amber-500' },
    REFUND: { label: '退款', icon: '🔄', color: 'text-slate-400' },
};

export default function FundRecordsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<FundRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'ALL' | 'CASH' | 'SILVER'>('ALL');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadRecords();
    }, [router]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const data = await fetchFundRecords();
            setRecords(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const filteredRecords = records.filter(r => {
        if (activeTab === 'ALL') return true;
        return r.currency === activeTab;
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">资金记录</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Tabs */}
                <div className="flex w-full gap-2 rounded-[24px] bg-slate-100/50 p-1.5 ring-1 ring-slate-200/50">
                    {[
                        { key: 'ALL', label: '全部' },
                        { key: 'CASH', label: '本金' },
                        { key: 'SILVER', label: '银锭' }
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-[20px] py-3 text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Records List */}
                <div className="space-y-4">
                    {filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="text-4xl opacity-10 mb-4 italic">📜</div>
                            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">暂无资金往来记录</h3>
                        </div>
                    ) : (
                        filteredRecords.map((record, i) => {
                            const config = TYPE_CONFIG[record.type] || { label: '其他', icon: '📝', color: 'text-slate-400' };
                            const isPositive = record.amount > 0;
                            const isSilver = record.currency === 'SILVER';

                            return (
                                <Card key={i} className="rounded-[28px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 transition-all hover:bg-slate-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-5">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-slate-50 text-xl shadow-inner">
                                                {config.icon}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm font-black text-slate-900 tracking-tight">{record.remark || config.label}</div>
                                                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                                    {new Date(record.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <div className={cn('text-base font-black tracking-tight', isPositive ? 'text-emerald-500' : 'text-rose-500')}>
                                                {isPositive ? '+' : ''}{record.amount}
                                                <span className="ml-1 text-[10px] font-bold uppercase">{isSilver ? '银' : '元'}</span>
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                                余额: {record.balanceAfter}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
