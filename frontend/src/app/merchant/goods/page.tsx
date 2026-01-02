'use client';

import { useState, useEffect } from 'react';
import MerchantLayout from '../../../components/MerchantLayout';
import { BASE_URL } from '../../../../apiConfig';

interface Goods {
    id: string;
    shopId: string;
    title: string;
    mainImage: string;
    price: number;
    url: string;
    specName: string;
    specValue: string;
    platform: string;
}

interface Shop {
    id: string;
    name: string;
    platform: string;
}

export default function GoodsPage() {
    const [goodsList, setGoodsList] = useState<Goods[]>([]);
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGoods, setEditingGoods] = useState<Goods | null>(null);

    const [formData, setFormData] = useState({
        shopId: '',
        title: '',
        mainImage: '',
        price: '',
        url: '',
        specName: '',
        specValue: '',
    });

    useEffect(() => {
        fetchShops();
        fetchGoods();
    }, []);

    const fetchShops = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/shops/my-shops`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setShops(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch shops:', error);
        }
    };

    const fetchGoods = async () => {
        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/goods`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setGoodsList(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch goods:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除这个商品吗？')) return;

        try {
            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/goods/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                alert('删除成功');
                fetchGoods();
            } else {
                alert(json.message || '删除失败');
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.shopId || !formData.price || !formData.url) {
            alert('请填写必填项');
            return;
        }

        try {
            const token = localStorage.getItem('merchantToken');
            const url = editingGoods
                ? `${BASE_URL}/goods/${editingGoods.id}`
                : `${BASE_URL}/goods`;

            const method = editingGoods ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    price: Number(formData.price)
                })
            });

            const json = await res.json();
            if (json.success) {
                alert(editingGoods ? '更新成功' : '创建成功');
                setIsModalOpen(false);
                setEditingGoods(null);
                setFormData({
                    shopId: '',
                    title: '',
                    mainImage: '',
                    price: '',
                    url: '',
                    specName: '',
                    specValue: '',
                });
                fetchGoods();
            } else {
                alert(json.message || '操作失败');
            }
        } catch (error) {
            console.error('Submit failed:', error);
        }
    };

    const openEdit = (goods: Goods) => {
        setEditingGoods(goods);
        setFormData({
            shopId: goods.shopId,
            title: goods.title,
            mainImage: goods.mainImage,
            price: goods.price.toString(),
            url: goods.url,
            specName: goods.specName || '',
            specValue: goods.specValue || '',
        });
        setIsModalOpen(true);
    };

    return (
        <MerchantLayout>
            <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>商品管理</h1>
                    <button
                        onClick={() => {
                            setEditingGoods(null);
                            setFormData({
                                shopId: shops.length > 0 ? shops[0].id : '',
                                title: '',
                                mainImage: '',
                                price: '',
                                url: '',
                                specName: '',
                                specValue: '',
                            });
                            setIsModalOpen(true);
                        }}
                        style={{
                            padding: '10px 20px',
                            background: '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        + 新增商品
                    </button>
                </div>

                <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {loading ? (
                        <div>加载中...</div>
                    ) : goodsList.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#999', padding: '40px' }}>暂无商品</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f0f0f0', textAlign: 'left' }}>
                                    <th style={{ padding: '16px', color: '#666' }}>主图</th>
                                    <th style={{ padding: '16px', color: '#666' }}>商品标题</th>
                                    <th style={{ padding: '16px', color: '#666' }}>店铺</th>
                                    <th style={{ padding: '16px', color: '#666' }}>价格</th>
                                    <th style={{ padding: '16px', color: '#666' }}>规格</th>
                                    <th style={{ padding: '16px', color: '#666' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {goodsList.map(goods => {
                                    const shop = shops.find(s => s.id === goods.shopId);
                                    return (
                                        <tr key={goods.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '16px' }}>
                                                {goods.mainImage ? (
                                                    <img src={goods.mainImage} alt={goods.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                                                ) : (
                                                    <div style={{ width: '60px', height: '60px', background: '#f0f0f0', borderRadius: '4px' }} />
                                                )}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{goods.title}</div>
                                                <a href={goods.url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#1890ff' }}>商品链接</a>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {shop ? (
                                                    <span style={{
                                                        background: '#e6f7ff', color: '#1890ff',
                                                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px'
                                                    }}>
                                                        {shop.name}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td style={{ padding: '16px', color: '#f5222d', fontWeight: 'bold' }}>
                                                ¥{goods.price}
                                            </td>
                                            <td style={{ padding: '16px', color: '#666' }}>
                                                {goods.specName ? `${goods.specName}: ${goods.specValue}` : '-'}
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <button
                                                    onClick={() => openEdit(goods)}
                                                    style={{ color: '#1890ff', border: 'none', background: 'none', cursor: 'pointer', marginRight: '12px' }}
                                                >
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(goods.id)}
                                                    style={{ color: '#ff4d4f', border: 'none', background: 'none', cursor: 'pointer' }}
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {isModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px' }}>
                                {editingGoods ? '编辑商品' : '新增商品'}
                            </h2>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>所属店铺</label>
                                <select
                                    value={formData.shopId}
                                    onChange={e => setFormData({ ...formData, shopId: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                                >
                                    <option value="">请选择店铺</option>
                                    {shops.map(shop => (
                                        <option key={shop.id} value={shop.id}>{shop.name} ({shop.platform})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>商品标题</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="请输入商品标题"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>商品链接</label>
                                <input
                                    type="text"
                                    value={formData.url}
                                    onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    placeholder="请输入商品链接"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>商品价格</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>规格名称 (选填)</label>
                                    <input
                                        type="text"
                                        value={formData.specName}
                                        onChange={e => setFormData({ ...formData, specName: e.target.value })}
                                        placeholder="例如：颜色"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>规格值 (选填)</label>
                                    <input
                                        type="text"
                                        value={formData.specValue}
                                        onChange={e => setFormData({ ...formData, specValue: e.target.value })}
                                        placeholder="例如：红色"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#333' }}>主图链接</label>
                                <input
                                    type="text"
                                    value={formData.mainImage}
                                    onChange={e => setFormData({ ...formData, mainImage: e.target.value })}
                                    placeholder="请输入图片URL"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                                {formData.mainImage && (
                                    <div style={{ marginTop: '8px' }}>
                                        <img src={formData.mainImage} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '8px 20px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    取消
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    style={{ padding: '8px 20px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    保存
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MerchantLayout>
    );
}
