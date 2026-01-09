'use client';

import { useState, useEffect, useMemo } from 'react';
import { TaskFormData, TaskType, TaskEntryType } from './types';
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

// 任务入口类型定义
const TASK_ENTRY_TYPES = [
    { id: TaskEntryType.KEYWORD, name: '关键词', icon: '🔍', desc: '通过搜索关键词找到商品' },
    { id: TaskEntryType.TAOWORD, name: '淘口令', icon: '📋', desc: '复制淘口令打开商品' },
    { id: TaskEntryType.QRCODE, name: '二维码', icon: '📱', desc: '扫描二维码进入商品' },
    { id: TaskEntryType.ZTC, name: '直通车', icon: '🚗', desc: '通过直通车搜索进入' },
    { id: TaskEntryType.CHANNEL, name: '通道', icon: '🔗', desc: '通过指定通道链接进入' },
];

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
    const handleEntryTypeChange = (entryType: number) => { onChange({ taskEntryType: entryType }); };
    const handleShopChange = (shopId: string) => { const selectedShop = shops.find(s => s.id === shopId); if (selectedShop) onChange({ shopId: selectedShop.id, shopName: selectedShop.shopName }); else onChange({ shopId: '', shopName: '' }); };
    const handleFetchInfo = () => { if (!data.url) return; onChange({ title: '示例商品标题 - ' + (data.url.length > 10 ? data.url.substring(0, 10) : '未知'), mainImage: 'https://via.placeholder.com/150', goodsPrice: 99.00 }); };

    const platformCode = getShopPlatformCode(data.taskType);
    const filteredShops = shops.filter(s => s.platform === platformCode || s.platform === 'OTHER');

    // 根据任务入口类型确定是否可以进入下一步
    const getEntryTypeValid = () => {
        const entryType = data.taskEntryType || TaskEntryType.KEYWORD;
        switch (entryType) {
            case TaskEntryType.KEYWORD:
                return !!data.keyword;
            case TaskEntryType.TAOWORD:
                return !!data.taoWord;
            case TaskEntryType.QRCODE:
                return !!data.qrCodeImage;
            case TaskEntryType.ZTC:
                return !!data.ztcKeyword;
            case TaskEntryType.CHANNEL:
                return !!data.channelUrl;
            default:
                return !!data.keyword;
        }
    };

    const isNextDisabled = !data.shopId || !data.url || !data.title || data.goodsPrice <= 0 || data.count <= 0 || !getEntryTypeValid();

    return (
        <div className="p-6">
            <h2 className="mb-6 text-lg font-bold text-[#3b4559]">第一步：填写基础任务信息</h2>

            {/* Platform Selection */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#374151]">发布平台</label>
                <div className="flex flex-wrap gap-4">
                    {loadingPlatforms ? (
                        <div className="text-[#9ca3af]">加载平台中...</div>
                    ) : taskPlatforms.map(p => (
                        <div key={p.id} onClick={() => handlePlatformChange(p.id)} className={cn('flex cursor-pointer items-center gap-2 rounded-md border px-6 py-3 transition-all', data.taskType === p.id ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb] bg-white')}>
                            <span>{p.icon}</span>
                            <span className={cn(data.taskType === p.id ? 'font-semibold text-primary-600' : 'text-[#374151]')}>{p.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Task Entry Type Selection */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#374151]">任务类型（搜索入口）</label>
                <div className="flex flex-wrap gap-3">
                    {TASK_ENTRY_TYPES.map(entry => (
                        <div
                            key={entry.id}
                            onClick={() => handleEntryTypeChange(entry.id)}
                            className={cn(
                                'flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2.5 transition-all',
                                (data.taskEntryType || TaskEntryType.KEYWORD) === entry.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                            )}
                        >
                            <span>{entry.icon}</span>
                            <div>
                                <span className={cn('text-sm', (data.taskEntryType || TaskEntryType.KEYWORD) === entry.id ? 'font-semibold text-primary-600' : 'text-[#374151]')}>{entry.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <p className="mt-2 text-xs text-[#6b7280]">
                    {TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.desc}
                </p>
            </div>

            {/* Shop Selection & URL */}
            <div className="mb-6 flex gap-6">
                <div className="w-[260px] shrink-0">
                    <label className="mb-2 block text-sm text-[#374151]">选择店铺</label>
                    {loadingShops ? (
                        <div className="px-3 py-2.5 text-[#9ca3af]">加载中...</div>
                    ) : filteredShops.length === 0 ? (
                        <div className="rounded-md bg-amber-50 px-3 py-2.5 text-sm text-warning-500">⚠️ 暂无该平台已审核通过的店铺，请先到 <a href="/merchant/shops" className="text-primary-600">店铺管理</a> 绑定店铺。</div>
                    ) : (
                        <Select value={data.shopId} onChange={handleShopChange} options={[{ value: '', label: '请选择店铺...' }, ...filteredShops.map(shop => ({ value: shop.id, label: `${shop.shopName} (${shop.accountName})` }))]} />
                    )}
                </div>
                <div className="flex-1">
                    <label className="mb-2 block text-sm text-[#374151]">商品链接</label>
                    <div className="flex items-center gap-2">
                        <Input type="text" value={data.url} onChange={e => onChange({ url: e.target.value })} placeholder="粘贴商品链接/口令" className="flex-1" />
                        <button onClick={handleFetchInfo} className="h-[38px] rounded-md border border-[#d1d5db] bg-[#f3f4f6] px-5 text-[14px] text-[#4b5563] transition-colors hover:bg-[#e5e7eb] focus:outline-none focus:ring-2 focus:ring-primary-500/20">获取</button>
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div className="mb-6 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-5">
                <div className="flex items-start gap-6">
                    <div className="flex h-[110px] w-[110px] shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-white">
                        {data.mainImage ? <img src={data.mainImage} alt="Main" className="h-full w-full object-cover" /> : <span className="text-3xl text-[#9ca3af]">📷</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm font-medium text-[#3b4559]">商品标题</label>
                            <Input type="text" value={data.title} onChange={e => onChange({ title: e.target.value })} placeholder="获取商品信息后自动填充" />
                        </div>
                        <div className="flex gap-6">
                            <div className="w-[180px]">
                                <label className="mb-1.5 block text-sm font-medium text-[#3b4559]">商品价格 (元)</label>
                                <Input type="number" value={String(data.goodsPrice)} onChange={e => onChange({ goodsPrice: parseFloat(e.target.value) || 0 })} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Entry Type Specific Input */}
            <div className="mb-6 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-5">
                <h3 className="mb-4 text-sm font-semibold text-[#3b4559]">
                    {TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.name}设置
                </h3>

                {/* 关键词输入 */}
                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.KEYWORD && (
                    <div>
                        <label className="mb-1.5 block text-sm text-[#374151]">搜索关键词 <span className="text-red-500">*</span></label>
                        <Input type="text" value={data.keyword} onChange={e => onChange({ keyword: e.target.value })} placeholder="请输入买家需要搜索的关键词" />
                        <p className="mt-1.5 text-xs text-[#6b7280]">买家将通过此关键词在平台搜索找到您的商品</p>
                    </div>
                )}

                {/* 淘口令输入 */}
                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.TAOWORD && (
                    <div>
                        <label className="mb-1.5 block text-sm text-[#374151]">淘口令 <span className="text-red-500">*</span></label>
                        <Input type="text" value={data.taoWord || ''} onChange={e => onChange({ taoWord: e.target.value })} placeholder="请输入淘口令，如：1�February February e0K8YCIBzPw￥" />
                        <p className="mt-1.5 text-xs text-[#6b7280]">买家将复制此淘口令打开淘宝/天猫App直接跳转商品</p>
                    </div>
                )}

                {/* 二维码上传 */}
                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.QRCODE && (
                    <div>
                        <label className="mb-1.5 block text-sm text-[#374151]">二维码图片 <span className="text-red-500">*</span></label>
                        <div className="flex items-start gap-4">
                            <div className="flex h-[120px] w-[120px] items-center justify-center rounded-md border-2 border-dashed border-[#d1d5db] bg-white">
                                {data.qrCodeImage ? (
                                    <img src={data.qrCodeImage} alt="QR Code" className="h-full w-full object-contain p-2" />
                                ) : (
                                    <span className="text-4xl text-[#9ca3af]">📱</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <Input type="text" value={data.qrCodeImage || ''} onChange={e => onChange({ qrCodeImage: e.target.value })} placeholder="请输入二维码图片URL或上传图片" />
                                <p className="mt-1.5 text-xs text-[#6b7280]">买家将扫描此二维码进入商品页面</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 直通车关键词 */}
                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.ZTC && (
                    <div>
                        <label className="mb-1.5 block text-sm text-[#374151]">直通车关键词 <span className="text-red-500">*</span></label>
                        <Input type="text" value={data.ztcKeyword || ''} onChange={e => onChange({ ztcKeyword: e.target.value })} placeholder="请输入直通车推广关键词" />
                        <p className="mt-1.5 text-xs text-[#6b7280]">买家将通过直通车搜索入口，使用此关键词找到您的商品（通常显示在搜索结果靠前位置）</p>
                    </div>
                )}

                {/* 通道链接 */}
                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.CHANNEL && (
                    <div>
                        <label className="mb-1.5 block text-sm text-[#374151]">通道链接 <span className="text-red-500">*</span></label>
                        <Input type="text" value={data.channelUrl || ''} onChange={e => onChange({ channelUrl: e.target.value })} placeholder="请输入通道跳转链接" />
                        <p className="mt-1.5 text-xs text-[#6b7280]">买家将通过此链接直接进入指定的商品页面或活动页面</p>
                    </div>
                )}
            </div>

            {/* Count */}
            <div className="mb-8">
                <label className="mb-2 block text-sm font-medium text-[#374151]">发布任务数量</label>
                <div className="flex items-center gap-3">
                    <div className="flex items-center">
                        <button onClick={() => onChange({ count: Math.max(1, data.count - 1) })} className="flex h-9 w-9 items-center justify-center rounded-l border border-[#d1d5db] bg-white text-gray-600 hover:bg-gray-50">-</button>
                        <Input type="number" value={String(data.count)} onChange={e => onChange({ count: parseInt(e.target.value) || 1 })} className="w-20 rounded-none border-x-0 text-center focus:ring-0" />
                        <button onClick={() => onChange({ count: data.count + 1 })} className="flex h-9 w-9 items-center justify-center rounded-r border border-[#d1d5db] bg-white text-gray-600 hover:bg-gray-50">+</button>
                    </div>
                    <span className="text-sm text-[#6b7280]">单</span>
                </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-end border-t border-[#e5e7eb] pt-8">
                <Button onClick={onNext} disabled={isNextDisabled} className={cn('min-w-[140px] h-11 text-[15px] font-semibold transition-all', isNextDisabled ? 'cursor-not-allowed bg-[#cbd5e1] text-white' : 'bg-primary-600 text-white shadow-md shadow-primary-600/20 hover:bg-primary-700 active:scale-[0.98]')}>下一步 →</Button>
            </div>
        </div>
    );
}
