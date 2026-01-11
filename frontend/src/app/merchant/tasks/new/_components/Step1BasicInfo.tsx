'use client';

import { useState, useEffect, useMemo } from 'react';
import { TaskFormData, TaskEntryType, GoodsItem } from './types';
import { fetchShops, Shop } from '../../../../../services/shopService';
import { getShopPlatformCode } from '../../../../../constants/platformConfig';
import { fetchEnabledPlatforms, PlatformData } from '../../../../../services/systemConfigService';
import { fetchGoodsByShop, Goods } from '../../../../../services/goodsService';
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

// 生成唯一ID
const generateId = () => `goods_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function Step1BasicInfo({ data, onChange, onNext }: StepProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [loadingPlatforms, setLoadingPlatforms] = useState(true);
    const [showAddGoodsModal, setShowAddGoodsModal] = useState(false);
    const [editingGoods, setEditingGoods] = useState<GoodsItem | null>(null);
    const [newGoodsUrl, setNewGoodsUrl] = useState('');
    const [newGoodsData, setNewGoodsData] = useState<Partial<GoodsItem>>({});
    const [fetchingGoods, setFetchingGoods] = useState(false);
    // 商品库相关状态
    const [showGoodsLibModal, setShowGoodsLibModal] = useState(false);
    const [goodsLibList, setGoodsLibList] = useState<Goods[]>([]);
    const [loadingGoodsLib, setLoadingGoodsLib] = useState(false);

    useEffect(() => { loadShops(); loadPlatforms(); }, []);

    // 当店铺变化时，加载该店铺的商品库
    useEffect(() => {
        if (data.shopId) {
            loadGoodsLib(data.shopId);
        } else {
            setGoodsLibList([]);
        }
    }, [data.shopId]);

    const loadShops = async () => { setLoadingShops(true); const shopList = await fetchShops(); setShops(shopList.filter(s => s && s.status === 1)); setLoadingShops(false); };
    const loadPlatforms = async () => { setLoadingPlatforms(true); const list = await fetchEnabledPlatforms(); setPlatforms(list); setLoadingPlatforms(false); };
    const loadGoodsLib = async (shopId: string) => {
        setLoadingGoodsLib(true);
        const goods = await fetchGoodsByShop(shopId);
        setGoodsLibList(goods);
        setLoadingGoodsLib(false);
    };

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

    const handlePlatformChange = (type: number) => { onChange({ taskType: type, shopId: '', shopName: '', goodsList: [] }); };
    const handleEntryTypeChange = (entryType: number) => { onChange({ taskEntryType: entryType }); };
    const handleShopChange = (shopId: string) => {
        const selectedShop = shops.find(s => s.id === shopId);
        if (selectedShop) onChange({ shopId: selectedShop.id, shopName: selectedShop.shopName });
        else onChange({ shopId: '', shopName: '' });
    };

    const platformCode = getShopPlatformCode(data.taskType);
    const filteredShops = shops.filter(s => s && s.shopName && (s.platform === platformCode || s.platform === 'OTHER'));

    // 计算商品总价
    const totalGoodsPrice = useMemo(() => {
        return data.goodsList.reduce((sum, g) => sum + (g.price * g.quantity), 0);
    }, [data.goodsList]);

    // 添加商品
    const handleAddGoods = () => {
        setEditingGoods(null);
        setNewGoodsUrl('');
        setNewGoodsData({});
        setShowAddGoodsModal(true);
    };

    // 编辑商品
    const handleEditGoods = (goods: GoodsItem) => {
        setEditingGoods(goods);
        setNewGoodsUrl(goods.link);
        setNewGoodsData(goods);
        setShowAddGoodsModal(true);
    };

    // 删除商品
    const handleDeleteGoods = (id: string) => {
        const newList = data.goodsList.filter(g => g.id !== id);
        onChange({ goodsList: newList });
    };

    // 获取商品信息
    const handleFetchGoodsInfo = async () => {
        if (!newGoodsUrl) return;
        setFetchingGoods(true);
        // 模拟获取商品信息
        setTimeout(() => {
            setNewGoodsData({
                name: '示例商品标题 - ' + (newGoodsUrl.length > 10 ? newGoodsUrl.substring(0, 10) : '未知'),
                image: 'https://via.placeholder.com/150',
                link: newGoodsUrl,
                price: 99.00,
                quantity: 1,
            });
            setFetchingGoods(false);
        }, 500);
    };

    // 保存商品
    const handleSaveGoods = () => {
        if (!newGoodsData.name || !newGoodsData.price) {
            alert('请填写商品名称和价格');
            return;
        }

        const goodsItem: GoodsItem = {
            id: editingGoods?.id || generateId(),
            goodsId: newGoodsData.goodsId,
            name: newGoodsData.name || '',
            image: newGoodsData.image || '',
            link: newGoodsData.link || newGoodsUrl,
            price: newGoodsData.price || 0,
            quantity: newGoodsData.quantity || 1,
            specName: newGoodsData.specName,
            specValue: newGoodsData.specValue,
            keyword: newGoodsData.keyword,
        };

        let newList: GoodsItem[];
        if (editingGoods) {
            newList = data.goodsList.map(g => g.id === editingGoods.id ? goodsItem : g);
        } else {
            newList = [...data.goodsList, goodsItem];
        }

        onChange({ goodsList: newList });
        setShowAddGoodsModal(false);
        setNewGoodsUrl('');
        setNewGoodsData({});
        setEditingGoods(null);
    };

    // 从商品库选择商品
    const handleSelectFromLib = (goods: Goods) => {
        // 检查是否已添加
        if (data.goodsList.some(g => g.goodsId === goods.id)) {
            alert('该商品已添加');
            return;
        }
        const goodsItem: GoodsItem = {
            id: generateId(),
            goodsId: goods.id,
            name: goods.name,
            image: goods.pcImg || '',
            link: goods.link || '',
            price: goods.price,
            quantity: 1,
            specName: goods.specName,
            specValue: goods.specValue,
            keyword: '', // 需要用户填写
        };
        onChange({ goodsList: [...data.goodsList, goodsItem] });
        setShowGoodsLibModal(false);
    };

    // 根据任务入口类型确定是否需要填写额外信息
    const getEntryTypeValid = () => {
        const entryType = data.taskEntryType || TaskEntryType.KEYWORD;
        // 如果有商品，检查每个商品是否有关键词（关键词入口时）
        if (entryType === TaskEntryType.KEYWORD) {
            return data.goodsList.length > 0 && data.goodsList.every(g => g.keyword && g.keyword.trim() !== '');
        }
        switch (entryType) {
            case TaskEntryType.TAOWORD:
                return !!data.taoWord;
            case TaskEntryType.QRCODE:
                return !!data.qrCodeImage;
            case TaskEntryType.ZTC:
                return !!data.ztcKeyword;
            case TaskEntryType.CHANNEL:
                return !!data.channelUrl;
            default:
                return data.goodsList.length > 0;
        }
    };

    const isNextDisabled = !data.shopId || data.goodsList.length === 0 || data.count <= 0 || !getEntryTypeValid();

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
                <label className="mb-2 block text-sm font-medium text-[#374151]">任务类型</label>
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

            {/* Shop Selection */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#374151]">选择店铺</label>
                {loadingShops ? (
                    <div className="px-3 py-2.5 text-[#9ca3af]">加载中...</div>
                ) : filteredShops.length === 0 ? (
                    <div className="rounded-md bg-amber-50 px-3 py-2.5 text-sm text-warning-500">暂无该平台已审核通过的店铺，请先到 <a href="/merchant/shops" className="text-primary-600">店铺管理</a> 绑定店铺。</div>
                ) : (
                    <Select value={data.shopId} onChange={handleShopChange} options={[{ value: '', label: '请选择店铺...' }, ...filteredShops.map(shop => ({ value: shop.id, label: `${shop.shopName}${shop.accountName ? ` (${shop.accountName})` : ''}` }))]} />
                )}
            </div>

            {/* Goods List Section */}
            <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-medium text-[#374151]">商品列表</label>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setShowGoodsLibModal(true)}
                            className="flex items-center gap-1"
                            disabled={!data.shopId}
                        >
                            📦 从商品库选择 {goodsLibList.length > 0 && `(${goodsLibList.length})`}
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAddGoods}
                            className="flex items-center gap-1"
                            disabled={!data.shopId}
                        >
                            <span>+</span> 手动添加
                        </Button>
                    </div>
                </div>

                {data.goodsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] py-12">
                        <span className="mb-2 text-4xl">📦</span>
                        <p className="mb-1 text-sm text-[#6b7280]">暂无商品</p>
                        <p className="text-xs text-[#9ca3af]">请点击上方"添加商品"按钮添加任务商品</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {data.goodsList.map((goods, index) => (
                            <div key={goods.id} className="flex items-center gap-4 rounded-lg border border-[#e5e7eb] bg-white p-4">
                                {/* 商品图片 */}
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb]">
                                    {goods.image ? (
                                        <img src={goods.image} alt={goods.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-2xl text-[#9ca3af]">📷</span>
                                    )}
                                </div>

                                {/* 商品信息 */}
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <span className="rounded bg-[#e5e7eb] px-1.5 py-0.5 text-xs text-[#6b7280]">商品{index + 1}</span>
                                        <span className="truncate text-sm font-medium text-[#374151]">{goods.name}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-[#6b7280]">
                                        <span>单价: <span className="font-medium text-primary-600">¥{goods.price.toFixed(2)}</span></span>
                                        <span>数量: <span className="font-medium">{goods.quantity}</span></span>
                                        <span>小计: <span className="font-medium text-primary-600">¥{(goods.price * goods.quantity).toFixed(2)}</span></span>
                                        {goods.keyword && <span>关键词: <span className="font-medium">{goods.keyword}</span></span>}
                                        {goods.specValue && <span>规格: {goods.specValue}</span>}
                                    </div>
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex shrink-0 items-center gap-2">
                                    <button
                                        onClick={() => handleEditGoods(goods)}
                                        className="rounded px-3 py-1.5 text-sm text-primary-600 hover:bg-primary-50"
                                    >
                                        编辑
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGoods(goods.id)}
                                        className="rounded px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
                                    >
                                        删除
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* 商品汇总 */}
                        <div className="flex items-center justify-end gap-6 rounded-lg bg-[#f9fafb] px-4 py-3">
                            <span className="text-sm text-[#6b7280]">共 <span className="font-semibold text-[#374151]">{data.goodsList.length}</span> 个商品</span>
                            <span className="text-sm text-[#6b7280]">商品总价: <span className="text-lg font-bold text-primary-600">¥{totalGoodsPrice.toFixed(2)}</span></span>
                        </div>
                    </div>
                )}
            </div>

            {/* Entry Type Specific Input (非关键词入口) */}
            {(data.taskEntryType || TaskEntryType.KEYWORD) !== TaskEntryType.KEYWORD && (
                <div className="mb-6 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-5">
                    <h3 className="mb-4 text-sm font-semibold text-[#3b4559]">
                        {TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.name}设置
                    </h3>

                    {/* 淘口令输入 */}
                    {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.TAOWORD && (
                        <div>
                            <label className="mb-1.5 block text-sm text-[#374151]">淘口令 <span className="text-red-500">*</span></label>
                            <Input type="text" value={data.taoWord || ''} onChange={e => onChange({ taoWord: e.target.value })} placeholder="请输入淘口令" />
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
                            <p className="mt-1.5 text-xs text-[#6b7280]">买家将通过直通车搜索入口，使用此关键词找到您的商品</p>
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
            )}

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

            {/* Add/Edit Goods Modal */}
            {showAddGoodsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#374151]">{editingGoods ? '编辑商品' : '添加商品'}</h3>
                            <button onClick={() => setShowAddGoodsModal(false)} className="text-[#9ca3af] hover:text-[#6b7280]">✕</button>
                        </div>

                        {/* 商品链接获取 */}
                        <div className="mb-4">
                            <label className="mb-1.5 block text-sm text-[#374151]">商品链接</label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={newGoodsUrl}
                                    onChange={e => setNewGoodsUrl(e.target.value)}
                                    placeholder="粘贴商品链接自动获取信息"
                                    className="flex-1"
                                />
                                <Button onClick={handleFetchGoodsInfo} disabled={fetchingGoods || !newGoodsUrl} variant="secondary">
                                    {fetchingGoods ? '获取中...' : '获取'}
                                </Button>
                            </div>
                        </div>

                        {/* 商品图片预览 */}
                        <div className="mb-4 flex gap-4">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb]">
                                {newGoodsData.image ? (
                                    <img src={newGoodsData.image} alt="预览" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-2xl text-[#9ca3af]">📷</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="mb-1 block text-sm text-[#374151]">商品名称 <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    value={newGoodsData.name || ''}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="请输入商品名称"
                                />
                            </div>
                        </div>

                        {/* 价格和数量 */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">单价 (元) <span className="text-red-500">*</span></label>
                                <Input
                                    type="number"
                                    value={String(newGoodsData.price || '')}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">数量</label>
                                <Input
                                    type="number"
                                    value={String(newGoodsData.quantity || 1)}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                    min="1"
                                />
                            </div>
                        </div>

                        {/* 规格 */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">规格名</label>
                                <Input
                                    type="text"
                                    value={newGoodsData.specName || ''}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, specName: e.target.value }))}
                                    placeholder="如：颜色"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">规格值</label>
                                <Input
                                    type="text"
                                    value={newGoodsData.specValue || ''}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, specValue: e.target.value }))}
                                    placeholder="如：红色"
                                />
                            </div>
                        </div>

                        {/* 关键词 (关键词入口时显示) */}
                        {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.KEYWORD && (
                            <div className="mb-4">
                                <label className="mb-1 block text-sm text-[#374151]">搜索关键词 <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    value={newGoodsData.keyword || ''}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, keyword: e.target.value }))}
                                    placeholder="买家搜索此关键词找到商品"
                                />
                                <p className="mt-1 text-xs text-[#6b7280]">买家将通过此关键词在平台搜索找到您的商品</p>
                            </div>
                        )}

                        {/* 操作按钮 */}
                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setShowAddGoodsModal(false)}>取消</Button>
                            <Button onClick={handleSaveGoods}>确认{editingGoods ? '修改' : '添加'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goods Library Selection Modal */}
            {showGoodsLibModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#374151]">从商品库选择</h3>
                            <button onClick={() => setShowGoodsLibModal(false)} className="text-[#9ca3af] hover:text-[#6b7280]">✕</button>
                        </div>

                        {loadingGoodsLib ? (
                            <div className="flex items-center justify-center py-12 text-[#6b7280]">加载商品中...</div>
                        ) : goodsLibList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <span className="mb-2 text-4xl">📦</span>
                                <p className="mb-1 text-sm text-[#6b7280]">该店铺暂无商品</p>
                                <p className="text-xs text-[#9ca3af]">请先到 <a href="/merchant/goods" className="text-primary-600">商品管理</a> 添加商品</p>
                            </div>
                        ) : (
                            <div className="max-h-[400px] space-y-3 overflow-y-auto">
                                {goodsLibList.map(goods => {
                                    const isAdded = data.goodsList.some(g => g.goodsId === goods.id);
                                    return (
                                        <div key={goods.id} className={cn('flex items-center gap-4 rounded-lg border p-3', isAdded ? 'border-green-200 bg-green-50' : 'border-[#e5e7eb] bg-white hover:border-primary-200')}>
                                            {/* 商品图片 */}
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb]">
                                                {goods.pcImg ? (
                                                    <img src={goods.pcImg} alt={goods.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xl text-[#9ca3af]">📷</span>
                                                )}
                                            </div>

                                            {/* 商品信息 */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-[#374151]">{goods.name}</p>
                                                <div className="mt-1 flex items-center gap-3 text-xs text-[#6b7280]">
                                                    <span>价格: <span className="font-medium text-primary-600">¥{goods.price.toFixed(2)}</span></span>
                                                    {goods.specValue && <span>规格: {goods.specValue}</span>}
                                                </div>
                                            </div>

                                            {/* 选择按钮 */}
                                            <div className="shrink-0">
                                                {isAdded ? (
                                                    <span className="text-sm text-green-600">已添加</span>
                                                ) : (
                                                    <Button size="sm" onClick={() => handleSelectFromLib(goods)}>选择</Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-4 flex justify-end border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setShowGoodsLibModal(false)}>关闭</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
