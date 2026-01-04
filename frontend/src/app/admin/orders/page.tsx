'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Modal, Descriptions, Image, message } from 'antd';
import { SearchOutlined, ReloadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminService } from '../../../services/adminService';
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
    PENDING: { text: '进行中', color: 'processing' },
    SUBMITTED: { text: '待审核', color: 'warning' },
    APPROVED: { text: '已通过', color: 'success' },
    REJECTED: { text: '已驳回', color: 'error' },
    COMPLETED: { text: '已完成', color: 'default' },
    CANCELLED: { text: '已取消', color: 'default' },
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

    useEffect(() => { loadOrders(); }, [page, filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await adminService.getOrders({ page, limit: 20, status: filter, keyword });
            if (res.data) { setOrders(res.data.data || []); setTotal(res.data.total || 0); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSearch = () => { setPage(1); loadOrders(); };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            const res = await fetch(`${BASE_URL}/excel/export/orders?status=${filter}&keyword=${keyword}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                message.success('导出成功');
            } else { message.error('导出失败'); }
        } catch (e) { message.error('导出失败'); } finally { setExporting(false); }
    };

    const columns: ColumnsType<Order> = [
        { title: '订单号', dataIndex: 'taobaoOrderNumber', width: 130, render: (v) => <code style={{ fontSize: 11 }}>{v || '-'}</code> },
        { title: '商品', dataIndex: 'productName', width: 180, ellipsis: true },
        { title: '买号', dataIndex: 'buynoAccount', width: 120, ellipsis: true },
        { title: '金额', dataIndex: 'productPrice', width: 90, align: 'right', render: (v) => <span style={{ fontWeight: 500 }}>¥{Number(v).toFixed(2)}</span> },
        { title: '佣金', dataIndex: 'commission', width: 80, align: 'right', render: (v) => <span style={{ color: '#52c41a' }}>¥{Number(v).toFixed(2)}</span> },
        { title: '物流', key: 'delivery', width: 100, render: (_, r) => r.deliveryState === 1 ? <Tag color="success">已发货</Tag> : <Tag>待发货</Tag> },
        { title: '状态', dataIndex: 'status', width: 90, align: 'center', render: (v) => <Tag color={statusLabels[v]?.color}>{statusLabels[v]?.text || v}</Tag> },
        { title: '创建时间', dataIndex: 'createdAt', width: 110, render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-' },
        {
            title: '操作', key: 'actions', width: 100, render: (_, r) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(r)}>查看</Button>
            )
        },
    ];

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="搜索订单号/商品名..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 220 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        value={filter}
                        onChange={(v) => { setFilter(v); setPage(1); }}
                        style={{ width: 120 }}
                        placeholder="全部状态"
                        allowClear
                        options={[
                            { value: '', label: '全部状态' },
                            { value: 'PENDING', label: '进行中' },
                            { value: 'SUBMITTED', label: '待审核' },
                            { value: 'APPROVED', label: '已通过' },
                            { value: 'REJECTED', label: '已驳回' },
                            { value: 'COMPLETED', label: '已完成' },
                        ]}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                    <Button icon={<ReloadOutlined />} onClick={loadOrders}>刷新</Button>
                    <Button icon={<DownloadOutlined />} onClick={handleExport} loading={exporting} style={{ background: '#52c41a', color: '#fff' }}>导出</Button>
                </Space>
            </Card>

            <Card>
                <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} scroll={{ x: 1100 }}
                    pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }} />
            </Card>

            <Modal title="订单详情" open={!!detailModal} onCancel={() => setDetailModal(null)} width={800} footer={<Button onClick={() => setDetailModal(null)}>关闭</Button>}>
                {detailModal && (
                    <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        <Descriptions title="订单信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="订单号">{detailModal.taobaoOrderNumber || '-'}</Descriptions.Item>
                            <Descriptions.Item label="状态"><Tag color={statusLabels[detailModal.status]?.color}>{statusLabels[detailModal.status]?.text}</Tag></Descriptions.Item>
                            <Descriptions.Item label="商品名称" span={2}>{detailModal.productName}</Descriptions.Item>
                            <Descriptions.Item label="买号">{detailModal.buynoAccount}</Descriptions.Item>
                            <Descriptions.Item label="平台">{detailModal.platform || '-'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="金额信息" column={3} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="商品价格">¥{Number(detailModal.productPrice).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="佣金">¥{Number(detailModal.commission).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="实付金额">¥{Number(detailModal.finalAmount || 0).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="用户本金">¥{Number(detailModal.userPrincipal || 0).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="商家本金">¥{Number(detailModal.sellerPrincipal || 0).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="退款金额">¥{Number(detailModal.refundAmount || 0).toFixed(2)}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="物流信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="物流状态">{detailModal.deliveryState === 1 ? <Tag color="success">已发货</Tag> : <Tag>待发货</Tag>}</Descriptions.Item>
                            <Descriptions.Item label="快递公司">{detailModal.delivery || '-'}</Descriptions.Item>
                            <Descriptions.Item label="快递单号" span={2}>{detailModal.deliveryNum || '-'}</Descriptions.Item>
                            <Descriptions.Item label="收货人">{detailModal.addressName || '-'}</Descriptions.Item>
                            <Descriptions.Item label="联系电话">{detailModal.addressPhone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="收货地址" span={2}>{detailModal.address || '-'}</Descriptions.Item>
                        </Descriptions>

                        {detailModal.praiseContent && (
                            <Descriptions title="评价信息" column={1} bordered size="small" style={{ marginBottom: 24 }}>
                                <Descriptions.Item label="评价内容">{detailModal.praiseContent}</Descriptions.Item>
                            </Descriptions>
                        )}

                        {(detailModal.keywordImg || detailModal.orderDetailImg) && (
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ fontWeight: 500, marginBottom: 12 }}>截图凭证</div>
                                <Image.PreviewGroup>
                                    <Space>
                                        {detailModal.keywordImg && <Image src={detailModal.keywordImg} width={100} height={100} style={{ objectFit: 'cover' }} />}
                                        {detailModal.orderDetailImg && <Image src={detailModal.orderDetailImg} width={100} height={100} style={{ objectFit: 'cover' }} />}
                                        {detailModal.receiveImg && <Image src={detailModal.receiveImg} width={100} height={100} style={{ objectFit: 'cover' }} />}
                                    </Space>
                                </Image.PreviewGroup>
                            </div>
                        )}

                        <Descriptions title="时间信息" column={2} bordered size="small">
                            <Descriptions.Item label="创建时间">{detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
                            <Descriptions.Item label="完成时间">{detailModal.completedAt ? new Date(detailModal.completedAt).toLocaleString('zh-CN') : '-'}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
}
