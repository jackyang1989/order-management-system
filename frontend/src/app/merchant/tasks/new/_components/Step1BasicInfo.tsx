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
import { Card } from '../../../../../components/ui/card';

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
                return { ...g, orderSpecs: [...orderSpecs, { specName: '', specValue: '', quantity: 1 }] };
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
                return { ...g, orderSpecs: newSpecs };
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
                return { ...g, orderSpecs: newSpecs };
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
        <div className="space-y-8 p-6">
            {/* Platform Selection */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-6 w-1.5 rounded-full bg-primary-600"></div>
                    <h2 className="text-lg font-bold text-slate-900">发布平台</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {loadingPlatforms ? (
                        <div className="col-span-full py-8 text-center text-slate-400">加载平台中...</div>
                    ) : taskPlatforms.map(p => (
                        <div
                            key={p.id}
                            onClick={() => handlePlatformChange(p.id)}
                            className={cn(
                                'group relative cursor-pointer overflow-hidden rounded-[20px] border-2 p-4 transition-all duration-300 hover:shadow-lg',
                                data.taskType === p.id
                                    ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10'
                                    : 'border-slate-100 bg-white hover:border-primary-200'
                            )}
                        >
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-3xl transition-transform duration-300 group-hover:scale-110">{p.icon}</span>
                                <span className={cn('font-bold', data.taskType === p.id ? 'text-primary-700' : 'text-slate-600')}>{p.name}</span>
                            </div>
                            {data.taskType === p.id && (
                                <div className="absolute right-0 top-0 rounded-bl-[16px] bg-primary-500 px-2 py-1 text-xs font-bold text-white">✓</div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* Task Entry Type Selection */}
            <section>
                <div className="mb-4 flex items-center gap-2">
                    <div className="h-6 w-1.5 rounded-full bg-primary-600"></div>
                    <h2 className="text-lg font-bold text-slate-900">任务类型</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                    {TASK_ENTRY_TYPES.map(entry => (
                        <div
                            key={entry.id}
                            onClick={() => handleEntryTypeChange(entry.id)}
                            className={cn(
                                'group relative cursor-pointer overflow-hidden rounded-[20px] border-2 p-4 transition-all duration-300 hover:shadow-lg',
                                (data.taskEntryType || TaskEntryType.KEYWORD) === entry.id
                                    ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10'
                                    : 'border-slate-100 bg-white hover:border-primary-200'
                            )}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{entry.icon}</span>
                                <span className={cn('font-bold', (data.taskEntryType || TaskEntryType.KEYWORD) === entry.id ? 'text-primary-700' : 'text-slate-600')}>{entry.name}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500">i</span>
                    {TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.desc}
                </div>
            </section>

            <div className="grid gap-8 md:grid-cols-2">
                {/* Shop Selection */}
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-6 w-1.5 rounded-full bg-primary-600"></div>
                        <h2 className="text-lg font-bold text-slate-900">选择店铺</h2>
                    </div>
                    {loadingShops ? (
                        <div className="h-12 w-full animate-pulse rounded-[16px] bg-slate-100"></div>
                    ) : filteredShops.length === 0 ? (
                        <div className="rounded-[20px] bg-amber-50 p-6 text-center text-sm font-bold text-amber-600">
                            暂无符合条件的店铺，请先 <a href="/merchant/shops" className="underline">绑定店铺</a>
                        </div>
                    ) : (
                        <div className="relative">
                            <Select
                                value={data.shopId}
                                onChange={handleShopChange}
                                options={[{ value: '', label: '请选择店铺...' }, ...filteredShops.map(shop => ({ value: shop.id, label: `${shop.shopName}${shop.accountName ? ` (${shop.accountName})` : ''}` }))]}
                                className="h-14 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-5 text-base font-bold text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                        </div>
                    )}
                </section>

                {/* Terminal Selection */}
                <section>
                    <div className="mb-4 flex items-center gap-2">
                        <div className="h-6 w-1.5 rounded-full bg-primary-600"></div>
                        <h2 className="text-lg font-bold text-slate-900">返款方式</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {TERMINAL_TYPES.map(t => (
                            <div
                                key={t.id}
                                onClick={() => onChange({ terminal: t.id })}
                                className={cn(
                                    'cursor-pointer rounded-[16px] border-2 px-4 py-3 transition-all hover:bg-slate-50',
                                    data.terminal === t.id
                                        ? 'border-primary-500 bg-primary-50'
                                        : 'border-slate-100 bg-white'
                                )}
                            >
                                <div className={cn('font-bold', data.terminal === t.id ? 'text-primary-700' : 'text-slate-700')}>{t.name}</div>
                                <div className="mt-1 text-xs text-slate-400">{t.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Goods List Section */}
            <section>
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-1.5 rounded-full bg-primary-600"></div>
                        <h2 className="text-lg font-bold text-slate-900">商品列表</h2>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setShowGoodsLibModal(true)}
                            className="h-10 rounded-[12px] bg-slate-100 font-bold text-slate-600 hover:bg-slate-200"
                            disabled={!data.shopId}
                        >
                            📦 从商品库选择 {goodsLibList.length > 0 && `(${goodsLibList.length})`}
                        </Button>
                        <Button
                            onClick={handleAddGoods}
                            className="h-10 rounded-[12px] bg-black font-bold text-white shadow-lg hover:bg-slate-800"
                            disabled={!data.shopId}
                        >
                            + 手动添加
                        </Button>
                    </div>
                </div>

                {data.goodsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-[32px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-16">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-md">
                            <span className="text-4xl">📦</span>
                        </div>
                        <p className="mb-2 text-lg font-bold text-slate-900">暂无任务商品</p>
                        <p className="text-sm font-medium text-slate-400">请点击上方按钮添加商品</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {data.goodsList.map((goods, index) => (
                            <Card key={goods.id} className="overflow-hidden rounded-[24px] border-0 bg-white shadow-lg shadow-slate-200/50" noPadding>
                                <div className="bg-slate-50/50 p-6">
                                    <div className="flex items-start gap-6">
                                        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-white shadow-sm ring-1 ring-slate-100">
                                            {goods.image ? (
                                                <img src={goods.image} alt={goods.name} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                                            ) : (
                                                <span className="text-3xl text-slate-300">📷</span>
                                            )}
                                            {index === 0 && <span className="absolute left-0 top-0 rounded-br-[12px] bg-primary-500 px-2 py-1 text-[10px] font-bold text-white">主商品</span>}
                                        </div>

                                        <div className="min-w-0 flex-1 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{goods.name}</h3>
                                                    <a href={goods.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-primary-500 hover:underline">查看商品链接 ↗</a>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleEditGoods(goods)} className="h-8 rounded-full bg-slate-100 px-4 text-xs font-bold text-slate-600 hover:bg-slate-200">编辑</button>
                                                    <button onClick={() => handleDeleteGoods(goods.id)} className="h-8 rounded-full bg-red-50 px-4 text-xs font-bold text-red-500 hover:bg-red-100">删除</button>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-4">
                                                <div className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-2 ring-1 ring-slate-100">
                                                    <span className="text-xs font-bold text-slate-400">单价</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xs text-slate-400">¥</span>
                                                        <Input
                                                            type="number"
                                                            value={goods.price}
                                                            onChange={e => handleUpdateGoodsField(goods.id, 'price', parseFloat(e.target.value) || 0)}
                                                            className="h-6 w-20 border-none bg-transparent p-0 text-base font-black text-slate-900 focus:ring-0"
                                                            step="0.01"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 rounded-[12px] bg-white px-4 py-2 ring-1 ring-slate-100">
                                                    <span className="text-xs font-bold text-slate-400">数量</span>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleUpdateGoodsField(goods.id, 'quantity', Math.max(1, goods.quantity - 1))} className="h-5 w-5 rounded-full bg-slate-100 font-bold text-slate-500 hover:bg-slate-200">-</button>
                                                        <span className="font-black text-slate-900">{goods.quantity}</span>
                                                        <button onClick={() => handleUpdateGoodsField(goods.id, 'quantity', goods.quantity + 1)} className="h-5 w-5 rounded-full bg-slate-100 font-bold text-slate-500 hover:bg-slate-200">+</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 关键词区域 */}
                                {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.KEYWORD && (
                                    <div className="border-t border-slate-100 p-6">
                                        <div className="mb-4 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">🔍</div>
                                                <h4 className="font-bold text-slate-900">搜索关键词</h4>
                                            </div>
                                            <button
                                                onClick={() => handleAddKeyword(goods.id)}
                                                disabled={(goods.keywords?.length || 0) >= 5}
                                                className={cn(
                                                    'text-xs font-bold transition-colors',
                                                    (goods.keywords?.length || 0) >= 5 ? 'cursor-not-allowed text-slate-300' : 'text-primary-600 hover:text-primary-700'
                                                )}
                                            >
                                                + 添加关键词 ({goods.keywords?.length || 0}/5)
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(!goods.keywords || goods.keywords.length === 0) ? (
                                                <div className="rounded-[16px] border-2 border-dashed border-slate-100 bg-slate-50 py-4 text-center text-xs font-medium text-slate-400">
                                                    请添加至少一个搜索关键词
                                                </div>
                                            ) : (
                                                goods.keywords.map((kw, kwIndex) => (
                                                    <div key={kwIndex} className="flex items-center gap-3 rounded-[16px] bg-slate-50 p-2 pl-4 transition-all hover:bg-slate-100">
                                                        <span className="text-xs font-bold text-slate-400">#{kwIndex + 1}</span>
                                                        <input
                                                            type="text"
                                                            value={kw.keyword}
                                                            onChange={e => handleUpdateKeyword(goods.id, kwIndex, 'keyword', e.target.value)}
                                                            placeholder="输入关键词..."
                                                            className="flex-1 bg-transparent text-sm font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                                                        />
                                                        <div className="h-4 w-px bg-slate-200"></div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">次数</span>
                                                            <input
                                                                type="number"
                                                                value={kw.useCount || 1}
                                                                onChange={e => handleUpdateKeyword(goods.id, kwIndex, 'useCount', parseInt(e.target.value) || 1)}
                                                                className="w-10 bg-transparent text-center text-sm font-bold text-slate-900 focus:outline-none"
                                                                min="1"
                                                            />
                                                        </div>
                                                        <button onClick={() => handleOpenAdvancedSettings(goods.id, kwIndex)} className="rounded-[8px] bg-white px-3 py-1.5 text-xs font-bold text-slate-500 shadow-sm hover:text-primary-600">高级</button>
                                                        <button onClick={() => handleRemoveKeyword(goods.id, kwIndex)} className="flex h-7 w-7 items-center justify-center rounded-full text-slate-300 hover:bg-white hover:text-red-500">×</button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 订单规格区域 */}
                                <div className="border-t border-slate-100 bg-slate-50/30 p-6">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h4 className="text-sm font-bold text-slate-500">下单规格 <span className="font-normal text-slate-400">(选填)</span></h4>
                                        <button
                                            onClick={() => handleAddOrderSpec(goods.id)}
                                            disabled={(goods.orderSpecs?.length || 0) >= 5}
                                            className={cn('text-xs font-bold', (goods.orderSpecs?.length || 0) >= 5 ? 'text-slate-300' : 'text-primary-600')}
                                        >
                                            + 添加规格
                                        </button>
                                    </div>
                                    {goods.orderSpecs && goods.orderSpecs.length > 0 && (
                                        <div className="space-y-2">
                                            {goods.orderSpecs.map((spec, specIndex) => (
                                                <div key={specIndex} className="flex items-center gap-2 rounded-[12px] border border-slate-200 bg-white p-2">
                                                    <span className="text-xs font-bold text-slate-400">{specIndex + 1}</span>
                                                    <input type="text" value={spec.specName} onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'specName', e.target.value)} placeholder="规格名" className="w-20 bg-transparent text-xs font-medium focus:outline-none" />
                                                    <div className="h-3 w-px bg-slate-200"></div>
                                                    <input type="text" value={spec.specValue} onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'specValue', e.target.value)} placeholder="规格值" className="flex-1 bg-transparent text-xs font-medium focus:outline-none" />
                                                    <div className="h-3 w-px bg-slate-200"></div>
                                                    <input type="number" value={spec.quantity} onChange={e => handleUpdateOrderSpec(goods.id, specIndex, 'quantity', parseInt(e.target.value) || 1)} className="w-10 bg-transparent text-center text-xs font-bold focus:outline-none" />
                                                    <button onClick={() => handleRemoveOrderSpec(goods.id, specIndex)} className="text-slate-400 hover:text-red-500">×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}

                        <div className="flex items-center justify-end gap-3 rounded-[20px] bg-slate-900 p-4 text-white shadow-xl shadow-slate-900/10">
                            <span className="text-sm font-medium text-slate-400">共 <span className="text-white">{data.goodsList.length}</span> 个商品</span>
                            <div className="h-4 w-px bg-slate-700"></div>
                            <span className="text-sm font-medium text-slate-400">总价: <span className="text-lg font-black text-white">¥{totalGoodsPrice.toFixed(2)}</span></span>
                        </div>
                    </div>
                )}
            </section>

            {/* Entry Type Specific Inputs */}
            {(data.taskEntryType || TaskEntryType.KEYWORD) !== TaskEntryType.KEYWORD && (
                <Card className="overflow-hidden rounded-[24px] border-0 bg-white shadow-lg" noPadding>
                    <div className="bg-primary-50 p-6">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.icon}</span>
                            <div>
                                <h3 className="text-lg font-bold text-primary-900">{TASK_ENTRY_TYPES.find(e => e.id === (data.taskEntryType || TaskEntryType.KEYWORD))?.name}配置</h3>
                                <p className="text-sm text-primary-700/70">完善以下信息供买手使用</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-8">
                        {/* TaoWord */}
                        {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.TAOWORD && (
                            <div>
                                <label className="mb-3 block text-sm font-bold text-slate-900">淘口令 <span className="text-red-500">*</span></label>
                                <Input
                                    value={data.taoWord || ''}
                                    onChange={e => onChange({ taoWord: e.target.value })}
                                    placeholder="请粘贴完整的淘口令..."
                                    className="h-14 rounded-[16px] bg-slate-50 text-lg font-medium"
                                />
                            </div>
                        )}
                        {/* ZTC */}
                        {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.ZTC && (
                            <div>
                                <label className="mb-3 block text-sm font-bold text-slate-900">直通车关键词 <span className="text-red-500">*</span></label>
                                <Input
                                    value={data.ztcKeyword || ''}
                                    onChange={e => onChange({ ztcKeyword: e.target.value })}
                                    placeholder="请输入直通车推广关键词"
                                    className="h-14 rounded-[16px] bg-slate-50 text-lg font-medium"
                                />
                            </div>
                        )}
                        {/* QR Code */}
                        {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.QRCODE && (
                            <div className="flex items-center gap-6">
                                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[20px] bg-slate-50 ring-2 ring-slate-100">
                                    {data.qrCodeImage ? (
                                        <img src={data.qrCodeImage} alt="QR" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
                                            <span className="text-4xl text-slate-200">+</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleQrCodeUpload} className="absolute inset-0 cursor-pointer opacity-0" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="mb-1 font-bold text-slate-900">上传二维码</h4>
                                    <p className="text-sm text-slate-500">请上传商品清晰的二维码图片，支持 JPG/PNG</p>
                                    <div className="mt-4 flex gap-3">
                                        <Button variant="secondary" className="rounded-full" onClick={() => document.querySelector<HTMLInputElement>('input[type=file]')?.click()}>选择图片</Button>
                                        {data.qrCodeImage && <Button variant="ghost" className="rounded-full text-red-500 hover:bg-red-50" onClick={() => onChange({ qrCodeImage: '' })}>删除</Button>}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Channel */}
                        {(data.taskEntryType || TaskEntryType.KEYWORD) === TaskEntryType.CHANNEL && (
                            <div className="flex items-center gap-6">
                                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[20px] bg-slate-50 ring-2 ring-slate-100">
                                    {data.channelUrl ? (
                                        <img src={data.channelUrl} alt="Channel" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full flex-col items-center justify-center text-slate-300">
                                            <span className="text-4xl text-slate-200">+</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" onChange={handleChannelUpload} className="absolute inset-0 cursor-pointer opacity-0" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="mb-1 font-bold text-slate-900">上传通道图片</h4>
                                    <p className="text-sm text-slate-500">请上传通道任务示意图</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            )}

            {/* Task Count */}
            <section className="flex items-center justify-between rounded-[24px] bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/10">
                <div>
                    <h3 className="text-xl font-bold text-white">发布任务数量</h3>
                    <p className="text-slate-400">设置要发布的任务单数</p>
                </div>
                <div className="flex items-center gap-4 rounded-[16px] bg-white/10 p-2 backdrop-blur-md">
                    <button onClick={() => onChange({ count: Math.max(1, data.count - 1) })} className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-white text-2xl font-bold text-slate-900 hover:bg-slate-200">-</button>
                    <div className="min-w-[80px] text-center text-3xl font-black text-white">{data.count}</div>
                    <button onClick={() => onChange({ count: data.count + 1 })} className="flex h-12 w-12 items-center justify-center rounded-[12px] bg-white text-2xl font-bold text-slate-900 hover:bg-slate-200">+</button>
                </div>
            </section>

            {/* Footer Action */}
            <div className="sticky bottom-6 z-10 flex justify-end">
                <Button
                    onClick={onNext}
                    disabled={isNextDisabled}
                    className={cn(
                        'h-14 rounded-[20px] px-10 text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95',
                        isNextDisabled ? 'cursor-not-allowed bg-slate-200 text-slate-400' : 'bg-primary-600 text-white shadow-primary-500/30 hover:bg-primary-700'
                    )}
                >
                    下一步
                </Button>
            </div>

            {/* Add/Edit Goods Modal */}
            {showAddGoodsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">{editingGoods ? '编辑商品' : '添加商品'}</h3>
                            <button onClick={() => setShowAddGoodsModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
                        </div>

                        {/* Shop Selection */}
                        {!editingGoods && (
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-bold text-slate-900">所属店铺 <span className="text-red-500">*</span></label>
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
                                    className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-base font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                                />
                                <p className="mt-2 text-xs text-slate-500">商品将关联到选中的店铺</p>
                            </div>
                        )}

                        {/* Link Fetch */}
                        <div className="mb-6">
                            <label className="mb-2 block text-sm font-bold text-slate-900">商品链接</label>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={newGoodsUrl}
                                    onChange={e => setNewGoodsUrl(e.target.value)}
                                    placeholder="粘贴商品链接自动获取信息"
                                    className="h-12 flex-1 rounded-[16px] bg-slate-50 font-medium"
                                />
                                <Button onClick={handleFetchGoodsInfo} disabled={fetchingGoods || !newGoodsUrl} variant="secondary" className="h-12 rounded-[16px] px-6 font-bold">
                                    {fetchingGoods ? '获取中...' : '获取'}
                                </Button>
                            </div>
                        </div>

                        {/* Image Preview & Name */}
                        <div className="mb-6 flex gap-4">
                            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-slate-50 ring-1 ring-slate-100">
                                {newGoodsData.image ? (
                                    <img src={newGoodsData.image} alt="预览" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-3xl text-slate-300">📷</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-bold text-slate-900">商品名称 <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    value={newGoodsData.name || ''}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="请输入商品名称"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>
                        </div>

                        {/* Price & Quantity */}
                        <div className="mb-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">单价 (元) <span className="text-red-500">*</span></label>
                                <Input
                                    type="number"
                                    value={String(newGoodsData.price || '')}
                                    onChange={e => setNewGoodsData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">数量</label>
                                <div className="flex items-center rounded-[16px] bg-slate-50 p-1">
                                    <button onClick={() => setNewGoodsData(prev => ({ ...prev, quantity: Math.max(1, (prev.quantity || 1) - 1) }))} className="h-10 w-10 rounded-[12px] bg-white font-bold text-slate-500 shadow-sm disabled:opacity-50">-</button>
                                    <Input
                                        type="number"
                                        value={String(newGoodsData.quantity || 1)}
                                        onChange={e => setNewGoodsData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                        min="1"
                                        className="h-10 flex-1 border-none bg-transparent text-center font-bold focus:ring-0"
                                    />
                                    <button onClick={() => setNewGoodsData(prev => ({ ...prev, quantity: (prev.quantity || 1) + 1 }))} className="h-10 w-10 rounded-[12px] bg-white font-bold text-slate-500 shadow-sm">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Verify Code */}
                        <div className="mb-8">
                            <label className="mb-2 block text-sm font-bold text-slate-900">核对口令</label>
                            <Input
                                type="text"
                                value={newGoodsData.verifyCode || ''}
                                onChange={e => setNewGoodsData(prev => ({ ...prev, verifyCode: e.target.value.slice(0, 10) }))}
                                placeholder="请输入核对口令"
                                maxLength={10}
                                className="h-12 rounded-[16px] bg-slate-50 font-medium"
                            />
                            <p className="mt-2 text-xs text-slate-500">请输入不超过10个字的核对口令，必须是商品详情页有的文字。买手做任务时需在详情页找到此口令进行核对。</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setShowAddGoodsModal(false)} className="h-12 flex-1 rounded-[16px] bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">取消</Button>
                            <Button onClick={handleSaveGoods} className="h-12 flex-2 rounded-[16px] px-8 font-bold shadow-lg shadow-primary-500/30">确认{editingGoods ? '修改' : '添加'}</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Goods Library Selection Modal */}
            {showGoodsLibModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-[32px] bg-white p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-900">从商品库选择</h3>
                            <button onClick={() => setShowGoodsLibModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                            {loadingGoodsLib ? (
                                <div className="flex items-center justify-center py-12 text-slate-400">加载商品中...</div>
                            ) : goodsLibList.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <span className="mb-4 text-5xl opacity-20">📦</span>
                                    <p className="mb-2 text-lg font-bold text-slate-900">该店铺暂无商品</p>
                                    <p className="text-sm text-slate-500">请先到 <a href="/merchant/goods" className="font-bold text-primary-600 hover:underline">商品管理</a> 添加商品</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {goodsLibList.map(goods => {
                                        const isAdded = data.goodsList.some(g => g.goodsId === goods.id);
                                        return (
                                            <div key={goods.id} className={cn('flex items-start gap-4 rounded-[20px] p-4 transition-all', isAdded ? 'bg-green-50 ring-1 ring-green-500/20' : 'bg-slate-50 hover:bg-white hover:shadow-lg hover:ring-1 hover:ring-primary-500/20')}>
                                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-white">
                                                    {goods.pcImg ? (
                                                        <img src={goods.pcImg} alt={goods.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <span className="text-2xl text-slate-300">📷</span>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1 space-y-2">
                                                    <p className="line-clamp-2 text-sm font-bold text-slate-900">{goods.name}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-bold text-primary-600">¥{Number(goods.price).toFixed(2)}</span>
                                                        {isAdded ? (
                                                            <span className="flex h-7 items-center rounded-full bg-green-100 px-3 text-xs font-bold text-green-700">已添加</span>
                                                        ) : (
                                                            <Button size="sm" onClick={() => handleSelectFromLib(goods)} className="h-8 rounded-full px-4 text-xs font-bold shadow-none">选择</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end border-t border-slate-100 pt-6">
                            <Button variant="secondary" onClick={() => setShowGoodsLibModal(false)} className="h-12 rounded-[16px] bg-slate-100 px-8 font-bold text-slate-600 hover:bg-slate-200">关闭</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyword Advanced Settings Modal */}
            {showKeywordAdvancedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-xl">⚙️</div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">关键词高级设置</h3>
                                    <p className="text-xs text-slate-500">设置更精准的搜索条件</p>
                                </div>
                            </div>
                            <button onClick={() => setShowKeywordAdvancedModal(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">✕</button>
                        </div>

                        {/* Discount Services */}
                        <div className="mb-6">
                            <label className="mb-3 block text-sm font-bold text-slate-900">折扣服务筛选</label>
                            <div className="flex flex-wrap gap-2">
                                {DISCOUNT_OPTIONS.map(opt => (
                                    <label key={opt.value} className={cn('cursor-pointer rounded-[12px] border-2 px-3 py-2 text-sm font-bold transition-all', advancedSettings.discount.includes(opt.value) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-500 hover:border-primary-200 hover:text-primary-600')}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={advancedSettings.discount.includes(opt.value)}
                                            onChange={e => {
                                                if (e.target.checked) setAdvancedSettings(prev => ({ ...prev, discount: [...prev.discount, opt.value] }));
                                                else setAdvancedSettings(prev => ({ ...prev, discount: prev.discount.filter(v => v !== opt.value) }));
                                            }}
                                        />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-6 grid gap-6 sm:grid-cols-2">
                            {/* Compare Keyword */}
                            <div className="col-span-full">
                                <label className="mb-2 block text-sm font-bold text-slate-900">货比关键词 <span className="text-red-500">*</span></label>
                                <Input
                                    type="text"
                                    value={advancedSettings.compareKeyword}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, compareKeyword: e.target.value }))}
                                    placeholder="买手货比时使用的关键词 (必填)"
                                    className={cn('h-12 rounded-[16px] bg-slate-50 font-medium', !advancedSettings.compareKeyword && 'ring-2 ring-red-100 focus:ring-red-200')}
                                />
                                <p className="mt-2 text-xs text-slate-500">买手进行货比浏览时使用此关键词搜索</p>
                            </div>

                            {/* Backup Keyword */}
                            <div className="col-span-full">
                                <label className="mb-2 block text-sm font-bold text-slate-900">备选关键词</label>
                                <Input
                                    type="text"
                                    value={advancedSettings.backupKeyword}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, backupKeyword: e.target.value }))}
                                    placeholder="主关键词找不到时使用"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>

                            {/* Specs */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">商品规格1</label>
                                <Input
                                    type="text"
                                    value={advancedSettings.spec1}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, spec1: e.target.value }))}
                                    placeholder="如：颜色"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">商品规格2</label>
                                <Input
                                    type="text"
                                    value={advancedSettings.spec2}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, spec2: e.target.value }))}
                                    placeholder="如：尺码"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>

                            {/* Price Range */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">最低价格 (元)</label>
                                <Input
                                    type="number"
                                    value={String(advancedSettings.minPrice || '')}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, minPrice: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">最高价格 (元)</label>
                                <Input
                                    type="number"
                                    value={String(advancedSettings.maxPrice || '')}
                                    onChange={e => setAdvancedSettings(prev => ({ ...prev, maxPrice: parseFloat(e.target.value) || 0 }))}
                                    placeholder="不限"
                                    className="h-12 rounded-[16px] bg-slate-50 font-medium"
                                />
                            </div>

                            {/* Sort & Province */}
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">排序方式</label>
                                <div className="relative">
                                    <select
                                        value={advancedSettings.sort}
                                        onChange={e => setAdvancedSettings(prev => ({ ...prev, sort: e.target.value }))}
                                        className="h-12 w-full appearance-none rounded-[16px] bg-slate-50 px-4 font-medium outline-none focus:ring-2 focus:ring-primary-500/20"
                                    >
                                        {SORT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-900">发货地省份</label>
                                <div className="relative">
                                    <select
                                        value={advancedSettings.province}
                                        onChange={e => setAdvancedSettings(prev => ({ ...prev, province: e.target.value }))}
                                        className="h-12 w-full appearance-none rounded-[16px] bg-slate-50 px-4 font-medium outline-none focus:ring-2 focus:ring-primary-500/20"
                                    >
                                        <option value="">不限</option>
                                        {PROVINCE_OPTIONS.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex gap-3 border-t border-slate-100 pt-6">
                            <Button variant="secondary" onClick={() => setShowKeywordAdvancedModal(false)} className="h-12 flex-1 rounded-[16px] bg-slate-100 font-bold text-slate-600 hover:bg-slate-200">取消</Button>
                            <Button onClick={handleSaveAdvancedSettings} className="h-12 flex-2 rounded-[16px] px-8 font-bold shadow-lg shadow-primary-500/30">保存设置</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
