'use client';

import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { toastSuccess, toastError } from '../../../../lib/toast';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Tabs } from '../../../../components/ui/tabs';
import { BASE_URL } from '../../../../../apiConfig';

interface SystemConfig {
    id: string;
    key: string;
    value: string;
    group: string;
    label: string;
    description: string;
    valueType: string;
    options: string | null;
    dependsOn: string | null; // 格式: "key:value"，当指定key的值等于value时显示
    sortOrder: number;
    isEditable: boolean;
    isVisible: boolean;
}

interface GroupMeta {
    key: string;
    label: string;
    icon: string;
}

const GROUP_ICONS: Record<string, string> = {
    register: '👤',
    vip: '👑',
    withdrawal: '💰',
    task_fee: '🧮',
    praise_fee: '⭐',
    commission: '📊',
    sms: '📱',
    payment: '💳',
    api: '🔗',
    system: '⚙️',
};

export default function AdminSystemParamsPage() {
    const [configs, setConfigs] = useState<Record<string, SystemConfig[]>>({});
    const [groups, setGroups] = useState<GroupMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('');
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => { loadConfig(); }, []);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            if (!token) {
                setError('未登录，请先登录管理后台');
                setLoading(false);
                return;
            }
            const response = await fetch(`${BASE_URL}/admin/config`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setConfigs(result.data.configs || {});
                    setGroups(result.data.groups || []);
                    // 初始化编辑值
                    const initialValues: Record<string, string> = {};
                    Object.values(result.data.configs || {}).flat().forEach((config: unknown) => {
                        const c = config as SystemConfig;
                        initialValues[c.key] = c.value || '';
                    });
                    setEditedValues(initialValues);
                    // 设置默认tab
                    if (result.data.groups?.length > 0 && !activeTab) {
                        setActiveTab(result.data.groups[0].key);
                    }
                }
            } else if (response.status === 401) {
                setError('登录已过期，请重新登录');
            } else {
                setError('加载配置失败');
            }
        } catch (e) {
            console.error(e);
            setError('网络错误，请检查后端服务是否运行');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            // 找出当前分组中修改过的配置
            const currentConfigs = configs[activeTab] || [];
            const updates = currentConfigs
                .filter(config => editedValues[config.key] !== config.value)
                .map(config => ({ key: config.key, value: editedValues[config.key] }));

            if (updates.length === 0) {
                toastSuccess('没有需要保存的修改');
                setSaving(false);
                return;
            }

            const response = await fetch(`${BASE_URL}/admin/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ configs: updates }),
            });

            if (response.ok) {
                toastSuccess('配置保存成功');
                await loadConfig(); // 重新加载配置
            } else {
                toastError('保存失败');
            }
        } catch (e) {
            toastError('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setEditedValues(prev => ({ ...prev, [key]: value }));
    };

    // 检查配置项是否满足dependsOn条件
    const shouldShowConfig = (config: SystemConfig): boolean => {
        if (!config.dependsOn) return true;
        const [depKey, depValue] = config.dependsOn.split(':');
        const currentValue = editedValues[depKey];
        return currentValue === depValue;
    };

    const currentConfigs = configs[activeTab] || [];
    // 过滤出满足条件的配置项
    const visibleConfigs = currentConfigs.filter(shouldShowConfig);

    const renderConfigInput = (config: SystemConfig) => {
        const value = editedValues[config.key] ?? config.value ?? '';

        // VIP价格特殊处理 - 可视化编辑器
        if (config.key === 'user_vip_prices' || config.key === 'seller_vip_prices') {
            try {
                const prices = JSON.parse(value) as Array<{ days: number; price: number }>;
                return (
                    <div className="space-y-2">
                        {prices.map((item, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 mb-1 block">天数</label>
                                    <input
                                        type="number"
                                        value={item.days}
                                        onChange={(e) => {
                                            const newPrices = [...prices];
                                            newPrices[index].days = Number(e.target.value);
                                            updateField(config.key, JSON.stringify(newPrices));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-slate-500 mb-1 block">价格(元)</label>
                                    <input
                                        type="number"
                                        value={item.price}
                                        onChange={(e) => {
                                            const newPrices = [...prices];
                                            newPrices[index].price = Number(e.target.value);
                                            updateField(config.key, JSON.stringify(newPrices));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                {config.isEditable && prices.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newPrices = prices.filter((_, i) => i !== index);
                                            updateField(config.key, JSON.stringify(newPrices));
                                        }}
                                        className="mt-5 text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}
                        {config.isEditable && (
                            <button
                                type="button"
                                onClick={() => {
                                    const newPrices = [...prices, { days: 30, price: 0 }];
                                    updateField(config.key, JSON.stringify(newPrices));
                                }}
                                className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                            >
                                + 添加价格档位
                            </button>
                        )}
                    </div>
                );
            } catch {
                // JSON解析失败，显示原始文本框
            }
        }

        // 如果有options，渲染下拉选择
        if (config.options) {
            try {
                const options = JSON.parse(config.options);
                return (
                    <select
                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={value}
                        onChange={(e) => updateField(config.key, e.target.value)}
                        disabled={!config.isEditable}
                    >
                        {options.map((opt: { value: string; label: string }) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                );
            } catch {
                // 解析失败，继续渲染其他类型
            }
        }

        switch (config.valueType) {
            case 'boolean':
                return (
                    <button
                        type="button"
                        onClick={() => updateField(config.key, value === 'true' ? 'false' : 'true')}
                        disabled={!config.isEditable}
                        className={cn(
                            'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20',
                            value === 'true' ? 'bg-primary' : 'bg-[#e5e7eb]',
                            !config.isEditable && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span
                            className={cn(
                                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200',
                                value === 'true' ? 'translate-x-5' : 'translate-x-0'
                            )}
                        />
                    </button>
                );
            case 'number':
                return (
                    <input
                        type="number"
                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={value}
                        onChange={(e) => updateField(config.key, e.target.value)}
                        disabled={!config.isEditable}
                        step="0.01"
                    />
                );
            case 'json':
                return (
                    <textarea
                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={value}
                        onChange={(e) => updateField(config.key, e.target.value)}
                        disabled={!config.isEditable}
                        rows={4}
                    />
                );
            case 'array':
                return (
                    <textarea
                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={value}
                        onChange={(e) => updateField(config.key, e.target.value)}
                        disabled={!config.isEditable}
                        rows={2}
                        placeholder="多个值用逗号分隔"
                    />
                );
            default:
                // 密码类字段
                if (config.key.includes('password') || config.key.includes('secret') || config.key.includes('key')) {
                    return (
                        <input
                            type="password"
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={value}
                            onChange={(e) => updateField(config.key, e.target.value)}
                            disabled={!config.isEditable}
                        />
                    );
                }
                return (
                    <input
                        type="text"
                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={value}
                        onChange={(e) => updateField(config.key, e.target.value)}
                        disabled={!config.isEditable}
                    />
                );
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <span className="text-base font-medium">系统参数配置</span>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={loadConfig}>
                            刷新
                        </Button>
                        <Button onClick={handleSave} loading={saving}>
                            保存配置
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-[#6b7280]">
                        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        加载中...
                    </div>
                ) : error ? (
                    <div className="py-12 text-center">
                        <div className="text-danger-400 mb-4">{error}</div>
                        <Button onClick={loadConfig} variant="secondary">重试</Button>
                    </div>
                ) : (
                    <div>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            items={groups.map(g => ({
                                key: g.key,
                                label: `${GROUP_ICONS[g.key] || ''} ${g.label}`,
                            }))}
                        />

                        <div className="mt-6 space-y-5">
                            {visibleConfigs.length === 0 ? (
                                <p className="py-8 text-center text-[#9ca3af]">该分组暂无配置项</p>
                            ) : (
                                <div className="grid gap-5 md:grid-cols-2">
                                    {visibleConfigs.map(config => (
                                        <div key={config.key} className="rounded-md border border-[#e5e7eb] p-4">
                                            <label className="mb-2 block text-sm font-medium text-[#374151]">
                                                {config.label || config.key}
                                            </label>
                                            {renderConfigInput(config)}
                                            {config.description && (
                                                <p className="mt-1.5 text-xs text-[#9ca3af]">{config.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
