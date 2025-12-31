'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, updateShop, Shop } from '../../../../../services/shopService';

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Shop>>({
        platform: 'TAOBAO',
        shopName: '',
        accountName: '',
        contactName: '',
        mobile: '',
        url: '',
        province: '',
        city: '',
        district: '',
        detailAddress: ''
    });

    useEffect(() => {
        loadShop();
    }, [id]);

    const loadShop = async () => {
        const shops = await fetchShops();
        const shop = shops.find(s => s.id === id);
        if (shop) {
            setFormData(shop);
        } else {
            alert('店铺不存在');
            router.push('/merchant/shops');
        }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile) {
            alert('请完善店铺基本信息');
            return;
        }
        setSubmitting(true);
        const res = await updateShop(id, formData);
        setSubmitting(false);

        if (res.success) {
            alert('店铺信息已更新');
            router.push('/merchant/shops');
        } else {
            alert(res.message);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '24px' }}>编辑店铺</h1>

            <div style={{ background: '#fff', padding: '32px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>平台类型</label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value as any })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                        >
                            <option value="TAOBAO">淘宝</option>
                            <option value="TMALL">天猫</option>
                            <option value="JD">京东</option>
                            <option value="PDD">拼多多</option>
                            <option value="DOUYIN">抖音</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>店铺名称</label>
                            <input
                                type="text"
                                placeholder="请输入店铺名称"
                                value={formData.shopName}
                                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>旺旺/账号名</label>
                            <input
                                type="text"
                                placeholder="请输入主旺旺号"
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>发件人姓名</label>
                            <input
                                type="text"
                                placeholder="请输入发件人姓名"
                                value={formData.contactName}
                                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>发件人手机</label>
                            <input
                                type="text"
                                placeholder="请输入手机号"
                                value={formData.mobile}
                                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>店铺链接 (选填)</label>
                        <input
                            type="text"
                            placeholder="https://"
                            value={formData.url || ''}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>发货地址</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <input placeholder="省" value={formData.province || ''} onChange={(e) => setFormData({ ...formData, province: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                            <input placeholder="市" value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                            <input placeholder="区" value={formData.district || ''} onChange={(e) => setFormData({ ...formData, district: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                        </div>
                        <input
                            placeholder="详细地址"
                            value={formData.detailAddress || ''}
                            onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                        />
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                padding: '12px 32px',
                                background: '#1890ff',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? '保存中...' : '保存修改'}
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
                                fontSize: '16px'
                            }}
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
