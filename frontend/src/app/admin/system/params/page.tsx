'use client';

import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { toastSuccess, toastError } from '../../../../lib/toast';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Tabs } from '../../../../components/ui/tabs';
import { BASE_URL } from '../../../../../apiConfig';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SystemConfig {
    id: string;
    key: string;
    value: string;
    group: string;
    label: string;
    description: string;
    valueType: string;
    options: string | null;
    dependsOn: string | null;
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
    withdrawal: '💰',
    task_fee: '🧮',
    praise_fee: '⭐',
    commission: '📊',
    sms: '📱',
    payment: '💳',
    api: '🔗',
    system: '⚙️',
};

// 可排序的配置项组件
function SortableConfigItem({
    config,
    editedValue,
    onUpdateField,
    renderInput,
}: {
    config: SystemConfig;
    editedValue: string;
    onUpdateField: (key: string, value: string) => void;
    renderInput: (config: SystemConfig, value: string) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.key });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "rounded-md border border-[#e5e7eb] p-4 transition-all",
                isDragging && "opacity-50 shadow-lg z-50"
            )}
        >
            <div className="mb-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-medium text-[#374151]">
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="拖动排序"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="4" r="1" fill="currentColor" />
                            <circle cx="10" cy="4" r="1" fill="currentColor" />
                            <circle cx="6" cy="8" r="1" fill="currentColor" />
                            <circle cx="10" cy="8" r="1" fill="currentColor" />
                            <circle cx="6" cy="12" r="1" fill="currentColor" />
                            <circle cx="10" cy="12" r="1" fill="currentColor" />
                        </svg>
                    </button>
                    {config.label || config.key}
                </label>
                <span className="text-xs text-slate-400">#{config.sortOrder || 0}</span>
            </div>
            {renderInput(config, editedValue)}
            {config.description && (
                <p className="mt-1.5 text-xs text-[#9ca3af]">{config.description}</p>
            )}
        </div>
    );
}

export default function AdminSystemParamsPage() {
    const [configs, setConfigs] = useState<Record<string, SystemConfig[]>>({});
    const [groups, setGroups] = useState<GroupMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('');
    const [editedValues, setEditedValues] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // 拖拽传感器配置
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${BASE_URL}/admin/config`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    // 过滤掉 VIP 相关的配置组
                    const filteredConfigs: Record<string, SystemConfig[]> = {};
                    Object.entries(result.data.configs || {}).forEach(([group, configs]) => {
                        if (group !== 'vip') {
                            // 过滤掉该组内 group 为 'vip' 的配置项
                            filteredConfigs[group] = (configs as SystemConfig[]).filter(cfg => cfg.group !== 'vip');
                        }
                    });

                    // 过滤掉 VIP 分组
                    const filteredGroups = (result.data.groups || []).filter((g: GroupMeta) => g.key !== 'vip');

                    setConfigs(filteredConfigs);
                    setGroups(filteredGroups);

                    // 初始化 editedValues
                    const initialValues: Record<string, string> = {};
                    Object.values(filteredConfigs).forEach(groupConfigs => {
                        groupConfigs.forEach((cfg: SystemConfig) => {
                            initialValues[cfg.key] = cfg.value || '';
                        });
                    });
                    setEditedValues(initialValues);
                    // 设置默认tab
                    if (filteredGroups.length > 0 && !activeTab) {
                        setActiveTab(filteredGroups[0].key);
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
                await loadConfig();
            } else {
                toastError('保存失败');
            }
        } catch (err) {
            console.error(err);
            toastError('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: string, value: string) => {
        setEditedValues(prev => ({ ...prev, [key]: value }));
    };

    // 处理拖拽结束
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) {
            return;
        }

        const currentConfigs = configs[activeTab] || [];
        const oldIndex = currentConfigs.findIndex((c) => c.key === active.id);
        const newIndex = currentConfigs.findIndex((c) => c.key === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // 更新本地状态
        const newConfigs = arrayMove(currentConfigs, oldIndex, newIndex);

        // 更新 sortOrder
        newConfigs.forEach((config, idx) => {
            config.sortOrder = idx + 1;
        });

        setConfigs(prev => ({
            ...prev,
            [activeTab]: newConfigs
        }));

        // 保存新的排序到后端
        try {
            const token = localStorage.getItem('adminToken');
            const orders = newConfigs.map((config, index) => ({
                key: config.key,
                sortOrder: index + 1,
            }));

            await fetch(`${BASE_URL}/admin/config/update-sort-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ orders }),
            });

            toastSuccess('排序已保存');
        } catch (error) {
            console.error('保存排序失败:', error);
            toastError('保存排序失败');
            // 如果失败，恢复原来的顺序
            setConfigs(prev => ({
                ...prev,
                [activeTab]: currentConfigs
            }));
        }
    };

    // 根据 dependsOn 判断是否显示某配置项
    const shouldShowConfig = (config: SystemConfig): boolean => {
        if (!config.dependsOn) return true;
        const [depKey, depValue] = config.dependsOn.split(':');
        const currentValue = editedValues[depKey];
        return currentValue === depValue;
    };

    const currentConfigs = configs[activeTab] || [];
    const visibleConfigs = currentConfigs.filter(shouldShowConfig);

    const renderConfigInput = (config: SystemConfig, value: string) => {
        // 买号升星阶梯 - 可视化编辑器
        if (config.key === 'star_thresholds') {
            try {
                const thresholds = JSON.parse(value) as Record<string, number>;
                const entries = Object.entries(thresholds).sort((a, b) => Number(a[0]) - Number(b[0]));
                return (
                    <div className="space-y-3">
                        {entries.map(([star, orders], index) => (
                            <div key={index} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs font-medium text-slate-500">星级</label>
                                    <input
                                        type="number"
                                        value={star}
                                        onChange={(e) => {
                                            const newEntries = [...entries];
                                            newEntries[index] = [e.target.value, orders];
                                            const newThresholds = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newThresholds));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs font-medium text-slate-500">所需订单数</label>
                                    <input
                                        type="number"
                                        value={orders}
                                        onChange={(e) => {
                                            const newEntries = [...entries];
                                            newEntries[index] = [star, Number(e.target.value)];
                                            const newThresholds = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newThresholds));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                {config.isEditable && entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newEntries = entries.filter((_, i) => i !== index);
                                            const newThresholds = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newThresholds));
                                        }}
                                        className="flex h-[38px] w-8 flex-shrink-0 items-center justify-center text-red-500 hover:text-red-700"
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
                                    const maxStar = Math.max(...entries.map(([s]) => Number(s)), 0);
                                    const newEntries = [...entries, [String(maxStar + 1), 0]];
                                    const newThresholds = Object.fromEntries(newEntries);
                                    updateField(config.key, JSON.stringify(newThresholds));
                                }}
                                className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                                + 添加星级
                            </button>
                        )}
                    </div>
                );
            } catch {
                // JSON解析失败，显示原始文本框
            }
        }

        // 星级限价 - 可视化编辑器
        if (config.key === 'star_price_limits') {
            try {
                const limits = JSON.parse(value) as Record<string, number>;
                const entries = Object.entries(limits).sort((a, b) => Number(a[0]) - Number(b[0]));
                return (
                    <div className="space-y-3">
                        {entries.map(([star, price], index) => (
                            <div key={index} className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs font-medium text-slate-500">星级</label>
                                    <input
                                        type="number"
                                        value={star}
                                        onChange={(e) => {
                                            const newEntries = [...entries];
                                            newEntries[index] = [e.target.value, price];
                                            const newLimits = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newLimits));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="mb-1 block text-xs font-medium text-slate-500">最高限价(元)</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => {
                                            const newEntries = [...entries];
                                            newEntries[index] = [star, Number(e.target.value)];
                                            const newLimits = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newLimits));
                                        }}
                                        className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-sm"
                                        disabled={!config.isEditable}
                                    />
                                </div>
                                {config.isEditable && entries.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newEntries = entries.filter((_, i) => i !== index);
                                            const newLimits = Object.fromEntries(newEntries);
                                            updateField(config.key, JSON.stringify(newLimits));
                                        }}
                                        className="flex h-[38px] w-8 flex-shrink-0 items-center justify-center text-red-500 hover:text-red-700"
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
                                    const maxStar = Math.max(...entries.map(([s]) => Number(s)), 0);
                                    const newEntries = [...entries, [String(maxStar + 1), 0]];
                                    const newLimits = Object.fromEntries(newEntries);
                                    updateField(config.key, JSON.stringify(newLimits));
                                }}
                                className="mt-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                            >
                                + 添加星级
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
                        {options.map((opt: string) => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            } catch { }
        }

        // 根据 valueType 渲染不同类型的输入框
        switch (config.valueType) {
            case 'boolean':
                return (
                    <button
                        onClick={() => updateField(config.key, value === 'true' ? 'false' : 'true')}
                        disabled={!config.isEditable}
                        className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                            value === 'true' ? 'bg-primary-600' : 'bg-[#d1d5db]',
                            !config.isEditable && 'opacity-50 cursor-not-allowed'
                        )}
                    >
                        <span
                            className={cn(
                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                value === 'true' ? 'translate-x-6' : 'translate-x-1'
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
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={visibleConfigs.map(c => c.key)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="grid gap-5 md:grid-cols-2">
                                            {visibleConfigs.map(config => (
                                                <SortableConfigItem
                                                    key={config.key}
                                                    config={config}
                                                    editedValue={editedValues[config.key] ?? config.value ?? ''}
                                                    onUpdateField={updateField}
                                                    renderInput={renderConfigInput}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
