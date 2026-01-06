'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, updateShop, Shop } from '../../../../../services/shopService';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Select } from '../../../../../components/ui/select';

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<Partial<Shop>>({ platform: 'TAOBAO', shopName: '', accountName: '', contactName: '', mobile: '', url: '', province: '', city: '', district: '', detailAddress: '' });

    useEffect(() => { loadShop(); }, [id]);

    const loadShop = async () => {
        const shops = await fetchShops();
        const shop = shops.find(s => s.id === id);
        if (shop) setFormData(shop); else { alert('店铺不存在'); router.push('/merchant/shops'); }
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile) { alert('请完善店铺基本信息'); return; }
        setSubmitting(true);
        const res = await updateShop(id, formData);
        setSubmitting(false);
        if (res.success) { alert('店铺信息已更新'); router.push('/merchant/shops'); } else alert(res.message);
    };

    if (loading) return <div className="py-10 text-center text-slate-500">加载中...</div>;

    return (
        <div className="mx-auto max-w-[800px] space-y-6 p-6">
            <h1 className="text-2xl font-medium">编辑店铺</h1>

            <Card className="bg-white p-8">
                <div className="grid gap-6">
                    {/* Platform */}
                    <div>
                        <label className="mb-2 block font-medium">平台类型</label>
                        <Select value={formData.platform || 'TAOBAO'} onChange={v => setFormData({ ...formData, platform: v as any })} options={[{ value: 'TAOBAO', label: '淘宝' }, { value: 'TMALL', label: '天猫' }, { value: 'JD', label: '京东' }, { value: 'PDD', label: '拼多多' }, { value: 'DOUYIN', label: '抖音' }]} />
                    </div>

                    {/* Shop Name & Account */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block font-medium">店铺名称</label>
                            <Input type="text" placeholder="请输入店铺名称" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">旺旺/账号名</label>
                            <Input type="text" placeholder="请输入主旺旺号" value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
                        </div>
                    </div>

                    {/* Contact & Mobile */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block font-medium">发件人姓名</label>
                            <Input type="text" placeholder="请输入发件人姓名" value={formData.contactName} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">发件人手机</label>
                            <Input type="text" placeholder="请输入手机号" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block font-medium">店铺链接 (选填)</label>
                        <Input type="text" placeholder="https://" value={formData.url || ''} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block font-medium">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Input placeholder="省" value={formData.province || ''} onChange={e => setFormData({ ...formData, province: e.target.value })} />
                            <Input placeholder="市" value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            <Input placeholder="区" value={formData.district || ''} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                        </div>
                        <Input placeholder="详细地址" value={formData.detailAddress || ''} onChange={e => setFormData({ ...formData, detailAddress: e.target.value })} />
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex gap-4">
                        <Button onClick={handleSubmit} disabled={submitting} className={cn(submitting && 'opacity-70')}>{submitting ? '保存中...' : '保存修改'}</Button>
                        <Button variant="secondary" onClick={() => router.back()}>取消</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
