'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createShop } from '../../../../services/shopService';
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
        const data = new FormData();
        Object.keys(formData).forEach(key => { const val = (formData as any)[key]; if (val !== null) data.append(key, val); });
        const res = await createShop(data);
        setSubmitting(false);
        if (res.success) { alert('绑定申请已提交，请等待审核'); router.push('/merchant/shops'); } else alert(res.message);
    };

    return (
        <div className="mx-auto max-w-[800px] space-y-6 p-6">
            <h1 className="text-2xl font-medium">绑定新店铺</h1>

            <Card className="bg-white p-8">
                <div className="grid gap-6">
                    {/* Platform */}
                    <div>
                        <label className="mb-2 block font-medium">平台类型</label>
                        <Select value={formData.platform} onChange={v => setFormData({ ...formData, platform: v })} options={platformOptions} />
                    </div>

                    {/* Shop Name & Account */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="mb-2 block font-medium">店铺名称</label>
                            <Input type="text" placeholder="请输入店铺名称" value={formData.shopName} onChange={e => setFormData({ ...formData, shopName: e.target.value })} />
                        </div>
                        <div>
                            <label className="mb-2 block font-medium">店铺账号</label>
                            <Input type="text" placeholder="请输入店铺账号" value={formData.accountName} onChange={e => setFormData({ ...formData, accountName: e.target.value })} />
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
                            <Input type="text" placeholder="请输入手机号" value={formData.mobile} maxLength={11} onChange={e => { setFormData({ ...formData, mobile: e.target.value }); validateMobile(e.target.value); }} onBlur={e => validateMobile(e.target.value)} className={cn(mobileError && 'border-red-500')} />
                            {mobileError && <div className="mt-1 text-xs text-danger-400">{mobileError}</div>}
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block font-medium">店铺链接</label>
                        <Input type="text" placeholder="https://" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block font-medium">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Select
                                value={formData.province}
                                onChange={v => setFormData({ ...formData, province: v, city: '', district: '' })}
                                placeholder="请选择省份"
                                options={getProvinces()}
                            />
                            <Select
                                value={formData.city}
                                onChange={v => setFormData({ ...formData, city: v, district: '' })}
                                placeholder="请选择城市"
                                options={formData.province ? getCities(formData.province) : []}
                                disabled={!formData.province}
                            />
                            <Select
                                value={formData.district}
                                onChange={v => setFormData({ ...formData, district: v })}
                                placeholder="请选择区县"
                                options={formData.province && formData.city ? getDistricts(formData.province, formData.city) : []}
                                disabled={!formData.city}
                            />
                        </div>
                        <Input placeholder="详细地址" value={formData.detailAddress} onChange={e => setFormData({ ...formData, detailAddress: e.target.value })} />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="mb-2 block font-medium">店铺后台截图 (验证用)</label>
                        <div onClick={() => document.getElementById('screenshot-upload')?.click()} className="cursor-pointer rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] p-5 text-center hover:border-[#9ca3af]">
                            {formData.screenshot ? (
                                <div className="text-sm text-success-400">已选择: {formData.screenshot.name}</div>
                            ) : (
                                <>
                                    <div className="mb-2 text-2xl text-[#9ca3af]">📷</div>
                                    <div className="text-sm text-[#6b7280]">点击上传店铺后台截图</div>
                                </>
                            )}
                            <input id="screenshot-upload" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) setFormData({ ...formData, screenshot: e.target.files[0] }); }} />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex gap-4">
                        <Button onClick={handleSubmit} disabled={submitting} className={cn(submitting && 'opacity-70')}>{submitting ? '提交中...' : '提交申请'}</Button>
                        <Button variant="secondary" onClick={() => router.back()}>取消</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
