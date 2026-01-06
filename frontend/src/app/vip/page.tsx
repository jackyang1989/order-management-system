'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated } from '../../services/authService';
import { fetchVipPackages, fetchVipStatus, fetchVipRecords, purchaseVip, fetchUserBalanceForVip, VipPackage, VipStatus, VipPurchase, PaymentMethod } from '../../services/vipService';
import BottomNav from '../../components/BottomNav';

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
        return <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <div className="flex-1">
                        <h1 className="text-base font-medium text-slate-800">VIP会员中心</h1>
                        <p className="text-xs text-slate-400">{vipStatus.isVip ? `VIP会员 · 剩余${vipStatus.daysRemaining}天` : '开通VIP享受更多权益'}</p>
                    </div>
                </div>
            </header>

            <div>
                {/* Balance Card */}
                <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-amber-500">{Number(userSilver || 0).toFixed(2)}</div>
                        <div className="mt-1 text-xs text-slate-400">银锭余额</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
                        <div className="text-xl font-bold text-slate-800">¥{Number(userBalance || 0).toFixed(2)}</div>
                        <div className="mt-1 text-xs text-slate-400">本金余额</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mx-4 mt-4 flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
                    {[{ key: 'recharge', label: '开通VIP' }, { key: 'records', label: '充值记录' }].map(tab => (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key as 'recharge' | 'records')}
                            className={cn('flex-1 rounded-md py-2 text-center text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-blue-500 text-white' : 'text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="mx-4 mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    {activeTab === 'recharge' ? (
                        <div className="space-y-5">
                            {/* Packages */}
                            <div>
                                <div className="mb-3 text-sm font-medium text-slate-700">选择套餐</div>
                                <div className="space-y-3">
                                    {packages.map(pkg => (
                                        <div key={pkg.id} onClick={() => setSelectedPackage(pkg)}
                                            className={cn('relative cursor-pointer rounded-xl border-2 p-4 transition-colors',
                                                selectedPackage?.id === pkg.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50')}>
                                            {selectedPackage?.id === pkg.id && <div className="absolute -top-2 right-3 rounded bg-blue-500 px-2 py-0.5 text-[10px] text-white shadow-sm">已选</div>}
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium text-slate-800">{pkg.name}</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold text-blue-500">{pkg.discountPrice}</span>
                                                    <span className="text-xs text-slate-400 line-through">¥{pkg.price}</span>
                                                </div>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{pkg.description}</div>
                                            <div className="mt-2 flex flex-wrap gap-1">{pkg.benefits?.map((b, i) => <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{b}</span>)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Payment Methods */}
                            <div>
                                <div className="mb-3 text-sm font-medium text-slate-700">支付方式</div>
                                <div className="space-y-2">
                                    {PAYMENT_METHODS.map(method => (
                                        <div key={method.key} onClick={() => setPaymentMethod(method.key)}
                                            className={cn('flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 transition-colors',
                                                paymentMethod === method.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200')}>
                                            <span className="text-2xl">{method.icon}</span>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-slate-800">{method.label}</div>
                                                <div className="text-xs text-slate-400">{method.desc}</div>
                                            </div>
                                            {method.key !== 'alipay' && <span className={cn('text-sm font-medium', method.key === 'silver' ? 'text-amber-500' : 'text-slate-700')}>{method.key === 'silver' ? Number(userSilver || 0).toFixed(2) : `¥${Number(userBalance || 0).toFixed(2)}`}</span>}
                                            <div className={cn('h-5 w-5 rounded-full border-4', paymentMethod === method.key ? 'border-blue-500' : 'border-slate-300')} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Submit Button */}
                            <button onClick={() => setShowConfirm(true)} disabled={!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')}
                                className={cn('w-full rounded-xl py-3.5 text-center text-base font-medium text-white transition-colors',
                                    (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')) ? 'cursor-not-allowed bg-slate-300' : 'bg-blue-500')}>
                                {paymentMethod !== 'alipay' && !isBalanceSufficient() ? '余额不足' : `立即开通 · ${selectedPackage?.discountPrice || 0}${paymentMethod === 'silver' ? '银锭' : '元'}`}
                            </button>
                            {/* Tips */}
                            <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700 leading-relaxed">
                                <div className="mb-1 font-medium">温馨提示</div>
                                <ul className="list-disc pl-4 space-y-0.5">
                                    <li>VIP权益开通后立即生效</li>
                                    <li>已开通VIP续费时间将自动叠加</li>
                                    <li>虚拟商品一经开通不支持退款</li>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
                    <div className="w-full max-w-sm rounded-2xl bg-white p-5">
                        <div className="mb-4 text-center text-lg font-bold text-slate-800">确认支付</div>
                        <div className="mb-4 rounded-xl bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between py-1"><span className="text-slate-500">套餐名称</span><span className="font-medium text-slate-800">{selectedPackage.name}</span></div>
                            <div className="flex justify-between py-1"><span className="text-slate-500">有效期</span><span className="font-medium text-slate-800">{selectedPackage.days}天</span></div>
                            <div className="flex justify-between py-1"><span className="text-slate-500">支付方式</span><span className="font-medium text-blue-500">{PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}</span></div>
                            <div className="mt-2 border-t border-slate-200 pt-2 flex justify-between"><span className="text-slate-500">支付金额</span><span className="text-xl font-bold text-blue-500">{paymentMethod === 'silver' ? `${selectedPackage.discountPrice}银锭` : `¥${selectedPackage.discountPrice}`}</span></div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowConfirm(false)} disabled={processing} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-600">取消</button>
                            <button onClick={handlePayment} disabled={processing} className={cn('flex-1 rounded-xl py-3 text-sm font-medium text-white', processing ? 'bg-slate-300' : 'bg-blue-500')}>{processing ? '处理中...' : '确认支付'}</button>
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
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" /></div>}>
            <VipContent />
        </Suspense>
    );
}
