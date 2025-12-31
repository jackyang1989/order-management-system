'use client';

import { useState, useEffect } from 'react';
import { TaskFormData, TaskType } from './types';
import { fetchShops, Shop } from '../../../../../services/shopService';

interface StepProps {
    data: TaskFormData;
    onChange: (data: Partial<TaskFormData>) => void;
    onNext: () => void;
}

export default function Step1BasicInfo({ data, onChange, onNext }: StepProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [loadingShops, setLoadingShops] = useState(true);

    useEffect(() => {
        loadShops();
    }, []);

    const loadShops = async () => {
        setLoadingShops(true);
        const shopList = await fetchShops();
        // Filter to only show approved shops
        setShops(shopList.filter(s => s.status === 1));
        setLoadingShops(false);
    };

    const handlePlatformChange = (type: number) => {
        // Reset shop selection when platform changes
        onChange({ taskType: type, shopId: '', shopName: '' });
    };

    const handleShopChange = (shopId: string) => {
        const selectedShop = shops.find(s => s.id === shopId);
        if (selectedShop) {
            onChange({
                shopId: selectedShop.id,
                shopName: selectedShop.shopName
            });
        } else {
            onChange({ shopId: '', shopName: '' });
        }
    };

    const handleFetchInfo = () => {
        // Mock fetch info (keep existing)
        if (!data.url) return;
        onChange({
            title: '示例商品标题 - ' + (data.url.length > 10 ? data.url.substring(0, 10) : '未知'),
            mainImage: 'https://via.placeholder.com/150',
            goodsPrice: 99.00
        });
    };

    // Filter shops by selected platform
    const platformMap: { [key: number]: string } = {
        1: 'TAOBAO',
        2: 'TMALL',
        3: 'JD',
        4: 'PDD'
    };
    const filteredShops = shops.filter(s => s.platform === platformMap[data.taskType] || s.platform === 'OTHER');

    const isNextDisabled = !data.shopId || !data.url || !data.title || data.goodsPrice <= 0 || data.count <= 0;

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                第一步：填写基础任务信息
            </h2>

            {/* Platform Selection */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    发布平台
                </label>
                <div style={{ display: 'flex', gap: '16px' }}>
                    {[
                        { id: 1, name: '淘宝', icon: '🟠' },
                        { id: 2, name: '天猫', icon: '🔴' },
                        { id: 3, name: '京东', icon: '🔴' },
                        { id: 4, name: '拼多多', icon: '🟢' },
                    ].map(p => (
                        <div
                            key={p.id}
                            onClick={() => handlePlatformChange(p.id)}
                            style={{
                                border: `1px solid ${data.taskType === p.id ? '#4f46e5' : '#e5e7eb'}`,
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: 'pointer',
                                background: data.taskType === p.id ? '#eef2ff' : '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <span>{p.icon}</span>
                            <span style={{ fontWeight: data.taskType === p.id ? '600' : '400', color: data.taskType === p.id ? '#4f46e5' : '#374151' }}>
                                {p.name}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Shop Selection & URL */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#374151' }}>选择店铺</label>
                    {loadingShops ? (
                        <div style={{ padding: '10px', color: '#999' }}>加载中...</div>
                    ) : filteredShops.length === 0 ? (
                        <div style={{ padding: '10px', color: '#f59e0b', background: '#fef3c7', borderRadius: '6px', fontSize: '13px' }}>
                            ⚠️ 暂无该平台已审核通过的店铺，请先到 <a href="/merchant/shops" style={{ color: '#4f46e5' }}>店铺管理</a> 绑定店铺。
                        </div>
                    ) : (
                        <select
                            value={data.shopId}
                            onChange={e => handleShopChange(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        >
                            <option value="">请选择店铺...</option>
                            {filteredShops.map(shop => (
                                <option key={shop.id} value={shop.id}>
                                    {shop.shopName} ({shop.accountName})
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#374151' }}>商品链接</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={data.url}
                            onChange={e => onChange({ url: e.target.value })}
                            placeholder="粘贴商品链接/口令"
                            style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                        />
                        <button
                            onClick={handleFetchInfo}
                            style={{ padding: '0 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', color: '#4b5563' }}
                        >
                            获取
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Info */}
            <div style={{ marginBottom: '24px', padding: '20px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <div style={{ width: '100px', height: '100px', background: '#e5e7eb', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {data.mainImage ? <img src={data.mainImage} alt="Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '24px', color: '#9ca3af' }}>📷</span>}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>商品标题</label>
                            <input
                                type="text"
                                value={data.title}
                                onChange={e => onChange({ title: e.target.value })}
                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>搜索关键词</label>
                                <input
                                    type="text"
                                    value={data.keyword}
                                    onChange={e => onChange({ keyword: e.target.value })}
                                    style={{ width: '200px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', marginBottom: '6px' }}>商品价格 (元)</label>
                                <input
                                    type="number"
                                    value={data.goodsPrice}
                                    onChange={e => onChange({ goodsPrice: parseFloat(e.target.value) || 0 })}
                                    style={{ width: '120px', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Count */}
            <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: '#374151' }}>发布任务数量</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => onChange({ count: Math.max(1, data.count - 1) })}
                    >-</button>
                    <input
                        type="number"
                        value={data.count}
                        onChange={e => onChange({ count: parseInt(e.target.value) || 1 })}
                        style={{ width: '80px', textAlign: 'center', padding: '6px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                    <button style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => onChange({ count: data.count + 1 })}
                    >+</button>
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>单</span>
                </div>
            </div>

            {/* Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <button
                    onClick={onNext}
                    disabled={isNextDisabled}
                    style={{
                        background: isNextDisabled ? '#9ca3af' : '#4f46e5',
                        color: '#fff',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: isNextDisabled ? 'not-allowed' : 'pointer',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}
                >
                    下一步
                </button>
            </div>
        </div>
    );
}
