'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createShop } from '../../../../services/shopService';

export default function NewShopPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
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

    const [mobileError, setMobileError] = useState('');

    const validateMobile = (mobile: string) => {
        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobile) {
            setMobileError('');
            return true;
        }
        if (!mobileRegex.test(mobile)) {
            setMobileError('请输入有效的11位手机号');
            return false;
        }
        setMobileError('');
        return true;
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile) {
            alert('请完善店铺基本信息');
            return;
        }
        if (!validateMobile(formData.mobile)) {
            alert('请输入有效的11位手机号');
            return;
        }
        setSubmitting(true);
        const res = await createShop(formData as any);
        setSubmitting(false);

        if (res.success) {
            alert('绑定申请已提交，请等待审核');
            router.push('/merchant/shops');
        } else {
            alert(res.message);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '500', marginBottom: '24px' }}>绑定新店铺</h1>

            <div style={{ background: '#fff', padding: '32px', borderRadius: '8px' }}>
                <div style={{ display: 'grid', gap: '24px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>平台类型</label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
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
                                onChange={(e) => {
                                    setFormData({ ...formData, mobile: e.target.value });
                                    validateMobile(e.target.value);
                                }}
                                onBlur={(e) => validateMobile(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: mobileError ? '1px solid #ff4d4f' : '1px solid #d9d9d9'
                                }}
                                maxLength={11}
                            />
                            {mobileError && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                                    {mobileError}
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>店铺链接 (选填)</label>
                        <input
                            type="text"
                            placeholder="https://"
                            value={formData.url}
                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>发货地址</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                            <input placeholder="省" value={formData.province} onChange={(e) => setFormData({ ...formData, province: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                            <input placeholder="市" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                            <input placeholder="区" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} style={{ padding: '10px', border: '1px solid #d9d9d9', borderRadius: '4px' }} />
                        </div>
                        <input
                            placeholder="详细地址"
                            value={formData.detailAddress}
                            onChange={(e) => setFormData({ ...formData, detailAddress: e.target.value })}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #d9d9d9' }}
                        />
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>店铺后台截图 (验证用)</label>
                        <div style={{ border: '1px dashed #d9d9d9', padding: '20px', borderRadius: '4px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }} onClick={() => document.getElementById('screenshot-upload')?.click()}>
                            {(formData as any).screenshot ? (
                                <div style={{ fontSize: '14px', color: '#10b981' }}>已选择: {(formData as any).screenshot.name}</div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '24px', color: '#999', marginBottom: '8px' }}>📷</div>
                                    <div style={{ fontSize: '14px', color: '#666' }}>点击上传店铺后台截图</div>
                                </>
                            )}
                            <input
                                id="screenshot-upload"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setFormData({ ...formData, screenshot: e.target.files[0] } as any);
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                        <button
                            onClick={async () => {
                                if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile) {
                                    alert('请完善店铺基本信息');
                                    return;
                                }
                                if (!validateMobile(formData.mobile)) {
                                    alert('请输入有效的11位手机号');
                                    return;
                                }

                                setSubmitting(true);
                                const data = new FormData();
                                Object.keys(formData).forEach(key => {
                                    data.append(key, (formData as any)[key]);
                                });

                                const res = await createShop(data);
                                setSubmitting(false);

                                if (res.success) {
                                    alert('绑定申请已提交，请等待审核');
                                    router.push('/merchant/shops');
                                } else {
                                    alert(res.message);
                                }
                            }}
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
                            {submitting ? '提交中...' : '提交申请'}
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
