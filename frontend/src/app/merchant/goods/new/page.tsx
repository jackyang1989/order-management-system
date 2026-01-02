'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createGoods, CreateGoodsDto } from '../../../../services/goodsService';
import { fetchShops, Shop } from '../../../../services/shopService';

export default function NewGoodsPage() {
    const router = useRouter();
    const [shops, setShops] = useState<Shop[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState<CreateGoodsDto>({
        shopId: '',
        name: '',
        link: '',
        taobaoId: '',
        verifyCode: '',
        specName: '',
        specValue: '',
        price: 0,
        num: 1,
        showPrice: 0
    });

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        const data = await fetchShops();
        setShops(data.filter(s => s.status === 1)); // 只显示审核通过的店铺
        if (data.length > 0 && data[0].status === 1) {
            setForm(prev => ({ ...prev, shopId: data[0].id }));
        }
    };

    const handleChange = (field: keyof CreateGoodsDto, value: string | number) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.shopId) {
            alert('请选择店铺');
            return;
        }
        if (!form.name.trim()) {
            alert('请输入商品名称');
            return;
        }
        if (!form.price || form.price <= 0) {
            alert('请输入有效的商品价格');
            return;
        }

        setLoading(true);
        const res = await createGoods({
            ...form,
            price: Number(form.price),
            num: Number(form.num) || 1,
            showPrice: Number(form.showPrice) || Number(form.price)
        });
        setLoading(false);

        if (res.success) {
            alert('商品创建成功');
            router.push('/merchant/goods');
        } else {
            alert(res.message);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid #d9d9d9',
        borderRadius: '4px',
        fontSize: '14px'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontWeight: '500' as const
    };

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
                <button
                    onClick={() => router.back()}
                    style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: '14px' }}
                >
                    ← 返回商品列表
                </button>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '24px' }}>添加商品</h1>

            <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', maxWidth: '800px' }}>
                <div style={{ display: 'grid', gap: '20px' }}>
                    {/* 店铺选择 */}
                    <div>
                        <label style={labelStyle}>所属店铺 <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <select
                            value={form.shopId}
                            onChange={(e) => handleChange('shopId', e.target.value)}
                            style={inputStyle}
                        >
                            <option value="">请选择店铺</option>
                            {shops.map(shop => (
                                <option key={shop.id} value={shop.id}>{shop.shopName}</option>
                            ))}
                        </select>
                        {shops.length === 0 && (
                            <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                                暂无可用店铺，请先绑定店铺
                            </div>
                        )}
                    </div>

                    {/* 商品名称 */}
                    <div>
                        <label style={labelStyle}>商品名称 <span style={{ color: '#ff4d4f' }}>*</span></label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="请输入商品名称"
                            style={inputStyle}
                            maxLength={200}
                        />
                    </div>

                    {/* 商品链接 */}
                    <div>
                        <label style={labelStyle}>商品链接</label>
                        <input
                            type="text"
                            value={form.link}
                            onChange={(e) => handleChange('link', e.target.value)}
                            placeholder="请输入商品链接或淘口令"
                            style={inputStyle}
                        />
                    </div>

                    {/* 淘宝商品ID */}
                    <div>
                        <label style={labelStyle}>淘宝商品ID</label>
                        <input
                            type="text"
                            value={form.taobaoId}
                            onChange={(e) => handleChange('taobaoId', e.target.value)}
                            placeholder="可从商品链接自动解析"
                            style={inputStyle}
                        />
                    </div>

                    {/* 核对口令 */}
                    <div>
                        <label style={labelStyle}>核对口令</label>
                        <input
                            type="text"
                            value={form.verifyCode}
                            onChange={(e) => handleChange('verifyCode', e.target.value)}
                            placeholder="用于买手核对订单"
                            style={inputStyle}
                            maxLength={20}
                        />
                    </div>

                    {/* 价格和数量 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>商品单价 <span style={{ color: '#ff4d4f' }}>*</span></label>
                            <input
                                type="number"
                                value={form.price}
                                onChange={(e) => handleChange('price', e.target.value)}
                                placeholder="0.00"
                                style={inputStyle}
                                min="0"
                                step="0.01"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>数量</label>
                            <input
                                type="number"
                                value={form.num}
                                onChange={(e) => handleChange('num', e.target.value)}
                                placeholder="1"
                                style={inputStyle}
                                min="1"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>展示价格</label>
                            <input
                                type="number"
                                value={form.showPrice}
                                onChange={(e) => handleChange('showPrice', e.target.value)}
                                placeholder="默认同单价"
                                style={inputStyle}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* 规格 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>规格名</label>
                            <input
                                type="text"
                                value={form.specName}
                                onChange={(e) => handleChange('specName', e.target.value)}
                                placeholder="如：颜色"
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>规格值</label>
                            <input
                                type="text"
                                value={form.specValue}
                                onChange={(e) => handleChange('specValue', e.target.value)}
                                placeholder="如：红色"
                                style={inputStyle}
                            />
                        </div>
                    </div>
                </div>

                {/* 提交按钮 */}
                <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{
                            padding: '12px 32px',
                            background: loading ? '#ccc' : '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {loading ? '提交中...' : '保存商品'}
                    </button>
                    <button
                        onClick={() => router.back()}
                        style={{
                            padding: '12px 32px',
                            background: '#fff',
                            color: '#666',
                            border: '1px solid #d9d9d9',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        取消
                    </button>
                </div>
            </div>
        </div>
    );
}
