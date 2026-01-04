'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Select, Button, Tag, Space, Modal, Descriptions, Progress, Image, message, Radio, Spin } from 'antd';
import { ReloadOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { BASE_URL } from '../../../../apiConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    createdAt: string;
    url: string;
    mainImage: string;
    keyword: string;
    taoWord: string;
    taobaoId: string;
    qrCode: string;
    remark: string;
    merchantId: string;
    merchant?: { id: string; merchantName: string; phone: string };
    goodsMoney: number;
    shippingFee: number;
    margin: number;
    extraReward: number;
    baseServiceFee: number;
    refundServiceFee: number;
    totalDeposit: number;
    totalCommission: number;
    isPraise: boolean;
    praiseFee: number;
    isImgPraise: boolean;
    imgPraiseFee: number;
    isVideoPraise: boolean;
    videoPraiseFee: number;
    terminal: number;
    taskTimeLimit: number;
    isFreeShipping: boolean;
    isPresale: boolean;
    isTimingPublish: boolean;
    publishTime: string;
    updatedAt: string;
}

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待支付', color: 'default' },
    1: { text: '进行中', color: 'success' },
    2: { text: '已完成', color: 'processing' },
    3: { text: '已取消', color: 'error' },
    4: { text: '待审核', color: 'warning' },
};

const platformLabels: Record<number, string> = { 1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多' };
const terminalLabels: Record<number, string> = { 1: '本佣货返', 2: '本立佣货' };

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Task | null>(null);

    useEffect(() => { loadTasks(); }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { setTasks(json.data); setTotal(json.total || json.data.length); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id: string, status: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const json = await res.json();
            if (json.success) { message.success('状态更新成功'); loadTasks(); }
        } catch (e) { message.error('操作失败'); }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/tasks?`;
            if (filter !== undefined) url += `status=${filter}&`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `tasks_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
                message.success('导出成功');
            } else { message.error('导出失败'); }
        } catch (e) { message.error('导出失败'); } finally { setExporting(false); }
    };

    const columns: ColumnsType<Task> = [
        { title: '任务编号', dataIndex: 'taskNumber', width: 120, render: (v) => <code style={{ fontSize: 12 }}>{v}</code> },
        { title: '标题', dataIndex: 'title', width: 200, ellipsis: true },
        { title: '平台', dataIndex: 'taskType', width: 80, render: (v) => platformLabels[v] || '其他' },
        { title: '单价', dataIndex: 'goodsPrice', width: 100, align: 'right', render: (v) => <span style={{ fontWeight: 500 }}>¥{Number(v).toFixed(2)}</span> },
        {
            title: '进度', key: 'progress', width: 150, render: (_, r) => (
                <Space direction="vertical" size={0}>
                    <Progress percent={Math.round((r.claimedCount / r.count) * 100)} size="small" />
                    <span style={{ fontSize: 12, color: '#999' }}>{r.claimedCount} / {r.count}</span>
                </Space>
            )
        },
        { title: '状态', dataIndex: 'status', width: 90, align: 'center', render: (v) => <Tag color={statusLabels[v]?.color}>{statusLabels[v]?.text}</Tag> },
        { title: '创建时间', dataIndex: 'createdAt', width: 110, render: (v) => new Date(v).toLocaleDateString('zh-CN') },
        {
            title: '操作', key: 'actions', width: 200, render: (_, r) => (
                <Space>
                    <Button size="small" icon={<EyeOutlined />} onClick={() => setDetailModal(r)}>查看</Button>
                    <Select size="small" value={r.status} onChange={(v) => handleUpdateStatus(r.id, v)} style={{ width: 90 }}
                        options={Object.entries(statusLabels).map(([k, v]) => ({ value: Number(k), label: v.text }))} />
                </Space>
            )
        },
    ];

    return (
        <div>
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <span>状态筛选：</span>
                    <Radio.Group value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }} buttonStyle="solid">
                        <Radio.Button value={undefined}>全部</Radio.Button>
                        <Radio.Button value={1}>进行中</Radio.Button>
                        <Radio.Button value={4}>待审核</Radio.Button>
                        <Radio.Button value={2}>已完成</Radio.Button>
                        <Radio.Button value={3}>已取消</Radio.Button>
                    </Radio.Group>
                    <Button icon={<ReloadOutlined />} onClick={loadTasks}>刷新</Button>
                    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} loading={exporting} style={{ background: '#52c41a' }}>导出Excel</Button>
                </Space>
            </Card>

            <Card>
                <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} scroll={{ x: 1000 }}
                    pagination={{ current: page, total, pageSize: 20, onChange: setPage, showTotal: (t) => `共 ${t} 条` }} />
            </Card>

            <Modal title="任务详情" open={!!detailModal} onCancel={() => setDetailModal(null)} width={900} footer={<Button onClick={() => setDetailModal(null)}>关闭</Button>}>
                {detailModal && (
                    <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                        {detailModal.mainImage && <div style={{ textAlign: 'center', marginBottom: 24 }}><Image src={detailModal.mainImage} alt="商品图" style={{ maxWidth: 200, borderRadius: 8 }} /></div>}
                        <Descriptions title="基本信息" column={3} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="任务编号">{detailModal.taskNumber}</Descriptions.Item>
                            <Descriptions.Item label="平台">{platformLabels[detailModal.taskType]}</Descriptions.Item>
                            <Descriptions.Item label="状态"><Tag color={statusLabels[detailModal.status]?.color}>{statusLabels[detailModal.status]?.text}</Tag></Descriptions.Item>
                            <Descriptions.Item label="标题" span={3}>{detailModal.title}</Descriptions.Item>
                            <Descriptions.Item label="店铺">{detailModal.shopName || '-'}</Descriptions.Item>
                            <Descriptions.Item label="关键词">{detailModal.keyword || '-'}</Descriptions.Item>
                            <Descriptions.Item label="结算方式">{terminalLabels[detailModal.terminal] || '-'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="任务进度" column={4} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="总单数"><span style={{ fontSize: 18, fontWeight: 600 }}>{detailModal.count}</span></Descriptions.Item>
                            <Descriptions.Item label="已领取"><span style={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }}>{detailModal.claimedCount}</span></Descriptions.Item>
                            <Descriptions.Item label="已完成"><span style={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }}>{detailModal.completedCount || 0}</span></Descriptions.Item>
                            <Descriptions.Item label="剩余"><span style={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }}>{detailModal.count - detailModal.claimedCount}</span></Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="费用信息" column={3} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="商品单价">¥{Number(detailModal.goodsPrice).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="总押金">¥{Number(detailModal.totalDeposit || 0).toFixed(2)}</Descriptions.Item>
                            <Descriptions.Item label="总佣金">¥{Number(detailModal.totalCommission || 0).toFixed(2)}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="增值服务" column={4} bordered size="small">
                            <Descriptions.Item label="文字好评"><Tag color={detailModal.isPraise ? 'green' : 'default'}>{detailModal.isPraise ? '是' : '否'}</Tag></Descriptions.Item>
                            <Descriptions.Item label="图片好评"><Tag color={detailModal.isImgPraise ? 'green' : 'default'}>{detailModal.isImgPraise ? '是' : '否'}</Tag></Descriptions.Item>
                            <Descriptions.Item label="视频好评"><Tag color={detailModal.isVideoPraise ? 'green' : 'default'}>{detailModal.isVideoPraise ? '是' : '否'}</Tag></Descriptions.Item>
                            <Descriptions.Item label="包邮"><Tag color={detailModal.isFreeShipping ? 'blue' : 'default'}>{detailModal.isFreeShipping ? '是' : '否'}</Tag></Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
}
