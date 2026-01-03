'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOrderDetail } from '../../../../services/orderService';
import { MockOrder } from '../../../../mocks/orderMock';
import { isAuthenticated } from '../../../../services/authService';
import BottomNav from '../../../../components/BottomNav';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [order, setOrder] = useState<MockOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadOrder();
    }, [id, router]);

    const loadOrder = async () => {
        setLoading(true);
        const result = await fetchOrderDetail(id);
        if (result) {
            setOrder(result);
        } else {
            alert('订单不存在');
            router.back();
        }
        setLoading(false);
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
            <div style={{ color: '#86868b', fontSize: '14px' }}>正在调取任务档案...</div>
        </div>
    );
    if (!order) return null;

    // 格式化价格显示
    const formatPrice = (val: any) => Number(val || 0).toFixed(2);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at 100% 0%, #fefeff 0%, #f5f8ff 50%, #f0f4ff 100%)',
            paddingBottom: '100px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
        }}>
            {/* Header - 沉浸式毛玻璃 */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', color: '#007aff', fontWeight: 'bold' }}>←</div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#1d1d1f' }}>任务详情</div>
                <div style={{ width: '20px' }}></div>
            </div>

            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
                {/* 状态总览卡片 - 物理质感 */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '28px',
                    padding: '24px',
                    marginBottom: '20px',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', fontWeight: '600', marginBottom: '4px' }}>任务单号</div>
                            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d1d1f' }}>{order.taskNumber || order.id}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{
                                background: order.status === 'COMPLETED' ? '#34c759' : '#007aff',
                                color: 'white',
                                padding: '4px 12px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: '700'
                            }}>
                                {order.statusLabel}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d1d1f', marginBottom: '6px' }}>{order.shopName}</div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <span style={{ background: '#f5f5f7', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#86868b', fontWeight: '600' }}>
                                    {order.taskType || '关键词任务'}
                                </span>
                                <span style={{ background: 'rgba(255, 107, 53, 0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', color: '#ff6b35', fontWeight: '600' }}>
                                    {order.terminal === '1' || order.terminal === 1 ? '本佣货返' : '本立佣货'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 核心财务信息 - 磁贴网格 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: '#1d1d1f', borderRadius: '24px', padding: '20px', color: 'white', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                        <div style={{ fontSize: '11px', opacity: 0.6, marginBottom: '4px' }}>垫付本金</div>
                        <div style={{ fontSize: '24px', fontWeight: '800' }}><span style={{ fontSize: '14px', marginRight: '2px' }}>¥</span>{formatPrice(order.principal)}</div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '20px', color: '#1d1d1f', border: '1px solid #f0f0f2', boxShadow: '0 8px 24px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontSize: '11px', color: '#86868b', marginBottom: '4px' }}>预估收入</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#34c759' }}><span style={{ fontSize: '14px', marginRight: '2px' }}>¥</span>{formatPrice(Number(order.commission || 0) + Number(order.userDivided || 0))}</div>
                    </div>
                </div>

                {/* 任务详情流水 */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: '28px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)'
                }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#1d1d1f', marginBottom: '20px' }}>任务进度</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {[
                            { label: '领取任务', time: order.createdAt, detail: '任务已成功指派至您的买号' },
                            { label: '商品核对', time: order.updatedAt, detail: '商品链接/淘口令验证通过' },
                            { label: '提交订单', time: order.deliveryTime || '-', detail: `订单号: ${order.taobaoOrderNumber || '待提交'}` },
                            { label: '返款进度', time: order.platformRefundTime || '-', detail: order.status === 'COMPLETED' ? '资金已结算至您的钱包' : '待操作' },
                            { label: '最终状态', time: order.endingTime || '-', detail: order.statusLabel || '-' }
                        ].map((step, idx, arr) => (
                            <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                {/* 进度线 */}
                                {idx !== arr.length - 1 && (
                                    <div style={{ position: 'absolute', left: '11px', top: '24px', width: '2px', height: 'calc(100% + 4px)', background: '#f5f5f7' }} />
                                )}
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: step.time && step.time !== '-' ? '#007aff' : '#f5f5f7',
                                    border: step.time && step.time !== '-' ? '4px solid rgba(0,122,255,0.2)' : '4px solid transparent',
                                    zIndex: 1, flexShrink: 0
                                }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d1d1f' }}>{step.label}</div>
                                        <div style={{ fontSize: '11px', color: '#c7c7cc' }}>{step.time && step.time !== '-' ? new Date(step.time).toLocaleString() : ''}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#86868b' }}>{step.detail}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 备注区域 */}
                {order.memo && (
                    <div style={{ marginTop: '20px', padding: '16px 20px', background: 'rgba(0,122,255,0.05)', borderRadius: '20px', border: '1px solid rgba(0,122,255,0.1)' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#007aff', marginBottom: '6px' }}>商家留言</div>
                        <div style={{ fontSize: '13px', color: '#1d1d1f', lineHeight: '1.6' }}>{order.memo}</div>
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
