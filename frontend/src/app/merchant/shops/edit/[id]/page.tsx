'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, updateShop, uploadShopScreenshot, Shop } from '../../../../../services/shopService';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Select } from '../../../../../components/ui/select';
import { getProvinces, getCities, getDistricts } from '../../../../../data/chinaRegions';

interface EditFormData extends Partial<Shop> {
    newScreenshot?: File | null;
}

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState<EditFormData>({
        platform: 'TAOBAO',
        shopName: '',
        accountName: '',
        contactName: '',
        mobile: '',
        url: '',
        province: '',
        city: '',
        district: '',
        detailAddress: '',
        screenshot: '',
        newScreenshot: null,
    });

    useEffect(() => { loadShop(); }, [id]);

    const loadShop = async () => {
        const shops = await fetchShops();
        const shop = shops.find(s => s.id === id);
        if (shop) {
            setFormData({ ...shop, newScreenshot: null });
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

        // 准备提交数据
        const { newScreenshot, ...shopData } = formData;
        let screenshotUrl = shopData.screenshot || '';

        // 如果有新截图，先上传
        if (newScreenshot) {
            const uploadRes = await uploadShopScreenshot(newScreenshot);
            if (!uploadRes.success) {
                alert('截图上传失败：' + uploadRes.message);
                setSubmitting(false);
                return;
            }
            screenshotUrl = uploadRes.url || '';
        }

        // 提交店铺信息
        const res = await updateShop(id, { ...shopData, screenshot: screenshotUrl || undefined });
        setSubmitting(false);
        if (res.success) {
            alert('店铺信息已更新');
            router.push('/merchant/shops');
        } else {
            alert(res.message);
        }
    };

    if (loading) return <div className="py-10 text-center text-[#6b7280]">加载中...</div>;

    // 获取当前显示的截图URL（新上传的优先）
    const displayScreenshot = formData.newScreenshot
        ? URL.createObjectURL(formData.newScreenshot)
        : formData.screenshot;

    return (
        <div className="mx-auto max-w-[800px] space-y-6 p-6">
            <h1 className="text-2xl font-medium">编辑店铺</h1>

            <Card className="bg-white p-8">
                <div className="grid gap-6">
                    {/* Platform */}
                    <div>
                        <label className="mb-2 block font-medium">平台类型</label>
                        <Select
                            value={formData.platform || 'TAOBAO'}
                            onChange={v => setFormData({ ...formData, platform: v as any })}
                            options={[
                                { value: 'TAOBAO', label: '淘宝' },
                                { value: 'TMALL', label: '天猫' },
                                { value: 'JD', label: '京东' },
                                { value: 'PDD', label: '拼多多' },
                                { value: 'DOUYIN', label: '抖音' },
                            ]}
                        />
                    </div>

                    {/* Shop Name & Account */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block font-medium">店铺名称</label>
                            <Input
                                type="text"
                                placeholder="请输入店铺名称"
                                value={formData.shopName}
                                onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">店铺账号</label>
                            <Input
                                type="text"
                                placeholder="请输入店铺账号"
                                value={formData.accountName}
                                onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Contact & Mobile */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block font-medium">发件人姓名</label>
                            <Input
                                type="text"
                                placeholder="请输入发件人姓名"
                                value={formData.contactName}
                                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">发件人手机</label>
                            <Input
                                type="text"
                                placeholder="请输入手机号"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block font-medium">店铺链接 (选填)</label>
                        <Input
                            type="text"
                            placeholder="https://"
                            value={formData.url || ''}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block font-medium">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Select
                                value={formData.province || ''}
                                onChange={v => setFormData({ ...formData, province: v, city: '', district: '' })}
                                placeholder="请选择省份"
                                options={getProvinces()}
                            />
                            <Select
                                value={formData.city || ''}
                                onChange={v => setFormData({ ...formData, city: v, district: '' })}
                                placeholder="请选择城市"
                                options={formData.province ? getCities(formData.province) : []}
                                disabled={!formData.province}
                            />
                            <Select
                                value={formData.district || ''}
                                onChange={v => setFormData({ ...formData, district: v })}
                                placeholder="请选择区县"
                                options={formData.province && formData.city ? getDistricts(formData.province, formData.city) : []}
                                disabled={!formData.city}
                            />
                        </div>
                        <Input
                            placeholder="详细地址"
                            value={formData.detailAddress || ''}
                            onChange={e => setFormData({ ...formData, detailAddress: e.target.value })}
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="mb-2 block font-medium">店铺后台截图 (验证用)</label>
                        <div
                            onClick={() => document.getElementById('screenshot-upload')?.click()}
                            className="cursor-pointer rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] p-5 text-center hover:border-[#9ca3af]"
                        >
                            {displayScreenshot ? (
                                <div className="flex flex-col items-center gap-2">
                                    <img
                                        src={displayScreenshot}
                                        alt="店铺截图预览"
                                        className="max-h-[200px] max-w-full rounded object-contain"
                                    />
                                    <div className="text-sm text-[#10b981]">
                                        {formData.newScreenshot ? `新截图: ${formData.newScreenshot.name}` : '点击更换截图'}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-2 text-2xl text-[#9ca3af]">📷</div>
                                    <div className="text-sm text-[#6b7280]">点击上传店铺后台截图</div>
                                </>
                            )}
                            <input
                                id="screenshot-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => {
                                    if (e.target.files?.[0]) {
                                        setFormData({ ...formData, newScreenshot: e.target.files[0] });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex gap-4">
                        <Button onClick={handleSubmit} disabled={submitting} className={cn(submitting && 'opacity-70')}>
                            {submitting ? '保存中...' : '保存修改'}
                        </Button>
                        <Button variant="secondary" onClick={() => router.back()}>取消</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
