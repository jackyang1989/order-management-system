'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { isAuthenticated, getToken } from '../../../services/authService';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface PrincipalRecord { id: string; type: string; money: number; balance: number; create_time: string; remark: string; }
interface SilverRecord { id: string; type: string; reward: number; balance: number; create_time: string; remark: string; }
interface WithdrawRecord { id: string; type: number; money: number; state: number; state_text: string; bank_name: string; bank_card: string; create_time: string; remark: string; }

function RecordsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialType = searchParams.get('type') || 'principal';

    const [activeTab, setActiveTab] = useState<'principal' | 'silver' | 'withdraw'>(initialType as 'principal' | 'silver' | 'withdraw');
    const [principalRecords, setPrincipalRecords] = useState<PrincipalRecord[]>([]);
    const [silverRecords, setSilverRecords] = useState<SilverRecord[]>([]);
    const [withdrawRecords, setWithdrawRecords] = useState<WithdrawRecord[]>([]);
    const [principalPage, setPrincipalPage] = useState(1);
    const [silverPage, setSilverPage] = useState(1);
    const [withdrawPage, setWithdrawPage] = useState(1);
    const [principalTotal, setPrincipalTotal] = useState(0);
    const [silverTotal, setSilverTotal] = useState(0);
    const [withdrawTotal, setWithdrawTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ principal: 0, silver: 0 });

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
    }, [activeTab]);

    const loadBalance = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/index`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.code === 1) { setBalance({ principal: data.data?.balance || 0, silver: data.data?.reward || 0 }); }
        } catch (error) { console.error('Load balance error:', error); }
    };

    const loadData = async () => {
        setLoading(true);
        await loadBalance();
        if (activeTab === 'principal') await loadPrincipalRecords();
        else if (activeTab === 'silver') await loadSilverRecords();
        else if (activeTab === 'withdraw') await loadWithdrawRecords();
        setLoading(false);
    };

    const loadPrincipalRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/benjinlist`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ page: principalPage })
            });
            const data = await res.json();
            if (data.code === 1) { setPrincipalRecords(data.data?.list || []); setPrincipalTotal(data.data?.total || 0); }
        } catch (error) { console.error('Load principal records error:', error); }
    };

    const loadSilverRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/yindinglist?page=${silverPage}`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.code === 1) { setSilverRecords(data.data?.list || []); setSilverTotal(data.data?.total || 0); }
        } catch (error) { console.error('Load silver records error:', error); }
    };

    const loadWithdrawRecords = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/money/tixianlist`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ page: withdrawPage })
            });
            const data = await res.json();
            if (data.code === 1) { setWithdrawRecords(data.data?.list || []); setWithdrawTotal(data.data?.total || 0); }
        } catch (error) { console.error('Load withdraw records error:', error); }
    };

    const getStateColor = (state: number) => {
        switch (state) {
            case 0: return 'text-amber-500 bg-amber-50';
            case 1: return 'text-green-500 bg-green-50';
            case 2: return 'text-red-500 bg-red-50';
            default: return 'text-slate-500 bg-slate-50';
        }
    };

    const tabs = [
        { key: 'principal', label: '本金记录' },
        { key: 'silver', label: '银锭记录' },
        { key: 'withdraw', label: '提现记录' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">资金记录</h1>
            </header>

            {/* Balance Card */}
            <ProfileContainer className="py-4">
                <div className="mb-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-slate-800">¥{balance.principal}</div>
                        <div className="mt-1 text-xs text-slate-400">可用本金</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-amber-500">{balance.silver}</div>
                        <div className="mt-1 text-xs text-slate-400">可用银锭</div>
                    </div>
                </div>
            </ProfileContainer>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as 'principal' | 'silver' | 'withdraw')}
                        className={cn(
                            'flex-1 py-3 text-center text-sm font-medium',
                            activeTab === tab.key ? 'border-b-2 border-blue-500 text-blue-500' : 'text-slate-500'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Records */}
            <ProfileContainer className="py-4">
                {loading ? (
                    <div className="rounded-xl bg-white py-12 text-center text-slate-400">加载中...</div>
                ) : (
                    <>
                        {/* Principal Records */}
                        {activeTab === 'principal' && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                {principalRecords.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="mb-3 text-4xl">💰</div>
                                        <div className="text-sm text-slate-400">暂无本金记录</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {principalRecords.map(record => (
                                            <div key={record.id} className="p-4">
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="font-medium text-slate-700">{record.type}</span>
                                                    <span className={cn('font-bold', record.money >= 0 ? 'text-green-500' : 'text-red-500')}>
                                                        {record.money >= 0 ? '+' : ''}{record.money}元
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400">
                                                    <span>{record.create_time}</span>
                                                    <span>余额: ¥{record.balance}</span>
                                                </div>
                                                {record.remark && <div className="mt-1.5 text-xs text-slate-400">备注: {record.remark}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {principalTotal > 10 && <div className="py-3 text-center text-xs text-slate-400">共 {principalTotal} 条记录</div>}
                            </div>
                        )}

                        {/* Silver Records */}
                        {activeTab === 'silver' && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                {silverRecords.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="mb-3 text-4xl">🥇</div>
                                        <div className="text-sm text-slate-400">暂无银锭记录</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {silverRecords.map(record => (
                                            <div key={record.id} className="p-4">
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="font-medium text-slate-700">{record.type}</span>
                                                    <span className={cn('font-bold', record.reward >= 0 ? 'text-amber-500' : 'text-red-500')}>
                                                        {record.reward >= 0 ? '+' : ''}{record.reward}银锭
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-slate-400">
                                                    <span>{record.create_time}</span>
                                                    <span>余额: {record.balance}银锭</span>
                                                </div>
                                                {record.remark && <div className="mt-1.5 text-xs text-slate-400">备注: {record.remark}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {silverTotal > 10 && <div className="py-3 text-center text-xs text-slate-400">共 {silverTotal} 条记录</div>}
                            </div>
                        )}

                        {/* Withdraw Records */}
                        {activeTab === 'withdraw' && (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                {withdrawRecords.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <div className="mb-3 text-4xl">💳</div>
                                        <div className="text-sm text-slate-400">暂无提现记录</div>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {withdrawRecords.map(record => (
                                            <div key={record.id} className="p-4">
                                                <div className="mb-1.5 flex items-center justify-between">
                                                    <span className="font-medium text-slate-700">{record.type === 1 ? '本金提现' : '银锭提现'}</span>
                                                    <span className={cn('rounded px-2 py-0.5 text-xs font-medium', getStateColor(record.state))}>
                                                        {record.state_text}
                                                    </span>
                                                </div>
                                                <div className="mb-1.5 text-lg font-bold text-red-500">-¥{record.money}</div>
                                                <div className="text-xs text-slate-400">提现至: {record.bank_name} {record.bank_card}</div>
                                                <div className="mt-0.5 text-xs text-slate-400">{record.create_time}</div>
                                                {record.remark && <div className="mt-1.5 text-xs text-slate-400">备注: {record.remark}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {withdrawTotal > 10 && <div className="py-3 text-center text-xs text-slate-400">共 {withdrawTotal} 条记录</div>}
                            </div>
                        )}
                    </>
                )}

                {/* Tips */}
                <div className="mt-4 rounded-xl bg-slate-100 p-4 text-xs text-slate-500 leading-relaxed">
                    <div className="mb-1 font-medium">说明：</div>
                    {activeTab === 'principal' && <>
                        <div>• 本金为订单垫付后返还的金额</div>
                        <div>• 本金可随时申请提现至绑定银行卡</div>
                        <div>• 提现到账时间为1-3个工作日</div>
                    </>}
                    {activeTab === 'silver' && <>
                        <div>• 银锭是平台的虚拟货币，1银锭=1元</div>
                        <div>• 银锭可通过完成任务、邀请好友获得</div>
                        <div>• 银锭提现将收取5%手续费</div>
                    </>}
                    {activeTab === 'withdraw' && <>
                        <div>• 提现申请将在1-3个工作日内审核处理</div>
                        <div>• 请确保银行卡信息正确，以免提现失败</div>
                        <div>• 如有疑问请联系客服</div>
                    </>}
                </div>
            </ProfileContainer>
        </div>
    );
}

export default function RecordsPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
            <RecordsContent />
        </Suspense>
    );
}
