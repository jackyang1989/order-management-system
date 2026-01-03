'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    productName: string;
    productPrice: number;
    buynoAccount: string;
    taobaoOrderNumber: string;
    completedAt: string;
}

interface GoodsPraiseSetting {
    goodsId: string;
    goodsName: string;
    isPraise: boolean;
    praiseContent: string;
    isImgPraise: boolean;
    praiseImages: string[];
    isVideoPraise: boolean;
    praiseVideo: string;
}

// 追评费用标准
const REVIEW_PRICE = {
    TEXT: 2,    // 文字追评 2元/件
    IMAGE: 3,   // 图片追评 3元/件
    VIDEO: 10,  // 视频追评 10元/件
};

function CreateReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [goodsSettings, setGoodsSettings] = useState<GoodsPraiseSetting[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderId) {
            router.push('/merchant/reviews');
            return;
        }
        loadOrderInfo();
    }, [orderId, router]);

    const loadOrderInfo = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            router.push('/merchant/login');
            return;
        }

        setLoading(true);
        try {
            // 检查订单是否可追评
            const checkRes = await fetch(`${BASE_URL}/review-tasks/merchant/check/${orderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const checkJson = await checkRes.json();

            if (!checkJson.success || !checkJson.data?.canReview) {
                setError(checkJson.data?.reason || '该订单不可追评');
                setLoading(false);
                return;
            }

            setOrder(checkJson.data.order);

            // 初始化商品追评设置
            // 这里简化处理，实际应该从 task_goods 表获取商品列表
            setGoodsSettings([{
                goodsId: checkJson.data.order.taskId,
                goodsName: checkJson.data.order.productName || '商品',
                isPraise: false,
                praiseContent: '',
                isImgPraise: false,
                praiseImages: [],
                isVideoPraise: false,
                praiseVideo: ''
            }]);

        } catch (e) {
            console.error(e);
            setError('加载订单信息失败');
        } finally {
            setLoading(false);
        }
    };

    // 计算总费用
    const calculateTotal = (): number => {
        let total = 0;
        for (const goods of goodsSettings) {
            if (goods.isPraise) total += REVIEW_PRICE.TEXT;
            if (goods.isImgPraise) total += REVIEW_PRICE.IMAGE;
            if (goods.isVideoPraise) total += REVIEW_PRICE.VIDEO;
        }
        return total;
    };

    // 更新商品设置
    const updateGoodsSetting = (index: number, field: keyof GoodsPraiseSetting, value: any) => {
        const newSettings = [...goodsSettings];
        (newSettings[index] as any)[field] = value;
        setGoodsSettings(newSettings);
    };

    // 提交创建追评任务
    const handleSubmit = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !orderId) return;

        // 验证
        const total = calculateTotal();
        if (total <= 0) {
            alert('请至少选择一种追评类型');
            return;
        }

        for (const goods of goodsSettings) {
            if (goods.isPraise && !goods.praiseContent.trim()) {
                alert('请填写文字追评内容');
                return;
            }
            if (goods.isImgPraise && goods.praiseImages.length === 0) {
                alert('请上传图片追评');
                return;
            }
            if (goods.isVideoPraise && !goods.praiseVideo) {
                alert('请上传视频追评');
                return;
            }
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userTaskId: orderId,
                    goods: goodsSettings.map(g => ({
                        goodsId: g.goodsId,
                        isPraise: g.isPraise,
                        praiseContent: g.praiseContent,
                        isImgPraise: g.isImgPraise,
                        praiseImages: g.praiseImages,
                        isVideoPraise: g.isVideoPraise,
                        praiseVideo: g.praiseVideo
                    }))
                })
            });
            const json = await res.json();

            if (json.success) {
                // 跳转到支付页面
                router.push(`/merchant/reviews/pay/${json.data.id}`);
            } else {
                alert(json.message || '创建失败');
            }
        } catch (e) {
            alert('网络错误');
        } finally {
            setSubmitting(false);
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

    const total = calculateTotal();

    return (
        <div>
            {/* 页面标题 */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>发布追评任务</h1>
                <p style={{ color: '#6b7280', marginTop: '8px', fontSize: '14px' }}>
                    为已完成的订单发布追评任务，买手完成追评后可获得佣金
                </p>
            </div>

            {/* 订单信息 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>订单信息</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '14px' }}>
                    <div>
                        <span style={{ color: '#6b7280' }}>商品名称：</span>
                        {order?.productName}
                    </div>
                    <div>
                        <span style={{ color: '#6b7280' }}>买号：</span>
                        {order?.buynoAccount}
                    </div>
                    <div>
                        <span style={{ color: '#6b7280' }}>淘宝订单号：</span>
                        {order?.taobaoOrderNumber || '-'}
                    </div>
                    <div>
                        <span style={{ color: '#6b7280' }}>完成时间：</span>
                        {order?.completedAt ? new Date(order.completedAt).toLocaleString('zh-CN') : '-'}
                    </div>
                </div>
            </div>

            {/* 追评内容设置 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>追评内容设置</h2>

                {goodsSettings.map((goods, idx) => (
                    <div key={goods.goodsId} style={{
                        padding: '16px',
                        background: '#f9fafb',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontWeight: '500', marginBottom: '16px' }}>
                            {goods.goodsName}
                        </div>

                        {/* 文字追评 */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={goods.isPraise}
                                    onChange={(e) => updateGoodsSetting(idx, 'isPraise', e.target.checked)}
                                />
                                <span style={{ fontWeight: '500' }}>文字追评</span>
                                <span style={{ color: '#10b981', fontSize: '13px' }}>+{REVIEW_PRICE.TEXT}元</span>
                            </label>
                            {goods.isPraise && (
                                <textarea
                                    value={goods.praiseContent}
                                    onChange={(e) => updateGoodsSetting(idx, 'praiseContent', e.target.value)}
                                    placeholder="请输入追评文字内容..."
                                    style={{
                                        width: '100%',
                                        height: '100px',
                                        padding: '12px',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '8px',
                                        resize: 'none',
                                        fontSize: '14px'
                                    }}
                                />
                            )}
                        </div>

                        {/* 图片追评 */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={goods.isImgPraise}
                                    onChange={(e) => updateGoodsSetting(idx, 'isImgPraise', e.target.checked)}
                                />
                                <span style={{ fontWeight: '500' }}>图片追评</span>
                                <span style={{ color: '#10b981', fontSize: '13px' }}>+{REVIEW_PRICE.IMAGE}元</span>
                            </label>
                            {goods.isImgPraise && (
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    图片上传功能需要集成OSS（暂未实现）
                                </div>
                            )}
                        </div>

                        {/* 视频追评 */}
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={goods.isVideoPraise}
                                    onChange={(e) => updateGoodsSetting(idx, 'isVideoPraise', e.target.checked)}
                                />
                                <span style={{ fontWeight: '500' }}>视频追评</span>
                                <span style={{ color: '#10b981', fontSize: '13px' }}>+{REVIEW_PRICE.VIDEO}元</span>
                            </label>
                            {goods.isVideoPraise && (
                                <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                    视频上传功能需要集成OSS（暂未实现）
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* 费用汇总 */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                padding: '20px',
                marginBottom: '20px'
            }}>
                <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>费用汇总</h2>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>追评费用</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                            买手获得50%佣金
                        </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                        ¥{total.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* 提交按钮 */}
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
                    取消
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || total <= 0}
                    style={{
                        flex: 2,
                        padding: '14px',
                        borderRadius: '8px',
                        border: 'none',
                        background: submitting || total <= 0 ? '#ccc' : '#4f46e5',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: submitting || total <= 0 ? 'not-allowed' : 'pointer'
                    }}
                >
                    {submitting ? '提交中...' : '下一步：支付'}
                </button>
            </div>
        </div>
    );
}

export default function CreateReviewPage() {
    return (
        <Suspense fallback={
            <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>加载中...</div>
        }>
            <CreateReviewContent />
        </Suspense>
    );
}
