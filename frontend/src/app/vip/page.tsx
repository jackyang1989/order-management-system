'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';
import {
    fetchVipPackages,
    fetchVipStatus,
    fetchVipRecords,
    purchaseVip,
    fetchUserBalanceForVip,
    VipPackage,
    VipStatus,
    VipPurchase,
    PaymentMethod
} from '../../services/vipService';
import BottomNav from '../../components/BottomNav';

// Fallback mock packages
const mockPackages: VipPackage[] = [
    { id: '1', name: '月度VIP', days: 30, price: 30, discountPrice: 19.9, description: '适合新手体验', benefits: ['专属任务优先领取', '佣金提升10%', '免费提现次数+2'] },
    { id: '2', name: '季度VIP', days: 90, price: 90, discountPrice: 49.9, description: '高性价比之选', benefits: ['专属任务优先领取', '佣金提升15%', '免费提现次数+5', '专属客服'] },
    { id: '3', name: '年度VIP', days: 365, price: 360, discountPrice: 168, description: '资深用户首选', benefits: ['专属任务优先领取', '佣金提升20%', '无限免费提现', '专属客服', '生日礼包'] }
];

// 支付方式配置
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

    // 余额信息
    const [userBalance, setUserBalance] = useState(0);
    const [userSilver, setUserSilver] = useState(0);

    // 支付方式选择
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('silver');

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    useEffect(() => {
        if (activeTab === 'records') {
            loadRecords();
        }
    }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pkgs, status, balanceData] = await Promise.all([
                fetchVipPackages(),
                fetchVipStatus(),
                fetchUserBalanceForVip()
            ]);

            if (pkgs.length > 0) {
                setPackages(pkgs);
                setSelectedPackage(pkgs[0]);
            } else {
                setPackages(mockPackages);
                setSelectedPackage(mockPackages[0]);
            }

            setVipStatus(status);
            setUserBalance(balanceData.balance);
            setUserSilver(balanceData.silver);
        } catch (error) {
            console.error('Load data error:', error);
            setPackages(mockPackages);
            setSelectedPackage(mockPackages[0]);
        } finally {
            setLoading(false);
        }
    };

    const loadRecords = async () => {
        try {
            const result = await fetchVipRecords();
            setRecords(result.list);
        } catch (error) {
            console.error('Load records error:', error);
        }
    };

    const handlePayment = async () => {
        if (!selectedPackage) return;

        // 验证余额
        if (paymentMethod === 'silver' && userSilver < selectedPackage.discountPrice) {
            alert('银锭余额不足，请选择其他支付方式');
            setShowConfirm(false);
            return;
        }
        if (paymentMethod === 'balance' && userBalance < selectedPackage.discountPrice) {
            alert('本金余额不足，请选择其他支付方式');
            setShowConfirm(false);
            return;
        }

        setProcessing(true);
        try {
            const result = await purchaseVip(selectedPackage.id, paymentMethod);

            if (result.success) {
                // 检查是否是支付宝支付（需要跳转）
                if (result.data && 'payUrl' in result.data) {
                    alert('正在跳转到支付宝支付页面...');
                    // TODO: 实际跳转到支付链接
                    // window.location.href = result.data.payUrl;
                    console.log('Pay URL:', result.data.payUrl);
                } else {
                    alert(result.message);
                    // 刷新数据
                    loadData();
                    setActiveTab('records');
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('支付失败，请稍后重试');
        } finally {
            setProcessing(false);
            setShowConfirm(false);
        }
    };

    // 获取当前支付方式可用余额
    const getCurrentBalance = () => {
        switch (paymentMethod) {
            case 'silver': return userSilver;
            case 'balance': return userBalance;
            case 'alipay': return Infinity; // 支付宝无余额限制
        }
    };

    // 检查余额是否充足
    const isBalanceSufficient = () => {
        if (!selectedPackage) return false;
        return getCurrentBalance() >= selectedPackage.discountPrice;
    };

    // 支付方式标签颜色
    const getPaymentMethodColor = (method: PaymentMethod) => {
        switch (method) {
            case 'silver': return '#8b5cf6';
            case 'balance': return '#f59e0b';
            case 'alipay': return '#1677ff';
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px',
                color: 'white',
                textAlign: 'center'
            }}>
                <div onClick={() => router.back()} style={{
                    position: 'absolute',
                    left: '16px',
                    top: '20px',
                    fontSize: '20px',
                    cursor: 'pointer'
                }}>←</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>VIP会员中心</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    {vipStatus.isVip
                        ? `VIP会员 · 剩余${vipStatus.daysRemaining}天`
                        : '开通VIP享受更多权益'}
                </div>
            </div>

            {/* 余额信息 */}
            <div style={{
                margin: '0 16px 16px',
                padding: '16px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                justifyContent: 'space-around'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>{Number(userSilver || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>银锭余额</div>
                </div>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.2)' }} />
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'white' }}>¥{Number(userBalance || 0).toFixed(2)}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>本金余额</div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div style={{
                display: 'flex',
                margin: '0 16px 16px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '4px'
            }}>
                {[
                    { key: 'recharge', label: '开通VIP' },
                    { key: 'records', label: '充值记录' }
                ].map(tab => (
                    <div
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as 'recharge' | 'records')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            textAlign: 'center',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            background: activeTab === tab.key ? 'white' : 'transparent',
                            color: activeTab === tab.key ? '#764ba2' : 'rgba(255,255,255,0.8)',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* 内容区域 */}
            <div style={{
                margin: '0 16px',
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                minHeight: '400px'
            }}>
                {activeTab === 'recharge' ? (
                    <>
                        {/* 套餐选择 */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#333' }}>
                                选择套餐
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {packages.map(pkg => (
                                    <div
                                        key={pkg.id}
                                        onClick={() => setSelectedPackage(pkg)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: selectedPackage?.id === pkg.id
                                                ? '2px solid #764ba2'
                                                : '1px solid #eee',
                                            background: selectedPackage?.id === pkg.id
                                                ? 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 100%)'
                                                : '#fafafa',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            position: 'relative'
                                        }}
                                    >
                                        {selectedPackage?.id === pkg.id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '12px',
                                                background: '#764ba2',
                                                color: 'white',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '10px'
                                            }}>已选</div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: '700', fontSize: '16px', color: '#333' }}>{pkg.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                                <span style={{ color: '#764ba2', fontSize: '24px', fontWeight: '800' }}>
                                                    {pkg.discountPrice}
                                                </span>
                                                <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>
                                                    ¥{pkg.price}
                                                </span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{pkg.description}</div>
                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                            {pkg.benefits?.map((benefit, idx) => (
                                                <span key={idx} style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    background: '#f0f0f0',
                                                    borderRadius: '4px',
                                                    color: '#666'
                                                }}>{benefit}</span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 支付方式选择 */}
                        <div style={{ marginBottom: '24px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#333' }}>
                                支付方式
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {PAYMENT_METHODS.map(method => (
                                    <div
                                        key={method.key}
                                        onClick={() => setPaymentMethod(method.key)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '10px',
                                            border: paymentMethod === method.key
                                                ? `2px solid ${getPaymentMethodColor(method.key)}`
                                                : '1px solid #eee',
                                            background: paymentMethod === method.key ? '#fafafa' : 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span style={{ fontSize: '24px' }}>{method.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>{method.label}</div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>{method.desc}</div>
                                        </div>
                                        {method.key !== 'alipay' && (
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: getPaymentMethodColor(method.key)
                                            }}>
                                                {method.key === 'silver' ? userSilver.toFixed(2) : `¥${userBalance.toFixed(2)}`}
                                            </div>
                                        )}
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: paymentMethod === method.key
                                                ? `6px solid ${getPaymentMethodColor(method.key)}`
                                                : '2px solid #ddd',
                                            background: 'white'
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 确认按钮 */}
                        <button
                            onClick={() => setShowConfirm(true)}
                            disabled={!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay'))
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '700',
                                cursor: (!selectedPackage || (!isBalanceSufficient() && paymentMethod !== 'alipay'))
                                    ? 'not-allowed'
                                    : 'pointer'
                            }}
                        >
                            {paymentMethod !== 'alipay' && !isBalanceSufficient()
                                ? '余额不足'
                                : `立即开通 · ${selectedPackage?.discountPrice || 0}${paymentMethod === 'silver' ? '银锭' : '元'}`}
                        </button>

                        {/* 温馨提示 */}
                        <div style={{
                            marginTop: '16px',
                            padding: '12px',
                            background: '#fffbeb',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#92400e'
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '4px' }}>温馨提示</div>
                            <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.6' }}>
                                <li>VIP权益开通后立即生效</li>
                                <li>已开通VIP续费时间将自动叠加</li>
                                <li>虚拟商品一经开通不支持退款</li>
                            </ul>
                        </div>
                    </>
                ) : (
                    /* 充值记录 */
                    <div>
                        {records.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 20px',
                                color: '#999'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                <div>暂无充值记录</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {records.map(record => (
                                    <div key={record.id} style={{
                                        padding: '16px',
                                        background: '#fafafa',
                                        borderRadius: '12px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <div style={{ fontWeight: '600', color: '#333' }}>{record.packageName}</div>
                                            <div style={{
                                                fontSize: '12px',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                background: record.status === 'paid' ? '#dcfce7' : '#fef3c7',
                                                color: record.status === 'paid' ? '#166534' : '#92400e'
                                            }}>
                                                {record.status === 'paid' ? '已支付' : '待支付'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                                            <span>{new Date(record.paidAt || record.createdAt).toLocaleString()}</span>
                                            <span style={{ fontWeight: '600', color: '#764ba2' }}>
                                                {record.paymentMethod === 'silver' ? `${record.amount}银锭` : `¥${record.amount}`}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
                                            有效期: {new Date(record.vipStartAt).toLocaleDateString()} ~ {new Date(record.vipEndAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 确认弹窗 */}
            {showConfirm && selectedPackage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '320px'
                    }}>
                        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', textAlign: 'center' }}>
                            确认支付
                        </div>
                        <div style={{
                            padding: '16px',
                            background: '#f5f5f5',
                            borderRadius: '8px',
                            marginBottom: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>套餐名称</span>
                                <span style={{ fontWeight: '600' }}>{selectedPackage.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>有效期</span>
                                <span style={{ fontWeight: '600' }}>{selectedPackage.days}天</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span style={{ color: '#666' }}>支付方式</span>
                                <span style={{ fontWeight: '600', color: getPaymentMethodColor(paymentMethod) }}>
                                    {PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label}
                                </span>
                            </div>
                            <div style={{
                                borderTop: '1px solid #eee',
                                paddingTop: '8px',
                                marginTop: '8px',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span style={{ color: '#666' }}>支付金额</span>
                                <span style={{ fontSize: '20px', fontWeight: '700', color: '#764ba2' }}>
                                    {paymentMethod === 'silver' ? `${selectedPackage.discountPrice}银锭` : `¥${selectedPackage.discountPrice}`}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={processing}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: '1px solid #ddd',
                                    background: 'white',
                                    color: '#666',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={handlePayment}
                                disabled={processing}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: processing ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: processing ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {processing ? '处理中...' : '确认支付'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}

// 导出包装组件（Suspense边界）
export default function VipPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{ color: 'white', fontSize: '14px' }}>加载中...</div>
            </div>
        }>
            <VipContent />
        </Suspense>
    );
}
