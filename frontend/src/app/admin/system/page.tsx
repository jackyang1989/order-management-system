'use client';

import { useState, useEffect } from 'react';
import api from '../../../services/api';

interface SystemGlobalConfig {
    id: number;
    // 注册赠送配置
    userNum: number;
    sellerNum: number;
    userVipTime: number;
    sellerVipTime: number;
    // VIP价格配置
    userVip: string;
    sellerVip: string;
    // 提现相关配置
    userMinMoney: number;
    sellerMinMoney: number;
    userMinReward: number;
    rewardPrice: number;
    sellerCashFee: number;
    userCashFree: string;
    userFeeMaxPrice: string;
    // 服务费用配置
    unionInterval: number;
    goodsMoreFee: number;
    refundServicePrice: number;
    phoneFee: number;
    pcFee: number;
    timingPay: number;
    timingPublish: number;
    nextDay: number;
    postage: number;
    rePay: number;
    ysFee: number;
    // 好评费用配置
    praise: number;
    imgPraise: number;
    videoPraise: number;
    // 佣金分成配置
    divided: number;
    // 系统账号配置
    msgUsername: string;
    msgPassword: string;
    alipay: string;
    // 其他配置
    verifySwitch: number;
    limitMobile: string;
    invitationNum: number;
    // 第三方API
    dingdanxiaApiKey: string;
    dingdanxiaEnabled: boolean;
    // 动态业务配置
    starThresholds: string;
    starPriceLimits: string;
    firstAccountVipDays: number;
    passwordCheckEnabled: boolean;
    // 邀请奖励配置
    inviteRewardAmount: number;
    inviteMaxOrders: number;
    inviteExpiryDays: number;
    // 平台开关配置
    enabledPlatforms: string;
    updatedAt: string;
}

interface ConfigField {
    key: keyof SystemGlobalConfig;
    label: string;
    type: 'number' | 'text' | 'boolean' | 'textarea';
    description?: string;
}

interface ConfigGroup {
    title: string;
    fields: ConfigField[];
}

const configGroups: ConfigGroup[] = [
    {
        title: '注册赠送配置',
        fields: [
            { key: 'userNum', label: '买手注册赠送银锭', type: 'number', description: '新买手注册时赠送的银锭数量' },
            { key: 'sellerNum', label: '商家注册赠送银锭', type: 'number', description: '新商家注册时赠送的银锭数量' },
            { key: 'userVipTime', label: '买手注册赠送VIP天数', type: 'number' },
            { key: 'sellerVipTime', label: '商家注册赠送VIP天数', type: 'number' },
        ],
    },
    {
        title: 'VIP价格配置',
        fields: [
            { key: 'userVip', label: '买手VIP开通金额', type: 'text', description: '逗号分隔多档位，如: 45,80,115,130' },
            { key: 'sellerVip', label: '商家VIP开通金额', type: 'text', description: '逗号分隔多档位，如: 450,800,1000,1200' },
        ],
    },
    {
        title: '提现相关配置',
        fields: [
            { key: 'userMinMoney', label: '买手提现本金最低金额', type: 'number' },
            { key: 'sellerMinMoney', label: '商家提现本金最低金额', type: 'number' },
            { key: 'userMinReward', label: '买手提现银锭最低数量', type: 'number' },
            { key: 'rewardPrice', label: '银锭兑换单价 (元)', type: 'number', description: '1银锭兑换多少元' },
            { key: 'sellerCashFee', label: '商家提现手续费率', type: 'number', description: '商家提现押金手续费率' },
            { key: 'userCashFree', label: '买手提现手续费规则', type: 'text' },
            { key: 'userFeeMaxPrice', label: '买手免手续费金额', type: 'text' },
        ],
    },
    {
        title: '服务费用配置',
        fields: [
            { key: 'unionInterval', label: '接单间隔服务费', type: 'number' },
            { key: 'goodsMoreFee', label: '多商品费用 (每个)', type: 'number' },
            { key: 'refundServicePrice', label: '返款服务费', type: 'number' },
            { key: 'phoneFee', label: '本立佣货服务费', type: 'number' },
            { key: 'pcFee', label: '本佣货返服务费', type: 'number' },
            { key: 'timingPay', label: '定时付款服务费', type: 'number' },
            { key: 'timingPublish', label: '定时发布服务费', type: 'number' },
            { key: 'nextDay', label: '隔天任务服务费', type: 'number' },
            { key: 'postage', label: '邮费/单', type: 'number' },
            { key: 'rePay', label: '回购任务发布费', type: 'number' },
            { key: 'ysFee', label: '预售每单服务费', type: 'number' },
        ],
    },
    {
        title: '好评费用配置',
        fields: [
            { key: 'praise', label: '文字好评费用', type: 'number' },
            { key: 'imgPraise', label: '图片好评费用', type: 'number' },
            { key: 'videoPraise', label: '视频好评费用', type: 'number' },
        ],
    },
    {
        title: '佣金分成配置',
        fields: [
            { key: 'divided', label: '买手佣金分成比例', type: 'number', description: '如0.6表示60%归买手' },
        ],
    },
    {
        title: '系统账号配置',
        fields: [
            { key: 'msgUsername', label: '短信账号', type: 'text' },
            { key: 'msgPassword', label: '短信密码', type: 'text' },
            { key: 'alipay', label: '支付宝收款账号', type: 'text' },
        ],
    },
    {
        title: '第三方API配置',
        fields: [
            { key: 'dingdanxiaApiKey', label: '订单侠API Key', type: 'text' },
            { key: 'dingdanxiaEnabled', label: '启用订单侠', type: 'boolean' },
        ],
    },
    {
        title: '买号升星配置',
        fields: [
            { key: 'starThresholds', label: '升星阶梯', type: 'textarea', description: 'JSON格式: {"2":30,"3":60,"4":90,"5":120} 表示30单升2星' },
            { key: 'starPriceLimits', label: '星级限价', type: 'textarea', description: 'JSON格式: {"1":100,"2":500,...} 表示N星最高可接X元任务' },
            { key: 'firstAccountVipDays', label: '首个买号审核通过赠送VIP天数', type: 'number' },
        ],
    },
    {
        title: '邀请奖励配置',
        fields: [
            { key: 'inviteRewardAmount', label: '每单邀请奖励银锭', type: 'number' },
            { key: 'inviteMaxOrders', label: '单人最大贡献单数', type: 'number', description: '超出后不再发放奖励' },
            { key: 'inviteExpiryDays', label: '活跃判定天数', type: 'number', description: '超过此天数未做任务则暂停奖励' },
        ],
    },
    {
        title: '其他配置',
        fields: [
            { key: 'verifySwitch', label: '商品核对码验证开关', type: 'number', description: '0关闭 1开启' },
            { key: 'passwordCheckEnabled', label: '商品口令核对开关', type: 'boolean' },
            { key: 'invitationNum', label: '邀请解锁阈值', type: 'number', description: '完成多少单才能解锁邀请功能' },
            { key: 'limitMobile', label: '禁止注册手机号', type: 'textarea', description: '逗号分隔多个手机号' },
        ],
    },
];

interface Platform {
    id: string;
    code: string;
    name: string;
    icon?: string;
    isActive: boolean;
    sortOrder: number;
}

export default function AdminSystemPage() {
    const [config, setConfig] = useState<SystemGlobalConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [platforms, setPlatforms] = useState<Platform[]>([]);

    useEffect(() => {
        loadConfig();
        loadPlatforms();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get<SystemGlobalConfig>('/system-config/global');
            setConfig(response.data);
        } catch (err: any) {
            setError(err.message || '加载配置失败');
        } finally {
            setLoading(false);
        }
    };

    const loadPlatforms = async () => {
        try {
            const response = await api.get<{ success: boolean; data: Platform[] }>('/admin/platforms?activeOnly=false');
            setPlatforms(response.data?.data || []);
        } catch (err: any) {
            console.error('加载平台失败:', err);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        setError(null);
        try {
            const { id, updatedAt, ...updateData } = config;
            await api.put('/system-config/global', updateData);
            alert('配置保存成功');
            loadConfig();
        } catch (err: any) {
            setError(err.message || '保存配置失败');
            alert('保存失败: ' + (err.message || '未知错误'));
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (key: keyof SystemGlobalConfig, value: string | number | boolean) => {
        if (!config) return;
        setConfig({ ...config, [key]: value });
    };

    const togglePlatform = async (platform: Platform) => {
        try {
            await api.put(`/admin/platforms/${platform.id}/toggle`, { isActive: !platform.isActive });
            loadPlatforms();
        } catch (err) {
            console.error('切换平台失败:', err);
        }
    };

    const renderField = (field: ConfigField) => {
        if (!config) return null;
        const value = config[field.key];

        if (field.type === 'boolean') {
            return (
                <div key={field.key} className="flex flex-col gap-2">
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={Boolean(value)}
                            onChange={e => handleChange(field.key, e.target.checked)}
                            className="h-4 w-4 rounded border-[#e5e7eb] text-primary-500 focus:ring-primary-500"
                        />
                        <span className="text-[13px] text-[#3b4559]">{field.label}</span>
                    </label>
                    {field.description && (
                        <span className="text-[12px] text-[#9ca3af]">{field.description}</span>
                    )}
                </div>
            );
        }

        if (field.type === 'textarea') {
            return (
                <div key={field.key} className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-700">{field.label}</label>
                    <textarea
                        value={String(value ?? '')}
                        onChange={e => handleChange(field.key, e.target.value)}
                        className="min-h-[80px] w-full resize-y rounded-2xl border-none bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                        rows={3}
                    />
                    {field.description && (
                        <span className="text-[12px] text-[#9ca3af]">{field.description}</span>
                    )}
                </div>
            );
        }

        return (
            <div key={field.key} className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">{field.label}</label>
                <input
                    type={field.type}
                    value={value as string | number ?? ''}
                    onChange={e => {
                        const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                        handleChange(field.key, val);
                    }}
                    className="w-full rounded-2xl border-none bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:shadow-sm"
                    step={field.type === 'number' ? 'any' : undefined}
                />
                {field.description && (
                    <span className="text-[12px] text-[#9ca3af]">{field.description}</span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-[#6b7280]">加载配置中...</div>
            </div>
        );
    }

    if (error && !config) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
                <div className="text-danger-400">{error}</div>
                <button
                    onClick={loadConfig}
                    className="rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
                >
                    重试
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between overflow-hidden rounded-md border border-[#e5e7eb] bg-white px-6 py-4 ">
                <span className="text-[15px] font-semibold text-[#3b4559]">系统配置管理</span>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="cursor-pointer rounded-md bg-primary-500 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? '保存中...' : '保存配置'}
                </button>
            </div>

            {error && (
                <div className="rounded-md border border-danger-100 bg-danger-50 p-4 text-[14px] text-danger-500">{error}</div>
            )}

            {/* 平台开关配置 - 放在最前面 */}
            <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white ">
                <div className="border-b border-[#e5e7eb] px-6 py-4">
                    <span className="text-[15px] font-semibold text-[#3b4559]">平台开关配置</span>
                    <span className="ml-2 text-[12px] text-[#6b7280]">控制全站显示的平台，关闭后该平台在用户端、商家端均不可见</span>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                        {platforms.sort((a, b) => a.sortOrder - b.sortOrder).map(platform => {
                            const isEnabled = platform.isActive;
                            return (
                                <div
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform)}
                                    className={`cursor-pointer rounded-md border-2 p-4 text-center transition-all ${isEnabled
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-[#e5e7eb] bg-[#f9fafb] opacity-60'
                                        }`}
                                >
                                    <div className="mb-2 text-2xl">{platform.icon || '🛒'}</div>
                                    <div className={`text-[13px] font-medium ${isEnabled ? 'text-primary-600' : 'text-[#6b7280]'}`}>
                                        {platform.name}
                                    </div>
                                    <div className={`mt-1 text-[11px] ${isEnabled ? 'text-success-500' : 'text-[#9ca3af]'}`}>
                                        {isEnabled ? '已启用' : '已关闭'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4 text-[12px] text-[#6b7280]">
                        提示：关闭平台后，用户无法绑定该平台买号、商家无法发布该平台任务、任务大厅不显示该平台任务
                    </div>
                </div>
            </div>

            {/* Config Groups */}
            {configGroups.map(group => (
                <div key={group.title} className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white ">
                    <div className="border-b border-[#e5e7eb] px-6 py-4">
                        <span className="text-[15px] font-semibold text-[#3b4559]">{group.title}</span>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {group.fields.map(field => renderField(field))}
                        </div>
                    </div>
                </div>
            ))}

            {/* System Info */}
            <div className="overflow-hidden rounded-md border border-[#e5e7eb] bg-white p-6 ">
                <h3 className="mb-4 text-[15px] font-semibold text-[#3b4559]">系统信息</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-md bg-[#f9fafb] p-4">
                        <div className="mb-1 text-[12px] text-[#6b7280]">系统版本</div>
                        <div className="text-[14px] font-medium text-[#3b4559]">v2.0.0</div>
                    </div>
                    <div className="rounded-md bg-[#f9fafb] p-4">
                        <div className="mb-1 text-[12px] text-[#6b7280]">配置更新时间</div>
                        <div className="text-[14px] font-medium text-[#3b4559]">
                            {config?.updatedAt ? new Date(config.updatedAt).toLocaleString('zh-CN') : '-'}
                        </div>
                    </div>
                    <div className="rounded-md bg-[#f9fafb] p-4">
                        <div className="mb-1 text-[12px] text-[#6b7280]">服务器时间</div>
                        <div className="text-[14px] font-medium text-[#3b4559]">{new Date().toLocaleString('zh-CN')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
