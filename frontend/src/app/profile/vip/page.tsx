'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
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
        return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">VIP会员中心</h1>
                        <p className="mt-0.5 text-xs text-slate-500 font-medium">{vipStatus.isVip ? `VIP会员 · 剩余${vipStatus.daysRemaining}天` : '开通VIP享受更多权益'}</p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 pt-4">
                {/* Balance Card */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-warning-500">{Number(userSilver || 0).toFixed(2)}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">银锭余额</div>
                    </div>
                    <div className="rounded-[24px] bg-white p-5 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="text-2xl font-black text-slate-900">¥{Number(userBalance || 0).toFixed(2)}</div>
                        <div className="mt-1 text-xs font-bold text-slate-400">本金余额</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="rounded-[20px] bg-white p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex">
                    {[{ key: 'recharge', label: '开通VIP' }, { key: 'records', label: '充值记录' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'recharge' | 'records')}
                            className={cn('flex-1 rounded-[16px] py-2.5 text-center text-sm font-bold transition-all', activeTab === tab.key ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20' : 'text-slate-500 hover:text-slate-700')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {activeTab === 'recharge' ? (
                        <div className="space-y-8">
                            {/* Packages */}
                            <div>
                                <div className="mb-4 text-sm font-bold text-slate-900">选择套餐</div>
                                <div className="grid gap-4">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                                            className={cn('relative cursor-pointer overflow-hidden rounded-[20px] border-2 p-5 transition-all',
                                                selectedPackage?.id === pkg.id ? 'border-primary-600 bg-primary-50/50 ring-4 ring-primary-100/50' : 'border-slate-100 bg-white hover:border-slate-200')}>
                                            {selectedPackage?.id === pkg.id && <div className="absolute top-0 right-0 rounded-bl-xl bg-primary-600 px-3 py-1 text-[10px] font-bold text-white">已选</div>}
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-black text-slate-900">{pkg.name}</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-primary-600">{pkg.discountPrice}</span>
                                                    <span className="text-xs text-slate-400 line-through decoration-slate-400/50">¥{pkg.price}</span>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-xs font-medium text-slate-500">{pkg.description}</div>
                                            <div className="mt-3 flex flex-wrap gap-2">{pkg.benefits?.map((b, i) => <span key={i} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">{b}</span>)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Payment Methods */}
                            <div>
                                <div className="mb-4 text-sm font-bold text-slate-900">支付方式</div>
                                <div className="space-y-3">
                                    {PAYMENT_METHODS.map(method => (
                                        <div key={method.key} onClick={() => setPaymentMethod(method.key)}
                                            className={cn('flex cursor-pointer items-center gap-4 rounded-[20px] border-2 p-4 transition-all',
                                                paymentMethod === method.key ? 'border-primary-600 bg-primary-50/50' : 'border-slate-100 bg-white')}>
                                            <span className="text-2xl">{method.icon}</span>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-900">{method.label}</div>
                                                <div className="mt-0.5 text-xs text-slate-400 font-medium">{method.desc}</div>
                                            </div>
                                            {method.key !== 'alipay' && <span className={cn('text-sm font-bold', method.key === 'silver' ? 'text-warning-500' : 'text-slate-700')}>{method.key === 'silver' ? Number(userSilver || 0).toFixed(2) : `¥${Number(userBalance || 0).toFixed(2)}`}</span>}
                                            <div className={cn('h-5 w-5 rounded-full border-[3px] transition-all', paymentMethod === method.key ? 'border-primary-600 bg-primary-600' : 'border-slate-200')} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Submit Button */}
                            <button onClick={() => setShowConfirm(true)} disabled={!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')}
                                className={cn('w-full rounded-xl py-4 text-center text-base font-bold text-white transition-all shadow-lg active:scale-[0.98]',
                                    (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')) ? 'cursor-not-allowed bg-slate-300 shadow-none' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30')}>
                                {paymentMethod !== 'alipay' && !isBalanceSufficient() ? '余额不足' : `立即开通 · ${selectedPackage?.discountPrice || 0}${paymentMethod === 'silver' ? '银锭' : '元'}`}
                            </button>
                            {/* Tips */}
                            <div className="rounded-[20px] bg-amber-50 p-5">
                                <div className="mb-2 flex items-center gap-2 text-xs font-black text-amber-700">
                                    <span>⚠️</span>
                                    <span>温馨提示</span>
                                </div>
                                <ul className="pl-1 space-y-1.5">
                                    {VIP_TIPS.map((tip, index) => (
                                        <li key={index} className="flex gap-2 text-xs font-medium text-amber-900/70">
                                            <span className="mt-1.5 block h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />
                                            <span className="flex-1 leading-relaxed">{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {records.length === 0 ? (
                                <div className="py-20 text-center">
                                    <div className="mb-4 text-5xl opacity-50">📋</div>
                                    <div className="text-sm font-bold text-slate-300">暂无充值记录</div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {records.map(record => (
                                        <div key={record.id} className="relative overflow-hidden rounded-[20px] bg-slate-50 p-5 transition-all hover:bg-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-bold text-slate-900">{record.packageName}</span>
                                                <span className={cn('rounded-lg px-2.5 py-1 text-xs font-bold', record.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600')}>{record.status === 'paid' ? '已支付' : '待支付'}</span>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs font-medium text-slate-400">
                                                <span>{new Date(record.paidAt || record.createdAt).toLocaleString()}</span>
                                                <span className="text-base font-bold text-primary-600">{record.paymentMethod === 'silver' ? `${record.amount}银锭` : `¥${record.amount}`}</span>
                                            </div>
                                            <div className="mt-2 text-xs font-medium text-slate-400">有效期: {new Date(record.vipStartAt).toLocaleDateString()} ~ {new Date(record.vipEndAt).toLocaleDateString()}</div>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="mb-6 text-center text-xl font-black text-slate-900">确认支付</div>
                        <div className="mb-6 space-y-3 rounded-[24px] bg-slate-50 p-5">
                            <div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-400">套餐名称</span><span className="font-bold text-slate-900">{selectedPackage.name}</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-400">有效期</span><span className="font-bold text-slate-900">{selectedPackage.days}天</span></div>
                            <div className="flex justify-between items-center text-sm"><span className="font-bold text-slate-400">支付方式</span><span className="font-bold text-primary-600">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span></div>
                            <div className="mt-3 border-t border-slate-200/50 pt-3 flex justify-between items-center"><span className="font-bold text-slate-400">支付金额</span><span className="text-xl font-black text-primary-600">{paymentMethod === 'silver' ? `${selectedPackage.discountPrice}银锭` : `¥${selectedPackage.discountPrice}`}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} disabled={processing} className="flex-1 rounded-xl bg-slate-100 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">取消</button>
                            <button onClick={handlePayment} disabled={processing} className={cn('flex-1 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-700 active:scale-95', processing ? 'bg-slate-300 shadow-none' : 'bg-primary-600')}>{processing ? 'Processing...' : '确认支付'}</button>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>}>
            <VipContent />
        </Suspense>
    );
}
