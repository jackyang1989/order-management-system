"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import {
    create as createAccount,
    sendSmsCode,
    CreateBuyerAccountInput,
} from "../../../services/buyerAccountService";
import { getProvinces, getCities, getDistricts } from "../../../data/chinaRegions";
import { PLATFORM_CONFIG, getPlatformList, PlatformConfig, PlatformImageConfig } from "../../../constants/platformConfig";

// 图片上传组件
function ImageUploader({
    config,
    value,
    onChange,
}: {
    config: PlatformImageConfig;
    value: string;
    onChange: (v: string) => void;
}) {
    const [showExample, setShowExample] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = () => {
                onChange(reader.result as string);
                setUploading(false);
            };
            reader.onerror = () => {
                toastError('图片读取失败');
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch {
            toastError('图片上传失败');
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-xs text-slate-500">
                    {config.label} {config.required && <span className="text-red-500">*</span>}
                </label>
                {config.example && (
                    <button type="button" onClick={() => setShowExample(true)} className="text-xs text-blue-500 hover:underline">
                        查看示例
                    </button>
                )}
            </div>
            <div className="relative">
                {value ? (
                    <div className="relative inline-block">
                        <img src={value} alt={config.label} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-blue-400 hover:text-blue-500">
                        {uploading ? <Spinner size="sm" /> : (<><span className="text-2xl">+</span><span className="text-xs">上传图片</span></>)}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            {showExample && config.example && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExample(false)}>
                    <div className="max-w-sm rounded-lg bg-white p-4" onClick={e => e.stopPropagation()}>
                        <div className="mb-2 text-sm font-medium text-slate-800">示例图片 - {config.label}</div>
                        <div className="flex h-64 items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
                            示例图片加载中...
                        </div>
                        <div className="mt-3 text-center">
                            <button onClick={() => setShowExample(false)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white">关闭</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BindAccountPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);

    // 获取平台列表并使用第一个作为默认值
    const platformList = getPlatformList();
    const defaultPlatformId = platformList[0]?.id || 'taobao';
    const defaultPlatformName = platformList[0]?.name || '淘宝';

    // 当前选中的平台配置
    const [selectedPlatformId, setSelectedPlatformId] = useState(defaultPlatformId);
    const platformConfig = useMemo<PlatformConfig>(() => {
        return PLATFORM_CONFIG[selectedPlatformId] || PLATFORM_CONFIG[defaultPlatformId];
    }, [selectedPlatformId, defaultPlatformId]);

    // 图片状态 (动态key)
    const [images, setImages] = useState<Record<string, string>>({});

    const [form, setForm] = useState<CreateBuyerAccountInput>(() => ({
        platform: defaultPlatformName,
        platformAccount: '',
        loginProvince: '',
        loginCity: '',
        province: '',
        city: '',
        district: '',
        buyerName: '',
        buyerPhone: '',
        fullAddress: '',
        realName: '',
        smsCode: '',
    }));

    const updateForm = useCallback((key: keyof CreateBuyerAccountInput, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateImage = useCallback((key: string, value: string) => {
        setImages(prev => ({ ...prev, [key]: value }));
    }, []);

    // 平台切换时重置部分字段
    const handlePlatformChange = (platformId: string) => {
        setSelectedPlatformId(platformId);
        const config = PLATFORM_CONFIG[platformId];
        if (config) {
            updateForm('platform', config.name);
            // 重置图片
            setImages({});
        }
    };

    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const handleSendSms = async () => {
        if (!form.buyerPhone || form.buyerPhone.length !== 11) {
            toastError('请输入正确的11位手机号');
            return;
        }
        try {
            await sendSmsCode(form.buyerPhone);
            toastSuccess('验证码已发送');
            setSmsCountdown(60);
        } catch (e: any) {
            toastError(e?.message || '发送失败');
        }
    };

    // 动态表单验证
    const validateForm = (): string | null => {
        if (!form.platformAccount) return `请输入${platformConfig.accountLabel}`;
        if (platformConfig.hasLoginLocation && (!form.loginProvince || !form.loginCity)) {
            return '请选择常用登录地';
        }
        if (platformConfig.hasAddress) {
            if (!form.buyerName) return '请输入收货人姓名';
            if (!form.province || !form.city || !form.district) return '请选择收货地址';
            if (!form.fullAddress) return '请输入详细地址';
        }
        if (platformConfig.hasSmsVerification) {
            if (!form.buyerPhone || form.buyerPhone.length !== 11) return '请输入正确的11位手机号';
            if (!form.smsCode || form.smsCode.length < 4) return '请输入验证码';
        }
        if (platformConfig.hasRealName && !form.realName) {
            return '请输入实名认证姓名';
        }
        // 验证必传图片
        for (const img of platformConfig.requiredImages) {
            if (img.required && !images[img.key]) {
                return `请上传${img.label}`;
            }
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) {
            toastError(error);
            return;
        }
        if (error) {
            toastError(error);
            return;
        }

        setSubmitting(true);
        try {
            await createAccount({
                ...form,
                profileImg: images.profileImg,
                creditImg: images.creditImg,
                payAuthImg: images.payAuthImg,
                scoreImg: images.scoreImg,
            });
            toastSuccess('提交成功，等待审核');
            router.push('/profile/buyno');
        } catch (e: any) {
            toastError(e?.message || '提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 地区选项
    const provinces = getProvinces();
    const loginCities = form.loginProvince ? getCities(form.loginProvince) : [];
    const addressCities = form.province ? getCities(form.province) : [];
    const addressDistricts = form.province && form.city ? getDistricts(form.province, form.city) : [];



    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.push('/profile/buyno')} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">绑定买号</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-4 px-4 py-4">
                {/* 动态温馨提示 */}

                {/* 动态温馨提示 */}
                <div className="rounded-lg bg-amber-50 p-3">
                    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-600">
                        ⚠️ 温馨提示 - {platformConfig.name}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                        {platformConfig.tips.map((tip, i) => (
                            <p key={i}>{i + 1}. {tip}</p>
                        ))}
                    </div>
                </div>

                {/* 表单 */}
                <Card className="border-slate-200 p-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 1. 平台选择 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">选择平台 <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                value={selectedPlatformId}
                                onChange={e => handlePlatformChange(e.target.value)}
                            >
                                {platformList.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 2. 账号输入 - 动态Label */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">
                                {platformConfig.accountLabel} <span className="text-red-500">*</span>
                            </label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder={platformConfig.accountPlaceholder}
                                value={form.platformAccount}
                                onChange={e => updateForm('platformAccount', e.target.value)}
                            />
                        </div>

                        {/* 3-4. 常用登录地 - 条件显示 */}
                        {platformConfig.hasLoginLocation && (
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">常用登录地 <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        value={form.loginProvince}
                                        onChange={e => { updateForm('loginProvince', e.target.value); updateForm('loginCity', ''); }}
                                    >
                                        <option value="">选择省份</option>
                                        {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                    <select
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        value={form.loginCity}
                                        onChange={e => updateForm('loginCity', e.target.value)}
                                        disabled={!form.loginProvince}
                                    >
                                        <option value="">选择城市</option>
                                        {loginCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                                <p className="mt-1 text-xs text-slate-400">请选择您账号的常用登录位置</p>
                            </div>
                        )}

                        {/* 收货信息区块 - 条件显示 */}
                        {platformConfig.hasAddress && (
                            <>
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="mb-3 text-sm font-medium text-slate-700">收货信息</div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">收货人姓名 <span className="text-red-500">*</span></label>
                                    <input
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入收货人姓名"
                                        value={form.buyerName}
                                        onChange={e => updateForm('buyerName', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">收货地址 <span className="text-red-500">*</span></label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800" value={form.province}
                                            onChange={e => { updateForm('province', e.target.value); updateForm('city', ''); updateForm('district', ''); }}>
                                            <option value="">省份</option>
                                            {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                        <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800" value={form.city}
                                            onChange={e => { updateForm('city', e.target.value); updateForm('district', ''); }} disabled={!form.province}>
                                            <option value="">城市</option>
                                            {addressCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        <select className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800" value={form.district}
                                            onChange={e => updateForm('district', e.target.value)} disabled={!form.city}>
                                            <option value="">区县</option>
                                            {addressDistricts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">详细地址 <span className="text-red-500">*</span></label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入具体的街道、门牌号等信息" value={form.fullAddress} onChange={e => updateForm('fullAddress', e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* 手机验证 - 条件显示 */}
                        {platformConfig.hasSmsVerification && (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">手机号码 <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                            placeholder="请输入11位手机号" maxLength={11} value={form.buyerPhone}
                                            onChange={e => updateForm('buyerPhone', e.target.value.replace(/\D/g, ''))} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white ${smsCountdown > 0 ? 'bg-slate-400' : 'bg-blue-500'}`}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-red-500">*</span></label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入短信验证码" maxLength={6} value={form.smsCode}
                                        onChange={e => updateForm('smsCode', e.target.value.replace(/\D/g, ''))} />
                                </div>
                            </>
                        )}

                        {/* 实名认证姓名 - 条件显示 */}
                        {platformConfig.hasRealName && (
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">实名认证姓名 <span className="text-red-500">*</span></label>
                                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                    placeholder="请输入实名认证的姓名" value={form.realName} onChange={e => updateForm('realName', e.target.value)} />
                            </div>
                        )}

                        {/* 动态图片上传区 */}
                        {platformConfig.requiredImages.length > 0 && (
                            <>
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="mb-3 text-sm font-medium text-slate-700">
                                        资质截图（{platformConfig.requiredImages.filter(i => i.required).length}张必传）
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {platformConfig.requiredImages.map(imgConfig => (
                                        <ImageUploader
                                            key={imgConfig.key}
                                            config={imgConfig}
                                            value={images[imgConfig.key] || ''}
                                            onChange={v => updateImage(imgConfig.key, v)}
                                        />
                                    ))}
                                </div>
                            </>
                        )}

                        <Button type="submit" loading={submitting} disabled={submitting}
                            className="mt-2 w-full bg-blue-500 py-6 text-base font-medium hover:bg-blue-600">
                            提交申请
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
