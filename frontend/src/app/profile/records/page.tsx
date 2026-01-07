'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { isAuthenticated } from '../../../services/authService';
import { fetchFundRecords, fetchWithdrawals, FundRecord, Withdrawal } from '../../../services/userService';
import { Spinner } from '../../../components/ui/spinner';

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

    const getStatusBadge = (status: number) => {
        const configs: Record<number, { text: string; color: "amber" | "green" | "red" | "slate" }> = { 0: { text: '审核中', color: 'amber' }, 1: { text: '已通过', color: 'green' }, 2: { text: '已拒绝', color: 'red' }, 3: { text: '已完成', color: 'slate' } };
        const conf = configs[status] || { text: '未知', color: 'slate' };
        return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">资金记录</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Tabs */}
                <div className="mb-6 flex w-full gap-2 rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                    {[{ key: 'balance', label: '本金' }, { key: 'silver', label: '银锭' }, { key: 'withdraw', label: '提现' }].map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-full py-2.5 text-center text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="py-20 flex justify-center"><Spinner size="lg" className="text-blue-600" /></div>
                    ) : activeTab === 'withdraw' ? (
                        withdrawals.length === 0 ? (
                            <div className="rounded-[24px] bg-white p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                <div className="text-3xl mb-4">📭</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No records found</div>
                            </div>
                        ) : (
                            withdrawals.map(r => (
                                <Card key={r.id} className="flex items-center justify-between border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[24px]">
                                    <div className="space-y-1">
                                        <div className="text-sm font-black text-slate-900 tabular-nums">¥{Number(r.amount).toFixed(2)}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                    </div>
                                    {getStatusBadge(r.status)}
                                </Card>
                            ))
                        )
                    ) : (
                        fundRecords.length === 0 ? (
                            <div className="rounded-[24px] bg-white p-12 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                <div className="text-3xl mb-4">📭</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">No records found</div>
                            </div>
                        ) : (
                            fundRecords.map(r => (
                                <Card key={r.id} className="flex items-center justify-between border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] rounded-[24px]">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className={cn('text-sm font-black tabular-nums', r.action === 'in' ? 'text-emerald-500' : 'text-rose-500')}>
                                                {r.action === 'in' ? '+' : '-'}{r.amount.toFixed(2)}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">BAL: {r.balance.toFixed(2)}</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-600 tracking-tight leading-relaxed">{r.description}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                    </div>
                                </Card>
                            ))
                        )
                    )}
                </div>
            </ProfileContainer>
        </div>
    );
}

export default function FundRecordsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
