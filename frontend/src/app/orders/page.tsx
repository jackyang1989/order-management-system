'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { fetchMyOrders } from '../../services/orderService';
import { MockOrder } from '../../mocks/orderMock';
import { isAuthenticated } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

// 原版任务状态选项（对应原版 options1）
const STATUS_OPTIONS = [
    { value: '', label: '全部状态' },
    { value: 'WAITING_DELIVERY', label: '已打印快递单，待发货' },
    { value: 'WAITING_RECEIVE', label: '已发货，待确认收货' },
    { value: 'WAITING_REFUND', label: '已确认收货，待商家返款' },
    { value: 'WAITING_REVIEW_REFUND', label: '商家已返款，待确认返款' },
    { value: 'COMPLETED', label: '已完成' },
    { value: 'TIMEOUT', label: '已超时' },
    { value: 'CANCELLED', label: '已取消' },
    { value: 'ABANDONED', label: '自动放弃' },
];

// 追评任务状态（对应原版 options5）
const REVIEW_STATUS_OPTIONS = [
    { value: '', label: '全部追评' },
    { value: '1', label: '待处理追评任务' },
    { value: '2', label: '待返款追评任务' },
    { value: '3', label: '已完成追评任务' },
    { value: '4', label: '已拒接追评任务' },
];

// 任务类型（对应原版 options3）
const TASK_TYPE_OPTIONS = [
    { value: '', label: '全部类型' },
    { value: 'keyword', label: '关键词' },
    { value: 'taokoling', label: '淘口令' },
    { value: 'qrcode', label: '二维码' },
    { value: 'ztc', label: '直通车' },
    { value: 'channel', label: '通道任务' },
];

// 返款方式（对应原版 options4）
const REFUND_TYPE_OPTIONS = [
    { value: '', label: '全部返款' },
    { value: 'benlijong', label: '本立佣货' },
    { value: 'benyonghuo', label: '本佣货返' },
];

export default function OrdersPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<MockOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // 筛选状态
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
    const [buynoFilter, setBuynoFilter] = useState('');
    const [taskTypeFilter, setTaskTypeFilter] = useState('');
    const [refundTypeFilter, setRefundTypeFilter] = useState('');
    const [reviewFilter, setReviewFilter] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // 分页
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // 批量选择
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadOrders();
    }, [statusFilter, buynoFilter, taskTypeFilter, refundTypeFilter, reviewFilter, currentPage, router]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const result = await fetchMyOrders(statusFilter || undefined);
            setOrders(result);
            setTotal(result.length);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setCurrentPage(1);
        loadOrders();
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.map(o => o.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectOrder = (orderId: string) => {
        if (selectedIds.includes(orderId)) {
            setSelectedIds(selectedIds.filter(id => id !== orderId));
        } else {
            setSelectedIds([...selectedIds, orderId]);
        }
    };

    const handleBatchConfirmRefund = async () => {
        if (selectedIds.length === 0) {
            alert('请选择要确认返款的订单');
            return;
        }
        if (confirm(`确认返款 ${selectedIds.length} 个订单？`)) {
            // TODO: 调用批量确认返款API
            alert('批量确认返款功能开发中');
        }
    };

    // 根据状态获取操作按钮
    const getActionButton = (order: MockOrder) => {
        const status = order.status;
        switch (status) {
            case 'WAITING_RECEIVE':
                return { label: '去收货', action: `/orders/${order.id}?action=receive` };
            case 'WAITING_REVIEW_REFUND':
                return { label: '确认返款', action: `/orders/${order.id}?action=confirm` };
            case 'PENDING':
                return { label: '继续任务', action: `/orders/${order.id}` };
            default:
                return { label: '查看详情', action: `/orders/${order.id}` };
        }
    };

    // 获取状态颜色
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return '#07c160';
            case 'CANCELLED':
            case 'ABANDONED':
            case 'TIMEOUT':
                return '#999';
            case 'WAITING_REFUND':
            case 'WAITING_REVIEW_REFUND':
                return '#ff9500';
            default:
                return '#409eff';
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>任务管理</div>
                    <div
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ fontSize: '14px', cursor: 'pointer', opacity: 0.8 }}
                    >
                        {showFilters ? '收起' : '筛选'}
                    </div>
                </div>

                {/* 搜索框 */}
                <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <input
                        type="text"
                        placeholder="请输入任务编号搜索"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#ffd700',
                            color: '#1d1d1f',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        搜索
                    </button>
                </div>
            </div>

            {/* 筛选面板 */}
            {showFilters && (
                <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderBottom: '1px solid #e5e5e5'
                }}>
                    {/* 任务状态 */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务状态</div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #e5e5e5',
                                fontSize: '14px'
                            }}
                        >
                            {STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 两列筛选 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务类型</div>
                            <select
                                value={taskTypeFilter}
                                onChange={(e) => { setTaskTypeFilter(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            >
                                {TASK_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>返款方式</div>
                            <select
                                value={refundTypeFilter}
                                onChange={(e) => { setRefundTypeFilter(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            >
                                {REFUND_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 追评任务 */}
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>追评任务</div>
                        <select
                            value={reviewFilter}
                            onChange={(e) => { setReviewFilter(e.target.value); setCurrentPage(1); }}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #e5e5e5',
                                fontSize: '14px'
                            }}
                        >
                            {REVIEW_STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* 快捷Tab切换 */}
            <div style={{
                background: '#fff',
                display: 'flex',
                overflowX: 'auto',
                borderBottom: '1px solid #e5e5e5',
                marginBottom: '10px'
            }}>
                {[
                    { key: '', label: '全部' },
                    { key: 'PENDING', label: '进行中' },
                    { key: 'WAITING_DELIVERY', label: '待发货' },
                    { key: 'WAITING_RECEIVE', label: '待收货' },
                    { key: 'WAITING_REFUND', label: '待返款' },
                    { key: 'WAITING_REVIEW_REFUND', label: '待确认' },
                    { key: 'COMPLETED', label: '已完成' },
                ].map((tab) => (
                    <div
                        key={tab.key}
                        onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                        style={{
                            flex: 'none',
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: statusFilter === tab.key ? '#409eff' : '#666',
                            borderBottom: statusFilter === tab.key ? '2px solid #409eff' : 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* 批量操作栏 */}
            {statusFilter === 'WAITING_REVIEW_REFUND' && (
                <div style={{
                    background: '#fff',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e5e5e5',
                    marginBottom: '10px'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            style={{ width: '18px', height: '18px' }}
                        />
                        全选
                    </label>
                    <button
                        onClick={handleBatchConfirmRefund}
                        disabled={selectedIds.length === 0}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            background: selectedIds.length > 0 ? '#ff9500' : '#ccc',
                            color: '#fff',
                            fontWeight: '600',
                            cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed'
                        }}
                    >
                        确认返款 ({selectedIds.length})
                    </button>
                </div>
            )}

            {/* 订单列表 */}
            <div style={{ padding: '0 12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        暂无订单
                    </div>
                ) : (
                    orders.map((order) => {
                        const actionBtn = getActionButton(order);
                        return (
                            <div key={order.id} style={{
                                background: '#fff',
                                borderRadius: '12px',
                                marginBottom: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                {/* 卡片头部 */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid #f5f5f5',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {statusFilter === 'WAITING_REVIEW_REFUND' && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(order.id)}
                                                onChange={() => handleSelectOrder(order.id)}
                                                style={{ width: '18px', height: '18px' }}
                                            />
                                        )}
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '18px'
                                        }}>
                                            🏪
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                                {order.shopName}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#999' }}>
                                                {order.taskNumber}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: getStatusColor(order.status),
                                        padding: '4px 10px',
                                        background: `${getStatusColor(order.status)}15`,
                                        borderRadius: '12px'
                                    }}>
                                        {order.statusLabel}
                                    </div>
                                </div>

                                {/* 卡片内容 */}
                                <div style={{ padding: '12px 16px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '8px',
                                        fontSize: '13px',
                                        color: '#666'
                                    }}>
                                        <div>买号：<span style={{ color: '#333' }}>{order.buyerAccount}</span></div>
                                        <div>类型：<span style={{ color: '#333' }}>{order.taskType || '关键词'}</span></div>
                                        <div>
                                            垫付：<span style={{ color: '#409eff', fontWeight: '600' }}>¥{order.principal}</span>
                                        </div>
                                        <div>
                                            佣金：<span style={{ color: '#07c160', fontWeight: '600' }}>¥{(order.commission + order.userDivided).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 卡片底部操作 */}
                                <div style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid #f5f5f5',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {order.createTime}
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Link href={`/orders/${order.id}`}>
                                            <button style={{
                                                padding: '6px 16px',
                                                borderRadius: '16px',
                                                border: '1px solid #ddd',
                                                background: '#fff',
                                                color: '#666',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}>
                                                查看详情
                                            </button>
                                        </Link>
                                        {actionBtn.label !== '查看详情' && (
                                            <Link href={actionBtn.action}>
                                                <button style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '16px',
                                                    border: 'none',
                                                    background: '#ff9500',
                                                    color: '#fff',
                                                    fontSize: '12px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}>
                                                    {actionBtn.label}
                                                </button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 分页信息 */}
            {!loading && orders.length > 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    fontSize: '12px',
                    color: '#999'
                }}>
                    共 {total} 条记录
                </div>
            )}

            <BottomNav />
        </div>
    );
}
