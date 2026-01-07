'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
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

    const getStatusBadge = (status: number) => {
        const configs: Record<number, { text: string; color: "amber" | "green" | "red" | "slate" }> = { 0: { text: '审核中', color: 'amber' }, 1: { text: '已通过', color: 'green' }, 2: { text: '已拒绝', color: 'red' }, 3: { text: '已完成', color: 'slate' } };
        const conf = configs[status] || { text: '未知', color: 'slate' };
        return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">资金记录</h1>
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Tabs */}
                <div className="mb-4 grid w-full grid-cols-3 gap-1 rounded-lg bg-slate-200 p-1">
                    {[{ key: 'balance', label: '本金记录' }, { key: 'silver', label: '银锭记录' }, { key: 'withdraw', label: '提现记录' }].map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as any)}
                            className={cn('w-full rounded-md py-2 text-center text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-white text-slate-800' : 'text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="py-12 text-center text-slate-400">加载中...</div>
                    ) : activeTab === 'withdraw' ? (
                        withdrawals.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">暂无提现记录</div>
                        ) : (
                            withdrawals.map(r => (
                                <Card key={r.id} className="flex items-center justify-between border-slate-200 p-4">
                                    <div>
                                        <div className="font-medium text-slate-800">¥{Number(r.amount).toFixed(2)}</div>
                                        <div className="mt-1 text-xs text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                    </div>
                                    {getStatusBadge(r.status)}
                                </Card>
                            ))
                        )
                    ) : (
                        fundRecords.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white py-12 text-center text-slate-400">暂无资金变动记录</div>
                        ) : (
                            fundRecords.map(r => (
                                <Card key={r.id} className="flex items-center justify-between border-slate-200 p-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('text-lg font-bold', r.action === 'in' ? 'text-green-500' : 'text-red-500')}>
                                                {r.action === 'in' ? '+' : '-'}{r.amount.toFixed(2)}
                                            </span>
                                            <span className="text-xs text-slate-400">余额: {r.balance.toFixed(2)}</span>
                                        </div>
                                        <div className="mt-1 text-sm text-slate-600">{r.description}</div>
                                        <div className="mt-1 text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
