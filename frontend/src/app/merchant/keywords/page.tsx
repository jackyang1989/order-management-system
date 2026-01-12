'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';
import { fetchShops, Shop } from '../../../services/shopService';

// 排序方式选项 - 与任务发布页保持一致
const SORT_OPTIONS = [
    { value: '0', label: '综合排序' },
    { value: '1', label: '销量排序' },
    { value: '2', label: '价格升序' },
    { value: '3', label: '价格降序' },
    { value: '4', label: '信用排序' },
];

interface KeywordScheme {
    id: string;
    name: string;
    description: string;
    shopId?: string;
    createdAt: string;
}

interface KeywordDetail {
    id: string;
    keyword: string;
    minPrice: number;
    maxPrice: number;
    sort: string;
    amount: number;
}

export default function KeywordsPage() {
    const router = useRouter();

    // 店铺相关状态
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [shopsLoading, setShopsLoading] = useState(true);

    // 方案和关键词状态（一个店铺对应一个默认方案）
    const [currentScheme, setCurrentScheme] = useState<KeywordScheme | null>(null);
    const [keywords, setKeywords] = useState<KeywordDetail[]>([]);
    const [loading, setLoading] = useState(false);

    const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false);
    const [keywordForm, setKeywordForm] = useState({
        id: '',
        keyword: '',
        minPrice: '',
        maxPrice: '',
        sort: '0',
        amount: '1'
    });

    // 加载店铺列表
    useEffect(() => {
        loadShops();
    }, []);

    // 店铺变化时加载该店铺的关键词
    useEffect(() => {
        if (selectedShop) {
            fetchShopKeywords(selectedShop.id);
        } else {
            setCurrentScheme(null);
            setKeywords([]);
        }
    }, [selectedShop]);

    const loadShops = async () => {
        setShopsLoading(true);
        try {
            const shopList = await fetchShops();
            // 只显示审核通过的店铺 (status === 1)
            const approvedShops = shopList.filter(s => s.status === 1);
            setShops(approvedShops);
            // 默认选择第一个店铺
            if (approvedShops.length > 0) {
                setSelectedShop(approvedShops[0]);
            }
        } catch (error) {
            console.error('Failed to load shops:', error);
        } finally {
            setShopsLoading(false);
        }
    };

    // 获取店铺的关键词（通过查找或创建默认方案）
    const fetchShopKeywords = async (shopId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('merchantToken');
            // 获取该店铺的方案
            const res = await fetch(`${BASE_URL}/keywords/schemes?shopId=${encodeURIComponent(shopId)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();

            if (json.success && json.data && json.data.length > 0) {
                // 使用第一个方案（默认方案）
                const scheme = json.data[0];
                setCurrentScheme(scheme);
                // 加载该方案的关键词
                fetchKeywords(scheme.id);
            } else {
                // 没有方案
                setCurrentScheme(null);
                setKeywords([]);
            }
        } catch (error) {
            console.error('Failed to fetch shop keywords:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchKeywords = async (schemeId: string) => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes/${schemeId}/details`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setKeywords(json.data);
        } catch (error) { console.error('Failed to fetch keywords:', error); }
    };

    // 确保店铺有方案，没有则创建
    const ensureSchemeExists = async (shopId: string, shopName: string): Promise<string | null> => {
        if (currentScheme) return currentScheme.id;

        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/keywords/schemes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: `${shopName}的关键词`,
                    description: '',
                    shopId: shopId
                })
            });
            const json = await res.json();
            if (json.success && json.data) {
                setCurrentScheme(json.data);
                return json.data.id;
            }
            return null;
        } catch (error) {
            console.error('Failed to create scheme:', error);
            return null;
        }
    };

    const handleKeywordSubmit = async () => {
        if (!selectedShop) return alert('请先选择店铺');
        if (!keywordForm.keyword) return alert('请输入关键词');

        try {
            // 确保方案存在
            const schemeId = await ensureSchemeExists(selectedShop.id, selectedShop.shopName);
            if (!schemeId) {
                alert('创建方案失败');
                return;
            }

            const token = localStorage.getItem('merchantToken');
            const url = keywordForm.id ? `${BASE_URL}/keywords/details/${keywordForm.id}` : `${BASE_URL}/keywords/schemes/${schemeId}/details`;
            const method = keywordForm.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    keyword: keywordForm.keyword,
                    minPrice: Number(keywordForm.minPrice) || 0,
                    maxPrice: Number(keywordForm.maxPrice) || 0,
                    sort: keywordForm.sort,
                    amount: Number(keywordForm.amount) || 1
                })
            });
            const json = await res.json();
            if (json.success) {
                fetchKeywords(schemeId);
                setIsKeywordModalOpen(false);
                setKeywordForm({ id: '', keyword: '', minPrice: '', maxPrice: '', sort: '0', amount: '1' });
            } else {
                alert(json.message);
            }
        } catch (error) { console.error('Keyword Op Failed:', error); }
    };

    const deleteKeyword = async (id: string) => {
        if (!confirm('确定删除该关键词吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            await fetch(`${BASE_URL}/keywords/details/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (currentScheme) fetchKeywords(currentScheme.id);
        } catch (error) { console.error('Delete Keyword Failed:', error); }
    };

    // 获取排序方式显示文本
    const getSortLabel = (sortValue: string) => {
        const option = SORT_OPTIONS.find(opt => opt.value === sortValue);
        return option ? option.label : '综合排序';
    };

    // 格式化价格区间显示
    const formatPriceRange = (minPrice: number, maxPrice: number) => {
        if (!minPrice && !maxPrice) return '-';
        if (minPrice && maxPrice) return `¥${minPrice} - ¥${maxPrice}`;
        if (minPrice) return `¥${minPrice} 起`;
        if (maxPrice) return `¥${maxPrice} 以内`;
        return '-';
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* 左侧：店铺列表 */}
            <Card className="flex w-[280px] flex-shrink-0 flex-col rounded-[32px] border-0 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">店铺列表</h2>
                    <p className="mt-1 text-xs text-slate-400">选择店铺管理关键词</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {shopsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 animate-pulse rounded-[16px] bg-slate-50"></div>
                            ))}
                        </div>
                    ) : shops.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center rounded-[20px] bg-slate-50 text-slate-400">
                            <span className="mb-2 text-2xl">🏪</span>
                            <span className="text-sm">暂无店铺</span>
                            <button
                                onClick={() => router.push('/merchant/shops')}
                                className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700"
                            >
                                前往添加
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {shops.map(shop => (
                                <div
                                    key={shop.id}
                                    onClick={() => setSelectedShop(shop)}
                                    className={cn(
                                        'cursor-pointer rounded-[16px] border p-3 transition-all duration-200',
                                        selectedShop?.id === shop.id
                                            ? 'border-transparent bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                                            : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    <div className="truncate text-sm font-bold">
                                        {shop.shopName}
                                    </div>
                                    <div className={cn(
                                        "mt-0.5 text-xs",
                                        selectedShop?.id === shop.id ? "text-primary-100" : "text-slate-400"
                                    )}>
                                        {shop.platform}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* 右侧：关键词列表 */}
            <Card className="flex min-w-0 flex-1 flex-col rounded-[32px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedShop ? (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{selectedShop.shopName}</h2>
                                <p className="mt-1 text-sm font-medium text-slate-400">
                                    管理该店铺的搜索关键词配置 · {keywords.length} 个关键词
                                </p>
                            </div>
                            <Button
                                onClick={() => { setKeywordForm({ id: '', keyword: '', minPrice: '', maxPrice: '', sort: '0', amount: '1' }); setIsKeywordModalOpen(true); }}
                                className="h-10 rounded-[14px] bg-primary-600 px-5 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/30"
                            >
                                + 添加关键词
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 animate-pulse rounded-[16px] bg-slate-50"></div>
                                    ))}
                                </div>
                            ) : keywords.length === 0 ? (
                                <div className="flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl shadow-sm">🔍</div>
                                    <p className="mt-4 text-sm font-bold text-slate-400">暂无关键词配置</p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setKeywordForm({ id: '', keyword: '', minPrice: '', maxPrice: '', sort: '0', amount: '1' }); setIsKeywordModalOpen(true); }}
                                        className="mt-2 font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        立即添加
                                    </Button>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-[24px] border border-slate-100 bg-white">
                                    <table className="w-full min-w-[600px]">
                                        <thead>
                                            <tr className="bg-slate-50/50">
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">关键词</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">排序方式</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">价格区间</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-400">数量</th>
                                                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {keywords.map(kw => (
                                                <tr key={kw.id} className="group transition-colors hover:bg-slate-50/50">
                                                    <td className="px-6 py-4">
                                                        <span className="font-bold text-slate-700">{kw.keyword}</span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="text-sm font-medium text-slate-500">
                                                            {getSortLabel(kw.sort)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="font-mono text-sm font-bold text-slate-700">
                                                            {formatPriceRange(kw.minPrice, kw.maxPrice)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                            {kw.amount}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setKeywordForm({
                                                                        id: kw.id,
                                                                        keyword: kw.keyword,
                                                                        minPrice: kw.minPrice?.toString() || '',
                                                                        maxPrice: kw.maxPrice?.toString() || '',
                                                                        sort: kw.sort || '0',
                                                                        amount: kw.amount?.toString() || '1'
                                                                    });
                                                                    setIsKeywordModalOpen(true);
                                                                }}
                                                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-slate-200 hover:bg-primary-50 hover:ring-primary-100"
                                                            >
                                                                编辑
                                                            </button>
                                                            <button
                                                                onClick={() => deleteKeyword(kw.id)}
                                                                className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm ring-1 ring-slate-200 hover:bg-red-50 hover:ring-red-100"
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-300">
                        <div className="mb-4 text-6xl opacity-50">🏪</div>
                        <p className="font-bold">请从左侧选择一个店铺</p>
                        <p className="mt-2 text-sm">选择店铺后可管理该店铺的关键词</p>
                    </div>
                )}
            </Card>

            {/* Keyword Modal */}
            <Modal title={keywordForm.id ? '编辑关键词' : '添加关键词'} open={isKeywordModalOpen} onClose={() => setIsKeywordModalOpen(false)} className="w-[500px] rounded-[32px]">
                <div className="space-y-6">
                    {selectedShop && (
                        <div className="rounded-[16px] bg-primary-50 p-3">
                            <p className="text-sm text-primary-600">
                                <span className="font-bold">所属店铺：</span>{selectedShop.shopName} ({selectedShop.platform})
                            </p>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">搜索关键词</label>
                            <Input
                                value={keywordForm.keyword}
                                onChange={e => setKeywordForm({ ...keywordForm, keyword: e.target.value })}
                                placeholder="输入买家搜索用的关键词"
                                className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">排序方式</label>
                            <Select
                                value={keywordForm.sort}
                                onChange={v => setKeywordForm({ ...keywordForm, sort: v })}
                                options={SORT_OPTIONS}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">卡位价格区间 (选填)</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                                    <Input
                                        type="number"
                                        value={keywordForm.minPrice}
                                        onChange={e => setKeywordForm({ ...keywordForm, minPrice: e.target.value })}
                                        placeholder="最低价"
                                        min="0"
                                        className="h-12 rounded-[16px] border-none bg-slate-50 px-4 pl-8 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>
                                    <Input
                                        type="number"
                                        value={keywordForm.maxPrice}
                                        onChange={e => setKeywordForm({ ...keywordForm, maxPrice: e.target.value })}
                                        placeholder="最高价"
                                        min="0"
                                        className="h-12 rounded-[16px] border-none bg-slate-50 px-4 pl-8 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>
                            <p className="mt-1.5 text-xs text-slate-400">设置后，任务发布时会自动应用到筛选设置</p>
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">数量</label>
                            <Input
                                type="number"
                                value={keywordForm.amount}
                                onChange={e => setKeywordForm({ ...keywordForm, amount: e.target.value })}
                                min="1"
                                className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => setIsKeywordModalOpen(false)}
                            className="h-11 rounded-[14px] border-none bg-slate-100 px-6 font-bold text-slate-600 hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleKeywordSubmit}
                            className="h-11 rounded-[14px] bg-primary-600 px-6 font-bold text-white hover:bg-primary-700"
                        >
                            确定
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
