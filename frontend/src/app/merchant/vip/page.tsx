'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

interface VipInfo {
    isVip: boolean;
    vipLevel: number;
    vipExpireAt: string | null;
    vipDaysLeft: number;
}

interface VipPlan {
    id: string;
    name: string;
    duration: number; // days
    price: number;
    originalPrice: number;
    benefits: string[];
    recommended?: boolean;
}

const vipPlans: VipPlan[] = [
    {
        id: 'monthly',
        name: '月度会员',
        duration: 30,
        price: 99,
        originalPrice: 129,
        benefits: ['服务费8折', '优先审核', '专属客服']
    },
    {
        id: 'quarterly',
        name: '季度会员',
        duration: 90,
        price: 269,
        originalPrice: 387,
        benefits: ['服务费7折', '优先审核', '专属客服', '数据报表'],
        recommended: true
    },
    {
        id: 'yearly',
        name: '年度会员',
        duration: 365,
        price: 899,
        originalPrice: 1548,
        benefits: ['服务费6折', '优先审核', '专属客服', '数据报表', '专属活动', '免费培训']
    }
];

export default function MerchantVipPage() {
    const [vipInfo, setVipInfo] = useState<VipInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
    const [purchasing, setPurchasing] = useState(false);

    useEffect(() => {
        loadVipInfo();
    }, []);

    const loadVipInfo = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/merchant/vip-info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setVipInfo(json.data);
            } else {
                // Mock data if API not available
                setVipInfo({
                    isVip: false,
                    vipLevel: 0,
                    vipExpireAt: null,
                    vipDaysLeft: 0
                });
            }
        } catch (e) {
            // Mock data
            setVipInfo({
                isVip: false,
                vipLevel: 0,
                vipExpireAt: null,
                vipDaysLeft: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async (plan: VipPlan) => {
        setSelectedPlan(plan);
        setPurchasing(true);

        // Simulate payment
        setTimeout(() => {
            alert(`VIP购买成功！${plan.name}已开通，有效期${plan.duration}天`);
            setPurchasing(false);
            setSelectedPlan(null);
            loadVipInfo();
        }, 2000);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                加载中...
            </div>
        );
    }

    return (
        <div>
            {/* Current VIP Status */}
            <div style={{
                background: vipInfo?.isVip
                    ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                    : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: '#fff',
                marginBottom: '32px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>当前会员状态</div>
                        <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                            {vipInfo?.isVip ? `VIP ${vipInfo.vipLevel || 1} 会员` : '普通用户'}
                        </div>
                        {vipInfo?.isVip && vipInfo.vipExpireAt && (
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                到期时间: {new Date(vipInfo.vipExpireAt).toLocaleDateString('zh-CN')}
                                （剩余 {vipInfo.vipDaysLeft} 天）
                            </div>
                        )}
                        {!vipInfo?.isVip && (
                            <div style={{ fontSize: '14px', opacity: 0.9 }}>
                                开通VIP享受更多特权
                            </div>
                        )}
                    </div>
                    <div style={{ fontSize: '64px' }}>
                        {vipInfo?.isVip ? '👑' : '⭐'}
                    </div>
                </div>
            </div>

            {/* VIP Benefits */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>VIP专属特权</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                    {[
                        { icon: '💰', title: '服务费折扣', desc: '最高6折优惠' },
                        { icon: '⚡', title: '优先审核', desc: '任务优先处理' },
                        { icon: '👨‍💼', title: '专属客服', desc: '1对1服务' },
                        { icon: '📊', title: '数据报表', desc: '详细数据分析' },
                    ].map((benefit, idx) => (
                        <div key={idx} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb'
                        }}>
                            <div style={{ fontSize: '32px', marginBottom: '12px' }}>{benefit.icon}</div>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>{benefit.title}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{benefit.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* VIP Plans */}
            <div>
                <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
                    {vipInfo?.isVip ? '续费套餐' : '开通套餐'}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                    {vipPlans.map(plan => (
                        <div
                            key={plan.id}
                            style={{
                                background: '#fff',
                                borderRadius: '16px',
                                padding: '24px',
                                border: plan.recommended ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                                position: 'relative'
                            }}
                        >
                            {plan.recommended && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-12px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: '#f59e0b',
                                    color: '#fff',
                                    padding: '4px 16px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '500'
                                }}>
                                    推荐
                                </div>
                            )}

                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                                    {plan.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                                    <span style={{ fontSize: '14px', color: '#ef4444' }}>¥</span>
                                    <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ef4444' }}>{plan.price}</span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                    原价 ¥{plan.originalPrice}
                                </div>
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                {plan.benefits.map((benefit, idx) => (
                                    <div key={idx} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 0',
                                        borderBottom: idx < plan.benefits.length - 1 ? '1px solid #f3f4f6' : 'none'
                                    }}>
                                        <span style={{ color: '#10b981' }}>✓</span>
                                        <span style={{ fontSize: '14px', color: '#374151' }}>{benefit}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePurchase(plan)}
                                disabled={purchasing && selectedPlan?.id === plan.id}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: plan.recommended ? '#f59e0b' : '#4f46e5',
                                    color: '#fff',
                                    cursor: purchasing && selectedPlan?.id === plan.id ? 'not-allowed' : 'pointer',
                                    fontWeight: '500',
                                    fontSize: '14px'
                                }}
                            >
                                {purchasing && selectedPlan?.id === plan.id ? '购买中...' : (vipInfo?.isVip ? '立即续费' : '立即开通')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ */}
            <div style={{ marginTop: '40px', background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e5e7eb' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>常见问题</h2>
                <div style={{ display: 'grid', gap: '12px' }}>
                    {[
                        { q: 'VIP会员可以退款吗？', a: 'VIP会员服务一经开通，不支持退款，请谨慎购买。' },
                        { q: '续费会自动延长有效期吗？', a: '是的，续费后有效期会在原有基础上延长。' },
                        { q: '如何联系专属客服？', a: '开通VIP后，可在帮助中心找到专属客服联系方式。' },
                    ].map((faq, idx) => (
                        <div key={idx} style={{ padding: '12px 0', borderBottom: idx < 2 ? '1px solid #f3f4f6' : 'none' }}>
                            <div style={{ fontWeight: '500', marginBottom: '4px' }}>{faq.q}</div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>{faq.a}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
