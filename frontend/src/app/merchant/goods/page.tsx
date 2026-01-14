'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';

interface Goods { id: string; shopId: string; name: string; pcImg: string; price: number; link: string; verifyCode?: string; platform: string; }
interface Shop { id: string; shopName: string; platform: string; }

export default function GoodsPage() {
    const [goodsList, setGoodsList] = useState<Goods[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoods, setEditingGoods] = useState<Goods | null>(null);
    const [formData, setFormData] = useState({ shopId: '', title: '', mainImage: '', price: '', url: '', verifyCode: '' });
    const [searchKeyword, setSearchKeyword] = useState('');

    useEffect(() => { fetchShops(); fetchGoods(); }, []);

    const fetchShops = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/shops`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setShops(json.data);
        } catch (error) { console.error('Failed to fetch shops:', error); }
    };

    const fetchGoods = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/goods`, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setGoodsList(json.data);
        } catch (error) { console.error('Failed to fetch goods:', error); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个商品吗？')) return;
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/goods/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { alert('删除成功'); fetchGoods(); }
            else alert(json.message || '删除失败');
        } catch (error) { console.error('Delete failed:', error); }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.shopId || !formData.price) { alert('请填写必填项'); return; }
        try {
            const token = localStorage.getItem('merchantToken');
            const apiUrl = editingGoods ? `${BASE_URL}/goods/${editingGoods.id}` : `${BASE_URL}/goods`;
            const method = editingGoods ? 'PUT' : 'POST';
            // Map frontend field names to backend field names
            const payload = {
                shopId: formData.shopId,
                name: formData.title,
                link: formData.url || '',
                pcImg: formData.mainImage || '',
                price: Number(formData.price),
                verifyCode: formData.verifyCode || ''
            };
            const res = await fetch(apiUrl, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            const json = await res.json();
            if (json.success) { alert(editingGoods ? '更新成功' : '创建成功'); setIsModalOpen(false); setEditingGoods(null); setFormData({ shopId: '', title: '', mainImage: '', price: '', url: '', verifyCode: '' }); fetchGoods(); }
            else alert(json.message || '操作失败');
        } catch (error) { console.error('Submit failed:', error); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const reader = new FileReader();
        reader.onload = () => { setFormData(prev => ({ ...prev, mainImage: reader.result as string })); setUploading(false); };
        reader.onerror = () => { alert('图片读取失败'); setUploading(false); };
        reader.readAsDataURL(file);
    };

    const openEdit = (goods: Goods) => { setEditingGoods(goods); setFormData({ shopId: goods.shopId, title: goods.name, mainImage: goods.pcImg || '', price: goods.price.toString(), url: goods.link || '', verifyCode: goods.verifyCode || '' }); setIsModalOpen(true); };
    const openAdd = () => { setEditingGoods(null); setFormData({ shopId: shops.length > 0 ? shops[0].id : '', title: '', mainImage: '', price: '', url: '', verifyCode: '' }); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingGoods(null); setFormData({ shopId: '', title: '', mainImage: '', price: '', url: '', verifyCode: '' }); };

    // 从商品链接中提取商品ID
    const extractGoodsId = (link: string): string => {
        if (!link) return '';
        const match = link.match(/[?&]id=(\d+)/);
        return match ? match[1] : '';
    };

    // 过滤商品列表
    const filteredGoodsList = goodsList.filter(goods => {
        if (!searchKeyword.trim()) return true;
        const keyword = searchKeyword.toLowerCase().trim();
        const goodsId = extractGoodsId(goods.link);

        // 支持标题搜索
        if (goods.name.toLowerCase().includes(keyword)) return true;

        // 支持商品ID搜索
        if (goodsId && goodsId.includes(keyword)) return true;

        // 支持完整URL搜索
        if (keyword.includes('http') || keyword.includes('item.')) {
            const searchId = extractGoodsId(keyword);
            if (searchId && goodsId === searchId) return true;
        }

        return false;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">商品管理</h1>
                <Button
                    onClick={openAdd}
                    className="flex items-center gap-1.5 rounded-[16px] bg-primary-600 px-5 text-base font-bold text-white shadow-none transition-all active:scale-95 hover:bg-primary-700"
                >
                    + 新增商品
                </Button>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
                <Input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="搜索商品标题、商品ID或商品链接..."
                    className="h-12 flex-1 rounded-[16px] border-none bg-white px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                />
                {searchKeyword && (
                    <Button
                        onClick={() => setSearchKeyword('')}
                        variant="secondary"
                        className="rounded-[16px]"
                    >
                        清除
                    </Button>
                )}
            </div>

            {/* Content */}
            <Card className="rounded-[24px] bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center font-medium text-slate-400">加载中...</div>
                ) : filteredGoodsList.length === 0 ? (
                    <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                        <div className="mb-4 text-5xl opacity-50">🛒</div>
                        <div className="mb-5 text-[14px] font-medium text-slate-400">
                            {searchKeyword ? '未找到匹配的商品' : '暂无商品'}
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">主图</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">商品标题</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">店铺</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">价格</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">核对口令</th>
                                    <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredGoodsList.map((goods, index) => {
                                    const shop = shops.find(s => s.id === goods.shopId);
                                    return (
                                        <tr
                                            key={goods.id}
                                            className={cn(
                                                "group border-b border-slate-50 transition-colors hover:bg-slate-50/50",
                                                index === filteredGoodsList.length - 1 && "border-0"
                                            )}
                                        >
                                            <td className="px-6 py-5">
                                                {goods.pcImg ? <img src={goods.pcImg} alt={goods.name} className="h-[60px] w-[60px] rounded-[12px] border border-slate-100 object-cover" />
                                                    : <div className="h-[60px] w-[60px] rounded-[12px] bg-slate-100" />}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="mb-1 font-semibold text-slate-900 line-clamp-2 max-w-[200px]">{goods.name}</div>
                                                <a href={goods.link} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline">商品链接</a>
                                            </td>
                                            <td className="px-6 py-5">
                                                {shop ? <Badge variant="soft" color="blue" className="rounded-full px-2.5 font-bold">{shop.shopName}</Badge> : '-'}
                                            </td>
                                            <td className="px-6 py-5 font-black text-danger-500">¥{goods.price}</td>
                                            <td className="px-6 py-5 text-sm font-medium text-slate-500">{goods.verifyCode || '-'}</td>
                                            <td className="px-6 py-5">
                                                <button onClick={() => openEdit(goods)} className="mr-3 text-sm font-bold text-primary-600 hover:text-primary-700 hover:underline">编辑</button>
                                                <button onClick={() => handleDelete(goods.id)} className="text-sm font-bold text-danger-400 hover:text-danger-500 hover:underline">删除</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Add/Edit Modal */}
            <Modal
                title={editingGoods ? '编辑商品' : '新增商品'}
                open={isModalOpen}
                onClose={closeModal}
                className="max-w-lg rounded-[32px]"
            >
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">所属店铺</label>
                        <Select
                            value={formData.shopId}
                            onChange={v => setFormData({ ...formData, shopId: v })}
                            placeholder="请选择店铺"
                            options={shops.map(shop => ({ value: shop.id, label: `${shop.shopName} (${shop.platform})` }))}
                            className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">商品标题</label>
                        <Input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="请输入商品标题"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">商品链接</label>
                        <Input
                            type="text"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            placeholder="请输入商品链接"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">商品价格</label>
                        <Input
                            type="number"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            placeholder="0.00"
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">核对口令</label>
                        <Input
                            type="text"
                            value={formData.verifyCode}
                            onChange={e => setFormData({ ...formData, verifyCode: e.target.value })}
                            placeholder="请输入核对口令"
                            maxLength={10}
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                        <div className="mt-2 text-xs font-medium text-slate-400">不超过10个字，买手做任务时需在详情页找到此口令进行核对</div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">商品主图</label>
                        <div className="relative">
                            {formData.mainImage ? (
                                <div className="relative inline-block">
                                    <img src={formData.mainImage} alt="商品主图" className="h-24 w-24 rounded-[12px] border border-slate-100 object-cover shadow-sm" />
                                    <button type="button" onClick={() => setFormData({ ...formData, mainImage: '' })} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-danger-400 text-xs text-white hover:bg-danger-500 shadow-sm">×</button>
                                </div>
                            ) : (
                                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-primary-400 hover:bg-slate-100 hover:text-primary-500">
                                    {uploading ? <Spinner size="sm" /> : <><span className="text-2xl">+</span><span className="text-xs font-bold">上传主图</span></>}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-5">
                    <Button
                        variant="secondary"
                        onClick={closeModal}
                        className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        className="h-11 rounded-[16px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700"
                    >
                        保存
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
