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
    'vip': '会员设置',
    'service': '服务费用',
    'praise': '好评费用',
    'commission': '佣金分成',
    'account': '账号配置'
};

const DEFAULT_CONFIGS = [
    // 基本设置
    { key: 'verify_switch', group: 'basic', label: '验证开关', type: 'number', desc: '商品核对码验证开关（0关闭/1开启）' },
    { key: 'invitation_num', group: 'basic', label: '邀请链接要求', type: 'number', desc: '买手邀请链接数量要求' },
    { key: 'limit_mobile', group: 'basic', label: '禁止注册手机号', type: 'text', desc: '禁止注册手机号列表（逗号分隔）' },

    // 会员设置
    { key: 'user_num', group: 'vip', label: '买手注册赠送银锭', type: 'number', desc: '新注册买手赠送银锭数' },
    { key: 'seller_num', group: 'vip', label: '商家注册赠送银锭', type: 'number', desc: '新注册商家赠送银锭数' },
    { key: 'user_vip_time', group: 'vip', label: '买手注册赠送VIP天数', type: 'number', desc: '新注册买手赠送VIP天数' },
    { key: 'seller_vip_time', group: 'vip', label: '商家注册赠送VIP天数', type: 'number', desc: '新注册商家赠送VIP天数' },
    { key: 'user_vip', group: 'vip', label: '买手VIP价格', type: 'text', desc: '买手VIP开通金额（逗号分隔多档位，如: 45,80,115,130）' },
    { key: 'seller_vip', group: 'vip', label: '商家VIP价格', type: 'text', desc: '商家VIP开通金额（逗号分隔多档位，如: 450,800,1000,1200）' },

    // 财务设置 - 提现相关
    { key: 'user_min_money', group: 'finance', label: '买手提现本金最低金额', type: 'number', desc: '买手垫付本金提现最低额（元）' },
    { key: 'seller_min_money', group: 'finance', label: '商家提现本金最低金额', type: 'number', desc: '商家提现本金最低额（元）' },
    { key: 'user_min_reward', group: 'finance', label: '买手提现银锭最低数', type: 'number', desc: '买手提现最少银锭数' },
    { key: 'reward_price', group: 'finance', label: '银锭兑换单价', type: 'number', desc: '1银锭兑换多少元' },
    { key: 'seller_cash_fee', group: 'finance', label: '商家提现手续费率', type: 'number', desc: '商家提现押金手续费率（小数，如0.01表示1%）' },
    { key: 'user_cash_free', group: 'finance', label: '买手提现手续费', type: 'text', desc: '买手提现押金手续费配置' },
    { key: 'user_fee_max_price', group: 'finance', label: '买手免手续费金额', type: 'text', desc: '买手提现免手续费金额' },

    // 服务费用
    { key: 'union_interval', group: 'service', label: '接单间隔服务费', type: 'number', desc: '设置接单间隔的额外费用（元/单）' },
    { key: 'goods_more_fee', group: 'service', label: '多商品费用', type: 'number', desc: '每增加一个商品的费用（元）' },
    { key: 'refund_service_price', group: 'service', label: '返款服务费率', type: 'number', desc: '返款服务费用比例（小数）' },
    { key: 'phone_fee', group: 'service', label: '本立佣货服务费', type: 'number', desc: '本立佣货类型任务服务费（元/单）' },
    { key: 'pc_fee', group: 'service', label: '本佣货返服务费率', type: 'number', desc: '本佣货返类型服务费比例（小数）' },
    { key: 'timing_pay', group: 'service', label: '定时付款服务费', type: 'number', desc: '定时付款额外费用（元/单）' },
    { key: 'timing_publish', group: 'service', label: '定时发布服务费', type: 'number', desc: '定时发布额外费用（元/单）' },
    { key: 'next_day', group: 'service', label: '隔天任务服务费', type: 'number', desc: '隔天任务额外费用（元/单）' },
    { key: 'postage', group: 'service', label: '邮费', type: 'number', desc: '默认邮费（元/单）' },
    { key: 're_pay', group: 'service', label: '回购任务发布费', type: 'number', desc: '回购任务发布费用（元）' },
    { key: 'ys_fee', group: 'service', label: '预售任务服务费', type: 'number', desc: '预售任务每单服务费（元）' },

    // 好评费用
    { key: 'praise', group: 'praise', label: '文字好评费用', type: 'number', desc: '文字好评每条费用（元）' },
    { key: 'img_praise', group: 'praise', label: '图片好评费用', type: 'number', desc: '图片好评每条费用（元）' },
    { key: 'video_praise', group: 'praise', label: '视频好评费用', type: 'number', desc: '视频好评每条费用（元）' },

    // 佣金分成
    { key: 'divided', group: 'commission', label: '买手佣金分成比例', type: 'number', desc: '买手任务佣金分成比例（如0.6表示60%）' },

    // 账号配置
    { key: 'msg_username', group: 'account', label: '短信账号', type: 'text', desc: '短信服务账号' },
    { key: 'msg_password', group: 'account', label: '短信密码', type: 'password', desc: '短信服务密码' },
    { key: 'alipay', group: 'account', label: '支付宝收款账号', type: 'text', desc: '平台支付宝收款账号' },
];

export default function AdminSystemParamsPage() {
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        setSaving(true);

        // 只保存当前标签页的配置
        const currentGroupConfigs = DEFAULT_CONFIGS.filter(c => c.group === activeTab);
        const updates = currentGroupConfigs.map(c => ({
            key: c.key,
            value: String(configs[c.key] || ''),
            group: c.group
        }));

        try {
            const res = await fetch(`${BASE_URL}/system-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ configs: updates })
            });
            const json = await res.json();
            if (json.success) {
                alert('保存成功');
            } else {
                alert('保存失败: ' + json.message);
            }
        } catch (e) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveAll = async () => {
        const token = localStorage.getItem('adminToken');
        setSaving(true);

        const updates = DEFAULT_CONFIGS.map(c => ({
            key: c.key,
            value: String(configs[c.key] || ''),
            group: c.group
        }));

        try {
            const res = await fetch(`${BASE_URL}/system-config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ configs: updates })
            });
            const json = await res.json();
            if (json.success) {
                alert('全部保存成功');
            } else {
                alert('保存失败: ' + json.message);
            }
        } catch (e) {
            alert('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const groups = ['basic', 'vip', 'finance', 'service', 'praise', 'commission', 'account'];
    const currentConfigs = DEFAULT_CONFIGS.filter(c => c.group === activeTab);

    return (
        <div>
            <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                {/* 标签头部 */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="hide-scrollbar" style={{ display: 'flex', gap: '24px', overflowX: 'auto', paddingBottom: '2px', flex: 1 }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .hide-scrollbar::-webkit-scrollbar { display: none; }
                            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                        `}} />
                        {groups.map(g => (
                            <span
                                key={g}
                                onClick={() => setActiveTab(g)}
                                style={{
                                    fontSize: '14px',
                                    fontWeight: activeTab === g ? '600' : '400',
                                    color: activeTab === g ? '#1890ff' : '#666',
                                    cursor: 'pointer',
                                    paddingBottom: '14px',
                                    marginBottom: '-17px',
                                    borderBottom: activeTab === g ? '2px solid #1890ff' : 'none',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {GROUP_LABELS[g]}
                            </span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{ padding: '8px 16px', background: '#fff', color: '#1890ff', border: '1px solid #1890ff', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                        >
                            保存当前页
                        </button>
                        <button
                            onClick={handleSaveAll}
                            disabled={saving}
                            style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}
                        >
                            {saving ? '保存中...' : '保存全部'}
                        </button>
                    </div>
                </div>

                {/* 配置内容 */}
                <div style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{ color: '#999', textAlign: 'center', padding: '40px' }}>加载中...</div>
                    ) : (
                        <>
                            <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
                                <span style={{ color: '#52c41a', fontWeight: '500' }}>{GROUP_LABELS[activeTab]}</span>
                                <span style={{ color: '#666', marginLeft: '12px', fontSize: '13px' }}>共 {currentConfigs.length} 项配置</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                                {currentConfigs.map(c => (
                                    <div key={c.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ color: '#333', fontSize: '14px', fontWeight: '500' }}>
                                            {c.label}
                                            <span style={{ color: '#999', fontSize: '12px', fontWeight: '400', marginLeft: '8px' }}>({c.key})</span>
                                        </label>
                                        {c.type === 'text' || c.type === 'password' ? (
                                            <input
                                                type={c.type}
                                                value={configs[c.key] || ''}
                                                onChange={e => setConfigs(prev => ({ ...prev, [c.key]: e.target.value }))}
                                                style={{ padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                                                placeholder={`请输入${c.label}`}
                                            />
                                        ) : (
                                            <input
                                                type="number"
                                                step={c.key.includes('fee') || c.key.includes('divided') ? '0.001' : '1'}
                                                value={configs[c.key] || ''}
                                                onChange={e => setConfigs(prev => ({ ...prev, [c.key]: e.target.value }))}
                                                style={{ padding: '10px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
                                                placeholder="0"
                                            />
                                        )}
                                        <span style={{ color: '#999', fontSize: '12px' }}>{c.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 配置说明 */}
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px 24px', marginTop: '16px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#333' }}>配置说明</h4>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                    <p style={{ margin: '0 0 8px' }}><strong>基本设置：</strong>系统基础功能开关和限制配置</p>
                    <p style={{ margin: '0 0 8px' }}><strong>会员设置：</strong>VIP价格、注册赠送等会员相关配置</p>
                    <p style={{ margin: '0 0 8px' }}><strong>财务设置：</strong>提现限额、手续费等财务相关配置</p>
                    <p style={{ margin: '0 0 8px' }}><strong>服务费用：</strong>各类任务附加服务的费用配置</p>
                    <p style={{ margin: '0 0 8px' }}><strong>好评费用：</strong>文字/图片/视频好评的单价配置</p>
                    <p style={{ margin: '0 0 8px' }}><strong>佣金分成：</strong>平台与买手的佣金分成比例</p>
                    <p style={{ margin: 0 }}><strong>账号配置：</strong>短信服务、支付账号等第三方服务配置</p>
                </div>
            </div>
        </div>
    );
}
