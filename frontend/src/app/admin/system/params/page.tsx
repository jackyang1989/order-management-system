'use client';

import { useState, useEffect } from 'react';
import { cn } from '../../../../lib/utils';
import { toastSuccess, toastError } from '../../../../lib/toast';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Tabs } from '../../../../components/ui/tabs';
import { adminService, SystemConfigDto } from '../../../../services/adminService';

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
    const [config, setConfig] = useState<Partial<SystemConfigDto>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('finance');

    useEffect(() => { loadConfig(); }, []);

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
            await adminService.updateGlobalConfig(config as SystemConfigDto);
            toastSuccess('配置保存成功');
        } catch (e) {
            toastError('保存失败');
        } finally {
            setSaving(false);
        }
    };

    const updateField = (key: keyof SystemConfigDto, value: unknown) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const groupedItems = CONFIG_ITEMS.filter(c => c.group === activeTab);

    return (
        <div className="space-y-6">
            <Card className="bg-white">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">系统参数配置</h2>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={loadConfig} className="flex items-center gap-1">
                            🔄 刷新
                        </Button>
                        <Button onClick={handleSave} loading={saving} className="flex items-center gap-1">
                            💾 保存配置
                        </Button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12 text-slate-500">
                        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        加载中...
                    </div>
                ) : (
                    <div>
                        <Tabs
                            value={activeTab}
                            onChange={setActiveTab}
                            items={TABS.map(t => ({ key: t.key, label: t.label }))}
                        />

                        <div className="mt-6 max-w-lg space-y-5">
                            {groupedItems.map(item => (
                                <div key={item.key}>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        {item.label}
                                        <span className="ml-2 text-xs font-normal text-slate-400">{item.desc}</span>
                                    </label>
                                    {item.type === 'switch' ? (
                                        <button
                                            type="button"
                                            onClick={() => updateField(item.key, !config[item.key])}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20',
                                                config[item.key] ? 'bg-primary' : 'bg-slate-200'
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200',
                                                    config[item.key] ? 'translate-x-5' : 'translate-x-0'
                                                )}
                                            />
                                        </button>
                                    ) : item.type === 'number' ? (
                                        <input
                                            type="number"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={config[item.key] as number ?? ''}
                                            onChange={(e) => updateField(item.key, e.target.value === '' ? '' : Number(e.target.value))}
                                            min={0}
                                            step="0.01"
                                            placeholder={item.desc}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            value={(config[item.key] as string) ?? ''}
                                            onChange={(e) => updateField(item.key, e.target.value)}
                                            placeholder={item.desc}
                                        />
                                    )}
                                </div>
                            ))}
                            {groupedItems.length === 0 && (
                                <p className="py-8 text-center text-slate-400">该分组暂无配置项</p>
                            )}
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
