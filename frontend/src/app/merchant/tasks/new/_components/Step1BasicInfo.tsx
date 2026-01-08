'use client';

import { useState, useEffect, useMemo } from 'react';
import { TaskFormData, TaskType } from './types';
import { fetchShops, Shop } from '../../../../../services/shopService';
import { getShopPlatformCode } from '../../../../../constants/platformConfig';
import { fetchEnabledPlatforms, PlatformData } from '../../../../../services/systemConfigService';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Select } from '../../../../../components/ui/select';

// 平台代码到任务类型ID的映射
const PLATFORM_CODE_TO_TASK_TYPE: Record<string, number> = {
    'taobao': 1,
    'tmall': 2,
    'jd': 3,
    'pdd': 4,
    'douyin': 5,
    'kuaishou': 6,
    'xhs': 7,
    'xianyu': 8,
    '1688': 9,
};

interface StepProps { data: TaskFormData; onChange: (data: Partial<TaskFormData>) => void; onNext: () => void; }

export default function Step1BasicInfo({ data, onChange, onNext }: StepProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [loadingPlatforms, setLoadingPlatforms] = useState(true);

    useEffect(() => { loadShops(); loadPlatforms(); }, []);

    const loadShops = async () => { setLoadingShops(true); const shopList = await fetchShops(); setShops(shopList.filter(s => s.status === 1)); setLoadingShops(false); };
    const loadPlatforms = async () => { setLoadingPlatforms(true); const list = await fetchEnabledPlatforms(); setPlatforms(list); setLoadingPlatforms(false); };

    // 将后端平台数据转换为任务平台格式
    const taskPlatforms = useMemo(() => {
        return platforms
            .filter(p => PLATFORM_CODE_TO_TASK_TYPE[p.code])
            .map(p => ({
                id: PLATFORM_CODE_TO_TASK_TYPE[p.code],
                name: p.name,
                icon: p.icon || '🛒',
                platformCode: p.code.toUpperCase(),
            }));
    }, [platforms]);

    const handlePlatformChange = (type: number) => { onChange({ taskType: type, shopId: '', shopName: '' }); };
    const handleShopChange = (shopId: string) => { const selectedShop = shops.find(s => s.id === shopId); if (selectedShop) onChange({ shopId: selectedShop.id, shopName: selectedShop.shopName }); else onChange({ shopId: '', shopName: '' }); };
    const handleFetchInfo = () => { if (!data.url) return; onChange({ title: '示例商品标题 - ' + (data.url.length > 10 ? data.url.substring(0, 10) : '未知'), mainImage: 'https://via.placeholder.com/150', goodsPrice: 99.00 }); };

    const platformCode = getShopPlatformCode(data.taskType);
    const filteredShops = shops.filter(s => s.platform === platformCode || s.platform === 'OTHER');
    const isNextDisabled = !data.shopId || !data.url || !data.title || data.goodsPrice <= 0 || data.count <= 0;

    return (
        <div className="p-6">
            <h2 className="mb-6 text-lg font-bold text-slate-800">第一步：填写基础任务信息</h2>

            {/* Platform Selection */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-slate-700">发布平台</label>
                <div className="flex flex-wrap gap-4">
                    {loadingPlatforms ? (
                        <div className="text-slate-400">加载平台中...</div>
                    ) : taskPlatforms.map(p => (
                        <div key={p.id} onClick={() => handlePlatformChange(p.id)} className={cn('flex cursor-pointer items-center gap-2 rounded-lg border px-6 py-3 transition-all', data.taskType === p.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white')}>
                            <span>{p.icon}</span>
                            <span className={cn(data.taskType === p.id ? 'font-semibold text-indigo-600' : 'text-slate-700')}>{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shop Selection & URL */}
            <div className="mb-6 grid grid-cols-2 gap-6">
                <div>
                    <label className="mb-2 block text-sm text-slate-700">选择店铺</label>
                    {loadingShops ? (
                        <div className="px-3 py-2.5 text-slate-400">加载中...</div>
                    ) : filteredShops.length === 0 ? (
                        <div className="rounded-md bg-amber-50 px-3 py-2.5 text-sm text-amber-600">⚠️ 暂无该平台已审核通过的店铺，请先到 <a href="/merchant/shops" className="text-indigo-600">店铺管理</a> 绑定店铺。</div>
                    ) : (
                        <Select value={data.shopId} onChange={handleShopChange} options={[{ value: '', label: '请选择店铺...' }, ...filteredShops.map(shop => ({ value: shop.id, label: `${shop.shopName} (${shop.accountName})` }))]} />
                    )}
                </div>
                <div>
                    <label className="mb-2 block text-sm text-slate-700">商品链接</label>
                    <div className="flex gap-2">
                        <Input type="text" value={data.url} onChange={e => onChange({ url: e.target.value })} placeholder="粘贴商品链接/口令" className="flex-1" />
                        <button onClick={handleFetchInfo} className="rounded-md border border-slate-300 bg-slate-100 px-4 text-slate-600 hover:bg-slate-200">获取</button>
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-5">
                <div className="flex gap-6">
                    <div className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-lg bg-slate-200">
                        {data.mainImage ? <img src={data.mainImage} alt="Main" className="h-full w-full object-cover" /> : <span className="text-2xl text-slate-400">📷</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm">商品标题</label>
                            <Input type="text" value={data.title} onChange={e => onChange({ title: e.target.value })} />
                        </div>
                        <div className="flex gap-6">
                            <div>
                                <label className="mb-1.5 block text-sm">搜索关键词</label>
                                <Input type="text" value={data.keyword} onChange={e => onChange({ keyword: e.target.value })} className="w-[200px]" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm">商品价格 (元)</label>
                                <Input type="number" value={String(data.goodsPrice)} onChange={e => onChange({ goodsPrice: parseFloat(e.target.value) || 0 })} className="w-[120px]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Count */}
            <div className="mb-8">
                <label className="mb-2 block text-sm text-slate-700">发布任务数量</label>
                <div className="flex items-center gap-3">
                    <button onClick={() => onChange({ count: Math.max(1, data.count - 1) })} className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white">-</button>
                    <Input type="number" value={String(data.count)} onChange={e => onChange({ count: parseInt(e.target.value) || 1 })} className="w-20 text-center" />
                    <button onClick={() => onChange({ count: data.count + 1 })} className="flex h-8 w-8 items-center justify-center rounded border border-slate-300 bg-white">+</button>
                    <span className="text-sm text-slate-500">单</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end border-t border-slate-200 pt-6">
                <Button onClick={onNext} disabled={isNextDisabled} className={cn(isNextDisabled && 'cursor-not-allowed bg-slate-400')}>下一步</Button>
            </div>
        </div>
    );
}
