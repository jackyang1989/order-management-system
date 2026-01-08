'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createShop } from '../../../../services/shopService';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { fetchSystemConfig, getEnabledPlatforms } from '../../../../services/systemConfigService';

// 平台ID到platformCode的映射
const PLATFORM_ID_TO_CODE: Record<string, string> = {
    'taobao': 'TAOBAO',
    'tmall': 'TMALL',
    'jd': 'JD',
    'pdd': 'PDD',
    'douyin': 'DOUYIN',
    'kuaishou': 'KUAISHOU',
};

// 平台ID到中文名的映射
const PLATFORM_ID_TO_NAME: Record<string, string> = {
    'taobao': '淘宝',
    'tmall': '天猫',
    'jd': '京东',
    'pdd': '拼多多',
    'douyin': '抖音',
    'kuaishou': '快手',
};

export default function NewShopPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [enabledPlatformIds, setEnabledPlatformIds] = useState<string[]>(['taobao']);
    const [formData, setFormData] = useState({ platform: 'TAOBAO', shopName: '', accountName: '', contactName: '', mobile: '', url: '', province: '', city: '', district: '', detailAddress: '', screenshot: null as File | null });
    const [mobileError, setMobileError] = useState('');

    // 加载启用的平台列表
    useEffect(() => {
        const loadEnabledPlatforms = async () => {
            const config = await fetchSystemConfig();
            const enabled = getEnabledPlatforms(config);
            setEnabledPlatformIds(enabled);
            // 如果当前平台不在启用列表中，切换到第一个启用的平台
            const currentPlatformId = Object.entries(PLATFORM_ID_TO_CODE).find(([_, code]) => code === formData.platform)?.[0];
            if (currentPlatformId && !enabled.includes(currentPlatformId) && enabled.length > 0) {
                setFormData(prev => ({ ...prev, platform: PLATFORM_ID_TO_CODE[enabled[0]] || 'TAOBAO' }));
            }
        };
        loadEnabledPlatforms();
    }, []);

    // 根据启用平台生成选项
    const platformOptions = useMemo(() => {
        return enabledPlatformIds
            .filter(id => PLATFORM_ID_TO_CODE[id])
            .map(id => ({
                value: PLATFORM_ID_TO_CODE[id],
                label: PLATFORM_ID_TO_NAME[id] || id,
            }));
    }, [enabledPlatformIds]);

    const validateMobile = (mobile: string) => {
        const mobileRegex = /^1[3-9]\d{9}$/;
        if (!mobile) { setMobileError(''); return true; }
        if (!mobileRegex.test(mobile)) { setMobileError('请输入有效的11位手机号'); return false; }
        setMobileError(''); return true;
    };

    const handleSubmit = async () => {
        if (!formData.shopName || !formData.accountName || !formData.contactName || !formData.mobile) { alert('请完善店铺基本信息'); return; }
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
                            {mobileError && <div className="mt-1 text-xs text-red-500">{mobileError}</div>}
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className="mb-2 block font-medium">店铺链接 (选填)</label>
                        <Input type="text" placeholder="https://" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="mb-2 block font-medium">发货地址</label>
                        <div className="mb-3 grid grid-cols-3 gap-3">
                            <Input placeholder="省" value={formData.province} onChange={e => setFormData({ ...formData, province: e.target.value })} />
                            <Input placeholder="市" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            <Input placeholder="区" value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} />
                        </div>
                        <Input placeholder="详细地址" value={formData.detailAddress} onChange={e => setFormData({ ...formData, detailAddress: e.target.value })} />
                    </div>

                    {/* Screenshot Upload */}
                    <div>
                        <label className="mb-2 block font-medium">店铺后台截图 (验证用)</label>
                        <div onClick={() => document.getElementById('screenshot-upload')?.click()} className="cursor-pointer rounded border border-dashed border-slate-300 bg-slate-50 p-5 text-center hover:border-slate-400">
                            {formData.screenshot ? (
                                <div className="text-sm text-green-500">已选择: {formData.screenshot.name}</div>
                            ) : (
                                <>
                                    <div className="mb-2 text-2xl text-slate-400">📷</div>
                                    <div className="text-sm text-slate-500">点击上传店铺后台截图</div>
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
