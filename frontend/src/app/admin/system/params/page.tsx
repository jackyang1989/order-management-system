'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, InputNumber, Switch, Button, Tabs, message, Spin, Divider, Typography } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminService, SystemConfigDto } from '../../../../services/adminService';

const { Title, Text } = Typography;

const CONFIG_ITEMS: { key: keyof SystemConfigDto; group: string; label: string; type: 'text' | 'number' | 'switch'; desc: string }[] = [
    // Basic
    { key: 'siteName', group: 'basic', label: '站点名称', type: 'text', desc: '网站名称' },
    // VIP
    { key: 'registerReward', group: 'vip', label: '注册赠送银锭', type: 'number', desc: '新用户注册赠送银锭数' },
    { key: 'registerAudit', group: 'vip', label: '注册审核开关', type: 'switch', desc: '是否开启注册审核' },
    // Finance - Withdrawals
    { key: 'userMinMoney', group: 'finance', label: '买手提现最低金额', type: 'number', desc: '买手提现门槛（元）' },
    { key: 'sellerMinMoney', group: 'finance', label: '商家提现最低金额', type: 'number', desc: '商家提现门槛（元）' },
    { key: 'userMinReward', group: 'finance', label: '买手提现最低银锭', type: 'number', desc: '买手提现银锭门槛' },
    { key: 'rewardPrice', group: 'finance', label: '银锭兑换汇率', type: 'number', desc: '1银锭等于多少元' },
    { key: 'sellerCashFee', group: 'finance', label: '商家提现手续费率', type: 'number', desc: '如0.01代表1%' },
    { key: 'userFeeMaxPrice', group: 'finance', label: '买手免手续费限额', type: 'number', desc: '低于此金额收取手续费' },
    { key: 'userCashFree', group: 'finance', label: '买手提现手续费', type: 'number', desc: '固定手续费（元）' },
    // Task Fees
    { key: 'baseServiceFee', group: 'service', label: '基础服务费', type: 'number', desc: '每单基础服务费' },
    { key: 'praiseFee', group: 'praise', label: '文字好评费用', type: 'number', desc: '元/条' },
    { key: 'imagePraiseFee', group: 'praise', label: '图片好评费用', type: 'number', desc: '元/条' },
    { key: 'videoPraiseFee', group: 'praise', label: '视频好评费用', type: 'number', desc: '元/条' },
];

const TABS = [
    { key: 'finance', label: '财务设置' },
    { key: 'vip', label: '会员设置' },
    { key: 'service', label: '服务费用' },
    { key: 'praise', label: '好评费用' },
    { key: 'basic', label: '基本设置' },
];

export default function AdminSystemParamsPage() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('finance');

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await adminService.getGlobalConfig();
            if (res.data) {
                form.setFieldsValue(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const values = form.getFieldsValue();
            await adminService.updateGlobalConfig(values);
            message.success('配置保存成功');
        } catch (e) {
            message.error('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const renderFormItem = (item: typeof CONFIG_ITEMS[0]) => {
        const commonProps = { style: { width: '100%' } };
        switch (item.type) {
            case 'text':
                return <Input {...commonProps} placeholder={item.desc} />;
            case 'number':
                return <InputNumber {...commonProps} min={0} precision={2} placeholder={item.desc} />;
            case 'switch':
                return <Switch checkedChildren="开" unCheckedChildren="关" />;
            default:
                return <Input {...commonProps} />;
        }
    };

    const groupedItems = CONFIG_ITEMS.filter(c => c.group === activeTab);

    return (
        <div>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>系统参数配置</Title>
                    <div>
                        <Button icon={<ReloadOutlined />} onClick={loadConfig} style={{ marginRight: 8 }}>刷新</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>保存配置</Button>
                    </div>
                </div>

                <Spin spinning={loading}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={TABS.map(t => ({
                            key: t.key,
                            label: t.label,
                            children: (
                                <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
                                    {groupedItems.map(item => (
                                        <Form.Item
                                            key={item.key}
                                            name={item.key}
                                            label={item.label}
                                            tooltip={item.desc}
                                            valuePropName={item.type === 'switch' ? 'checked' : 'value'}
                                        >
                                            {renderFormItem(item)}
                                        </Form.Item>
                                    ))}
                                    {groupedItems.length === 0 && (
                                        <Text type="secondary">该分组暂无配置项</Text>
                                    )}
                                </Form>
                            )
                        }))}
                    />
                </Spin>
            </Card>
        </div>
    );
}
