"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../../components/ui/button";
import { Card } from "../../../../../components/ui/card";
import { toastError, toastSuccess } from "../../../../../lib/toast";
import { Spinner } from "../../../../../components/ui/spinner";
import {
    getOne,
    update as updateAccount,
    sendSmsCode,
    UpdateBuyerAccountInput,
    BuyerAccount,
} from "../../../../../services/buyerAccountService";
import { getProvinces, getCities, getDistricts } from "../../../../../data/chinaRegions";
import { PLATFORM_CONFIG, PLATFORM_NAME_MAP, PlatformConfig, PlatformImageConfig } from "../../../../../constants/platformConfig";
import { cn } from "../../../../../lib/utils";

// 复用图片上传组件逻辑
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
            <div className="flex items-center gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-500">
                    {config.label} {config.required && <span className="text-danger-400">*</span>}
                </label>
                {config.example && (
                    <button type="button" onClick={() => setShowExample(true)} className="text-xs font-bold text-primary-600 hover:underline">
                        查看示例
                    </button>
                )}
            </div>
            <div className="relative group">
                {value ? (
                    <div className="relative inline-block">
                        <img src={value} alt={config.label} className="h-24 w-24 rounded-2xl border-2 border-slate-100 object-cover shadow-sm transition-all group-hover:border-primary-500/50" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-lg transition-transform active:scale-95"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <label className={cn(
                        "flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 transition-all hover:bg-slate-100 hover:border-primary-400 hover:text-primary-500",
                        uploading && "opacity-50 cursor-not-allowed"
                    )}>
                        {uploading ? <Spinner size="sm" /> : (<><span className="text-2xl mb-1">+</span><span className="text-xs font-bold">上传图片</span></>)}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploading} />
                    </label>
                )}
            </div>
            {showExample && config.example && (
                <div className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/90 backdrop-blur-sm" onClick={() => setShowExample(false)}>
                    <div className="max-w-md rounded-[24px] bg-white p-6" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 text-base font-bold text-slate-900">示例图片 - {config.label}</div>
                        <div className="rounded-xl overflow-hidden bg-slate-100">
                            <img src={config.example} alt={config.label} className="w-full h-auto object-contain" />
                        </div>
                        {config.pathHint && (
                            <div className="mt-4 rounded-xl bg-blue-50 p-3 border border-blue-200">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                    <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-xs font-bold text-blue-800">页面位置</span>
                                </div>
                                <div className="text-xs text-blue-700 whitespace-pre-line leading-relaxed">
                                    {config.pathHint}
                                </div>
                            </div>
                        )}
                        <div className="mt-6 text-center">
                            <button onClick={() => setShowExample(false)} className="w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700">关闭</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function EditBuynoPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [account, setAccount] = useState<BuyerAccount | null>(null);

    // 平台配置
    const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(PLATFORM_CONFIG.taobao);

    // 动态截图配置 (从后端获取)
    const [imageRequirements, setImageRequirements] = useState<PlatformImageConfig[]>([]);

    // 图片状态 (动态key)
    const [images, setImages] = useState<Record<string, string>>({});

    const [form, setForm] = useState<UpdateBuyerAccountInput>({
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
    });

    const updateForm = useCallback((key: keyof UpdateBuyerAccountInput, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateImage = useCallback((key: string, value: string) => {
        setImages(prev => ({ ...prev, [key]: value }));
    }, []);

    useEffect(() => {
        loadAccount();
    }, [resolvedParams.id]);

    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const loadAccount = async () => {
        setLoading(true);
        try {
            const data = await getOne(resolvedParams.id);
            if (!data) {
                toastError('买号不存在');
                router.back();
                return;
            }
            setAccount(data);

            // 确定平台配置
            const platformId = PLATFORM_NAME_MAP[data.platform] || 'taobao';
            const config = PLATFORM_CONFIG[platformId] || PLATFORM_CONFIG.taobao;
            setPlatformConfig(config);

            // 加载动态截图配置
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/platforms/${platformId}/image-requirements`);
                const imgData = await res.json();
                if (imgData.success && imgData.data) {
                    setImageRequirements(imgData.data);
                }
            } catch (err) {
                console.error('加载截图配置失败:', err);
            }

            setForm({
                loginProvince: data.loginProvince || '',
                loginCity: data.loginCity || '',
                province: data.province || '',
                city: data.city || '',
                district: data.district || '',
                buyerName: data.buyerName || '',
                buyerPhone: data.buyerPhone || '',
                fullAddress: data.fullAddress || '',
                realName: data.realName || '',
                smsCode: '',
            });

            // 初始化图片
            setImages({
                profileImg: data.profileImg || '',
                creditImg: data.creditImg || '',
                payAuthImg: data.payAuthImg || '',
                scoreImg: data.scoreImg || '',
            });

        } catch (e: any) {
            toastError(e?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

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

    const validateForm = (): string | null => {
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
        // 验证必传图片 - 使用动态配置
        for (const img of imageRequirements) {
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
        setSubmitting(true);
        try {
            await updateAccount(resolvedParams.id, {
                ...form,
                profileImg: images.profileImg,
                creditImg: images.creditImg,
                payAuthImg: images.payAuthImg,
                scoreImg: images.scoreImg,
            });
            toastSuccess('更新成功');
            router.push('/profile/buyer-accounts');
        } catch (e: any) {
            toastError(e?.message || '更新失败');
        } finally {
            setSubmitting(false);
        }
    };

    const provinces = getProvinces();
    const loginCities = form.loginProvince ? getCities(form.loginProvince) : [];
    const addressCities = form.province ? getCities(form.province) : [];
    const addressDistricts = form.province && form.city ? getDistricts(form.province, form.city) : [];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">编辑买号</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-4 px-4 py-4">
                {/* 账号信息 (不可编辑) */}
                <Card className="border-slate-200 p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">{platformConfig.accountLabel}</span>
                        <span className="font-medium text-slate-800">{account?.platformAccount}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">平台</span>
                        <span className="text-slate-600">{account?.platform}</span>
                    </div>
                </Card>

                {/* 动态温馨提示 */}
                <div className="rounded-lg bg-amber-50 p-3">
                    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-warning-500">
                        ⚠️ 温馨提示 - {platformConfig.name}
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                        {platformConfig.tips.map((tip, i) => (
                            <p key={i}>{i + 1}. {tip}</p>
                        ))}
                    </div>
                </div>

                {/* 编辑表单 */}
                <Card className="border-slate-200 p-5">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 常用登录地 */}
                        {platformConfig.hasLoginLocation && (
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">常用登录地 <span className="text-danger-400">*</span></label>
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
                            </div>
                        )}

                        {/* 收货信息区块 */}
                        {platformConfig.hasAddress && (
                            <>
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="mb-3 text-sm font-medium text-slate-700">收货信息</div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">收货人姓名 <span className="text-danger-400">*</span></label>
                                    <input
                                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入收货人姓名"
                                        value={form.buyerName}
                                        onChange={e => updateForm('buyerName', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">收货地址 <span className="text-danger-400">*</span></label>
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
                                    <label className="mb-1 block text-xs text-slate-500">详细地址 <span className="text-danger-400">*</span></label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入详细地址" value={form.fullAddress} onChange={e => updateForm('fullAddress', e.target.value)} />
                                </div>
                            </>
                        )}

                        {/* 手机验证 */}
                        {platformConfig.hasSmsVerification && (
                            <>
                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">手机号码 <span className="text-danger-400">*</span></label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                            placeholder="请输入11位手机号" maxLength={11} value={form.buyerPhone}
                                            onChange={e => updateForm('buyerPhone', e.target.value.replace(/\D/g, ''))} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white ${smsCountdown > 0 ? 'bg-slate-400' : 'bg-primary-500'}`}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-danger-400">*</span></label>
                                    <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                        placeholder="请输入短信验证码" maxLength={6} value={form.smsCode}
                                        onChange={e => updateForm('smsCode', e.target.value.replace(/\D/g, ''))} />
                                </div>
                            </>
                        )}

                        {/* 实名认证姓名 */}
                        {platformConfig.hasRealName && (
                            <div>
                                <label className="mb-1 block text-xs text-slate-500">实名认证姓名 <span className="text-danger-400">*</span></label>
                                <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                    placeholder="请输入实名认证的姓名" value={form.realName} onChange={e => updateForm('realName', e.target.value)} />
                            </div>
                        )}

                        {/* 动态图片上传区 */}
                        {imageRequirements.length > 0 && (
                            <>
                                <div className="border-t border-slate-200 pt-4">
                                    <div className="mb-3 text-sm font-medium text-slate-700">
                                        资质截图（{imageRequirements.filter(i => i.required).length}张必传）
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {imageRequirements.map(imgConfig => (
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
                            className="mt-2 w-full bg-primary-500 py-6 text-base font-medium hover:bg-primary-600">
                            保存修改
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
