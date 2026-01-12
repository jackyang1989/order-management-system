'use client';

import { useState, useEffect, useMemo } from 'react';
import { TaskFormData, TaskEntryType, GoodsItem, KeywordConfig, KeywordAdvancedSettings, OrderSpecConfig } from './types';
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

// 返款方式类型定义
const TERMINAL_TYPES = [
    { id: 1, name: '本佣货返', desc: '买手垫付，商家返本金+佣金' },
    { id: 2, name: '本立佣货', desc: '商家预付本金，买手收货后返' },
];

// 折扣服务选项
const DISCOUNT_OPTIONS = [
    { value: '0', label: '包邮' },
    { value: '1', label: '公益宝贝' },
    { value: '2', label: '全球购' },
    { value: '3', label: '消费者保障' },
    { value: '4', label: '货到付款' },
    { value: '5', label: '淘金币抵钱' },
    { value: '6', label: '天猫' },
    { value: '7', label: '花呗分期' },
    { value: '8', label: '7+天退货' },
    { value: '9', label: '天猫超市' },
    { value: '10', label: '天猫直送' },
    { value: '11', label: '通用排序' },
];

// 排序方式选项
const SORT_OPTIONS = [
    { value: '0', label: '综合排序' },
    { value: '1', label: '销量优先' },
    { value: '2', label: '价格由高到低' },
    { value: '3', label: '价格由低到高' },
    { value: '4', label: '信用排序' },
];

// 省份选项
const PROVINCE_OPTIONS = [
    '北京', '上海', '广东', '浙江', '江苏', '福建', '山东', '河南',
    '湖北', '湖南', '四川', '重庆', '天津', '河北', '山西', '辽宁',
    '吉林', '黑龙江', '安徽', '江西', '广西', '海南', '贵州', '云南',
    '陕西', '甘肃', '青海', '内蒙古', '宁夏', '新疆', '西藏'
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
    // 关键词高级设置相关状态
    const [showKeywordAdvancedModal, setShowKeywordAdvancedModal] = useState(false);
    const [editingKeywordGoodsId, setEditingKeywordGoodsId] = useState<string>('');
    const [editingKeywordIndex, setEditingKeywordIndex] = useState<number>(0);
    const [advancedSettings, setAdvancedSettings] = useState<KeywordAdvancedSettings>({
        discount: [],
        spec1: '',
        spec2: '',
        compareKeyword: '',
        backupKeyword: '',
        sort: '0',
        minPrice: 0,
        maxPrice: 0,
        province: '',
    });
    // 图片上传状态
    const [uploadingQrCode, setUploadingQrCode] = useState(false);
    const [uploadingChannel, setUploadingChannel] = useState(false);

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
        return data.goodsList.reduce((sum, g) => {
            // 优先使用规格数量之和，没有规格时用商品数量
            const qty = g.orderSpecs && g.orderSpecs.length > 0
                ? g.orderSpecs.reduce((s, spec) => s + (spec.quantity || 1), 0)
                : (g.quantity || 1);
            return sum + (g.price * qty);
        }, 0);
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
        setNewGoodsData({
            ...goods,
            verifyCode: goods.verifyCode || '',
            shopId: goods.shopId || data.shopId,
        });
        setShowAddGoodsModal(true);
    };

    // 删除商品
    const handleDeleteGoods = (id: string) => {
        const newList = data.goodsList.filter(g => g.id !== id);
        onChange({ goodsList: newList });
    };

    // 更新商品属性 (用于直接编辑价格/数量/关键词等)
    const handleUpdateGoodsField = (id: string, field: keyof GoodsItem, value: unknown) => {
        const newList = data.goodsList.map(g => {
            if (g.id === id) {
                return { ...g, [field]: value };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 添加关键词到商品
    const handleAddKeyword = (goodsId: string) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId) {
                const keywords = g.keywords || [];
                if (keywords.length >= 5) {
                    alert('每个商品最多添加5个关键词');
                    return g;
                }
                return { ...g, keywords: [...keywords, { keyword: '', useCount: 1 }] };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 删除关键词
    const handleRemoveKeyword = (goodsId: string, keywordIndex: number) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId && g.keywords) {
                const newKeywords = g.keywords.filter((_, i) => i !== keywordIndex);
                return { ...g, keywords: newKeywords };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 更新关键词
    const handleUpdateKeyword = (goodsId: string, keywordIndex: number, field: keyof KeywordConfig, value: unknown) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId && g.keywords) {
                const newKeywords = g.keywords.map((kw, i) => {
                    if (i === keywordIndex) {
                        return { ...kw, [field]: value };
                    }
                    return kw;
                });
                return { ...g, keywords: newKeywords };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 打开关键词高级设置
    const handleOpenAdvancedSettings = (goodsId: string, keywordIndex: number) => {
        const goods = data.goodsList.find(g => g.id === goodsId);
        if (goods?.keywords?.[keywordIndex]?.advancedSettings) {
            setAdvancedSettings(goods.keywords[keywordIndex].advancedSettings!);
        } else {
            setAdvancedSettings({
                discount: [],
                spec1: '',
                spec2: '',
                compareKeyword: '',
                backupKeyword: '',
                sort: '0',
                minPrice: 0,
                maxPrice: 0,
                province: '',
            });
        }
        setEditingKeywordGoodsId(goodsId);
        setEditingKeywordIndex(keywordIndex);
        setShowKeywordAdvancedModal(true);
    };

    // 保存关键词高级设置
    const handleSaveAdvancedSettings = () => {
        const newList = data.goodsList.map(g => {
            if (g.id === editingKeywordGoodsId && g.keywords) {
                const newKeywords = g.keywords.map((kw, i) => {
                    if (i === editingKeywordIndex) {
                        return { ...kw, advancedSettings: { ...advancedSettings } };
                    }
                    return kw;
                });
                return { ...g, keywords: newKeywords };
            }
            return g;
        });
        onChange({ goodsList: newList });
        setShowKeywordAdvancedModal(false);
    };

    // 添加下单规格
    const handleAddOrderSpec = (goodsId: string) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId) {
                const orderSpecs = g.orderSpecs || [];
                if (orderSpecs.length >= 5) {
                    alert('每个商品最多添加5个下单规格');
                    return g;
                }
                const newSpecs = [...orderSpecs, { specName: '', specValue: '', quantity: 1 }];
                // 自动更新商品数量为规格数量之和
                const newQuantity = newSpecs.reduce((sum, spec) => sum + (spec.quantity || 1), 0);
                return { ...g, orderSpecs: newSpecs, quantity: newQuantity };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 删除下单规格
    const handleRemoveOrderSpec = (goodsId: string, specIndex: number) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId && g.orderSpecs) {
                const newSpecs = g.orderSpecs.filter((_, i) => i !== specIndex);
                // 自动更新商品数量：规格为空时默认1，否则为规格数量之和
                const newQuantity = newSpecs.length > 0
                    ? newSpecs.reduce((sum, spec) => sum + (spec.quantity || 1), 0)
                    : 1;
                return { ...g, orderSpecs: newSpecs, quantity: newQuantity };
            }
            return g;
        });
        onChange({ goodsList: newList });
    };

    // 更新下单规格
    const handleUpdateOrderSpec = (goodsId: string, specIndex: number, field: keyof OrderSpecConfig, value: string | number) => {
        const newList = data.goodsList.map(g => {
            if (g.id === goodsId && g.orderSpecs) {
                const newSpecs = g.orderSpecs.map((spec, i) => {
                    if (i === specIndex) {
                        return { ...spec, [field]: value };
                    }
                    return spec;
                });
                // 当规格数量变化时，自动更新商品数量
                const newQuantity = newSpecs.reduce((sum, spec) => sum + (spec.quantity || 1), 0);
                return { ...g, orderSpecs: newSpecs, quantity: newQuantity };
            }
            return g;
        });
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

    // 二维码图片上传
    const handleQrCodeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingQrCode(true);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                onChange({ qrCodeImage: reader.result as string });
                setUploadingQrCode(false);
            };
            reader.onerror = () => {
                alert('图片读取失败');
                setUploadingQrCode(false);
            };
            reader.readAsDataURL(file);
        } catch {
            alert('图片上传失败');
            setUploadingQrCode(false);
        }
    };

    // 通道图片上传
    const handleChannelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingChannel(true);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                onChange({ channelUrl: reader.result as string });
                setUploadingChannel(false);
            };
            reader.onerror = () => {
                alert('图片读取失败');
                setUploadingChannel(false);
            };
            reader.readAsDataURL(file);
        } catch {
            alert('图片上传失败');
            setUploadingChannel(false);
        }
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
            verifyCode: newGoodsData.verifyCode,
            shopId: newGoodsData.shopId || data.shopId,
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
            verifyCode: goods.verifyCode || '', // 同步商品库中的核对口令
            shopId: goods.shopId || data.shopId,
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

            {/* Terminal (Refund Type) Selection */}
            <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#374151]">返款方式</label>
                <div className="flex gap-4">
                    {TERMINAL_TYPES.map(t => (
                        <div
                            key={t.id}
                            onClick={() => onChange({ terminal: t.id })}
                            className={cn(
                                'flex cursor-pointer flex-col rounded-md border px-5 py-3 transition-all',
                                data.terminal === t.id
                                    ? 'border-primary-500 bg-primary-50'
                                    : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                            )}
                        >
                            <span className={cn('text-sm font-medium', data.terminal === t.id ? 'text-primary-600' : 'text-[#374151]')}>{t.name}</span>
                            <span className="mt-0.5 text-xs text-[#9ca3af]">{t.desc}</span>
                        </div>
                    ))}
                </div>
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
                    <div className="space-y-4">
                        {data.goodsList.map((goods, index) => (
                            <div key={goods.id} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
                                {/* 商品基本信息行 */}
                                <div className="flex items-start gap-4">
                                    {/* 商品图片 */}
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#e5e7eb] bg-[#f9fafb]">
                                        {goods.image ? (
                                            <img src={goods.image} alt={goods.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-2xl text-[#9ca3af]">📷</span>
                                        )}
                                    </div>

                                    {/* 商品信息 */}
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex items-center gap-2">
                                            {/* 主商品/副商品标签 */}
                                            {index === 0 ? (
                                                <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs font-medium text-primary-600">主商品</span>
                                            ) : index <= 2 ? (
                                                <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-xs font-medium text-amber-600">副商品{index}</span>
                                            ) : (
                                                <span className="rounded bg-[#e5e7eb] px-1.5 py-0.5 text-xs text-[#6b7280]">商品{index + 1}</span>
                                            )}
                                            <span className="truncate text-sm font-medium text-[#374151]">{goods.name}</span>
                                            <div className="ml-auto flex shrink-0 items-center gap-2">
                                                <button onClick={() => handleEditGoods(goods)} className="rounded px-2 py-1 text-xs text-primary-600 hover:bg-primary-50">编辑</button>
                                                <button onClick={() => handleDeleteGoods(goods.id)} className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50">删除</button>
                                            </div>
                                        </div>

                                        {/* 可编辑价格/数量行 */}
                                        <div className="mb-3 flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-[#6b7280]">下单价格:</span>
                                                <input
                                                    type="number"
                                                    value={goods.price}
                                                    onChange={e => handleUpdateGoodsField(goods.id, 'price', parseFloat(e.target.value) || 0)}
                                                    className="w-20 rounded border border-[#e5e7eb] px-2 py-1 text-sm"
                                                    step="0.01"
                                                    min="0"
                                                />
                                                <span className="text-xs text-[#6b7280]">元</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-[#6b7280]">下单数量:</span>
                                                <span className="px-2 py-1 text-sm font-medium text-[#374151]">
                                                    {goods.orderSpecs && goods.orderSpecs.length > 0
                                                        ? goods.orderSpecs.reduce((sum, spec) => sum + (spec.quantity || 1), 0)
                                                        : goods.quantity || 1}
                                                </span>
                                                <span className="text-xs text-[#6b7280]">件</span>
                                                {goods.orderSpecs && goods.orderSpecs.length > 0 && (
                                                    <span className="text-xs text-[#9ca3af]">(按规格计算)</span>
                                                )}
                                            </div>
                                            <span className="text-sm text-[#6b7280]">小计: <span className="font-medium text-primary-600">¥{(Number(goods.price) * (goods.orderSpecs && goods.orderSpecs.length > 0 ? goods.orderSpecs.reduce((sum, spec) => sum + (spec.quantity || 1), 0) : (goods.quantity || 1))).toFixed(2)}</span></span>
                                        </div>

                                        {/* 下单规格设置 (非必填) */}
                                        <div className="mb-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <label className="text-xs font-medium text-[#374151]">下单规格设置 <span className="text-[#9ca3af]">(非必填)</span></label>
                                                <button
                                                    onClick={() => handleAddOrderSpec(goods.id)}
                                                    disabled={(goods.orderSpecs?.length || 0) >= 5}
                                                    className={cn(
                                                        'text-xs',
                                                        (goods.orderSpecs?.length || 0) >= 5
                                                            ? 'cursor-not-allowed text-[#9ca3af]'
                                                            : 'text-primary-600 hover:text-primary-700'
                                                    )}
                                                >
                                                    + 添加下单规格 ({goods.orderSpecs?.length || 0}/5)
                                                </button>
                                            </div>

                                            {(!goods.orderSpecs || goods.orderSpecs.length === 0) ? (
                                                <div className="rounded bg-[#f9fafb] px-3 py-2 text-center text-xs text-[#9ca3af]">
                                                    点击上方按钮添加下单规格，买手将按照规格购买商品
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    {goods.orderSpecs.map((spec, specIndex) => (
                                                        <div key={specIndex} className="flex items-center gap-2 rounded bg-[#f9fafb] p-2">
                                                            <span className="shrink-0 text-xs text-[#6b7280]">#{specIndex + 1}</span>
                                                            <input
                                                                type="text"
                                                                value={spec.specName}
                                                                onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'specName', e.target.value)}
                                                                placeholder="规格名(如:颜色)"
                                                                className="min-w-0 flex-1 rounded border border-[#e5e7eb] px-2 py-1 text-sm"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={spec.specValue}
                                                                onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'specValue', e.target.value)}
                                                                placeholder="规格值(如:尺码)"
                                                                className="min-w-0 flex-1 rounded border border-[#e5e7eb] px-2 py-1 text-sm"
                                                            />
                                                            <div className="flex shrink-0 items-center gap-1">
                                                                <span className="text-xs text-[#6b7280]">数量</span>
                                                                <input
                                                                    type="number"
                                                                    value={spec.quantity}
                                                                    onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'quantity', parseInt(e.target.value) || 1)}
                                                                    className="w-16 rounded border border-[#e5e7eb] px-1 py-1 text-center text-sm"
                                                                    min="1"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveOrderSpec(goods.id, specIndex)}
                                                                className="shrink-0 text-red-400 hover:text-red-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-1 text-xs text-[#9ca3af]">设置后买手将按照指定规格和数量购买商品</p>
                                        </div>
                                    </div>
                                </div>

                                {/* 关键词配置区域 (关键词入口时显示) */}
                                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.KEYWORD && (
                                    <div className="mt-4 border-t border-[#f3f4f6] pt-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-xs font-medium text-[#374151]">搜索关键词配置 <span className="text-red-500">*</span></label>
                                            <button
                                                onClick={() => handleAddKeyword(goods.id)}
                                                disabled={(goods.keywords?.length || 0) >= 5}
                                                className={cn(
                                                    'text-xs',
                                                    (goods.keywords?.length || 0) >= 5
                                                        ? 'cursor-not-allowed text-[#9ca3af]'
                                                        : 'text-primary-600 hover:text-primary-700'
                                                )}
                                            >
                                                + 添加关键词 ({goods.keywords?.length || 0}/5)
                                            </button>
                                        </div>

                                        {(!goods.keywords || goods.keywords.length === 0) ? (
                                            <div className="rounded bg-[#f9fafb] px-3 py-2 text-center text-xs text-[#9ca3af]">
                                                请添加搜索关键词，买手将通过此关键词搜索商品
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {goods.keywords.map((kw, kwIndex) => (
                                                    <div key={kwIndex} className="flex items-center gap-2 rounded bg-[#f9fafb] p-2">
                                                        <span className="text-xs text-[#6b7280]">#{kwIndex + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={kw.keyword}
                                                            onChange={e => handleUpdateKeyword(goods.id, kwIndex, 'keyword', e.target.value)}
                                                            placeholder="输入搜索关键词"
                                                            className="flex-1 rounded border border-[#e5e7eb] px-2 py-1 text-sm"
                                                        />
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-xs text-[#6b7280]">使用次数</span>
                                                            <input
                                                                type="number"
                                                                value={kw.useCount || 1}
                                                                onChange={e => handleUpdateKeyword(goods.id, kwIndex, 'useCount', parseInt(e.target.value) || 1)}
                                                                className="w-12 rounded border border-[#e5e7eb] px-1 py-1 text-center text-sm"
                                                                min="1"
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleOpenAdvancedSettings(goods.id, kwIndex)}
                                                            className="rounded border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#6b7280] hover:border-primary-300 hover:text-primary-600"
                                                        >
                                                            高级设置
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveKeyword(goods.id, kwIndex)}
                                                            className="text-red-400 hover:text-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* 商品汇总 */}
                        <div className="flex items-center justify-end gap-6 rounded-lg bg-[#f9fafb] px-4 py-3">
                            <span className="text-sm text-[#6b7280]">共 <span className="font-semibold text-[#374151]">{data.goodsList.length}</span> 个商品 (最多3个)</span>
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
                                <div className="relative">
                                    {data.qrCodeImage ? (
                                        <div className="relative">
                                            <img src={data.qrCodeImage} alt="QR Code" className="h-[120px] w-[120px] rounded-md border border-[#e5e7eb] object-contain p-2" />
                                            <button
                                                type="button"
                                                onClick={() => onChange({ qrCodeImage: '' })}
                                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex h-[120px] w-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d1d5db] bg-white text-[#9ca3af] transition-colors hover:border-primary-400 hover:text-primary-500">
                                            {uploadingQrCode ? (
                                                <span className="text-sm">上传中...</span>
                                            ) : (
                                                <>
                                                    <span className="text-3xl">+</span>
                                                    <span className="text-xs">上传二维码</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleQrCodeUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-[#6b7280]">请上传商品二维码图片，买家将扫描此二维码进入商品页面</p>
                                    <p className="mt-1 text-xs text-[#9ca3af]">支持 JPG、PNG 格式，建议尺寸 200x200 以上</p>
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

                    {/* 通道图片上传 */}
                    {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.CHANNEL && (
                        <div>
                            <label className="mb-1.5 block text-sm text-[#374151]">通道图片 <span className="text-red-500">*</span></label>
                            <div className="flex items-start gap-4">
                                <div className="relative">
                                    {data.channelUrl ? (
                                        <div className="relative">
                                            <img src={data.channelUrl} alt="Channel" className="h-[120px] w-[120px] rounded-md border border-[#e5e7eb] object-contain p-2" />
                                            <button
                                                type="button"
                                                onClick={() => onChange({ channelUrl: '' })}
                                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white hover:bg-red-600"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="flex h-[120px] w-[120px] cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d1d5db] bg-white text-[#9ca3af] transition-colors hover:border-primary-400 hover:text-primary-500">
                                            {uploadingChannel ? (
                                                <span className="text-sm">上传中...</span>
                                            ) : (
                                                <>
                                                    <span className="text-3xl">+</span>
                                                    <span className="text-xs">上传通道图片</span>
                                                </>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleChannelUpload} className="hidden" />
                                        </label>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-[#6b7280]">请上传通道任务图片，买家将通过此通道进入指定的商品页面或活动页面</p>
                                    <p className="mt-1 text-xs text-[#9ca3af]">支持 JPG、PNG 格式，建议尺寸 200x200 以上</p>
                                </div>
                            </div>
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
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#374151]">{editingGoods ? '编辑商品' : '添加商品'}</h3>
                            <button onClick={() => setShowAddGoodsModal(false)} className="text-[#9ca3af] hover:text-[#6b7280]">✕</button>
                        </div>

                        {/* 所属店铺选择 (仅手动添加时显示，编辑时默认使用当前任务店铺) */}
                        {!editingGoods && (
                            <div className="mb-4">
                                <label className="mb-1.5 block text-sm font-medium text-[#374151]">所属店铺 <span className="text-red-500">*</span></label>
                                <Select
                                    value={newGoodsData.shopId || data.shopId}
                                    onChange={v => setNewGoodsData(prev => ({ ...prev, shopId: v }))}
                                    options={[
                                        { value: '', label: '请选择店铺...' },
                                        ...filteredShops.map(shop => ({
                                            value: shop.id,
                                            label: `${shop.shopName}${shop.accountName ? ` (${shop.accountName})` : ''}`
                                        }))
                                    ]}
                                />
                                <p className="mt-1 text-xs text-[#6b7280]">商品将关联到选中的店铺</p>
                            </div>
                        )}

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

                        {/* 价格 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">单价 (元) <span className="text-red-500">*</span></label>
                            <Input
                                type="number"
                                value={String(newGoodsData.price || '')}
                                onChange={e => setNewGoodsData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                placeholder="0.00"
                            />
                        </div>

                        {/* 核对口令 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">核对口令</label>
                            <Input
                                type="text"
                                value={newGoodsData.verifyCode || ''}
                                onChange={e => setNewGoodsData(prev => ({ ...prev, verifyCode: e.target.value.slice(0, 10) }))}
                                placeholder="请输入核对口令"
                                maxLength={10}
                            />
                            <p className="mt-1 text-xs text-[#6b7280]">请输入不超过10个字的核对口令，必须是商品详情页有的文字。买手做任务时需在详情页找到此口令进行核对。</p>
                        </div>

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
                                                    <span>价格: <span className="font-medium text-primary-600">¥{Number(goods.price).toFixed(2)}</span></span>
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

            {/* Keyword Advanced Settings Modal */}
            {showKeywordAdvancedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-[#374151]">关键词高级设置</h3>
                            <button onClick={() => setShowKeywordAdvancedModal(false)} className="text-[#9ca3af] hover:text-[#6b7280]">✕</button>
                        </div>

                        {/* 折扣服务多选 */}
                        <div className="mb-4">
                            <label className="mb-2 block text-sm font-medium text-[#374151]">折扣服务筛选</label>
                            <div className="grid grid-cols-4 gap-2">
                                {DISCOUNT_OPTIONS.map(opt => (
                                    <label key={opt.value} className="flex cursor-pointer items-center gap-1.5 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm hover:bg-[#f9fafb]">
                                        <input
                                            type="checkbox"
                                            checked={advancedSettings.discount.includes(opt.value)}
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    setAdvancedSettings(prev => ({ ...prev, discount: [...prev.discount, opt.value] }));
                                                } else {
                                                    setAdvancedSettings(prev => ({ ...prev, discount: prev.discount.filter(v => v !== opt.value) }));
                                                }
                                            }}
                                        />
                                        <span>{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 货比关键词 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">货比关键词</label>
                            <Input
                                type="text"
                                value={advancedSettings.compareKeyword}
                                onChange={e => setAdvancedSettings(prev => ({ ...prev, compareKeyword: e.target.value }))}
                                placeholder="不填则默认使用主商品的第一个搜索关键词"
                            />
                            <p className="mt-0.5 text-xs text-[#9ca3af]">买手进行货比浏览时使用此关键词搜索，不填则自动使用主商品的第一个搜索关键词</p>
                        </div>

                        {/* 备选关键词 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">备选关键词</label>
                            <Input
                                type="text"
                                value={advancedSettings.backupKeyword}
                                onChange={e => setAdvancedSettings(prev => ({ ...prev, backupKeyword: e.target.value }))}
                                placeholder="主关键词找不到时使用"
                            />
                        </div>

                        {/* 排序方式 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">排序方式</label>
                            <select
                                value={advancedSettings.sort}
                                onChange={e => setAdvancedSettings(prev => ({ ...prev, sort: e.target.value }))}
                                className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
                            >
                                {SORT_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* 价格范围 */}
                        <div className="mb-4 grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">最低价格</label>
                                <Input
                                    type="number"
                                    value={String(advancedSettings.minPrice || '')}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm text-[#374151]">最高价格</label>
                                <Input
                                    type="number"
                                    value={String(advancedSettings.maxPrice || '')}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 0 }))}
                                    placeholder="不限"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* 发货地省份 */}
                        <div className="mb-4">
                            <label className="mb-1 block text-sm text-[#374151]">发货地省份</label>
                            <select
                                value={advancedSettings.province}
                                onChange={e => setAdvancedSettings(prev => ({ ...prev, province: e.target.value }))}
                                className="w-full rounded border border-[#e5e7eb] px-3 py-2 text-sm"
                            >
                                <option value="">不限</option>
                                {PROVINCE_OPTIONS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-end gap-3 border-t border-[#e5e7eb] pt-4">
                            <Button variant="secondary" onClick={() => setShowKeywordAdvancedModal(false)}>取消</Button>
                            <Button onClick={handleSaveAdvancedSettings}>保存设置</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
