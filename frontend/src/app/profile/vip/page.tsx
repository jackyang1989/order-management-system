'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { isAuthenticated } from '../../../services/authService';
import { fetchVipPackages, fetchVipStatus, fetchVipRecords, purchaseVip, fetchUserBalanceForVip, VipPackage, VipStatus, VipPurchase, PaymentMethod } from '../../../services/vipService';
import { VIP_TIPS } from '../../../constants/platformConfig';
import BottomNav from '../../../components/BottomNav';

const mockPackages: VipPackage[] = [
    { id: '1', name: '月度VIP', days: 30, price: 30, discountPrice: 19.9, description: '适合新手体验', benefits: ['专属任务优先领取', '佣金提升10%', '免费提现次数+2'] },
    { id: '2', name: '季度VIP', days: 90, price: 90, discountPrice: 49.9, description: '高性价比之选', benefits: ['专属任务优先领取', '佣金提升15%', '免费提现次数+5', '专属客服'] },
    { id: '3', name: '年度VIP', days: 365, price: 360, discountPrice: 168, description: '资深用户首选', benefits: ['专属任务优先领取', '佣金提升20%', '无限免费提现', '专属客服', '生日礼包'] }
];

const PAYMENT_METHODS = [
    { key: 'silver' as PaymentMethod, label: '银锭支付', icon: '💎', desc: '使用银锭余额支付' },
    { key: 'balance' as PaymentMethod, label: '本金支付', icon: '💰', desc: '使用本金余额支付' },
    { key: 'alipay' as PaymentMethod, label: '支付宝支付', icon: '📱', desc: '跳转支付宝扫码' }
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
        if (paymentMethod === 'silver' && userSilver < selectedPackage.discountPrice) { alert('银锭余额不足'); setShowConfirm(false); return; }
        if (paymentMethod === 'balance' && userBalance < selectedPackage.discountPrice) { alert('本金余额不足'); setShowConfirm(false); return; }
        setProcessing(true);
        try {
            const result = await purchaseVip(selectedPackage.id, paymentMethod);
            if (result.success) {
                if (result.data && 'payUrl' in result.data) { alert('正在跳转支付宝...'); }
                else { alert(result.message); loadData(); setActiveTab('records'); }
            } else { alert(result.message); }
        } catch (error) { alert('支付失败'); }
        finally { setProcessing(false); setShowConfirm(false); }
    };

    const getCurrentBalance = () => { if (paymentMethod === 'silver') return userSilver; if (paymentMethod === 'balance') return userBalance; return Infinity; };
    const isBalanceSufficient = () => selectedPackage ? Number(getCurrentBalance()) >= selectedPackage.discountPrice : false;

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">VIP会员中心</h1>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {vipStatus.isVip ? `会员权益生效中 · 剩余${vipStatus.daysRemaining}天` : '开通特权 · 收益翻倍'}
                        </p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Balances */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-emerald-500 p-5 text-white shadow-lg shadow-emerald-100">
                        <div className="text-2xl font-black">{Number(userSilver || 0).toFixed(2)}</div>
                        <div className="mt-1 text-[10px] font-bold uppercase opacity-80">银锭余额</div>
                    </div>
                    <div className="rounded-[24px] bg-blue-600 p-5 text-white shadow-lg shadow-blue-100">
                        <div className="text-2xl font-black">¥{Number(userBalance || 0).toFixed(2)}</div>
                        <div className="mt-1 text-[10px] font-bold uppercase opacity-80">本金余额</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex rounded-[20px] bg-slate-100 p-1.5">
                    {[{ key: 'recharge', label: '开通VIP' }, { key: 'records', label: '购买记录' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'recharge' | 'records')}
                            className={cn('flex-1 rounded-[16px] py-2.5 text-center text-xs font-bold transition-all',
                                activeTab === tab.key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'recharge' ? (
                    <div className="space-y-6">
                        {/* Packages Card */}
                        <Card className="rounded-[28px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">选择会员套餐</div>
                            <div className="space-y-4">
                                {packages.map(pkg => (
                                    <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                                        className={cn('relative cursor-pointer rounded-[24px] border-2 p-5 transition-all active:scale-[0.98]',
                                            selectedPackage?.id === pkg.id ? 'border-blue-600 bg-blue-50/50' : 'border-slate-50 bg-slate-50/50')}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-base font-black text-slate-900">{pkg.name}</div>
                                                <div className="mt-0.5 text-[10px] font-bold text-slate-400">{pkg.description}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-blue-600">{pkg.discountPrice}</div>
                                                <div className="text-[10px] font-bold text-slate-300 line-through">¥{pkg.price}</div>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {pkg.benefits?.slice(0, 3).map((b, i) => (
                                                <span key={i} className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-bold text-slate-500 shadow-sm">{b}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Payment Card */}
                        <Card className="rounded-[28px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                            <div className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">选择支付方式</div>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map(method => (
                                    <div key={method.key} onClick={() => setPaymentMethod(method.key)}
                                        className={cn('flex cursor-pointer items-center gap-4 rounded-[20px] border-2 p-4 transition-all',
                                            paymentMethod === method.key ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 hover:border-slate-100')}>
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow-sm">{method.icon}</div>
                                        <div className="flex-1">
                                            <div className="text-sm font-black text-slate-900">{method.label}</div>
                                            <div className="text-[10px] font-bold text-slate-400">{method.desc}</div>
                                        </div>
                                        <div className={cn('h-5 w-5 rounded-full border-[3px] transition-all', paymentMethod === method.key ? 'border-blue-600 bg-blue-600 ring-2 ring-blue-50' : 'border-slate-200')} />
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Action Button */}
                        <button onClick={() => setShowConfirm(true)} disabled={!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')}
                            className={cn('w-full rounded-[24px] py-4 text-center text-base font-black text-white shadow-xl transition-all active:scale-95',
                                (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')) ? 'bg-slate-200 shadow-none' : 'bg-blue-600 shadow-blue-100')}>
                            {paymentMethod !== 'alipay' && !isBalanceSufficient() ? '余额不足' : `立即开通 · ${selectedPackage?.discountPrice || 0}${paymentMethod === 'silver' ? '银锭' : '元'}`}
                        </button>

                        {/* Tips */}
                        <div className="rounded-[24px] bg-amber-50 p-6">
                            <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-900">
                                <span>⚠️</span> 温馨提示
                            </div>
                            <ul className="space-y-1.5 text-[10px] font-bold leading-relaxed text-amber-700/80">
                                {VIP_TIPS.map((tip, index) => <li key={index} className="flex gap-2"><span>•</span>{tip}</li>)}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-3xl shadow-inner">📋</div>
                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">暂无购买记录</div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {records.map(record => (
                                    <div key={record.id} className="rounded-[24px] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-black text-slate-900">{record.packageName}</span>
                                            <Badge className={cn('rounded-full px-3 py-1 text-[9px] font-bold shadow-none',
                                                record.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600')}>
                                                {record.status === 'paid' ? '已支付' : '待支付'}
                                            </Badge>
                                        </div>
                                        <div className="mt-4 flex items-end justify-between">
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-bold text-slate-300">{new Date(record.paidAt || record.createdAt).toLocaleString()}</div>
                                                <div className="text-[10px] font-bold text-slate-400">有效期至: {new Date(record.vipEndAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-lg font-black text-blue-600">{record.paymentMethod === 'silver' ? `${record.amount}银锭` : `¥${record.amount}`}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Flat Confirm Modal */}
            {showConfirm && selectedPackage && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300 sm:items-center">
                    <div className="w-full max-w-[515px] animate-in fade-in slide-in-from-bottom-10 rounded-t-[32px] bg-white p-8 shadow-2xl sm:rounded-[32px]">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl shadow-inner">💳</div>
                            <h3 className="text-xl font-black text-slate-900">确认支付</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">请核对您的订单信息</p>
                        </div>
                        <div className="mb-8 space-y-4 rounded-[24px] bg-slate-50 p-6">
                            <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">充值套餐</span><span className="text-xs font-black text-slate-900">{selectedPackage.name}</span></div>
                            <div className="flex justify-between"><span className="text-xs font-bold text-slate-400">支付方式</span><span className="text-xs font-black text-blue-600">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span></div>
                            <div className="mt-4 h-px bg-slate-100" />
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs font-bold text-slate-400">实付金额</span>
                                <span className="text-2xl font-black text-blue-600">{paymentMethod === 'silver' ? `${selectedPackage.discountPrice}银锭` : `¥${selectedPackage.discountPrice}`}</span>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowConfirm(false)} disabled={processing} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-400 transition active:scale-95">再想想</button>
                            <button onClick={handlePayment} disabled={processing} className={cn('flex-1 rounded-[20px] py-4 text-sm font-bold text-white shadow-lg transition active:scale-95',
                                processing ? 'bg-slate-200 shadow-none' : 'bg-blue-600 shadow-blue-100')}>
                                {processing ? '处理中...' : '立即确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

export default function VipPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>}>
            <VipContent />
        </Suspense>
    );
}
