'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import ProfileContainer from '../../../components/ProfileContainer';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { isAuthenticated } from '../../../services/authService';
import { fetchFundRecords, fetchWithdrawals, exportFundRecordsToExcel, FundRecord, Withdrawal } from '../../../services/userService';
import { toastSuccess, toastError } from '../../../lib/toast';

function RecordsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'balance' | 'silver' | 'withdraw' | null;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'balance' | 'silver' | 'withdraw'>(initialTab || 'balance');
    const [fundRecords, setFundRecords] = useState<FundRecord[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        if (activeTab === 'withdraw') {
            toastError('提现记录暂不支持导出');
            return;
        }
        setExporting(true);
        try {
            await exportFundRecordsToExcel(activeTab === 'balance' ? 'principal' : 'silver');
            toastSuccess('导出成功');
        } catch (error: any) {
            toastError(error?.message || '导出失败');
        } finally {
            setExporting(false);
        }
    };

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
        <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-20 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">资金记录</h1>
                    {activeTab !== 'withdraw' && (
                        <button
                            onClick={handleExport}
                            disabled={exporting || loading}
                            className="text-sm font-bold text-primary-600 disabled:text-slate-400 bg-white px-3 py-1.5 rounded-full shadow-sm"
                        >
                            {exporting ? '导出中...' : '导出'}
                        </button>
                    )}
                </div>
            </header>

            <ProfileContainer className="py-4">
                {/* Tabs */}
                <div className="mb-6 flex gap-2 rounded-[20px] bg-white p-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {[{ key: 'balance', label: '本金' }, { key: 'silver', label: '银锭' }, { key: 'withdraw', label: '提现' }].map((tab) => (
                        <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key as any)}
                            className={cn('flex-1 rounded-[16px] py-3 text-sm font-bold transition-all', activeTab === tab.key ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'bg-transparent text-slate-500 hover:bg-slate-50')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* List Content */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="rounded-[24px] bg-white py-16 text-center text-slate-400">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                            <div className="mt-4 text-xs font-bold">加载Imp...</div>
                        </div>
                    ) : activeTab === 'withdraw' ? (
                        withdrawals.length === 0 ? (
                            <div className="rounded-[24px] bg-white py-20 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <div className="mb-4 text-5xl opacity-30 grayscale">💸</div>
                                <div className="text-sm font-bold text-slate-300">暂无提现记录</div>
                            </div>
                        ) : (
                            withdrawals.map(r => (
                                <div key={r.id} className="relative overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all active:scale-[0.99]">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xl font-black text-slate-900">¥{Number(r.amount).toFixed(2)}</div>
                                            <div className="mt-1 text-[10px] font-medium text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                        </div>
                                        <div className="scale-110">{getStatusBadge(r.status)}</div>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        fundRecords.length === 0 ? (
                            <div className="rounded-[24px] bg-white py-20 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                <div className="mb-4 text-5xl opacity-30 grayscale">📊</div>
                                <div className="text-sm font-bold text-slate-300">暂无资金变动记录</div>
                            </div>
                        ) : (
                            fundRecords.map(r => (
                                <div key={r.id} className="relative overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all active:scale-[0.99]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={cn('flex h-8 w-8 items-center justify-center rounded-full text-lg', r.action === 'in' ? 'bg-success-50 text-success-500' : 'bg-slate-100 text-slate-500')}>
                                                {r.action === 'in' ? '↗' : '↙'}
                                            </div>
                                            <span className="font-bold text-slate-700">{r.description}</span>
                                        </div>
                                        <div className="text-right">
                                            <div className={cn('text-lg font-black', r.action === 'in' ? 'text-success-500' : 'text-slate-900')}>
                                                {r.action === 'in' ? '+' : '-'}{r.amount.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                                        <div className="text-[10px] font-medium text-slate-400">{new Date(r.createdAt).toLocaleString('zh-CN')}</div>
                                        <div className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">余额: {r.balance.toFixed(2)}</div>
                                    </div>
                                </div>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
