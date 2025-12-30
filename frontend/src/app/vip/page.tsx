'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';

// VIP套餐
const vipPackages = [
    { id: 1, months: 3, price: 30, originalPrice: 45 },
    { id: 2, months: 6, price: 50, originalPrice: 90 },
    { id: 3, months: 9, price: 70, originalPrice: 135 },
    { id: 4, months: 12, price: 88, originalPrice: 180 }
];

// 支付方式
const paymentMethods = [
    { id: 'alipay', name: '支付宝', icon: '💳' },
    { id: 'balance', name: '本金支付', icon: '💰' },
    { id: 'silver', name: '银锭支付', icon: '🥈' }
];

// Mock 用户VIP信息
const mockUserVip = {
    isVip: true,
    expireTime: '2024-12-31',
    username: 'test_user'
};

// Mock 购买记录
const mockRecords = [
    { id: '1', date: '2024-12-01 10:00:00', months: 3, price: 30, payMethod: '支付宝', expireDate: '2025-03-01' },
    { id: '2', date: '2024-09-01 15:30:00', months: 3, price: 30, payMethod: '本金支付', expireDate: '2024-12-01' }
];

export default function VipPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'recharge' | 'records'>('recharge');
    const [selectedPackage, setSelectedPackage] = useState(vipPackages[0]);
    const [selectedPayment, setSelectedPayment] = useState(paymentMethods[0]);
    const [userVip, setUserVip] = useState(mockUserVip);
    const [records, setRecords] = useState(mockRecords);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        setLoading(false);
    }, [router]);

    const handlePayment = () => {
        setShowConfirm(false);
        // Mock 支付成功
        alert(`支付成功！已开通${selectedPackage.months}个月VIP会员`);
        // 更新VIP状态
        const newExpire = new Date();
        newExpire.setMonth(newExpire.getMonth() + selectedPackage.months);
        setUserVip({
            ...userVip,
            isVip: true,
            expireTime: newExpire.toISOString().split('T')[0]
        });
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: 'linear-gradient(135deg, #e6a23c 0%, #f5d98e 100%)',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#fff' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#fff' }}>VIP会员中心</div>
            </div>

            {/* VIP 状态卡片 */}
            <div style={{
                background: 'linear-gradient(135deg, #e6a23c 0%, #f5d98e 100%)',
                padding: '20px 15px 30px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ fontSize: '36px', marginRight: '15px' }}>👑</div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{userVip.username}</div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                            {userVip.isVip ? 'VIP会员' : '普通会员'}
                        </div>
                    </div>
                </div>
                {userVip.isVip && (
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                        到期时间：{userVip.expireTime}
                    </div>
                )}
            </div>

            {/* Tab 切换 */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => setActiveTab('recharge')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'recharge' ? '#e6a23c' : '#666',
                        position: 'relative'
                    }}
                >
                    充值会员
                    {activeTab === 'recharge' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#e6a23c' }}></div>}
                </div>
                <div
                    onClick={() => setActiveTab('records')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'records' ? '#e6a23c' : '#666',
                        position: 'relative'
                    }}
                >
                    充值记录
                    {activeTab === 'records' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#e6a23c' }}></div>}
                </div>
            </div>

            {/* 充值内容 */}
            {activeTab === 'recharge' && (
                <div>
                    {/* 套餐选择 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>选择套餐</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            {vipPackages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    style={{
                                        border: selectedPackage.id === pkg.id ? '2px solid #e6a23c' : '1px solid #e5e5e5',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: selectedPackage.id === pkg.id ? '#fffbf0' : '#fff'
                                    }}
                                >
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>{pkg.months}个月</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e6a23c' }}>¥{pkg.price}</div>
                                    <div style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through' }}>¥{pkg.originalPrice}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 当前选中 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', color: '#666' }}>当前选中套餐</span>
                            <span style={{ fontSize: '14px', color: '#333' }}>
                                {selectedPackage.months}个月 | <span style={{ color: '#e6a23c', fontWeight: 'bold' }}>¥{selectedPackage.price}</span>
                            </span>
                        </div>
                    </div>

                    {/* 支付方式 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>支付方式</div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {paymentMethods.map(method => (
                                <div
                                    key={method.id}
                                    onClick={() => setSelectedPayment(method)}
                                    style={{
                                        flex: 1,
                                        border: selectedPayment.id === method.id ? '2px solid #e6a23c' : '1px solid #e5e5e5',
                                        borderRadius: '8px',
                                        padding: '12px 8px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        background: selectedPayment.id === method.id ? '#fffbf0' : '#fff'
                                    }}
                                >
                                    <div style={{ fontSize: '24px', marginBottom: '5px' }}>{method.icon}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{method.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* VIP 权益 */}
                    <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>VIP专属权益</div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                            <div>✅ 每日可接任务数量翻倍</div>
                            <div>✅ 优先看到高佣金任务</div>
                            <div>✅ 提现手续费减免50%</div>
                            <div>✅ 专属VIP客服通道</div>
                            <div>✅ 每月额外赠送银锭</div>
                        </div>
                    </div>

                    {/* 底部支付按钮 */}
                    <div style={{
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        maxWidth: '540px',
                        margin: '0 auto',
                        padding: '10px 15px',
                        background: '#fff',
                        borderTop: '1px solid #e5e5e5'
                    }}>
                        <button
                            onClick={() => setShowConfirm(true)}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #e6a23c 0%, #f5d98e 100%)',
                                border: 'none',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            立即开通 ¥{selectedPackage.price}
                        </button>
                    </div>
                </div>
            )}

            {/* 充值记录 */}
            {activeTab === 'records' && (
                <div style={{ background: '#fff', marginTop: '10px' }}>
                    {records.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📋</div>
                            暂无充值记录
                        </div>
                    ) : (
                        records.map((record, index) => (
                            <div
                                key={record.id}
                                style={{
                                    padding: '15px',
                                    borderBottom: index < records.length - 1 ? '1px solid #f5f5f5' : 'none'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                                        购买{record.months}个月会员
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#e6a23c', fontWeight: 'bold' }}>
                                        ¥{record.price}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                                    <div>支付方式：{record.payMethod}</div>
                                    <div>购买时间：{record.date}</div>
                                    <div>到期时间：{record.expireDate}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 确认支付弹窗 */}
            {showConfirm && (
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
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '80%',
                        maxWidth: '300px',
                        textAlign: 'center',
                        padding: '20px'
                    }}>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>确认支付</div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                            您将使用 <span style={{ color: '#e6a23c' }}>{selectedPayment.name}</span> 支付 <span style={{ color: '#e6a23c', fontWeight: 'bold' }}>¥{selectedPackage.price}</span> 开通{selectedPackage.months}个月VIP会员
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    background: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >取消</button>
                            <button
                                onClick={handlePayment}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    background: '#e6a23c',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >确认支付</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
