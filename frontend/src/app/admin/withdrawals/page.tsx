'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Select, Button, Tag, Space, Modal, message, Popconfirm, Input, Typography } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { BASE_URL } from '../../../../apiConfig';

const { Text } = Typography;

interface Withdrawal {
    id: string;
    userId: string;
    amount: number;
    fee: number;
    actualAmount: number;
    bankName: string;
    cardNumber: string;
    holderName: string;
    status: string;
    remark: string;
    createdAt: string;
}

const statusLabels: Record<string, { text: string; color: string }> = {
    PENDING: { text: '待审核', color: 'warning' },
    APPROVED: { text: '已通过', color: 'success' },
    REJECTED: { text: '已拒绝', color: 'error' },
    COMPLETED: { text: '已完成', color: 'default' },
};

export default function AdminWithdrawalsPage() {
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('PENDING');
    const [reviewing, setReviewing] = useState<string | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);

    useEffect(() => {
        loadWithdrawals();
    }, [filter]);

    const loadWithdrawals = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedRowKeys([]);
        try {
            const url = filter ? `${BASE_URL}/admin/withdrawals?status=${filter}` : `${BASE_URL}/admin/withdrawals`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setWithdrawals(json.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string, approved: boolean, remark: string = '') => {
        const token = localStorage.getItem('adminToken');
        setReviewing(id);
        try {
            const res = await fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ approved, remark })
            });
            const json = await res.json();
            if (json.success) {
                message.success(approved ? '提现已通过' : '提现已拒绝');
                loadWithdrawals();
            }
        } catch (e) {
            message.error('操作失败');
        } finally {
            setReviewing(null);
        }
    };

    const handleReject = (id: string) => {
        Modal.confirm({
            title: '拒绝提现',
            content: (
                <Input.TextArea id="rejectReason" rows={3} placeholder="请输入拒绝原因" style={{ marginTop: 16 }} />
            ),
            onOk: async () => {
                const reason = (document.getElementById('rejectReason') as HTMLTextAreaElement)?.value || '';
                await handleApprove(id, false, reason);
            },
        });
    };

    const handleBatchApprove = async (approved: boolean) => {
        if (selectedRowKeys.length === 0) {
            message.warning('请先选择要操作的记录');
            return;
        }
        const action = approved ? '批量通过' : '批量拒绝';

        Modal.confirm({
            title: `确定${action}？`,
            content: `将对选中的 ${selectedRowKeys.length} 条记录执行${action}操作`,
            onOk: async () => {
                const token = localStorage.getItem('adminToken');
                setBatchLoading(true);
                try {
                    const remark = approved ? '' : '批量拒绝';
                    await Promise.all(
                        selectedRowKeys.map(id =>
                            fetch(`${BASE_URL}/admin/withdrawals/${id}/approve`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({ approved, remark })
                            })
                        )
                    );
                    message.success(`已${action} ${selectedRowKeys.length} 条记录`);
                    loadWithdrawals();
                } catch (e) {
                    message.error('部分操作失败');
                } finally {
                    setBatchLoading(false);
                }
            },
        });
    };

    const columns: ColumnsType<Withdrawal> = [
        {
            title: '提现金额',
            key: 'amount',
            width: 140,
            render: (_, record) => (
                <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1890ff' }}>¥{Number(record.amount).toFixed(2)}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>
                        手续费: ¥{Number(record.fee).toFixed(2)}
                    </div>
                </div>
            ),
        },
        {
            title: '到账金额',
            key: 'actualAmount',
            width: 100,
            render: (_, record) => (
                <Text strong style={{ color: '#52c41a' }}>¥{Number(record.actualAmount).toFixed(2)}</Text>
            ),
        },
        {
            title: '银行卡信息',
            key: 'bank',
            width: 200,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 500 }}>{record.holderName}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{record.bankName}</div>
                    <div style={{ fontSize: 12, color: '#999', fontFamily: 'monospace' }}>
                        {record.cardNumber?.replace(/(\d{4})\d+(\d{4})/, '$1****$2')}
                    </div>
                </div>
            ),
        },
        {
            title: '状态',
            key: 'status',
            width: 100,
            align: 'center',
            render: (_, record) => {
                const config = statusLabels[record.status] || statusLabels.PENDING;
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '申请时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-',
        },
        {
            title: '备注',
            dataIndex: 'remark',
            key: 'remark',
            width: 150,
            ellipsis: true,
            render: (v) => v || '-',
        },
        {
            title: '操作',
            key: 'actions',
            width: 200,
            render: (_, record) => {
                if (record.status !== 'PENDING') {
                    return <Text type="secondary">已处理</Text>;
                }
                return (
                    <Space>
                        <Popconfirm
                            title="确定通过该提现申请？"
                            onConfirm={() => handleApprove(record.id, true)}
                        >
                            <Button
                                size="small"
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={reviewing === record.id}
                            >
                                通过
                            </Button>
                        </Popconfirm>
                        <Button
                            size="small"
                            danger
                            icon={<CloseCircleOutlined />}
                            loading={reviewing === record.id}
                            onClick={() => handleReject(record.id)}
                        >
                            拒绝
                        </Button>
                    </Space>
                );
            },
        },
    ];

    const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');

    return (
        <div>
            {/* 筛选栏 */}
            <Card style={{ marginBottom: 16 }}>
                <Space>
                    <Select
                        value={filter}
                        onChange={setFilter}
                        style={{ width: 140 }}
                        options={[
                            { value: 'PENDING', label: '待审核' },
                            { value: 'APPROVED', label: '已通过' },
                            { value: 'REJECTED', label: '已拒绝' },
                            { value: '', label: '全部' },
                        ]}
                    />
                    <Button icon={<ReloadOutlined />} onClick={loadWithdrawals}>刷新</Button>
                    {filter === 'PENDING' && selectedRowKeys.length > 0 && (
                        <>
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                loading={batchLoading}
                                onClick={() => handleBatchApprove(true)}
                            >
                                批量通过 ({selectedRowKeys.length})
                            </Button>
                            <Button
                                danger
                                icon={<CloseCircleOutlined />}
                                loading={batchLoading}
                                onClick={() => handleBatchApprove(false)}
                            >
                                批量拒绝 ({selectedRowKeys.length})
                            </Button>
                        </>
                    )}
                </Space>
            </Card>

            {/* 提现列表 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={withdrawals}
                    rowKey="id"
                    loading={loading}
                    rowSelection={filter === 'PENDING' ? {
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                        getCheckboxProps: (record) => ({
                            disabled: record.status !== 'PENDING',
                        }),
                    } : undefined}
                    pagination={{
                        showTotal: (t) => `共 ${t} 条记录`,
                        showSizeChanger: true,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>
        </div>
    );
}
