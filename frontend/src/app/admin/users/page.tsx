'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Button, Tag, Space, Modal, Form, InputNumber, message, Avatar, Badge, Descriptions, Image, Tooltip } from 'antd';
import { SearchOutlined, ReloadOutlined, UserOutlined, DollarOutlined, CrownOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { BASE_URL } from '../../../../apiConfig';

interface User {
    id: string;
    username: string;
    phone: string;
    qq?: string;
    balance: number;
    silver: number;
    frozenBalance?: number;
    frozenSilver?: number;
    reward?: number;
    vip: boolean;
    vipExpireAt?: string;
    verifyStatus: number;
    isActive: boolean;
    isBanned: boolean;
    banReason?: string;
    createdAt: string;
    lastLoginAt?: string;
    lastLoginIp?: string;
    realName?: string;
    idCard?: string;
    idCardFront?: string;
    idCardBack?: string;
    invitationCode?: string;
    invitedBy?: string;
    referrerId?: string;
    referrerType?: number;
    referralReward?: number;
    referralCount?: number;
}

interface BalanceModalData {
    userId: string;
    username: string;
    type: 'balance' | 'silver';
    action: 'add' | 'deduct';
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [vipFilter, setVipFilter] = useState<string>('all');

    const [balanceModal, setBalanceModal] = useState<BalanceModalData | null>(null);
    const [detailModal, setDetailModal] = useState<User | null>(null);
    const [banModal, setBanModal] = useState<{ userId: string; username: string } | null>(null);
    const [form] = Form.useForm();

    useEffect(() => {
        loadUsers();
    }, [page, statusFilter, vipFilter]);

    const loadUsers = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/users?page=${page}&limit=20`;
            if (search) url += `&keyword=${encodeURIComponent(search)}`;
            if (statusFilter !== 'all') url += `&status=${statusFilter}`;
            if (vipFilter !== 'all') url += `&vip=${vipFilter}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setUsers(json.data || []);
                setTotal(json.total || 0);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        setPage(1);
        loadUsers();
    };

    const handleAdjustBalance = async (values: { amount: number; reason: string }) => {
        if (!balanceModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/users/${balanceModal.userId}/balance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: balanceModal.type,
                    action: balanceModal.action,
                    amount: values.amount,
                    reason: values.reason
                })
            });
            const json = await res.json();
            if (json.success) {
                message.success('操作成功');
                setBalanceModal(null);
                form.resetFields();
                loadUsers();
            } else {
                message.error(json.message || '操作失败');
            }
        } catch (e) {
            message.error('操作失败');
        }
    };

    const handleBan = async (reason: string) => {
        if (!banModal) return;
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${banModal.userId}/ban`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason })
            });
            message.success('用户已封禁');
            setBanModal(null);
            loadUsers();
        } catch (e) {
            message.error('操作失败');
        }
    };

    const handleUnban = async (userId: string) => {
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/unban`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            message.success('已解封');
            loadUsers();
        } catch (e) {
            message.error('操作失败');
        }
    };

    const handleSetVip = async (userId: string, days: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            await fetch(`${BASE_URL}/admin/users/${userId}/vip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ days })
            });
            message.success('VIP已设置');
            loadUsers();
        } catch (e) {
            message.error('操作失败');
        }
    };

    const getVerifyStatusTag = (status: number) => {
        const configs = [
            { text: '未认证', color: 'default' },
            { text: '待审核', color: 'warning' },
            { text: '已认证', color: 'success' },
            { text: '已拒绝', color: 'error' },
        ];
        const config = configs[status] || configs[0];
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const columns: ColumnsType<User> = [
        {
            title: '用户信息',
            key: 'info',
            width: 200,
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.username}</div>
                        <div style={{ fontSize: 12, color: '#999' }}>{record.phone}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: '本金余额',
            key: 'balance',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <div>
                    <div style={{ color: '#52c41a', fontWeight: 500 }}>¥{Number(record.balance || 0).toFixed(2)}</div>
                    {(record.frozenBalance || 0) > 0 && (
                        <div style={{ fontSize: 12, color: '#faad14' }}>冻结: ¥{Number(record.frozenBalance).toFixed(2)}</div>
                    )}
                </div>
            ),
        },
        {
            title: '银锭余额',
            key: 'silver',
            align: 'right',
            width: 120,
            render: (_, record) => (
                <div>
                    <div style={{ color: '#1890ff', fontWeight: 500 }}>{Number(record.silver || 0).toFixed(2)}</div>
                    {(record.frozenSilver || 0) > 0 && (
                        <div style={{ fontSize: 12, color: '#faad14' }}>冻结: {Number(record.frozenSilver).toFixed(2)}</div>
                    )}
                </div>
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
            title: '实名',
            key: 'verify',
            align: 'center',
            width: 80,
            render: (_, record) => getVerifyStatusTag(record.verifyStatus),
        },
        {
            title: '状态',
            key: 'status',
            align: 'center',
            width: 80,
            render: (_, record) => {
                if (record.isBanned) return <Tag color="error">已封禁</Tag>;
                if (record.isActive) return <Tag color="success">正常</Tag>;
                return <Tag>未激活</Tag>;
            },
        },
        {
            title: '操作',
            key: 'actions',
            width: 280,
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button size="small" onClick={() => setDetailModal(record)}>详情</Button>
                    <Button size="small" type="primary" ghost onClick={() => setBalanceModal({ userId: record.id, username: record.username, type: 'balance', action: 'add' })}>
                        充值
                    </Button>
                    <Button size="small" style={{ color: '#faad14', borderColor: '#faad14' }} onClick={() => setBalanceModal({ userId: record.id, username: record.username, type: 'balance', action: 'deduct' })}>
                        扣款
                    </Button>
                    {!record.vip && (
                        <Tooltip title="设置30天VIP">
                            <Button size="small" icon={<CrownOutlined />} onClick={() => handleSetVip(record.id, 30)}>VIP</Button>
                        </Tooltip>
                    )}
                    {record.isBanned ? (
                        <Button size="small" type="primary" onClick={() => handleUnban(record.id)}>解封</Button>
                    ) : (
                        <Button size="small" danger onClick={() => setBanModal({ userId: record.id, username: record.username })}>封禁</Button>
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
                        placeholder="搜索用户名/手机号/姓名..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 280 }}
                        prefix={<SearchOutlined />}
                    />
                    <Select
                        value={statusFilter}
                        onChange={v => { setStatusFilter(v); setPage(1); }}
                        style={{ width: 120 }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: 'active', label: '正常' },
                            { value: 'banned', label: '已封禁' },
                        ]}
                    />
                    <Select
                        value={vipFilter}
                        onChange={v => { setVipFilter(v); setPage(1); }}
                        style={{ width: 120 }}
                        options={[
                            { value: 'all', label: '全部会员' },
                            { value: 'vip', label: 'VIP用户' },
                            { value: 'normal', label: '普通用户' },
                        ]}
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>搜索</Button>
                    <Button icon={<ReloadOutlined />} onClick={loadUsers}>刷新</Button>
                </Space>
            </Card>

            {/* 用户列表 */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        total: total,
                        pageSize: 20,
                        onChange: setPage,
                        showTotal: (t) => `共 ${t} 条记录`,
                    }}
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* 充值/扣款弹窗 */}
            <Modal
                title={`${balanceModal?.action === 'add' ? '💰 充值' : '💸 扣款'} - ${balanceModal?.username}`}
                open={!!balanceModal}
                onCancel={() => { setBalanceModal(null); form.resetFields(); }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAdjustBalance}>
                    <Form.Item label="账户类型">
                        <Select
                            value={balanceModal?.type}
                            onChange={t => balanceModal && setBalanceModal({ ...balanceModal, type: t })}
                            options={[
                                { value: 'balance', label: '本金余额' },
                                { value: 'silver', label: '银锭余额' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="amount" label={`${balanceModal?.action === 'add' ? '充值' : '扣除'}金额`} rules={[{ required: true, message: '请输入金额' }]}>
                        <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="请输入金额" />
                    </Form.Item>
                    <Form.Item name="reason" label="操作原因" rules={[{ required: true, message: '请输入原因' }]}>
                        <Input placeholder="请输入操作原因" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => { setBalanceModal(null); form.resetFields(); }}>取消</Button>
                            <Button type="primary" htmlType="submit" style={{ background: balanceModal?.action === 'add' ? '#52c41a' : '#faad14' }}>
                                确认{balanceModal?.action === 'add' ? '充值' : '扣款'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 封禁弹窗 */}
            <Modal
                title={`🚫 封禁用户 - ${banModal?.username}`}
                open={!!banModal}
                onCancel={() => setBanModal(null)}
                onOk={() => {
                    const reason = (document.getElementById('banReason') as HTMLTextAreaElement)?.value;
                    if (reason) handleBan(reason);
                }}
                okText="确认封禁"
                okButtonProps={{ danger: true }}
            >
                <Form layout="vertical">
                    <Form.Item label="封禁原因">
                        <Input.TextArea id="banReason" rows={3} placeholder="请输入封禁原因" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 用户详情弹窗 */}
            <Modal
                title="用户详情"
                open={!!detailModal}
                onCancel={() => setDetailModal(null)}
                width={700}
                footer={[
                    <Button key="recharge" type="primary" style={{ background: '#52c41a' }} onClick={() => { setBalanceModal({ userId: detailModal!.id, username: detailModal!.username, type: 'balance', action: 'add' }); setDetailModal(null); }}>
                        充值
                    </Button>,
                    !detailModal?.vip && (
                        <Button key="vip" style={{ background: '#722ed1', color: '#fff' }} onClick={() => { handleSetVip(detailModal!.id, 30); setDetailModal(null); }}>
                            设为VIP
                        </Button>
                    ),
                    detailModal?.isBanned ? (
                        <Button key="unban" type="primary" onClick={() => { handleUnban(detailModal!.id); setDetailModal(null); }}>解封</Button>
                    ) : (
                        <Button key="ban" danger onClick={() => { setBanModal({ userId: detailModal!.id, username: detailModal!.username }); setDetailModal(null); }}>封禁</Button>
                    ),
                    <Button key="close" onClick={() => setDetailModal(null)}>关闭</Button>,
                ]}
            >
                {detailModal && (
                    <div>
                        <Descriptions title="基本信息" column={2} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="用户ID">{detailModal.id}</Descriptions.Item>
                            <Descriptions.Item label="用户名">{detailModal.username}</Descriptions.Item>
                            <Descriptions.Item label="手机号">{detailModal.phone}</Descriptions.Item>
                            <Descriptions.Item label="QQ">{detailModal.qq || '-'}</Descriptions.Item>
                            <Descriptions.Item label="邀请码">{detailModal.invitationCode || '-'}</Descriptions.Item>
                            <Descriptions.Item label="最后登录IP">{detailModal.lastLoginIp || '-'}</Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="账户余额" column={3} bordered size="small" style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="本金余额">
                                <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{Number(detailModal.balance || 0).toFixed(2)}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="银锭余额">
                                <span style={{ color: '#1890ff', fontWeight: 600 }}>{Number(detailModal.silver || 0).toFixed(2)}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="累计赚取">
                                <span style={{ color: '#fa8c16', fontWeight: 600 }}>{Number(detailModal.reward || 0).toFixed(2)}</span>
                            </Descriptions.Item>
                        </Descriptions>

                        <Descriptions title="状态信息" column={2} bordered size="small">
                            <Descriptions.Item label="VIP状态">{detailModal.vip ? <Tag color="gold">VIP</Tag> : '普通用户'}</Descriptions.Item>
                            <Descriptions.Item label="实名认证">{getVerifyStatusTag(detailModal.verifyStatus)}</Descriptions.Item>
                            <Descriptions.Item label="账号状态">
                                {detailModal.isBanned ? <Tag color="error">已封禁</Tag> : detailModal.isActive ? <Tag color="success">正常</Tag> : <Tag>未激活</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="注册时间">{new Date(detailModal.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
}
