'use client';

import { useState, useEffect } from 'react';
import { adminService, SystemConfigDto } from '../../../../services/adminService';

const GROUP_LABELS: Record<string, string> = {
    'basic': '基本设置',
    'finance': '财务设置',
    'vip': '会员设置',
    'service': '服务费用',
    'praise': '好评费用',
    'commission': '佣金分成',
    'account': '账号配置'
};

// Map items to CamelCase keys
const CONFIG_ITEMS: { key: keyof SystemConfigDto; group: string; label: string; type: string; desc: string }[] = [
    // Basic
    { key: 'siteName', group: 'basic', label: '站点名称', type: 'text', desc: '网站名称' },

    // VIP
    { key: 'registerReward', group: 'vip', label: '注册赠送银锭', type: 'number', desc: '新用户注册赠送银锭数' },
    { key: 'registerAudit', group: 'vip', label: '注册审核开关', type: 'checkbox', desc: '是否开启注册审核' },

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

export default function AdminSystemParamsPage() {
    const [config, setConfig] = useState<SystemConfigDto>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('finance'); // Default to finance as it is high priority

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const res = await adminService.getGlobalConfig();
            if (res.data) {
                setConfig(res.data);
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
            await adminService.updateGlobalConfig(config);
            alert('配置保存成功');
        } catch (e) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof SystemConfigDto, value: any) => {
        setConfig((prev: SystemConfigDto) => ({ ...prev, [key]: value }));
    };

    const groups = ['basic', 'finance', 'vip', 'service', 'praise'];
    const currentItems = CONFIG_ITEMS.filter(c => c.group === activeTab);

    return (
        <div>
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {/* Tabs */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '24px' }}>
                    {groups.map(g => (
                        <span
                            key={g}
                            onClick={() => setActiveTab(g)}
                            style={{
                                cursor: 'pointer',
                                paddingBottom: '12px',
                                borderBottom: activeTab === g ? '2px solid #1890ff' : 'none',
                                color: activeTab === g ? '#1890ff' : '#666',
                                fontWeight: activeTab === g ? 500 : 'normal'
                            }}
                        >
                            {GROUP_LABELS[g]}
                        </span>
                    ))}
                    <div style={{ flex: 1, textAlign: 'right' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '6px 16px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            {saving ? '保存中...' : '保存全部'}
                        </button>
                    </div>
                </div>

                {/* Form */}
                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <div>加载中...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {currentItems.map(item => (
                                <div key={String(item.key)} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontWeight: 500 }}>{item.label} <small style={{ color: '#999' }}>({String(item.key)})</small></label>

                                    {item.type === 'checkbox' ? (
                                        <div style={{ padding: '10px 0' }}>
                                            <input
                                                type="checkbox"
                                                checked={Boolean(config[item.key])}
                                                onChange={e => handleChange(item.key, e.target.checked)}
                                            /> 开启
                                        </div>
                                    ) : (
                                        <input
                                            type={item.type === 'number' ? 'number' : 'text'}
                                            value={config[item.key] !== undefined ? String(config[item.key]) : ''}
                                            onChange={e => handleChange(item.key, item.type === 'number' ? Number(e.target.value) : e.target.value)}
                                            step="0.01"
                                            style={{ padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                        />
                                    )}
                                    <span style={{ fontSize: '12px', color: '#999' }}>{item.desc}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
