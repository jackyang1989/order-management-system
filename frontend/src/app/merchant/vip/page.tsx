'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';

interface VipInfo { isVip: boolean; vipLevel: number; vipExpireAt: string | null; vipDaysLeft: number; balance?: number; silver?: number; }
interface VipPackage { id: string; name: string; duration: number; price: number; originalPrice: number; benefits: string[]; recommended?: boolean; isActive?: boolean; }

export default function MerchantVipPage() {
    const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
    const [packages, setPackages] = useState<VipPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<VipPackage | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'alipay' | 'balance' | 'silver'>('alipay');
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => { loadVipInfo(); loadPackages(); }, []);

    const loadVipInfo = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) {
                const data = json.data;
                const vipExpireAt = data.vipExpireTime ? new Date(data.vipExpireTime) : null;
                const now = new Date();
                const isVip = data.vip === 1 && vipExpireAt && vipExpireAt > now;
                const vipDaysLeft = vipExpireAt ? Math.max(0, Math.ceil((vipExpireAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;
                setVipInfo({ isVip: isVip || false, vipLevel: data.vipLevel || 1, vipExpireAt: data.vipExpireTime, vipDaysLeft, balance: data.balance || 0, silver: data.silver || 0 });
            } else setVipInfo({ isVip: false, vipLevel: 0, vipExpireAt: null, vipDaysLeft: 0 });
        } catch { setVipInfo({ isVip: false, vipLevel: 0, vipExpireAt: null, vipDaysLeft: 0 }); }
        finally { setLoading(false); }
    };

    const loadPackages = async () => {
        try {
            const res = await fetch(`${BASE_URL}/vip/packages`);
            const json = await res.json();
            if (json.success && json.data?.length > 0) {
                setPackages(json.data.filter((p: VipPackage) => p.isActive !== false).map((p: VipPackage) => ({ ...p, benefits: p.benefits || ['VIP专属特权'], recommended: p.duration === 90 })));
            } else setPackages([{ id: 'monthly', name: '月度会员', duration: 30, price: 99, originalPrice: 129, benefits: ['服务费8折', '优先审核', '专属客服'] }, { id: 'quarterly', name: '季度会员', duration: 90, price: 269, originalPrice: 387, benefits: ['服务费7折', '优先审核', '专属客服', '数据报表'], recommended: true }, { id: 'yearly', name: '年度会员', duration: 365, price: 899, originalPrice: 1548, benefits: ['服务费6折', '优先审核', '专属客服', '数据报表', '专属活动', '免费培训'] }]);
        } catch { setPackages([{ id: 'monthly', name: '月度会员', duration: 30, price: 99, originalPrice: 129, benefits: ['服务费8折', '优先审核', '专属客服'] }, { id: 'quarterly', name: '季度会员', duration: 90, price: 269, originalPrice: 387, benefits: ['服务费7折', '优先审核', '专属客服', '数据报表'], recommended: true }, { id: 'yearly', name: '年度会员', duration: 365, price: 899, originalPrice: 1548, benefits: ['服务费6折', '优先审核', '专属客服', '数据报表', '专属活动', '免费培训'] }]); }
    };

    const openPaymentModal = (pkg: VipPackage) => { setSelectedPackage(pkg); setPaymentMethod('alipay'); setShowPaymentModal(true); };

    const handlePurchase = async () => {
        if (!selectedPackage) return;
        const token = localStorage.getItem('merchantToken');
        if (!token) { alert('请先登录'); return; }
        if (paymentMethod === 'balance' && (vipInfo?.balance || 0) < selectedPackage.price) { alert('余额不足，请先充值'); return; }
        if (paymentMethod === 'silver' && (vipInfo?.silver || 0) < selectedPackage.price) { alert('银锭不足，请先充值'); return; }
        setPurchasing(true);
        try {
            const res = await fetch(`${BASE_URL}/vip/purchase`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ packageId: selectedPackage.id, paymentMethod: paymentMethod === 'alipay' ? 1 : paymentMethod === 'balance' ? 2 : 3 }) });
            const json = await res.json();
            if (json.success) {
                if (json.data?.payUrl) { alert('正在跳转到支付页面...'); const callbackRes = await fetch(`${BASE_URL}/vip/alipay/callback`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNo: json.data.orderNo }) }); const callbackJson = await callbackRes.json(); if (callbackJson.success) alert(`VIP购买成功！${selectedPackage.name}已开通`); }
                else alert(`VIP购买成功！${selectedPackage.name}已开通`);
                setShowPaymentModal(false); setSelectedPackage(null); loadVipInfo();
            } else alert(json.message || 'VIP购买失败');
        } catch { alert('网络错误，请重试'); }
        finally { setPurchasing(false); }
    };

    if (loading) return <div className="flex h-[400px] items-center justify-center text-slate-500">加载中...</div>;

    const benefits = [{ icon: '💰', title: '服务费折扣', desc: '最高6折优惠' }, { icon: '⚡', title: '优先审核', desc: '任务优先处理' }, { icon: '👨‍💼', title: '专属客服', desc: '1对1服务' }, { icon: '📊', title: '数据报表', desc: '详细数据分析' }];
    const faqs = [{ q: 'VIP会员可以退款吗？', a: 'VIP会员服务一经开通，不支持退款，请谨慎购买。' }, { q: '续费会自动延长有效期吗？', a: '是的，续费后有效期会在原有基础上延长。' }, { q: '如何联系专属客服？', a: '开通VIP后，可在帮助中心找到专属客服联系方式。' }];

    return (
        <div className="space-y-8">
            {/* VIP Status Banner */}
            <div className={cn('rounded-2xl p-8 text-white', vipInfo?.isVip ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-500 to-slate-600')}>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2 text-sm opacity-90">当前会员状态</div>
                        <div className="mb-2 text-3xl font-bold">{vipInfo?.isVip ? `VIP ${vipInfo.vipLevel || 1} 会员` : '普通用户'}</div>
                        {vipInfo?.isVip && vipInfo.vipExpireAt && <div className="text-sm opacity-90">到期时间: {new Date(vipInfo.vipExpireAt).toLocaleDateString('zh-CN')}（剩余 {vipInfo.vipDaysLeft} 天）</div>}
                        {!vipInfo?.isVip && <div className="text-sm opacity-90">开通VIP享受更多特权</div>}
                    </div>
                    <div className="text-6xl">{vipInfo?.isVip ? '👑' : '⭐'}</div>
                </div>
            </div>

            {/* Benefits */}
            <div>
                <h2 className="mb-4 text-xl font-semibold">VIP专属特权</h2>
                <div className="grid grid-cols-4 gap-4">
                    {benefits.map((b, idx) => (
                        <Card key={idx} className="bg-white p-5 text-center">
                            <div className="mb-3 text-3xl">{b.icon}</div>
                            <div className="mb-1 font-semibold">{b.title}</div>
                            <div className="text-xs text-slate-500">{b.desc}</div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Plans */}
            <div>
                <h2 className="mb-4 text-xl font-semibold">{vipInfo?.isVip ? '续费套餐' : '开通套餐'}</h2>
                <div className="grid grid-cols-3 gap-5">
                    {packages.map(plan => (
                        <Card key={plan.id} className={cn('relative bg-white p-6', plan.recommended ? 'border-2 border-amber-500' : '')}>
                            {plan.recommended && <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-medium text-white">推荐</div>}
                            <div className="mb-5 text-center">
                                <div className="mb-2 text-lg font-semibold">{plan.name}</div>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-sm text-red-500">¥</span>
                                    <span className="text-4xl font-bold text-red-500">{plan.price}</span>
                                </div>
                                <div className="text-xs text-slate-400 line-through">原价 ¥{plan.originalPrice}</div>
                            </div>
                            <div className="mb-5">
                                {plan.benefits.map((b, idx) => (
                                    <div key={idx} className={cn('flex items-center gap-2 py-2', idx < plan.benefits.length - 1 && 'border-b border-slate-100')}>
                                        <span className="text-green-500">✓</span>
                                        <span className="text-sm text-slate-700">{b}</span>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={() => openPaymentModal(plan)} disabled={purchasing} className={cn('w-full', plan.recommended ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700')}>{vipInfo?.isVip ? '立即续费' : '立即开通'}</Button>
                        </Card>
                    ))}
                </div>
            </div>

            {/* FAQ */}
            <Card className="bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold">常见问题</h2>
                <div className="space-y-3">
                    {faqs.map((faq, idx) => (
                        <div key={idx} className={cn('py-3', idx < faqs.length - 1 && 'border-b border-slate-100')}>
                            <div className="mb-1 font-medium">{faq.q}</div>
                            <div className="text-sm text-slate-500">{faq.a}</div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Payment Modal */}
            <Modal title={`购买 ${selectedPackage?.name || ''}`} open={showPaymentModal} onClose={() => { setShowPaymentModal(false); setSelectedPackage(null); }}>
                {selectedPackage && (
                    <>
                        <div className="mb-5 rounded-lg bg-slate-50 p-4">
                            <div className="mb-2 flex justify-between"><span className="text-slate-500">套餐时长</span><span className="font-medium">{selectedPackage.duration}天</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">应付金额</span><span className="text-xl font-bold text-red-500">¥{selectedPackage.price}</span></div>
                        </div>
                        <div className="mb-5">
                            <label className="mb-3 block text-sm font-medium text-slate-700">选择支付方式</label>
                            <div className="flex flex-col gap-2.5">
                                {(['alipay', 'balance', 'silver'] as const).map(method => (
                                    <button key={method} onClick={() => setPaymentMethod(method)} className={cn('flex items-center justify-between rounded-lg border-2 px-4 py-3.5 text-left', paymentMethod === method ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white')}>
                                        <span>{method === 'alipay' ? '支付宝支付' : method === 'balance' ? `余额支付 (¥${Number(vipInfo?.balance || 0).toFixed(2)})` : `银锭支付 (${Number(vipInfo?.silver || 0).toFixed(0)})`}</span>
                                        {paymentMethod === method && <span className="text-indigo-600">✓</span>}
                                    </button>
                                ))}
                            </div>
                            {paymentMethod === 'balance' && (vipInfo?.balance || 0) < selectedPackage.price && <div className="mt-2 text-xs text-red-500">余额不足，请先充值</div>}
                            {paymentMethod === 'silver' && (vipInfo?.silver || 0) < selectedPackage.price && <div className="mt-2 text-xs text-red-500">银锭不足，请先充值</div>}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => { setShowPaymentModal(false); setSelectedPackage(null); }} disabled={purchasing} className="flex-1">取消</Button>
                            <Button onClick={handlePurchase} disabled={purchasing || (paymentMethod === 'balance' && (vipInfo?.balance || 0) < selectedPackage.price) || (paymentMethod === 'silver' && (vipInfo?.silver || 0) < selectedPackage.price)} className={cn('flex-1', purchasing && 'opacity-70')}>{purchasing ? '购买中...' : '确认购买'}</Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
}
