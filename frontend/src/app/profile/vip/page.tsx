'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { isAuthenticated } from '../../../services/authService';
import { fetchVipPackages, fetchVipStatus, fetchVipRecords, purchaseVip, fetchUserBalanceForVip, VipPackage, VipStatus, VipPurchase, PaymentMethod } from '../../../services/vipService';
import { VIP_TIPS } from '../../../constants/platformConfig';
import BottomNav from '../../../components/BottomNav';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Spinner } from '../../../components/ui/spinner';

const mockPackages: VipPackage[] = [
    { id: '1', name: '月度VIP', days: 30, price: 30, discountPrice: 19.9, description: '适合新手体验', benefits: ['专属任务优先领取', '佣金提升10%', '免费提现次数+2'] },
    { id: '2', name: '季度VIP', days: 90, price: 90, discountPrice: 49.9, description: '高性价比之选', benefits: ['专属任务优先领取', '佣金提升15%', '免费提现次数+5', '专属客服'] },
    { id: '3', name: '年度VIP', days: 365, price: 360, discountPrice: 168, description: '资深用户首选', benefits: ['专属任务优先领取', '佣金提升20%', '无限免费提现', '专属客服', '生日礼包'] }
];

const PAYMENT_METHODS = [
    { key: 'silver' as PaymentMethod, label: '银锭支付', icon: '💎', desc: '使用银锭余额支付' },
    { key: 'balance' as PaymentMethod, label: '本金支付', icon: '💰', desc: '使用本金余额支付' },
    { key: 'alipay' as PaymentMethod, label: '支付宝支付', icon: '📱', desc: '跳转支付宝扫码支付' }
];

function VipContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') as 'recharge' | 'records' | null;

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'recharge' | 'records'>(initialTab || 'recharge');
    const [packages, setPackages] = useState<VipPackage[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<VipPackage | null>(null);
    const [vipStatus, setVipStatus] = useState<VipStatus>({ isVip: false, expireAt: null, daysRemaining: 0 });
    const [records, setRecords] = useState<VipPurchase[]>([]);
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [userBalance, setUserBalance] = useState(0);
    const [userSilver, setUserSilver] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('silver');

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadData(); }, [router]);
    useEffect(() => { if (activeTab === 'records') loadRecords(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pkgs, status, balanceData] = await Promise.all([fetchVipPackages(), fetchVipStatus(), fetchUserBalanceForVip()]);
            if (pkgs.length > 0) { setPackages(pkgs); setSelectedPackage(pkgs[0]); }
            else { setPackages(mockPackages); setSelectedPackage(mockPackages[0]); }
            setVipStatus(status);
            setUserBalance(balanceData.balance);
            setUserSilver(balanceData.silver);
        } catch (error) { console.error('Load data error:', error); setPackages(mockPackages); setSelectedPackage(mockPackages[0]); }
        finally { setLoading(false); }
    };

    const loadRecords = async () => { try { const result = await fetchVipRecords(); setRecords(result.list); } catch (error) { console.error('Load records error:', error); } };

    const handlePayment = async () => {
        if (!selectedPackage) return;
        if (paymentMethod === 'silver' && userSilver < selectedPackage.discountPrice) { alert('银锭余额不足，请选择其他支付方式'); setShowConfirm(false); return; }
        if (paymentMethod === 'balance' && userBalance < selectedPackage.discountPrice) { alert('本金余额不足，请选择其他支付方式'); setShowConfirm(false); return; }
        setProcessing(true);
        try {
            const result = await purchaseVip(selectedPackage.id, paymentMethod);
            if (result.success) {
                if (result.data && 'payUrl' in result.data) { alert('正在跳转到支付宝支付页面...'); }
                else { alert(result.message); loadData(); setActiveTab('records'); }
            } else { alert(result.message); }
        } catch (error) { alert('支付失败，请稍后重试'); }
        finally { setProcessing(false); setShowConfirm(false); }
    };

    const getCurrentBalance = () => { if (paymentMethod === 'silver') return userSilver; if (paymentMethod === 'balance') return userBalance; return Infinity; };
    const isBalanceSufficient = () => selectedPackage ? Number(getCurrentBalance()) >= selectedPackage.discountPrice : false;

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">VIP会员中心</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vipStatus.isVip ? `VIP MEMBER • ${vipStatus.daysRemaining} DAYS LEFT` : 'UPGRADE TO VIP FOR PREMIUM BENEFITS'}</p>
                    </div>
                </div>
            </header>

            <div>
                {/* Balance Cards */}
                <div className="mx-6 mt-6 grid grid-cols-2 gap-4">
                    <Card className="rounded-[24px] border-none bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">银锭余额</div>
                        <div className="text-2xl font-black text-amber-500 tabular-nums">{Number(userSilver || 0).toFixed(2)}</div>
                    </Card>
                    <Card className="rounded-[24px] border-none bg-white p-6 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">本金余额</div>
                        <div className="text-2xl font-black text-slate-900 tabular-nums">¥{Number(userBalance || 0).toFixed(2)}</div>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="mx-6 mt-6 flex gap-2 rounded-full bg-slate-100 p-1.5 ring-1 ring-slate-200/50">
                    {[{ key: 'recharge', label: '开通VIP' }, { key: 'records', label: '充值记录' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'recharge' | 'records')}
                            className={cn('flex-1 rounded-full py-2.5 text-center text-[10px] font-black uppercase tracking-widest transition-all',
                                activeTab === tab.key ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/5' : 'text-slate-400 hover:text-slate-600')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="mx-6 mt-6">
                    {activeTab === 'recharge' ? (
                        <div className="space-y-8">
                            {/* Packages */}
                            <div className="space-y-4">
                                <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">选择套餐 / SELECT PACKAGE</label>
                                <div className="space-y-3">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} onClick={() => setSelectedPackage(pkg)} className="cursor-pointer active:scale-[0.98] transition-transform">
                                            <Card
                                                className={cn('relative rounded-[24px] border-2 p-6 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.02)]',
                                                    selectedPackage?.id === pkg.id ? 'border-blue-500 bg-blue-50/50' : 'border-white bg-white hover:bg-slate-50')}>
                                                {selectedPackage?.id === pkg.id && (
                                                    <div className="absolute right-6 top-6 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 shadow-lg">
                                                        <span className="text-white text-[10px]">✓</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">{pkg.name}</div>
                                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pkg.description}</div>
                                                    </div>
                                                    <div className="flex items-baseline gap-2">
                                                        <span className="text-2xl font-black text-slate-900 tabular-nums">{pkg.discountPrice}</span>
                                                        <span className="text-[10px] font-bold text-slate-300 line-through tabular-nums">¥{pkg.price}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {pkg.benefits?.map((b, i) => (
                                                        <span key={i} className="rounded-full bg-slate-900/5 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                                                            {b}
                                                        </span>
                                                    ))}
                                                </div>
                                            </Card>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="space-y-4">
                                <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">支付方式 / PAYMENT METHOD</label>
                                <div className="grid gap-3">
                                    {PAYMENT_METHODS.map(method => (
                                        <div key={method.key} onClick={() => setPaymentMethod(method.key)}
                                            className={cn('flex cursor-pointer items-center gap-4 rounded-[20px] border-2 p-4 transition-all',
                                                paymentMethod === method.key ? 'border-blue-500 bg-blue-50/50' : 'border-white bg-white hover:bg-slate-50')}>
                                            <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-slate-50 text-2xl shadow-inner">{method.icon}</div>
                                            <div className="flex-1">
                                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{method.label}</div>
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{method.desc}</div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {method.key !== 'alipay' && (
                                                    <span className={cn('text-[11px] font-black tabular-nums', method.key === 'silver' ? 'text-amber-500' : 'text-slate-900')}>
                                                        {method.key === 'silver' ? Number(userSilver || 0).toFixed(2) : `¥${Number(userBalance || 0).toFixed(2)}`}
                                                    </span>
                                                )}
                                                <div className={cn('h-5 w-5 rounded-full border-2 transition-all', paymentMethod === method.key ? 'border-blue-500 bg-blue-500 shadow-sm' : 'border-slate-200')} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button onClick={() => setShowConfirm(true)} disabled={!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')}
                                className={cn('w-full rounded-[20px] py-8 text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95',
                                    (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white')}>
                                {paymentMethod !== 'alipay' && !isBalanceSufficient() ? 'INSUFFICIENT BALANCE' : `ACTIVATE NOW • ${selectedPackage?.discountPrice || 0}${paymentMethod === 'silver' ? ' DIAMOND' : ' CNY'}`}
                            </Button>

                            {/* Tips */}
                            <div className="rounded-[24px] bg-amber-50/50 p-6 border border-amber-100/50">
                                <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-widest leading-none">
                                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                                    开通须知 • VIP TERMS
                                </div>
                                <ul className="space-y-2 text-[10px] font-bold text-amber-800/60 leading-relaxed uppercase tracking-wide">
                                    {VIP_TIPS.map((tip, index) => (
                                        <li key={index} className="flex gap-2">
                                            <span className="opacity-40 italic font-black">{String(index + 1).padStart(2, '0')}</span>
                                            {tip}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {records.length === 0 ? (
                                <div className="py-12 text-center"><div className="mb-3 text-4xl">📋</div><div className="text-sm text-slate-400">暂无充值记录</div></div>
                            ) : (
                                <div className="space-y-3">
                                    {records.map(record => (
                                        <div key={record.id} className="rounded-xl bg-slate-50 p-4">
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-slate-800">{record.packageName}</span>
                                                <span className={cn('rounded-full px-2 py-0.5 text-xs', record.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>{record.status === 'paid' ? '已支付' : '待支付'}</span>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                                                <span>{new Date(record.paidAt || record.createdAt).toLocaleString()}</span>
                                                <span className="font-medium text-blue-500">{record.paymentMethod === 'silver' ? `${record.amount}银锭` : `¥${record.amount}`}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400">有效期: {new Date(record.vipStartAt).toLocaleDateString()} ~ {new Date(record.vipEndAt).toLocaleDateString()}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirm && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <Card className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl border-none">
                        <div className="mb-8 text-center">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">支付确认</div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">CONFIRM PAYMENT</h2>
                        </div>
                        <div className="mb-8 space-y-4">
                            <div className="flex justify-between items-center rounded-2xl bg-slate-50 px-5 py-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PACKAGE</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{selectedPackage.name}</span>
                            </div>
                            <div className="flex justify-between items-center rounded-2xl bg-slate-50 px-5 py-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DURATION</span>
                                <span className="text-sm font-black text-slate-900">{selectedPackage.days} DAYS</span>
                            </div>
                            <div className="flex justify-between items-center rounded-2xl bg-slate-50 px-5 py-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">METHOD</span>
                                <span className="text-sm font-black text-blue-500 uppercase">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span>
                            </div>
                            <div className="mt-2 text-center pt-4">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">TOTAL AMOUNT</div>
                                <div className="text-4xl font-black text-slate-900 tabular-nums">
                                    {paymentMethod === 'silver' ? selectedPackage.discountPrice : `¥${selectedPackage.discountPrice}`}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirm(false)} disabled={processing} className="flex-1 rounded-[18px] bg-slate-50 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 active:scale-95 transition-all">CANCEL</button>
                            <button onClick={handlePayment} disabled={processing} className={cn('flex-1 rounded-[18px] py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg active:scale-95 transition-all', processing ? 'bg-slate-200 shadow-none cursor-not-allowed' : 'bg-slate-900 shadow-slate-900/20')}>{processing ? 'PROCESSING...' : 'CONFIRM'}</button>
                        </div>
                    </Card>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

export default function VipPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>}>
            <VipContent />
        </Suspense>
    );
}
