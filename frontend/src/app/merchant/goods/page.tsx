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

interface Goods { id: string; shopId: string; title: string; mainImage: string; price: number; url: string; specName: string; specValue: string; platform: string; }
interface Shop { id: string; name: string; platform: string; }

export default function GoodsPage() {
    const [goodsList, setGoodsList] = useState<Goods[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoods, setEditingGoods] = useState<Goods | null>(null);
    const [formData, setFormData] = useState({ shopId: '', title: '', mainImage: '', price: '', url: '', specName: '', specValue: '' });

    useEffect(() => { fetchShops(); fetchGoods(); }, []);

    const fetchShops = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/shops/my-shops`, { headers: { Authorization: `Bearer ${token}` } });
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
        if (!formData.title || !formData.shopId || !formData.price || !formData.url) { alert('请填写必填项'); return; }
        try {
            const token = localStorage.getItem('merchantToken');
            const url = editingGoods ? `${BASE_URL}/goods/${editingGoods.id}` : `${BASE_URL}/goods`;
            const method = editingGoods ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...formData, price: Number(formData.price) }) });
            const json = await res.json();
            if (json.success) { alert(editingGoods ? '更新成功' : '创建成功'); setIsModalOpen(false); setEditingGoods(null); setFormData({ shopId: '', title: '', mainImage: '', price: '', url: '', specName: '', specValue: '' }); fetchGoods(); }
            else alert(json.message || '操作失败');
        } catch (error) { console.error('Submit failed:', error); }
    };

    const openEdit = (goods: Goods) => { setEditingGoods(goods); setFormData({ shopId: goods.shopId, title: goods.title, mainImage: goods.mainImage, price: goods.price.toString(), url: goods.url, specName: goods.specName || '', specValue: goods.specValue || '' }); setIsModalOpen(true); };
    const openAdd = () => { setEditingGoods(null); setFormData({ shopId: shops.length > 0 ? shops[0].id : '', title: '', mainImage: '', price: '', url: '', specName: '', specValue: '' }); setIsModalOpen(true); };
    const closeModal = () => { setIsModalOpen(false); setEditingGoods(null); setFormData({ shopId: '', title: '', mainImage: '', price: '', url: '', specName: '', specValue: '' }); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">商品管理</h1>
                <Button onClick={openAdd}>+ 新增商品</Button>
            </div>

            {/* Content */}
            <Card className="bg-white p-6">
                {loading ? (
                    <div className="text-slate-500">加载中...</div>
                ) : goodsList.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">暂无商品</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-left">
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">主图</th>
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">商品标题</th>
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">店铺</th>
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">价格</th>
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">规格</th>
                                    <th className="px-4 py-4 text-sm font-medium text-slate-500">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {goodsList.map(goods => {
                                    const shop = shops.find(s => s.id === goods.shopId);
                                    return (
                                        <tr key={goods.id} className="border-b border-slate-100">
                                            <td className="px-4 py-4">
                                                {goods.mainImage ? <img src={goods.mainImage} alt={goods.title} className="h-[60px] w-[60px] rounded object-cover" />
                                                    : <div className="h-[60px] w-[60px] rounded bg-slate-100" />}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="mb-1 font-medium">{goods.title}</div>
                                                <a href={goods.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500">商品链接</a>
                                            </td>
                                            <td className="px-4 py-4">
                                                {shop ? <Badge variant="soft" color="blue">{shop.name}</Badge> : '-'}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-red-500">¥{goods.price}</td>
                                            <td className="px-4 py-4 text-sm text-slate-500">{goods.specName ? `${goods.specName}: ${goods.specValue}` : '-'}</td>
                                            <td className="px-4 py-4">
                                                <button onClick={() => openEdit(goods)} className="mr-3 text-sm text-blue-500 hover:underline">编辑</button>
                                                <button onClick={() => handleDelete(goods.id)} className="text-sm text-red-500 hover:underline">删除</button>
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
            <Modal title={editingGoods ? '编辑商品' : '新增商品'} open={isModalOpen} onClose={closeModal}>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm text-slate-700">所属店铺</label>
                        <Select value={formData.shopId} onChange={v => setFormData({ ...formData, shopId: v })} options={[{ value: '', label: '请选择店铺' }, ...shops.map(shop => ({ value: shop.id, label: `${shop.name} (${shop.platform})` }))]} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-slate-700">商品标题</label>
                        <Input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="请输入商品标题" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-slate-700">商品链接</label>
                        <Input type="text" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="请输入商品链接" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-slate-700">商品价格</label>
                        <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm text-slate-700">规格名称 (选填)</label>
                            <Input type="text" value={formData.specName} onChange={e => setFormData({ ...formData, specName: e.target.value })} placeholder="例如：颜色" />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm text-slate-700">规格值 (选填)</label>
                            <Input type="text" value={formData.specValue} onChange={e => setFormData({ ...formData, specValue: e.target.value })} placeholder="例如：红色" />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-slate-700">主图链接</label>
                        <Input type="text" value={formData.mainImage} onChange={e => setFormData({ ...formData, mainImage: e.target.value })} placeholder="请输入图片URL" />
                        {formData.mainImage && <div className="mt-2"><img src={formData.mainImage} alt="Preview" className="h-[100px] w-[100px] rounded object-cover" /></div>}
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={closeModal}>取消</Button>
                    <Button onClick={handleSubmit}>保存</Button>
                </div>
            </Modal>
        </div>
    );
}
