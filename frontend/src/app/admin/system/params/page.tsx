'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../../apiConfig';

interface SystemConfig {
    key: string;
    value: string;
    group: string;
    description: string;
}

const GROUP_LABELS: Record<string, string> = {
    'basic': '基本设置',
    'finance': '财务设置',
    'vip': '会员设置'
};

const DEFAULT_CONFIGS = [
    { key: 'verify_switch', group: 'basic', label: '验证开关', type: 'number', desc: '全局验证开关' },
    { key: 'user_num', group: 'vip', label: '买手注册赠送VIP天数', type: 'number', desc: '新注册买手赠送天数' },
    { key: 'seller_num', group: 'vip', label: '商家注册赠送VIP天数', type: 'number', desc: '新注册商家赠送天数' },
    { key: 'withdraw_min_principal', group: 'finance', label: '买手提现本金最低金额', type: 'number', desc: '买手垫付本金提现最低额' },
    { key: 'withdraw_min_reward', group: 'finance', label: '买手提现银锭最低数', type: 'number', desc: '买手提现最少银锭数' },
    { key: 'reward_price', group: 'finance', label: '买手提现银锭单价', type: 'number', desc: '1银锭 = 多少元' },
    { key: 'seller_withdraw_min', group: 'finance', label: '商家提现押金最低金额', type: 'number', desc: '商家提现最低金额' },
];

export default function AdminSystemParamsPage() {
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('basic');

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/system-config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                const map: Record<string, string> = {};
                json.data.forEach((c: SystemConfig) => map[c.key] = c.value);
                setConfigs(map);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        const token = localStorage.getItem('adminToken');
        const updates = Object.entries(configs).map(([key, value]) => ({
            key,
            value: String(value), // Ensure string
            group: DEFAULT_CONFIGS.find(c => c.key === key)?.group || 'other'
        }));

        try {
            const res = await fetch(`${BASE_URL}/system-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ configs: updates })
            });
            const json = await res.json();
            if (json.success) alert('保存成功');
            else alert('保存失败: ' + json.message);
        } catch (e) {
            alert('保存失败');
        }
    };

    const groups = ['basic', 'finance', 'vip'];

    return (
        <div>
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        {groups.map(g => (
                            <span
                                key={g}
                                onClick={() => setActiveTab(g)}
                                style={{
                                    fontSize: '16px',
                                    fontWeight: activeTab === g ? '600' : '400',
                                    color: activeTab === g ? '#1890ff' : '#666',
                                    cursor: 'pointer',
                                    paddingBottom: '16px',
                                    marginBottom: '-17px',
                                    borderBottom: activeTab === g ? '2px solid #1890ff' : 'none'
                                }}
                            >
                                {GROUP_LABELS[g]}
                            </span>
                        ))}
                    </div>
                    <button onClick={handleSave} style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>保存设置</button>
                </div>

                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{ color: '#999', textAlign: 'center' }}>加载中...</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {DEFAULT_CONFIGS.filter(c => c.group === activeTab).map(c => (
                                <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>{c.label}</label>
                                    <input
                                        type={c.type}
                                        value={configs[c.key] || ''}
                                        onChange={e => setConfigs(prev => ({ ...prev, [c.key]: e.target.value }))}
                                        style={{ padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                                    />
                                    <span style={{ color: '#999', fontSize: '12px' }}>{c.desc}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
