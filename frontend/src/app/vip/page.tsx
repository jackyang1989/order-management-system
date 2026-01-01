'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, getCurrentUser } from '../../services/authService';
import {
    fetchVipPackages,
    fetchVipStatus,
    fetchVipRecords,
    purchaseVip,
    VipPackage,
    VipStatus,
    VipPurchase
} from '../../services/vipService';

// Fallback mock packages
const mockPackages: VipPackage[] = [
    { id: '1', name: '月度VIP', days: 30, price: 30, discountPrice: 19.9, description: '适合新手体验', benefits: ['专属任务优先领取', '佣金提升10%', '免费提现次数+2'] },
    { id: '2', name: '季度VIP', days: 90, price: 90, discountPrice: 49.9, description: '高性价比之选', benefits: ['专属任务优先领取', '佣金提升15%', '免费提现次数+5', '专属客服'] },
    { id: '3', name: '年度VIP', days: 365, price: 360, discountPrice: 168, description: '资深用户首选', benefits: ['专属任务优先领取', '佣金提升20%', '无限免费提现', '专属客服', '生日礼包'] }
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
    const [userSilver, setUserSilver] = useState(0);
    const [username, setUsername] = useState('');

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
            const user = getCurrentUser();
            if (user) {
                setUsername(user.username || '');
                setUserSilver(Number(user.silver) || 0);
            }

            const [pkgs, status] = await Promise.all([
                fetchVipPackages(),
                fetchVipStatus()
            ]);

            if (pkgs.length > 0) {
                setPackages(pkgs);
                setSelectedPackage(pkgs[0]);
            } else {
                setPackages(mockPackages);
                setSelectedPackage(mockPackages[0]);
            }

            setVipStatus(status);
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
        if (userSilver < selectedPackage.discountPrice) {
            alert('银锭余额不足，请先充值');
            setShowConfirm(false);
            return;
        }

        setProcessing(true);
        try {
            const result = await purchaseVip(selectedPackage.id);
            if (result.success) {
                alert(`购买成功！已开通${selectedPackage.name}`);
                setShowConfirm(false);
                // Refresh VIP status
                const status = await fetchVipStatus();
                setVipStatus(status);
                setUserSilver(prev => prev - selectedPackage.discountPrice);
                // Switch to records tab
                setActiveTab('records');
                loadRecords();
            } else {
                alert(result.message || '购买失败');
            }
        } catch (error) {
            alert('网络错误，请重试');
        } finally {
            setProcessing(false);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('zh-CN');
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
                        <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>{username}</div>
                        <div style={{ fontSize: '14px', opacity: 0.9 }}>
                            {vipStatus.isVip ? 'VIP会员' : '普通会员'}
                        </div>
                    </div>
                </div>
                {vipStatus.isVip && (
                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                        到期时间：{formatDate(vipStatus.expireAt)} (剩余{vipStatus.daysRemaining}天)
                    </div>
                )}
                <div style={{ fontSize: '12px', marginTop: '10px', opacity: 0.7 }}>
                    可用银锭：{userSilver}
                </div>
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
                        position: 'relative',
                        cursor: 'pointer'
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
                        position: 'relative',
                        cursor: 'pointer'
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
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {packages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    onClick={() => setSelectedPackage(pkg)}
                                    style={{
                                        border: selectedPackage?.id === pkg.id ? '2px solid #e6a23c' : '1px solid #e5e5e5',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        cursor: 'pointer',
                                        background: selectedPackage?.id === pkg.id ? '#fffbf0' : '#fff'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>{pkg.name}</div>
                                        <div>
                                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e6a23c' }}>{pkg.discountPrice}</span>
                                            <span style={{ fontSize: '12px', color: '#999', textDecoration: 'line-through', marginLeft: '5px' }}>¥{pkg.price}</span>
                                            <span style={{ fontSize: '12px', color: '#999' }}> 银锭</span>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>{pkg.description}</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                        {pkg.benefits?.map((benefit, idx) => (
                                            <span key={idx} style={{
                                                fontSize: '10px',
                                                padding: '2px 6px',
                                                background: '#fff8e6',
                                                color: '#e6a23c',
                                                borderRadius: '2px'
                                            }}>{benefit}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 当前选中 */}
                    {selectedPackage && (
                        <div style={{ padding: '15px', background: '#fff', marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: '#666' }}>当前选中套餐</span>
                                <span style={{ fontSize: '14px', color: '#333' }}>
                                    {selectedPackage.name} ({selectedPackage.days}天) | <span style={{ color: '#e6a23c', fontWeight: 'bold' }}>{selectedPackage.discountPrice}银锭</span>
                                </span>
                            </div>
                        </div>
                    )}

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
                            disabled={!selectedPackage}
                            style={{
                                width: '100%',
                                background: selectedPackage ? 'linear-gradient(135deg, #e6a23c 0%, #f5d98e 100%)' : '#ccc',
                                border: 'none',
                                color: '#fff',
                                padding: '12px',
                                borderRadius: '4px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: selectedPackage ? 'pointer' : 'not-allowed'
                            }}
                        >
                            立即开通 {selectedPackage?.discountPrice}银锭
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
                                        {record.packageName}
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#e6a23c', fontWeight: 'bold' }}>
                                        {record.amount}银锭
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                                    <div>购买时间：{formatDate(record.paidAt)}</div>
                                    <div>有效期：{formatDate(record.vipStartAt)} ~ {formatDate(record.vipEndAt)}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 确认支付弹窗 */}
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
                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>确认购买</div>
                        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            您将使用银锭支付
                        </div>
                        <div style={{ fontSize: '24px', color: '#e6a23c', fontWeight: 'bold', marginBottom: '10px' }}>
                            {selectedPackage.discountPrice} 银锭
                        </div>
                        <div style={{ fontSize: '12px', color: '#999', marginBottom: '20px' }}>
                            开通 {selectedPackage.name} ({selectedPackage.days}天)
                        </div>
                        {userSilver < selectedPackage.discountPrice && (
                            <div style={{ fontSize: '12px', color: '#f56c6c', marginBottom: '10px' }}>
                                余额不足，当前银锭：{userSilver}
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={processing}
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
                                disabled={processing || userSilver < selectedPackage.discountPrice}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    border: 'none',
                                    background: processing || userSilver < selectedPackage.discountPrice ? '#ccc' : '#e6a23c',
                                    color: '#fff',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    cursor: processing || userSilver < selectedPackage.discountPrice ? 'not-allowed' : 'pointer'
                                }}
                            >{processing ? '处理中...' : '确认支付'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function VipPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>}>
            <VipContent />
        </Suspense>
    );
}
