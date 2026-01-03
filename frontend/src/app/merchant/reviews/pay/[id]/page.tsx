'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';

interface ReviewTask {
    id: string;
    taskNumber: string;
    money: number;
    userMoney: number;
    state: number;
    createdAt: string;
}

interface MerchantBalance {
    balance: number;
    silver: number;
}

export default function PayReviewPage() {
    const router = useRouter();
    const params = useParams();
    const reviewTaskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [task, setTask] = useState<ReviewTask | null>(null);
    const [balance, setBalance] = useState<MerchantBalance>({ balance: 0, silver: 0 });
    const [useReward, setUseReward] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [reviewTaskId]);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }

        setLoading(true);
        try {
            // 获取追评任务信息
            const taskRes = await fetch(`${BASE_URL}/review-tasks/${reviewTaskId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const taskJson = await taskRes.json();

            if (!taskJson.success || !taskJson.data) {
                setError('追评任务不存在');
                setLoading(false);
                return;
            }

            if (taskJson.data.state !== 0) {
                setError('该任务已支付或状态不正确');
                setLoading(false);
                return;
            }

            setTask(taskJson.data);

            // 获取商家余额
            const profileRes = await fetch(`${BASE_URL}/merchants/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const profileJson = await profileRes.json();
            if (profileJson.success && profileJson.data) {
                setBalance({
                    balance: Number(profileJson.data.balance) || 0,
                    silver: Number(profileJson.data.silver) || 0
                });
            }

        } catch (e) {
            console.error(e);
            setError('加载数据失败');
        } finally {
            setLoading(false);
        }
    };

    // 计算支付明细
    const calculatePayment = () => {
        if (!task) return { silverDeduct: 0, balanceDeduct: 0, canPay: false };

        const total = Number(task.money);
        let silverDeduct = 0;
        let balanceDeduct = 0;

        if (!useReward) {
            // 纯押金支付
            balanceDeduct = total;
        } else {
            // 银锭+押金混合支付
            if (total > balance.silver) {
                silverDeduct = balance.silver;
                balanceDeduct = total - balance.silver;
            } else {
                silverDeduct = total;
            }
        }

        const canPay = (silverDeduct + balanceDeduct) <= (balance.silver + balance.balance) &&
            balanceDeduct <= balance.balance;

        return { silverDeduct, balanceDeduct, canPay };
    };

    const { silverDeduct, balanceDeduct, canPay } = calculatePayment();

    // 提交支付
    const handlePay = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !task) return;

        if (!canPay) {
            alert('余额不足，请充值');
            return;
        }

        if (!confirm(`确认支付 ¥${Number(task.money).toFixed(2)}？`)) return;

        setPaying(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/pay`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    reviewTaskId: task.id,
                    useReward: useReward
                })
            });
            const json = await res.json();

            if (json.success) {
                alert('支付成功！等待管理员审核');
                router.push('/merchant/reviews');
            } else {
                alert(json.message || '支付失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                加载中...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '48px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <div style={{ color: '#ef4444', marginBottom: '24px' }}>{error}</div>
                <button
                    onClick={() => router.push('/merchant/reviews')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#374151',
                        cursor: 'pointer'
                    }}
                >
                    返回
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>支付追评费用</h1>
                <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
                    任务编号: {task?.taskNumber}
                </p>
            </div>

            {/* 支付金额 */}
            <div style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: 'white',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>需支付</div>
                <div style={{ fontSize: '48px', fontWeight: '700' }}>
                    ¥{task ? Number(task.money).toFixed(2) : '0.00'}
                </div>
                <div style={{ fontSize: '13px', opacity: 0.8, marginTop: '8px' }}>
                    买手佣金: ¥{task ? Number(task.userMoney).toFixed(2) : '0.00'}
                </div>
            </div>

            {/* 账户余额 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>账户余额</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div style={{
                        padding: '16px',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '13px', color: '#92400e' }}>银锭余额</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#d97706', marginTop: '4px' }}>
                            {balance.silver.toFixed(2)}
                        </div>
                    </div>
                    <div style={{
                        padding: '16px',
                        background: '#dbeafe',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '13px', color: '#1e40af' }}>押金余额</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb', marginTop: '4px' }}>
                            ¥{balance.balance.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* 支付方式 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>支付方式</h2>

                <div
                    onClick={() => setUseReward(false)}
                    style={{
                        padding: '16px',
                        border: `2px solid ${!useReward ? '#4f46e5' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        background: !useReward ? '#eef2ff' : 'transparent'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${!useReward ? '#4f46e5' : '#d1d5db'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {!useReward && (
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f46e5' }} />
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: '500' }}>纯押金支付</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                使用押金余额支付全部费用
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    onClick={() => setUseReward(true)}
                    style={{
                        padding: '16px',
                        border: `2px solid ${useReward ? '#4f46e5' : '#e5e7eb'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: useReward ? '#eef2ff' : 'transparent'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: `2px solid ${useReward ? '#4f46e5' : '#d1d5db'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {useReward && (
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4f46e5' }} />
                            )}
                        </div>
                        <div>
                            <div style={{ fontWeight: '500' }}>银锭优先支付</div>
                            <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
                                优先使用银锭，不足部分用押金补足
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 支付明细 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>支付明细</h2>
                <div style={{ fontSize: '14px' }}>
                    {silverDeduct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#6b7280' }}>银锭扣除</span>
                            <span style={{ color: '#d97706', fontWeight: '500' }}>{silverDeduct.toFixed(2)} 银锭</span>
                        </div>
                    )}
                    {balanceDeduct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ color: '#6b7280' }}>押金扣除</span>
                            <span style={{ color: '#2563eb', fontWeight: '500' }}>¥{balanceDeduct.toFixed(2)}</span>
                        </div>
                    )}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        fontWeight: '600'
                    }}>
                        <span>合计</span>
                        <span style={{ color: '#ef4444' }}>¥{task ? Number(task.money).toFixed(2) : '0.00'}</span>
                    </div>
                </div>
            </div>

            {/* 余额不足提示 */}
            {!canPay && (
                <div style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    color: '#dc2626',
                    fontSize: '14px'
                }}>
                    ⚠️ 余额不足，请先充值
                </div>
            )}

            {/* 支付按钮 */}
            <div style={{ display: 'flex', gap: '12px' }}>
                <button
                    onClick={() => router.back()}
                    style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        background: '#fff',
                        color: '#374151',
                        fontSize: '16px',
                        cursor: 'pointer'
                    }}
                >
                    返回
                </button>
                <button
                    onClick={handlePay}
                    disabled={paying || !canPay}
                    style={{
                        flex: 2,
                        padding: '14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: paying || !canPay ? '#ccc' : '#4f46e5',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: paying || !canPay ? 'not-allowed' : 'pointer'
                    }}
                >
                    {paying ? '支付中...' : `确认支付 ¥${task ? Number(task.money).toFixed(2) : '0.00'}`}
                </button>
            </div>
        </div>
    );
}
