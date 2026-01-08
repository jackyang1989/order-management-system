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
                    <div className="text-[#f9fafb]0">加载中...</div>
                ) : goodsList.length === 0 ? (
                    <div className="py-10 text-center text-[#9ca3af]">暂无商品</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[800px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] text-left">
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">主图</th>
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">商品标题</th>
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">店铺</th>
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">价格</th>
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">核对口令</th>
                                    <th className="px-4 py-4 text-sm font-medium text-[#f9fafb]0">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {goodsList.map(goods => {
                                    const shop = shops.find(s => s.id === goods.shopId);
                                    return (
                                        <tr key={goods.id} className="border-b border-[#f3f4f6]">
                                            <td className="px-4 py-4">
                                                {goods.pcImg ? <img src={goods.pcImg} alt={goods.name} className="h-[60px] w-[60px] rounded object-cover" />
                                                    : <div className="h-[60px] w-[60px] rounded bg-[#f3f4f6]" />}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="mb-1 font-medium">{goods.name}</div>
                                                <a href={goods.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500">商品链接</a>
                                            </td>
                                            <td className="px-4 py-4">
                                                {shop ? <Badge variant="soft" color="blue">{shop.shopName}</Badge> : '-'}
                                            </td>
                                            <td className="px-4 py-4 font-bold text-red-500">¥{goods.price}</td>
                                            <td className="px-4 py-4 text-sm text-[#f9fafb]0">{goods.verifyCode || '-'}</td>
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
                        <label className="mb-2 block text-sm text-[#374151]">所属店铺</label>
                        <Select value={formData.shopId} onChange={v => setFormData({ ...formData, shopId: v })} placeholder="请选择店铺" options={shops.map(shop => ({ value: shop.id, label: `${shop.shopName} (${shop.platform})` }))} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#374151]">商品标题</label>
                        <Input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="请输入商品标题" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#374151]">商品链接</label>
                        <Input type="text" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} placeholder="请输入商品链接" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#374151]">商品价格</label>
                        <Input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#374151]">核对口令</label>
                        <Input type="text" value={formData.verifyCode} onChange={e => setFormData({ ...formData, verifyCode: e.target.value })} placeholder="请输入核对口令" maxLength={10} />
                        <div className="mt-1.5 text-xs text-[#f9fafb]0">不超过10个字，买手做任务时需在详情页找到此口令进行核对</div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#374151]">商品主图</label>
                        <div className="relative">
                            {formData.mainImage ? (
                                <div className="relative inline-block">
                                    <img src={formData.mainImage} alt="商品主图" className="h-24 w-24 rounded-md border border-[#e5e7eb] object-cover" />
                                    <button type="button" onClick={() => setFormData({ ...formData, mainImage: '' })} className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600">×</button>
                                </div>
                            ) : (
                                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-[#d1d5db] bg-[#f9fafb] text-[#9ca3af] transition-colors hover:border-blue-400 hover:text-blue-500">
                                    {uploading ? <Spinner size="sm" /> : <><span className="text-2xl">+</span><span className="text-xs">上传主图</span></>}
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                            )}
                        </div>
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
