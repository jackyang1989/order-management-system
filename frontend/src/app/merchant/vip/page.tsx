'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';

interface VipPackage { id: string; name: string; price: number; duration: number; originalPrice: number; description: string; benefits: string[]; }
interface VipInfo { isVip: boolean; expireAt: string | null; level: number; }

export default function MerchantVipPage() {
    const [packages, setPackages] = useState<VipPackage[]>([]);
    const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<VipPackage | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'balance' | 'alipay'>('balance');
    const [balance, setBalance] = useState(0);

    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [step, setStep] = useState<'confirm' | 'payment'>('confirm');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const [vipRes, pkgsRes, profileRes] = await Promise.all([
                fetch(`${BASE_URL}/merchant-vip/status`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${BASE_URL}/vip-packages?type=merchant`),
                fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const vipJson = await vipRes.json();
            const pkgsJson = await pkgsRes.json();
            const profileJson = await profileRes.json();

            if (vipJson.success) setVipInfo(vipJson.data);
            if (pkgsJson.success) setPackages(pkgsJson.data);
            if (profileJson.success) setBalance(Number(profileJson.data.balance) || 0);

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const openPaymentModal = (pkg: VipPackage) => {
        setSelectedPackage(pkg);
        setStep('confirm');
        setPaymentMethod('balance');
        setShowPaymentModal(true);
    };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');

        setPurchasing(true);
        try {
            if (paymentMethod === 'balance') {
                if (balance < selectedPackage.price) { alert('余额不足，请先充值或使用支付宝支付'); setPurchasing(false); return; }
                const res = await fetch(`${BASE_URL}/merchant-vip/purchase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ packageId: selectedPackage.id, paymentMethod: 'balance' })
                });
                const json = await res.json();
                if (json.success) { alert('开通成功！'); setShowPaymentModal(false); loadData(); }
                else alert(json.message || '开通失败');
            } else {
                const res = await fetch(`${BASE_URL}/merchant-vip/purchase`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ packageId: selectedPackage.id, paymentMethod: 'alipay' })
                });
                const json = await res.json();
                if (json.success) {
                    setOrderNumber(json.data.orderNumber);
                    setQrCodeUrl(json.payUrl || `/pay/alipay?orderNumber=${json.data.orderNumber}&amount=${selectedPackage.price}`);
                    setStep('payment');
                } else alert(json.message || '创建订单失败');
            }
        } catch { alert('网络错误'); }
        finally { if (addressStep !== 'payment') setPurchasing(false); }
    };

    // addressStep isn't defined, fixing logic
    const addressStep = step;

    const confirmPayment = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !orderNumber) return;
        setPurchasing(true);
        try {
            const res = await fetch(`${BASE_URL}/recharge/callback/alipay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber, tradeNo: `VIP_${Date.now()}`, success: true }) });
            const json = await res.json();
            if (json.success) { alert('支付成功！'); setShowPaymentModal(false); loadData(); }
            else alert(json.message || '支付确认失败');
        } catch { alert('网络错误'); }
        finally { setPurchasing(false); }
    };

    return (
        <div className="space-y-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-white shadow-lg shadow-indigo-500/20">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <h1 className="mb-2 text-3xl font-black tracking-tight">VIP 会员服务</h1>
                        <p className="text-indigo-100 font-medium">开通会员，享受更多专属权益，提升任务发布效率</p>
                    </div>
                    <div className="flex items-center gap-4 rounded-[20px] bg-white/10 px-6 py-4 backdrop-blur-md border border-white/10">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-2xl shadow-lg ring-4 ring-amber-400/30">👑</div>
                        <div>
                            <div className="text-xs font-bold uppercase text-indigo-200">当前状态</div>
                            <div className="text-lg font-bold">{vipInfo?.isVip ? `VIP 会员 (有效期至 ${new Date(vipInfo.expireAt!).toLocaleDateString()})` : '普通商户'}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {packages.map((pkg, index) => (
                    <Card
                        key={pkg.id}
                        className={cn(
                            "relative flex flex-col overflow-hidden rounded-[32px] border-0 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl",
                            index === 1 && "ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10"
                        )}
                    >
                        {index === 1 && (
                            <div className="absolute right-0 top-0 rounded-bl-[20px] bg-gradient-to-br from-indigo-500 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm">
                                此处最热
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-slate-900">¥{pkg.price}</span>
                                {pkg.originalPrice > pkg.price && (
                                    <span className="text-sm font-medium text-slate-400 line-through">¥{pkg.originalPrice}</span>
                                )}
                            </div>
                            <p className="mt-2 text-sm font-medium text-slate-500">{pkg.description}</p>
                        </div>

                        <div className="mb-8 flex-1 space-y-3">
                            {pkg.benefits?.map((benefit, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs text-emerald-600">✓</div>
                                    <span className="text-sm font-medium text-slate-600">{benefit}</span>
                                </div>
                            ))}
                        </div>

                        <Button
                            onClick={() => openPaymentModal(pkg)}
                            disabled={purchasing}
                            className={cn(
                                "h-12 w-full rounded-[16px] text-base font-bold shadow-none transition-all active:scale-95",
                                index === 1
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20"
                                    : "bg-slate-100 text-slate-900 hover:bg-slate-200"
                            )}
                        >
                            {vipInfo?.isVip ? '立即续费' : '立即开通'}
                        </Button>
                    </Card>
                ))}
            </div>

            {/* Benefits Section */}
            <div className="rounded-[32px] bg-white p-8">
                <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">会员特权对比</h2>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                    {[
                        { icon: '🚀', title: '优先发布', desc: '任务优先展示，获取更多流量' },
                        { icon: '💰', title: '更低费率', desc: '享受更低的任务发布服务费' },
                        { icon: '🎯', title: '精准匹配', desc: '智能匹配更优质的用户资源' },
                        { icon: '🎧', title: '专属客服', desc: '7x24小时一对一专属服务' }
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-slate-50 text-3xl shadow-sm">{item.icon}</div>
                            <h3 className="mb-2 text-lg font-bold text-slate-900">{item.title}</h3>
                            <p className="text-sm font-medium text-slate-500">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Modal */}
            <Modal title={`开通 ${selectedPackage?.name}`} open={showPaymentModal} onClose={() => setShowPaymentModal(false)} className="rounded-[32px]">
                {step === 'confirm' ? (
                    <div className="space-y-6">
                        <div className="rounded-[20px] bg-slate-50 p-6">
                            <div className="mb-4 flex justify-between">
                                <span className="font-bold text-slate-500">服务名称</span>
                                <span className="font-bold text-slate-900">{selectedPackage?.name}</span>
                            </div>
                            <div className="mb-4 flex justify-between">
                                <span className="font-bold text-slate-500">支付金额</span>
                                <span className="text-xl font-black text-indigo-600">¥{selectedPackage?.price}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-4">
                                <span className="font-bold text-slate-500">有效期</span>
                                <span className="font-bold text-slate-900">{selectedPackage?.duration} 天</span>
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-xs font-bold uppercase text-slate-400">支付方式</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('balance')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 p-4 transition-all",
                                        paymentMethod === 'balance'
                                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                                            : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    )}
                                >
                                    <span className="font-bold">余额支付</span>
                                    <span className="text-xs opacity-70">可用: ¥{balance.toFixed(2)}</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('alipay')}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 rounded-[16px] border-2 p-4 transition-all",
                                        paymentMethod === 'alipay'
                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                            : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"
                                    )}
                                >
                                    <span className="font-bold">支付宝</span>
                                    <span className="text-xs opacity-70">扫码支付</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                            <Button
                                variant="secondary"
                                onClick={() => setShowPaymentModal(false)}
                                className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                            >
                                取消
                            </Button>
                            <Button
                                onClick={handlePurchase}
                                disabled={purchasing}
                                className={cn(
                                    "h-11 rounded-[16px] bg-indigo-600 px-6 font-bold text-white shadow-none hover:bg-indigo-700",
                                    purchasing && 'cursor-not-allowed opacity-70'
                                )}
                            >
                                {purchasing ? '处理中...' : (paymentMethod === 'alipay' ? '获取二维码' : '确认支付')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mb-6 text-sm font-medium text-slate-400">请使用支付宝扫码支付</div>
                        <div className="mx-auto mb-6 flex h-[220px] w-[220px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-4">
                            {/* In a real app, QR code would be here */}
                            <div className="mb-2 text-6xl opacity-20">📱</div>
                            <div className="text-xs font-bold text-slate-400">扫码支付</div>
                        </div>
                        <div className="mb-2 text-xs font-medium text-slate-400">订单号: {orderNumber}</div>
                        <div className="mb-8 text-3xl font-black text-indigo-600">¥{selectedPackage?.price}</div>
                        <div className="flex justify-center gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => { setStep('confirm'); setOrderNumber(''); }}
                                disabled={purchasing}
                                className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                            >
                                返回上一步
                            </Button>
                            <Button
                                onClick={confirmPayment}
                                disabled={purchasing}
                                className="h-11 rounded-[16px] bg-indigo-600 px-6 font-bold text-white shadow-none hover:bg-indigo-700"
                            >
                                {purchasing ? '确认中...' : '我已支付'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
