'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createShop, uploadShopScreenshot } from '../../../../services/shopService';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { fetchEnabledPlatforms, PlatformData } from '../../../../services/systemConfigService';
import { getProvinces, getCities, getDistricts } from '../../../../data/chinaRegions';

export default function NewShopPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [platforms, setPlatforms] = useState<PlatformData[]>([]);
    const [formData, setFormData] = useState({ platform: '', shopName: '', accountName: '', contactName: '', mobile: '', url: '', province: '', city: '', district: '', detailAddress: '', screenshot: null as File | null });
    const [mobileError, setMobileError] = useState('');

    // 加载启用的平台列表
    useEffect(() => {
        const loadPlatforms = async () => {
            const platformList = await fetchEnabledPlatforms();
            setPlatforms(platformList);
            // 设置默认平台为第一个
            if (platformList.length > 0 && !formData.platform) {
                setFormData(prev => ({ ...prev, platform: platformList[0].code.toUpperCase() }));
            }
        };
        loadPlatforms();
    }, []);

    // 根据启用平台生成选项
    const platformOptions = useMemo(() => {
        return platforms.map(p => ({
            value: p.code.toUpperCase(),
            label: p.name,
        }));
    }, [platforms]);

    const validateMobile = (mobile: string) => {
        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobile) { setMobileError(''); return true; }
        if (!mobileRegex.test(mobile)) { setMobileError('请输入有效的11位手机号'); return false; }
        setMobileError(''); return true;
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile || !formData.url) { alert('请完善店铺基本信息'); return; }
        if (!validateMobile(formData.mobile)) { alert('请输入有效的11位手机号'); return; }
        setSubmitting(true);

        // 准备提交数据
        const { screenshot, ...jsonData } = formData;
        let screenshotUrl = '';

        // 如果有截图，先上传
        if (screenshot) {
            const uploadRes = await uploadShopScreenshot(screenshot);
            if (!uploadRes.success) {
                alert('截图上传失败：' + uploadRes.message);
                setSubmitting(false);
                return;
            }
            screenshotUrl = uploadRes.url || '';
        }

        // 提交店铺信息
        const res = await createShop({ ...jsonData, screenshot: screenshotUrl || undefined });
        setSubmitting(false);
        if (res.success) { alert('绑定申请已提交，请等待审核'); router.push('/merchant/shops'); } else alert(res.message);
    };

    return (
        <div className="mx-auto max-w-[800px] space-y-6">
            <h1 className="text-xl font-bold text-slate-900">绑定新店铺</h1>

            <Card className="rounded-[24px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="grid gap-6">
                    {/* Platform */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">平台类型</label>
                        <Select value={formData.platform} onChange={v => setFormData({ ...formData, platform: v })} options={platformOptions} className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none" />
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
                                maxLength={11}
                                onChange={e => { setFormData({ ...formData, mobile: e.target.value }); validateMobile(e.target.value); }}
                                onBlur={e => validateMobile(e.target.value)}
                                className={cn("h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none", mobileError && 'bg-red-50 text-danger-500')}
                            />
                            {mobileError && <div className="mt-1 text-xs font-bold text-danger-400">{mobileError}</div>}
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">店铺链接</label>
                        <Input
                            type="text"
                            placeholder="https://"
                            value={formData.url}
                            onChange={e => setFormData({ ...formData, url: e.target.value })}
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Select
                                value={formData.province}
                                onChange={v => setFormData({ ...formData, province: v, city: '', district: '' })}
                                placeholder="请选择省份"
                                options={getProvinces()}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                            />
                            <Select
                                value={formData.city}
                                onChange={v => setFormData({ ...formData, city: v, district: '' })}
                                placeholder="请选择城市"
                                options={formData.province ? getCities(formData.province) : []}
                                disabled={!formData.province}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-50"
                            />
                            <Select
                                value={formData.district}
                                onChange={v => setFormData({ ...formData, district: v })}
                                placeholder="请选择区县"
                                options={formData.province && formData.city ? getDistricts(formData.province, formData.city) : []}
                                disabled={!formData.city}
                                className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none disabled:opacity-50"
                            />
                        </div>
                        <Input
                            placeholder="详细地址"
                            value={formData.detailAddress}
                            onChange={e => setFormData({ ...formData, detailAddress: e.target.value })}
                            className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none"
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="mb-2 block text-sm font-bold text-slate-700">店铺后台截图 (验证用)</label>
                        <div onClick={() => document.getElementById('screenshot-upload')?.click()} className="cursor-pointer rounded-[16px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:border-primary-400 hover:bg-slate-100 transition-all">
                            {formData.screenshot ? (
                                <div className="flex flex-col items-center gap-2">
                                    <img
                                        src={URL.createObjectURL(formData.screenshot)}
                                        alt="店铺截图预览"
                                        className="max-h-[200px] max-w-full rounded-[8px] object-contain shadow-sm"
                                    />
                                    <div className="text-sm font-medium text-emerald-500">已选择: {formData.screenshot.name}</div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-2 text-3xl opacity-50">📷</div>
                                    <div className="text-sm font-medium text-slate-500">点击上传店铺后台截图</div>
                                </>
                            )}
                            <input id="screenshot-upload" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFormData({ ...formData, screenshot: e.target.files[0] }); }} />
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
                            {submitting ? '提交中...' : '提交申请'}
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
