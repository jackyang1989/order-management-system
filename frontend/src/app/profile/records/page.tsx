'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchFundRecords, fetchWithdrawals, FundRecord, Withdrawal } from '../../../services/userService';

function RecordsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'balance' | 'silver' | 'withdraw' | null;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'balance' | 'silver' | 'withdraw'>(initialTab || 'balance');
    const [fundRecords, setFundRecords] = useState<FundRecord[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'withdraw') { const result = await fetchWithdrawals(); setWithdrawals(result); }
            else { const result = await fetchFundRecords({ type: activeTab === 'balance' ? 'principal' : 'silver' }); setFundRecords(result.list); }
        } catch (error) { console.error('Load records error:', error); }
        finally { setLoading(false); }
    };

    const getStatusText = (status: number) => {
        const configs: Record<number, { text: string; bg: string; textCol: string }> = {
            0: { text: '审核中', bg: 'bg-amber-50', textCol: 'text-amber-600' },
            1: { text: '已通过', bg: 'bg-emerald-50', textCol: 'text-emerald-600' },
            2: { text: '已拒绝', bg: 'bg-rose-50', textCol: 'text-rose-600' },
            3: { text: '已完成', bg: 'bg-slate-50', textCol: 'text-slate-500' }
        };
        return configs[status] || { text: '未知', bg: 'bg-slate-50', textCol: 'text-slate-500' };
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">资金记录</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4">
                {/* Tabs */}
                <div className="sticky top-20 z-10 flex w-full gap-2 rounded-[20px] bg-slate-100/50 backdrop-blur-sm p-1.5">
                    {[
                        { key: 'balance', label: '本金' },
                        { key: 'silver', label: '银锭' },
                        { key: 'withdraw', label: '提现' }
                    ].map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-[16px] py-3 text-center text-xs font-black uppercase tracking-wider transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex py-20 items-center justify-center">
                            <Spinner size="lg" className="text-blue-600" />
                        </div>
                    ) : activeTab === 'withdraw' ? (
                        withdrawals.length === 0 ? (
                            <NoData message="暂无提现记录" />
                        ) : (
                            withdrawals.map(r => {
                                const status = getStatusText(r.status);
                                return (
                                    <div key={r.id} className="group relative rounded-[28px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="text-lg font-black text-slate-900 tracking-tight">¥{Number(r.amount).toFixed(2)}</div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                                    {new Date(r.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                            <div className={cn('rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest', status.bg, status.textCol)}>
                                                {status.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )
                    ) : (
                        fundRecords.length === 0 ? (
                            <NoData message="暂无资金变动记录" />
                        ) : (
                            fundRecords.map(r => (
                                <div key={r.id} className="group relative rounded-[28px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className={cn('flex h-10 w-10 min-w-[40px] items-center justify-center rounded-full text-lg',
                                                    r.action === 'in' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
                                                    {r.action === 'in' ? '↓' : '↑'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 leading-tight">{r.description}</div>
                                                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                                        {new Date(r.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn('text-lg font-black tracking-tight', r.action === 'in' ? 'text-emerald-500' : 'text-rose-500')}>
                                                {r.action === 'in' ? '+' : '-'}{r.amount.toFixed(2)}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-300">余额: {r.balance.toFixed(2)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function NoData({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-3xl shadow-inner opacity-50">📋</div>
            <div>
                <h3 className="text-sm font-black text-slate-900">{message}</h3>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">如有疑问请联系客服</p>
            </div>
        </div>
    );
}

export default function FundRecordsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
