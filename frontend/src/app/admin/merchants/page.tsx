'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Modal, Form, InputNumber, message, Popconfirm } from 'antd';
import { SearchOutlined, ReloadOutlined, DollarOutlined, CrownOutlined, StopOutlined, CheckCircleOutlined, ShopOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { adminService, AdminMerchant } from '../../../services/adminService';

const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待审核', color: 'warning' },
    1: { text: '正常', color: 'success' },
    2: { text: '已拒绝', color: 'error' },
    3: { text: '已禁用', color: 'error' },
};

export default function AdminMerchantsPage() {
    const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [keyword, setKeyword] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    const [activeModal, setActiveModal] = useState<'balance' | 'vip' | null>(null);
    const [selectedMerchant, setSelectedMerchant] = useState<AdminMerchant | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadMerchants();
    }, [filter, page]);

    const loadMerchants = async () => {
        setLoading(true);
        try {
            const res = await adminService.getMerchants({ page, limit: 10, status: filter, keyword });
            if (res.data) {
                setMerchants(res.data.data);
                setTotal(res.data.total);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadMerchants();
    };

    const handleBan = async (id: string, currentStatus: number) => {
        if (currentStatus === 3) {
            try {
                await adminService.unbanMerchant(id);
                message.success('已启用');
                loadMerchants();
            } catch (e) {
                message.error('操作失败');
            }
        } else {
            Modal.confirm({
                title: '禁用商家',
                content: (
                    <Input.TextArea id="banReason" rows={3} placeholder="请输入禁用原因" style={{ marginTop: 16 }} />
                ),
                onOk: async () => {
                    const reason = (document.getElementById('banReason') as HTMLTextAreaElement)?.value;
                    if (!reason) {
                        message.error('请输入禁用原因');
                        return Promise.reject();
                    }
                    try {
                        await adminService.banMerchant(id, reason);
                        message.success('已禁用');
                        loadMerchants();
                    } catch (e) {
                        message.error('操作失败');
                    }
                },
            });
        }
    };

    const openAdjustBalance = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        form.setFieldsValue({ type: 'balance', action: 'add', amount: '', reason: '' });
        setActiveModal('balance');
    };

    const submitAdjustBalance = async (values: any) => {
        if (!selectedMerchant) return;
        try {
            await adminService.adjustMerchantBalance(selectedMerchant.id, {
                type: values.type,
                action: values.action,
                amount: Number(values.amount),
                reason: values.reason
            });
            message.success('余额调整成功');
            setActiveModal(null);
            form.resetFields();
            loadMerchants();
        } catch (e: any) {
            message.error(e.errorMessage || '操作失败');
        }
    };

    const openSetVip = (m: AdminMerchant) => {
        setSelectedMerchant(m);
        form.setFieldsValue({ days: 30 });
        setActiveModal('vip');
    };

    const submitSetVip = async (values: any) => {
        if (!selectedMerchant) return;
        try {
            await adminService.setMerchantVip(selectedMerchant.id, values.days);
            message.success('VIP设置成功');
            setActiveModal(null);
            form.resetFields();
            loadMerchants();
        } catch (e) {
            message.error('操作失败');
        }
    };

    const columns: ColumnsType<AdminMerchant> = [
        {
            title: '商家信息',
            key: 'info',
            width: 200,
            render: (_, record) => (
                <Space>
                    <ShopOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.username}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{record.phone}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '余额',
            key: 'balance',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <span style={{ color: '#52c41a', fontWeight: 500 }}>¥{Number(record.balance || 0).toFixed(2)}</span>
            ),
        },
        {
            title: '银锭',
            key: 'silver',
            align: 'right',
            width: 100,
            render: (_, record) => (
                <span style={{ color: '#1890ff', fontWeight: 500 }}>{Number(record.silver || 0).toFixed(2)}</span>
            ),
        },
        {
            title: '会员',
            key: 'vip',
            align: 'center',
            width: 80,
            render: (_, record) => record.vip ? <Tag color="gold">VIP</Tag> : <Tag>普通</Tag>,
        },
        {
            title: '状态',
            key: 'status',
            align: 'center',
            width: 100,
            render: (_, record) => {
                const config = statusLabels[record.status] || statusLabels[0];
                return <Tag color={config.color}>{config.text}</Tag>;
            },
        },
        {
            title: '注册时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (v) => v ? new Date(v).toLocaleString('zh-CN') : '-',
        },
        {
            title: '操作',
            key: 'actions',
            width: 280,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button size="small" type="primary" ghost icon={<DollarOutlined />} onClick={() => openAdjustBalance(record)}>
                        调余额
                    </Button>
                    {!record.vip && (
                        <Button size="small" icon={<CrownOutlined />} onClick={() => openSetVip(record)}>
                            设VIP
                        </Button>
                    )}
                    {record.status === 3 ? (
                        <Popconfirm title="确定启用该商家？" onConfirm={() => handleBan(record.id, record.status)}>
                            <Button size="small" type="primary">启用</Button>
                        </Popconfirm>
                    ) : (
                        <Button size="small" danger onClick={() => handleBan(record.id, record.status)}>
                            禁用
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            {/* 搜索栏 */}
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="搜索商家名/手机号..."
                        value={keyword}
                        onChange={e => setKeyword(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 240 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        value={filter}
                        onChange={v => { setFilter(v); setPage(1); }}
                        style={{ width: 120 }}
                        placeholder="全部状态"
                        allowClear
                        options={[
                            { value: 0, label: '待审核' },
                            { value: 1, label: '正常' },
                            { value: 2, label: '已拒绝' },
                            { value: 3, label: '已禁用' },
                        ]}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                    <Button icon={<ReloadOutlined />} onClick={loadMerchants}>刷新</Button>
                </Space>
            </Card>

            {/* 商家列表 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={merchants}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        total: total,
                        pageSize: 10,
                        onChange: setPage,
                        showTotal: (t) => `共 ${t} 条记录`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* 调整余额弹窗 */}
            <Modal
                title={`💰 调整余额 - ${selectedMerchant?.username}`}
                open={activeModal === 'balance'}
                onCancel={() => { setActiveModal(null); form.resetFields(); }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={submitAdjustBalance}>
                    <Form.Item name="type" label="账户类型" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'balance', label: '本金余额' },
                            { value: 'silver', label: '银锭余额' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="action" label="操作类型" rules={[{ required: true }]}>
                        <Select options={[
                            { value: 'add', label: '增加' },
                            { value: 'deduct', label: '扣除' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" />
                    </Form.Item>
                    <Form.Item name="reason" label="原因" rules={[{ required: true, message: '请输入原因' }]}>
                        <Input placeholder="请输入操作原因" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setActiveModal(null); form.resetFields(); }}>取消</Button>
                            <Button type="primary" htmlType="submit">确认</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 设置VIP弹窗 */}
            <Modal
                title={`👑 设置VIP - ${selectedMerchant?.username}`}
                open={activeModal === 'vip'}
                onCancel={() => { setActiveModal(null); form.resetFields(); }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={submitSetVip}>
                    <Form.Item name="days" label="VIP时长（天）" rules={[{ required: true }]}>
                        <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入天数" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setActiveModal(null); form.resetFields(); }}>取消</Button>
                            <Button type="primary" htmlType="submit">确认</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
