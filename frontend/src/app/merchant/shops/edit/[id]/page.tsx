'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchShops, updateShop, uploadShopScreenshot, getFullImageUrl, Shop } from '../../../../../services/shopService';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Card } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { Select } from '../../../../../components/ui/select';
import { fetchEnabledPlatforms, PlatformData } from '../../../../../services/systemConfigService';
import { getProvinces, getCities, getDistricts } from '../../../../../data/chinaRegions';

interface EditFormData extends Partial<Shop> {
    newScreenshot?: File | null;
}

export default function EditShopPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
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
        // 并行加载店铺信息和启用平台列表
        const [shops, platformList] = await Promise.all([
            fetchShops(),
            fetchEnabledPlatforms()
        ]);

        setPlatforms(platformList);
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

    if (loading) return <div className="flex min-h-[400px] items-center justify-center font-medium text-slate-400">加载中...</div>;

    // 获取当前显示的截图URL（新上传的优先）
    const displayScreenshot = formData.newScreenshot
        ? URL.createObjectURL(formData.newScreenshot)
        : getFullImageUrl(formData.screenshot);

    console.log('Screenshot debug:', {
        originalScreenshot: formData.screenshot,
        displayScreenshot,
        hasNewScreenshot: !!formData.newScreenshot
    });

    return (
        <div className="mx-auto max-w-[800px] space-y-6">
            <h1 className="text-xl font-bold text-slate-900">编辑店铺</h1>

            <Card className="rounded-[24px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="grid gap-6">
                    {/* Platform */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">平台类型</label>
                        <div className="relative">
                            <Select
                                value={formData.platform || 'TAOBAO'}
                                onChange={v => setFormData({ ...formData, platform: v as any })}
                                options={platforms.map(p => ({
                                    value: p.code.toUpperCase(),
                                    label: p.name
                                }))}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />

                        </div>
                    </div>

                    {/* Shop Name & Account */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">店铺名称</label>
                            <Input
                                type="text"
                                placeholder="请输入店铺名称"
                                value={formData.shopName}
                                onChange={e => setFormData({ ...formData, shopName: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">店铺账号</label>
                            <Input
                                type="text"
                                placeholder="请输入店铺账号"
                                value={formData.accountName}
                                onChange={e => setFormData({ ...formData, accountName: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* Contact & Mobile */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">发件人姓名</label>
                            <Input
                                type="text"
                                placeholder="请输入发件人姓名"
                                value={formData.contactName}
                                onChange={e => setFormData({ ...formData, contactName: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">发件人手机</label>
                            <Input
                                type="text"
                                placeholder="请输入手机号"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">店铺链接 (选填)</label>
                        <Input
                            type="text"
                            placeholder="https://"
                            value={formData.url || ''}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <div className="relative">
                                <Select
                                    value={formData.province || ''}
                                    onChange={v => setFormData({ ...formData, province: v, city: '', district: '' })}
                                    placeholder="请选择省份"
                                    options={getProvinces()}
                                    className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <Select
                                    value={formData.city || ''}
                                    onChange={v => setFormData({ ...formData, city: v, district: '' })}
                                    placeholder="请选择城市"
                                    options={formData.province ? getCities(formData.province) : []}
                                    disabled={!formData.province}
                                    className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-50"
                                />
                            </div>
                            <div className="relative">
                                <Select
                                    value={formData.district || ''}
                                    onChange={v => setFormData({ ...formData, district: v })}
                                    placeholder="请选择区县"
                                    options={formData.province && formData.city ? getDistricts(formData.province, formData.city) : []}
                                    disabled={!formData.city}
                                    className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-50"
                                />
                            </div>
                        </div>
                        <Input
                            placeholder="详细地址"
                            value={formData.detailAddress || ''}
                            onChange={e => setFormData({ ...formData, detailAddress: e.target.value })}
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">店铺后台截图 (验证用)</label>
                        <div
                            onClick={() => document.getElementById('screenshot-upload')?.click()}
                            className="cursor-pointer rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:border-primary-400 hover:bg-slate-100 transition-all"
                        >
                            {displayScreenshot ? (
                                <div className="flex flex-col items-center gap-2">
                                    <img
                                        src={displayScreenshot}
                                        alt="店铺截图预览"
                                        className="max-h-[200px] max-w-full rounded-[8px] object-contain shadow-sm"
                                    />
                                    <div className="text-sm font-medium text-emerald-500">
                                        {formData.newScreenshot ? `新截图: ${formData.newScreenshot.name}` : '点击更换截图'}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-2 text-3xl opacity-50">📷</div>
                                    <div className="text-sm font-medium text-slate-500">点击上传店铺后台截图</div>
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
                    <div className="mt-8 flex gap-4 border-t border-slate-50 pt-6">
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className={cn(
                                "h-11 rounded-[16px] bg-primary-600 px-8 text-base font-bold text-white shadow-none transition-all active:scale-95 hover:bg-primary-700",
                                submitting && 'opacity-70'
                            )}
                        >
                            {submitting ? '保存中...' : '保存修改'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="h-11 rounded-[16px] border-none bg-slate-100 px-8 text-base font-bold text-slate-600 shadow-none hover:bg-slate-200"
                        >
                            取消
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
