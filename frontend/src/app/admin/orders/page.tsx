'use client';

import { useState, useEffect } from 'react';
import { adminService } from '../../../../services/adminService';
import { BASE_URL } from '../../../../apiConfig';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    userId: string;
    buynoId: string;
    buynoAccount: string;
    platform: string;
    productName: string;
    productPrice: number;
    commission: number;
    userPrincipal: number;
    sellerPrincipal: number;
    finalAmount: number;
    refundAmount: number;
    taobaoOrderNumber: string;
    deliveryState: number;
    delivery: string;
    deliveryNum: string;
    keywordImg: string;
    chatImg: string;
    orderDetailImg: string;
    highPraiseImg: string;
    receiveImg: string;
    praiseContent: string;
    praiseImages: string[];
    addressName: string;
    addressPhone: string;
    address: string;
    status: string;
    rejectReason: string;
    cancelRemarks: string;
    createdAt: string;
    completedAt: string;
}

const statusLabels: Record<string, { text: string; color: string }> = {
    PENDING: { text: '进行中', color: '#1890ff' },
    SUBMITTED: { text: '待审核', color: '#faad14' },
    APPROVED: { text: '已通过', color: '#52c41a' },
    REJECTED: { text: '已驳回', color: '#ff4d4f' },
    COMPLETED: { text: '已完成', color: '#8c8c8c' },
    CANCELLED: { text: '已取消', color: '#d9d9d9' },
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState<string>('');
    const [keyword, setKeyword] = useState('');
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Order | null>(null);
    const [imageModal, setImageModal] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, [page, filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await adminService.getOrders({ page, limit: 20, status: filter, keyword });
            if (res.data) {
                setOrders(res.data.data || []);
                setTotal(res.data.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadOrders();
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/orders?`;
            if (filter) url += `status=${filter}&`;
            if (keyword) url += `keyword=${keyword}&`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `orders_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
            } else {
                alert('导出失败');
            }
        } catch (e) {
            console.error(e);
            alert('导出失败');
        } finally {
            setExporting(false);
        }
    };

    const renderImageThumbnail = (url: string | undefined, label: string) => {
        if (!url) return null;
        return (
            <div style={{ textAlign: 'center' }}>
                <img
                    src={url}
                    alt={label}
                    style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: '1px solid #d9d9d9' }}
                    onClick={() => setImageModal(url)}
                />
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{label}</div>
            </div>
        );
    };

    return (
        <div>
            {/* Filter Bar */}
            <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="订单号/任务标题/淘宝号"
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', width: '200px' }}
                            />
                            <button type="submit" style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>搜索</button>
                        </form>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[
                                { label: '全部', value: '' },
                                { label: '进行中', value: 'PENDING' },
                                { label: '待审核', value: 'SUBMITTED' },
                                { label: '已通过', value: 'APPROVED' },
                                { label: '已驳回', value: 'REJECTED' },
                            ].map(item => (
                                <button
                                    key={item.value}
                                    onClick={() => { setFilter(item.value); setPage(1); }}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '4px',
                                        border: filter === item.value ? '1px solid #1890ff' : '1px solid #d9d9d9',
                                        background: filter === item.value ? '#e6f7ff' : '#fff',
                                        color: filter === item.value ? '#1890ff' : '#666',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '4px',
                            border: 'none',
                            background: exporting ? '#95d475' : '#52c41a',
                            color: '#fff',
                            cursor: exporting ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px'
                        }}
                    >
                        {exporting ? '导出中...' : '导出Excel'}
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>加载中...</div>
                ) : orders.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>暂无订单数据</div>
                ) : (
                    <>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#fafafa' }}>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>订单ID</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>任务标题</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>买号</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'left', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>平台</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>金额</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>佣金</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>状态</th>
                                    <th style={{ padding: '14px 16px', textAlign: 'center', fontWeight: '500', color: '#000', borderBottom: '1px solid #f0f0f0' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(order => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                        <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#666' }}>
                                            {order.id.slice(0, 8)}...
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#000', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {order.taskTitle}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{order.buynoAccount}</td>
                                        <td style={{ padding: '14px 16px', color: '#666' }}>{order.platform}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#000', fontWeight: '500' }}>¥{Number(order.productPrice).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'right', color: '#52c41a', fontWeight: '500' }}>¥{Number(order.commission).toFixed(2)}</td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '12px',
                                                background: (statusLabels[order.status]?.color || '#999') + '20',
                                                color: statusLabels[order.status]?.color || '#999'
                                            }}>
                                                {statusLabels[order.status]?.text || order.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                            <button onClick={() => setDetailModal(order)} style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid #1890ff', background: '#fff', color: '#1890ff', cursor: 'pointer' }}>查看</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        <div style={{ padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d9d9d9',
                                    background: '#fff',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                                    opacity: page === 1 ? 0.5 : 1
                                }}
                            >
                                上一页
                            </button>
                            <span style={{ padding: '6px 12px', color: '#666' }}>第 {page} 页</span>
                            <button
                                onClick={() => setPage(p => p + 1)}
                                disabled={orders.length < 20}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    border: '1px solid #d9d9d9',
                                    background: '#fff',
                                    cursor: orders.length < 20 ? 'not-allowed' : 'pointer',
                                    opacity: orders.length < 20 ? 0.5 : 1
                                }}
                            >
                                下一页
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Modal Logic (Preserved entirely) */}
            {detailModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', borderRadius: '8px', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                            <h3 style={{ margin: 0, fontSize: '16px' }}>订单详情</h3>
                            <button onClick={() => setDetailModal(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }}>x</button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            {/* Basic Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>基本信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>订单ID：</span><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{detailModal.id}</span></div>
                                    <div><span style={{ color: '#999' }}>任务ID：</span><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{detailModal.taskId}</span></div>
                                    <div><span style={{ color: '#999' }}>任务标题：</span>{detailModal.taskTitle}</div>
                                    <div><span style={{ color: '#999' }}>平台：</span>{detailModal.platform}</div>
                                    <div><span style={{ color: '#999' }}>买号：</span><span style={{ color: '#1890ff' }}>{detailModal.buynoAccount}</span></div>
                                    <div><span style={{ color: '#999' }}>淘宝订单号：</span>{detailModal.taobaoOrderNumber || '-'}</div>
                                    <div><span style={{ color: '#999' }}>状态：</span>
                                        <span style={{ color: statusLabels[detailModal.status]?.color }}>{statusLabels[detailModal.status]?.text || detailModal.status}</span>
                                    </div>
                                    <div><span style={{ color: '#999' }}>创建时间：</span>{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</div>
                                </div>
                            </div>

                            {/* Amount Info */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>金额信息</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    <div><span style={{ color: '#999' }}>商品价格：</span><span style={{ color: '#000', fontWeight: '500' }}>¥{Number(detailModal.productPrice).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>佣金：</span><span style={{ color: '#52c41a', fontWeight: '500' }}>¥{Number(detailModal.commission).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>实付金额：</span><span style={{ color: '#fa8c16', fontWeight: '500' }}>¥{Number(detailModal.finalAmount).toFixed(2)}</span></div>
                                    <div><span style={{ color: '#999' }}>买手本金：</span>¥{Number(detailModal.userPrincipal).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>商家本金：</span>¥{Number(detailModal.sellerPrincipal).toFixed(2)}</div>
                                    <div><span style={{ color: '#999' }}>退款金额：</span>¥{Number(detailModal.refundAmount).toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Screenshots */}
                            <div style={{ marginBottom: '24px' }}>
                                <h4 style={{ fontSize: '14px', color: '#666', marginBottom: '12px', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>订单截图</h4>
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                    {renderImageThumbnail(detailModal.keywordImg, '搜索截图')}
                                    {renderImageThumbnail(detailModal.chatImg, '假聊截图')}
                                    {renderImageThumbnail(detailModal.orderDetailImg, '订单截图')}
                                    {renderImageThumbnail(detailModal.highPraiseImg, '好评截图')}
                                    {renderImageThumbnail(detailModal.receiveImg, '收货截图')}
                                    {!detailModal.keywordImg && !detailModal.chatImg && !detailModal.orderDetailImg && !detailModal.highPraiseImg && !detailModal.receiveImg && (
                                        <div style={{ color: '#999', padding: '20px' }}>暂无截图</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Preview Modal */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, cursor: 'zoom-out' }}>
                    <img src={imageModal} alt="预览" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }} />
                </div>
            )}
        </div>
    );
}
