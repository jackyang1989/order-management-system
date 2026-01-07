"use client";

import { useEffect, useState, useCallback, use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../../../lib/utils";
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

// 图片上传组件 (复用扁平化设计)
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
        <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {config.label} {config.required && <span className="text-red-500">*</span>}
                </label>
                {config.example && (
                    <button type="button" onClick={() => setShowExample(true)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700">
                        查看示例
                    </button>
                )}
            </div>
            <div className="relative">
                {value ? (
                    <div className="relative inline-block">
                        <img src={value} alt={config.label} className="h-28 w-28 rounded-[20px] border-none object-cover shadow-lg" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white shadow-xl transition active:scale-90"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-[20px] bg-slate-50 text-slate-300 transition-all hover:bg-slate-100 active:scale-95 border-2 border-dashed border-slate-200">
                        {uploading ? <Spinner size="sm" /> : (<><span className="text-3xl font-light mb-1">+</span><span className="text-[10px] font-bold">上传</span></>)}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            {showExample && config.example && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6" onClick={() => setShowExample(false)}>
                    <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-black text-slate-900">示例图片</h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{config.label}</p>
                        </div>
                        <div className="overflow-hidden rounded-[24px] bg-slate-50 aspect-square flex items-center justify-center text-[10px] font-bold text-slate-400 shadow-inner italic">
                            示例图片加载中...
                        </div>
                        <button onClick={() => setShowExample(false)} className="mt-8 w-full rounded-[20px] bg-blue-600 py-4 text-sm font-black text-white shadow-lg transition active:scale-95">关闭预览</button>
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
        if (platformConfig.hasLoginLocation && (!form.loginProvince || !form.loginCity)) return '请选择常用登录地';
        if (platformConfig.hasAddress) {
            if (!form.buyerName) return '请输入收货人姓名';
            if (!form.province || !form.city || !form.district) return '请选择收货地址';
            if (!form.fullAddress) return '请输入详细地址';
        }
        if (platformConfig.hasSmsVerification) {
            if (!form.buyerPhone || form.buyerPhone.length !== 11) return '请输入正确的11位手机号';
            if (!form.smsCode || form.smsCode.length < 4) return '请输入验证码';
        }
        if (platformConfig.hasRealName && !form.realName) return '请输入实名认证姓名';
        for (const img of platformConfig.requiredImages) {
            if (img.required && !images[img.key]) return `请上传${img.label}`;
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) { toastError(error); return; }
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
            router.push('/profile/buyno');
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

    const InputLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
        <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
            {children} {required && <span className="text-red-500">*</span>}
        </label>
    );

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">编辑买号</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Fixed Account Info */}
                <div className="rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{platformConfig.accountLabel}</div>
                            <div className="text-lg font-black text-slate-900 tracking-tight">{account?.platformAccount}</div>
                        </div>
                        <div className="rounded-full bg-slate-50 px-4 py-1.5 text-[10px] font-bold text-slate-400 italic">
                            {account?.platform}
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="rounded-[24px] bg-amber-50 p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-900">
                        <span>⚠️</span> 温馨提示 - {platformConfig.name}
                    </div>
                    <div className="space-y-2 text-[10px] font-bold leading-relaxed text-amber-700/80">
                        {platformConfig.tips.map((tip, i) => <p key={i}>{i + 1}. {tip}</p>)}
                    </div>
                </div>

                <Card className="rounded-[28px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* 1. Login Location */}
                        {platformConfig.hasLoginLocation && (
                            <div className="space-y-2">
                                <InputLabel required>常用登录地</InputLabel>
                                <div className="grid grid-cols-2 gap-3">
                                    <select className="rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-bold text-slate-900 focus:outline-none shadow-inner border-none"
                                        value={form.loginProvince} onChange={e => { updateForm('loginProvince', e.target.value); updateForm('loginCity', ''); }}>
                                        <option value="">选择省份</option>
                                        {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                    </select>
                                    <select className="rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-bold text-slate-900 focus:outline-none shadow-inner border-none"
                                        value={form.loginCity} onChange={e => updateForm('loginCity', e.target.value)} disabled={!form.loginProvince}>
                                        <option value="">选择城市</option>
                                        {loginCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Shipping Info */}
                        {platformConfig.hasAddress && (
                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                <div className="text-xs font-black text-slate-900 px-1">收货信息</div>
                                <div className="space-y-2">
                                    <InputLabel required>收货人姓名</InputLabel>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner"
                                        placeholder="请输入收货人姓名" value={form.buyerName} onChange={e => updateForm('buyerName', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <InputLabel required>收货地址</InputLabel>
                                    <div className="grid grid-cols-3 gap-2">
                                        <select className="rounded-[20px] bg-slate-50 px-3 py-4 text-[10px] font-bold text-slate-900 focus:outline-none shadow-inner border-none" value={form.province}
                                            onChange={e => { updateForm('province', e.target.value); updateForm('city', ''); updateForm('district', ''); }}>
                                            <option value="">省份</option>
                                            {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                        </select>
                                        <select className="rounded-[20px] bg-slate-50 px-3 py-4 text-[10px] font-bold text-slate-900 focus:outline-none shadow-inner border-none" value={form.city}
                                            onChange={e => { updateForm('city', e.target.value); updateForm('district', ''); }} disabled={!form.province}>
                                            <option value="">城市</option>
                                            {addressCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                        <select className="rounded-[20px] bg-slate-50 px-3 py-4 text-[10px] font-bold text-slate-900 focus:outline-none shadow-inner border-none" value={form.district}
                                            onChange={e => updateForm('district', e.target.value)} disabled={!form.city}>
                                            <option value="">区县</option>
                                            {addressDistricts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <InputLabel required>详细地址</InputLabel>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner"
                                        placeholder="请输入具体的街道、门牌号等信息" value={form.fullAddress} onChange={e => updateForm('fullAddress', e.target.value)} />
                                </div>
                            </div>
                        )}

                        {/* Phone Verification */}
                        {platformConfig.hasSmsVerification && (
                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                <div className="space-y-2">
                                    <InputLabel required>手机号码</InputLabel>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner"
                                            placeholder="请输入11位手机号" maxLength={11} value={form.buyerPhone}
                                            onChange={e => updateForm('buyerPhone', e.target.value.replace(/\D/g, ''))} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={cn('whitespace-nowrap rounded-[20px] px-6 py-4 text-xs font-black text-white shadow-lg transition active:scale-95',
                                                smsCountdown > 0 ? 'bg-slate-200' : 'bg-blue-600 shadow-blue-50')}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <InputLabel required>验证码</InputLabel>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner"
                                        placeholder="请输入短信验证码" maxLength={6} value={form.smsCode}
                                        onChange={e => updateForm('smsCode', e.target.value.replace(/\D/g, ''))} />
                                </div>
                            </div>
                        )}

                        {/* RealName */}
                        {platformConfig.hasRealName && (
                            <div className="space-y-2 pt-4 border-t border-slate-50">
                                <InputLabel required>实名认证姓名</InputLabel>
                                <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner"
                                    placeholder="请输入实名认证的姓名" value={form.realName} onChange={e => updateForm('realName', e.target.value)} />
                            </div>
                        )}

                        {/* Image Uploads */}
                        {platformConfig.requiredImages.length > 0 && (
                            <div className="space-y-6 pt-4 border-t border-slate-50">
                                <div className="text-xs font-black text-slate-900 px-1">
                                    资质截图 <span className="text-[10px] font-bold text-slate-400">({platformConfig.requiredImages.filter(i => i.required).length}张必传)</span>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    {platformConfig.requiredImages.map(imgConfig => (
                                        <ImageUploader key={imgConfig.key} config={imgConfig} value={images[imgConfig.key] || ''} onChange={v => updateImage(imgConfig.key, v)} />
                                    ))}
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={submitting}
                            className={cn('w-full rounded-[24px] bg-blue-600 py-5 text-base font-black text-white shadow-xl shadow-blue-100 transition active:scale-[0.98]',
                                submitting ? 'bg-slate-200 shadow-none' : 'hover:bg-blue-700')}>
                            {submitting ? <Spinner size="sm" /> : '保存并提交修改'}
                        </button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
