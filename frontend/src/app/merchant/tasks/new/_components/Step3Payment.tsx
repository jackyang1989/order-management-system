'use client';

import { TaskFormData } from './types';

interface StepProps {
    data: TaskFormData;
    merchant: { balance: number; silver: number; username: string } | null;
    onPrev: () => void;
    onSubmit: () => void;
    loading: boolean;
}

export default function Step3Payment({ data, merchant, onPrev, onSubmit, loading }: StepProps) {

    // Helper to format currency - handles undefined/null/string values
    const f = (n: number | string | undefined | null): string => {
        const num = Number(n);
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    const canSubmit = merchant && merchant.balance >= data.totalDeposit && merchant.silver >= 0; // Simplified check

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                第三步：费用确认与支付
            </h2>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
                {/* 费用清单 */}
                <div style={{ flex: 1, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', borderBottom: '1px solid #f3f4f6', paddingBottom: '12px' }}>
                        费用清单 ({data.count} 单)
                    </h3>

                    {/* 本金部分 */}
                    <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>本金/押金部分</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                            <span>商品本金 ({data.goodsPrice} × {data.count})</span>
                            <span>¥{f(data.goodsPrice * data.count)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                            <span>运费 ({data.postageMoney / data.count} × {data.count})</span>
                            <span>¥{f(data.postageMoney)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                            <span>商家保证金 (10.00 × {data.count})</span>
                            <span>¥{f(data.marginMoney)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb', fontWeight: '600', color: '#1f2937' }}>
                            <span>押金总计</span>
                            <span style={{ fontSize: '18px', color: '#059669' }}>¥{f(data.totalDeposit)}</span>
                        </div>
                    </div>

                    {/* 佣金部分 */}
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>佣金/服务费部分</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                            <span>基础服务费 ({data.baseServiceFee} × {data.count})</span>
                            <span>¥{f(data.baseServiceFee * data.count)}</span>
                        </div>
                        {data.praiseFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                <span>好评增值费 ({data.praiseFee} × {data.count})</span>
                                <span>¥{f(data.praiseFee * data.count)}</span>
                            </div>
                        )}
                        {data.timingPublishFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                <span>定时发布费 (1.00 × {data.count})</span>
                                <span>¥{f(data.timingPublishFee * data.count)}</span>
                            </div>
                        )}
                        {data.timingPayFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                <span>定时付款费 (1.00 × {data.count})</span>
                                <span>¥{f(data.timingPayFee * data.count)}</span>
                            </div>
                        )}
                        {data.addRewardFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                <span>额外悬赏费 ({data.addReward} × {data.count})</span>
                                <span>¥{f(data.addRewardFee * data.count)}</span>
                            </div>
                        )}
                        {data.cycleTimeFee > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                <span>周期延长费 ({f(data.cycleTimeFee)} × {data.count})</span>
                                <span>¥{f(Number(data.cycleTimeFee) * Number(data.count))}</span>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e5e7eb', fontWeight: '600', color: '#1f2937' }}>
                            <span>银锭/佣金总计</span>
                            <span style={{ fontSize: '18px', color: '#d97706' }}>¥{f(data.totalCommission)}</span>
                        </div>
                    </div>
                </div>

                {/* 支付方式 */}
                <div style={{ width: '300px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>账户余额</h3>

                    <div style={{ marginBottom: '16px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>可用本金余额</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>¥{merchant ? f(merchant.balance) : '0.00'}</div>
                        {merchant && merchant.balance < data.totalDeposit && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>余额不足，需充值 {f(data.totalDeposit - merchant.balance)}</div>
                        )}
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>可用银锭</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{merchant ? f(merchant.silver) : '0.00'}</div>
                        {merchant && merchant.silver < data.totalCommission && (
                            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>银锭不足，需充值 {f(data.totalCommission - merchant.silver)}</div>
                        )}
                    </div>

                    <button style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', marginBottom: '12px' }}>
                        💰 去充值
                    </button>

                </div>
            </div>

            {/* Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <button
                    onClick={onPrev}
                    disabled={loading}
                    style={{
                        background: '#fff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}
                >
                    上一步
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>实付总额</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc2626' }}>
                            ¥{f(data.totalDeposit + data.totalCommission)}
                        </div>
                    </div>
                    <button
                        onClick={onSubmit}
                        disabled={loading || !canSubmit}
                        style={{
                            background: canSubmit ? '#4f46e5' : '#9ca3af',
                            color: '#fff',
                            border: 'none',
                            padding: '12px 48px',
                            borderRadius: '8px',
                            cursor: canSubmit && !loading ? 'pointer' : 'not-allowed',
                            fontSize: '16px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        {loading ? '提交中...' : '确认发布'}
                    </button>
                </div>
            </div>
        </div>
    );
}
