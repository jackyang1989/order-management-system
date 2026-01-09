'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, getToken } from '../../services/authService';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================

// ========================

function PayContent() {
    const router = useRouter();
    const searchParams = useSearchParams();


    // 1=VIP充值, 2=本金充值, 3=订单支付
    const payType = searchParams.get('type') || '1';
    const orderId = searchParams.get('orderId') || '';
    const amount = searchParams.get('amount') || '0';

    const [loading, setLoading] = useState(false);
    const [payMethod, setPayMethod] = useState('alipay'); // alipay | wechat
    const [payAmount, setPayAmount] = useState(amount);
    const [payUrl, setPayUrl] = useState('');

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
    }, [router]);

    // 获取支付类型标题
    const getPayTitle = () => {
        switch (payType) {
            case '1': return 'VIP会员充值';
            case '2': return '本金充值';
            case '3': return '订单支付';
            default: return '支付';
        }
    };

    // ========================

    // ========================
    const handlePay = async () => {
        if (!payAmount || parseFloat(payAmount) <= 0) {
            alertError('请输入正确的金额');
            return;
        }

        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/payments/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    payType: payType,
                    payMethod: payMethod,
                    amount: payAmount,
                    orderId: orderId,
                }),
            });
            const data = await response.json();

            if (data.success) {
                if (data.url) {
                    // 跳转到第三方支付页面
                    setPayUrl(data.url);
                    window.location.href = data.url;
                } else if (data.qrcode) {
                    // 展示二维码支付
                    alertSuccess('请使用手机扫描二维码完成支付');
                } else {
                    alertSuccess(data.message || '支付成功');
                    setTimeout(() => {
                        router.push('/profile');
                    }, 2000);
                }
            } else {
                alertError(data.message || '支付失败');
            }
        } catch (error) {
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>{getPayTitle()}</div>
                    <div style={{ width: '24px' }}></div>
                </div>
            </div>

            {/* 支付金额 */}
            <div style={{
                margin: '16px',
                background: '#fff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>支付金额</div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px', fontWeight: '700', color: '#333', marginRight: '4px' }}>¥</span>
                    <input
                        type="number"
                        value={payAmount}
                        onChange={(e) => setPayAmount(e.target.value)}
                        placeholder="0.00"
                        disabled={!!amount && parseFloat(amount) > 0}
                        style={{
                            flex: 1,
                            fontSize: '32px',
                            fontWeight: '700',
                            color: '#333',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent'
                        }}
                    />
                </div>
            </div>

            {/* 支付方式选择 */}
            <div style={{
                margin: '16px',
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ fontSize: '14px', color: '#666', padding: '16px 16px 8px' }}>选择支付方式</div>

                {/* 支付宝 */}
                <div
                    onClick={() => setPayMethod('alipay')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f5f5f5'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#1677ff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        fontSize: '20px'
                    }}>
                        💳
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#333' }}>支付宝</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>推荐使用，安全快捷</div>
                    </div>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: payMethod === 'alipay' ? 'none' : '2px solid #ddd',
                        background: payMethod === 'alipay' ? '#409eff' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {payMethod === 'alipay' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                </div>

                {/* 微信支付 */}
                <div
                    onClick={() => setPayMethod('wechat')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        cursor: 'pointer'
                    }}
                >
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: '#07c160',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '12px',
                        fontSize: '20px'
                    }}>
                        💬
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#333' }}>微信支付</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>亿万用户的选择</div>
                    </div>
                    <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: payMethod === 'wechat' ? 'none' : '2px solid #ddd',
                        background: payMethod === 'wechat' ? '#07c160' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {payMethod === 'wechat' && <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>}
                    </div>
                </div>
            </div>

            {/* 提示信息 */}
            <div style={{ padding: '0 16px', fontSize: '12px', color: '#999', lineHeight: '1.8' }}>
                <div>• 请在5分钟内完成支付，超时需重新发起</div>
                <div>• 支付过程中请勿关闭页面</div>
                <div>• 如有问题请联系在线客服</div>
            </div>

            {/* 支付按钮 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '16px',
                background: '#fff',
                boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
            }}>
                <button
                    onClick={handlePay}
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        background: loading ? '#ccc' : '#ff9500',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? '处理中...' : `立即支付 ¥${payAmount || '0'}`}
                </button>
            </div>
        </div>
    );
}

export default function PayPage() {
    return (
        <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>}>
            <PayContent />
        </Suspense>
    );
}
