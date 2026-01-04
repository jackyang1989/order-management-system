'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Row, Col, Card, Statistic, Spin, Badge, Typography, Space } from 'antd';
import {
    UserOutlined,
    ShopOutlined,
    FileTextOutlined,
    ShoppingOutlined,
    AuditOutlined,
    DollarOutlined,
    SettingOutlined,
    RiseOutlined,
} from '@ant-design/icons';
import { BASE_URL } from '../../../../apiConfig';

const { Title, Text } = Typography;

interface Stats {
    totalUsers: number;
    totalMerchants: number;
    totalTasks: number;
    totalOrders: number;
    pendingMerchants: number;
    pendingWithdrawals: number;
    todayUsers: number;
    todayOrders: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                <Spin size="large" />
            </div>
        );
    }

    const statCards = [
        { label: '总用户数', value: stats?.totalUsers || 0, icon: <UserOutlined />, color: '#1890ff' },
        { label: '总商家数', value: stats?.totalMerchants || 0, icon: <ShopOutlined />, color: '#52c41a' },
        { label: '总任务数', value: stats?.totalTasks || 0, icon: <FileTextOutlined />, color: '#722ed1' },
        { label: '总订单数', value: stats?.totalOrders || 0, icon: <ShoppingOutlined />, color: '#fa8c16' },
    ];

    const quickActions = [
        { label: '审核商家', count: stats?.pendingMerchants || 0, path: '/admin/merchants', icon: <AuditOutlined /> },
        { label: '审核提现', count: stats?.pendingWithdrawals || 0, path: '/admin/withdrawals', icon: <DollarOutlined /> },
    ];

    const quickLinks = [
        { icon: <UserOutlined style={{ fontSize: 24 }} />, label: '买手列表', path: '/admin/users' },
        { icon: <ShopOutlined style={{ fontSize: 24 }} />, label: '商家列表', path: '/admin/merchants' },
        { icon: <FileTextOutlined style={{ fontSize: 24 }} />, label: '任务列表', path: '/admin/tasks' },
        { icon: <ShoppingOutlined style={{ fontSize: 24 }} />, label: '订单列表', path: '/admin/orders' },
        { icon: <DollarOutlined style={{ fontSize: 24 }} />, label: '提现审核', path: '/admin/withdrawals' },
        { icon: <SettingOutlined style={{ fontSize: 24 }} />, label: '系统设置', path: '/admin/system' },
    ];

    return (
        <div>
            {/* 欢迎卡片 */}
            <Card
                style={{
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    marginBottom: 24,
                    border: 'none',
                }}
                styles={{ body: { padding: '24px 32px' } }}
            >
                <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
                    欢迎回来，管理员
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.85)' }}>
                    今日新增用户 <strong>{stats?.todayUsers || 0}</strong> 人，新增订单 <strong>{stats?.todayOrders || 0}</strong> 单
                </Text>
            </Card>

            {/* 统计卡片 */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                {statCards.map((item, idx) => (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                        <Card hoverable>
                            <Statistic
                                title={item.label}
                                value={item.value}
                                prefix={<span style={{ color: item.color }}>{item.icon}</span>}
                                valueStyle={{ color: item.color }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* 快捷操作区 */}
            <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                {/* 待处理事项 */}
                <Col xs={24} lg={12}>
                    <Card title="待处理事项" extra={<RiseOutlined />}>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            {quickActions.map((action, idx) => (
                                <Card
                                    key={idx}
                                    size="small"
                                    hoverable
                                    onClick={() => router.push(action.path)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space>
                                            {action.icon}
                                            <span>{action.label}</span>
                                        </Space>
                                        <Badge
                                            count={action.count}
                                            showZero
                                            style={{ backgroundColor: action.count > 0 ? '#faad14' : '#d9d9d9' }}
                                        />
                                    </div>
                                </Card>
                            ))}
                        </Space>
                    </Card>
                </Col>

                {/* 今日数据 */}
                <Col xs={24} lg={12}>
                    <Card title="今日数据">
                        <Row gutter={16}>
                            <Col span={12}>
                                <Card style={{ background: '#e6f7ff', textAlign: 'center' }}>
                                    <Statistic
                                        title="新增用户"
                                        value={stats?.todayUsers || 0}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card style={{ background: '#f6ffed', textAlign: 'center' }}>
                                    <Statistic
                                        title="新增订单"
                                        value={stats?.todayOrders || 0}
                                        valueStyle={{ color: '#52c41a' }}
                                    />
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>

            {/* 快捷入口 */}
            <Card title="快捷入口">
                <Row gutter={[16, 16]}>
                    {quickLinks.map((item, idx) => (
                        <Col xs={12} sm={8} md={4} key={idx}>
                            <Card
                                hoverable
                                onClick={() => router.push(item.path)}
                                style={{ textAlign: 'center', cursor: 'pointer' }}
                                styles={{ body: { padding: '20px 16px' } }}
                            >
                                <div style={{ color: '#1890ff', marginBottom: 8 }}>
                                    {item.icon}
                                </div>
                                <Text>{item.label}</Text>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Card>
        </div>
    );
}
