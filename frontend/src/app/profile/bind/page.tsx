"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import { Modal } from "../../../components/ui/modal";
import {
    create as createAccount,
    sendSmsCode,
    CreateBuyerAccountInput,
} from "../../../services/buyerAccountService";
import { getProvinces, getCities, getDistricts } from "../../../data/chinaRegions";
import { PLATFORM_CONFIG, getPlatformList, PlatformConfig, PlatformImageConfig } from "../../../constants/platformConfig";

// Improved ImageUploader V2
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
            reader.readAsDataURL(file);
        } catch {
            toastError('图片上传失败');
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {config.label} {config.required && <span className="text-rose-500">*</span>}
                </label>
                {config.example && (
                    <button type="button" onClick={() => setShowExample(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">
                        查看示例
                    </button>
                )}
            </div>
            <div className="relative">
                {value ? (
                    <div className="relative group inline-block overflow-hidden rounded-[24px]">
                        <img src={value} alt={config.label} className="h-32 w-32 object-cover shadow-2xl transition-transform group-hover:scale-105" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/40 text-sm text-white shadow-xl backdrop-blur-md transition hover:bg-rose-500 active:scale-90"
                        >
                            ×
                        </button>
                    </div>
                ) : (
                    <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-[24px] bg-slate-50 text-slate-300 transition-all hover:bg-slate-100 hover:shadow-inner active:scale-95 border-none shadow-inner">
                        {uploading ? <Spinner size="sm" /> : (
                            <div className="flex flex-col items-center">
                                <span className="text-3xl font-light mb-1">+</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPLOAD</span>
                            </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            {showExample && config.example && (
                <Modal open={showExample} onClose={() => setShowExample(false)} title="上传示例参考">
                    <div className="p-10 pb-12 text-center space-y-8">
                        <div className="overflow-hidden rounded-[32px] bg-slate-50 aspect-square flex items-center justify-center text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] shadow-inner italic border border-slate-100">
                            Example Preview (Mock)
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">请对照示例上传</h4>
                            <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">请确保您的截图包含完整信息，且文字清晰可见。</p>
                        </div>
                        <button onClick={() => setShowExample(false)} className="w-full rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl shadow-blue-50 transition active:scale-95">了解并返回</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function BindAccountPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);

    // 当前选中的平台配置
    const [selectedPlatformId, setSelectedPlatformId] = useState('taobao');
    const platformConfig = useMemo<PlatformConfig>(() => {
        return PLATFORM_CONFIG[selectedPlatformId] || PLATFORM_CONFIG.taobao;
    }, [selectedPlatformId]);

    // 图片状态
    const [images, setImages] = useState<Record<string, string>>({});

    const [form, setForm] = useState<CreateBuyerAccountInput>({
        platform: '淘宝',
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
    });

    const updateForm = useCallback((key: keyof CreateBuyerAccountInput, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    const updateImage = useCallback((key: string, value: string) => {
        setImages(prev => ({ ...prev, [key]: value }));
    }, []);

    const handlePlatformChange = (platformId: string) => {
        setSelectedPlatformId(platformId);
        const config = PLATFORM_CONFIG[platformId];
        if (config) {
            updateForm('platform', config.name);
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

    const validateForm = (): string | null => {
        if (!form.platformAccount) return `请输入${platformConfig.accountLabel}`;
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

    const provinces = getProvinces();
    const loginCities = form.loginProvince ? getCities(form.loginProvince) : [];
    const addressCities = form.province ? getCities(form.province) : [];
    const addressDistricts = form.province && form.city ? getDistricts(form.province, form.city) : [];
    const platformList = getPlatformList();

    const FormSelect = ({ label, value, onChange, options, placeholder, required, disabled }: any) => (
        <div className="space-y-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <div className="relative">
                <select
                    className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 focus:outline-none appearance-none cursor-pointer border-none shadow-inner disabled:opacity-50"
                    value={value}
                    onChange={onChange}
                    disabled={disabled}
                >
                    <option value="">{placeholder || '请选择'}</option>
                    {options.map((o: any) => <option key={o.value || o.id || o} value={o.value || o.id || o}>{o.label || o.name || o}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-300 italic text-[10px]">▼</div>
            </div>
        </div>
    );

    const FormInput = ({ label, value, onChange, placeholder, required, maxLength, type = 'text' }: any) => (
        <div className="space-y-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                type={type}
                className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 focus:outline-none shadow-inner border-none"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                maxLength={maxLength}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.push('/profile/buyno')} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">绑定新买号</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-8 px-4 py-6">
                {/* Platform Selector (Visual Cards) */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2">选择下单平台</h3>
                    <div className="grid grid-cols-3 gap-3">
                        {platformList.map(p => {
                            const active = selectedPlatformId === p.id;
                            return (
                                <button key={p.id} onClick={() => handlePlatformChange(p.id)}
                                    className={cn('flex flex-col items-center gap-3 rounded-[28px] p-5 transition-all active:scale-95',
                                        active ? 'bg-blue-600 text-white shadow-xl shadow-blue-50' : 'bg-white shadow-sm ring-1 ring-slate-100/50')}>
                                    <span className="text-2xl">{p.name.includes('淘宝') ? '🛒' : p.name.includes('拼多多') ? '📦' : '🏪'}</span>
                                    <span className={cn('text-[10px] font-black uppercase tracking-wider', active ? 'text-white' : 'text-slate-600')}>{p.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Form Sections */}
                <div className="space-y-10 pb-10">
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">基本资料</h3>
                        <Card className="rounded-[40px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                            <FormInput label={platformConfig.accountLabel} required placeholder={platformConfig.accountPlaceholder} value={form.platformAccount} onChange={(e: any) => updateForm('platformAccount', e.target.value)} />

                            {platformConfig.hasLoginLocation && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">常用登录地 <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FormSelect label="" options={provinces} placeholder="省份" value={form.loginProvince} onChange={(e: any) => { updateForm('loginProvince', e.target.value); updateForm('loginCity', ''); }} />
                                        <FormSelect label="" options={loginCities} placeholder="城市" value={form.loginCity} onChange={(e: any) => updateForm('loginCity', e.target.value)} disabled={!form.loginProvince} />
                                    </div>
                                </div>
                            )}

                            {platformConfig.hasRealName && (
                                <FormInput label="实名认证姓名" required placeholder="请输入真实姓名" value={form.realName} onChange={(e: any) => updateForm('realName', e.target.value)} />
                            )}
                        </Card>
                    </div>

                    {platformConfig.hasAddress && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">收货信息</h3>
                            <Card className="rounded-[40px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                                <FormInput label="收货人" required placeholder="请输入真实姓名" value={form.buyerName} onChange={(e: any) => updateForm('buyerName', e.target.value)} />
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1 text-center">所在地区 <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <FormSelect label="" options={provinces} placeholder="省" value={form.province} onChange={(e: any) => { updateForm('province', e.target.value); updateForm('city', ''); updateForm('district', ''); }} />
                                        <FormSelect label="" options={addressCities} placeholder="市" value={form.city} onChange={(e: any) => { updateForm('city', e.target.value); updateForm('district', ''); }} disabled={!form.province} />
                                        <FormSelect label="" options={addressDistricts} placeholder="区" value={form.district} onChange={(e: any) => updateForm('district', e.target.value)} disabled={!form.city} />
                                    </div>
                                </div>
                                <FormInput label="详细街道地址" required placeholder="街道、门牌号等" value={form.fullAddress} onChange={(e: any) => updateForm('fullAddress', e.target.value)} />
                            </Card>
                        </div>
                    )}

                    {platformConfig.hasSmsVerification && (
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">安全验证</h3>
                            <Card className="rounded-[40px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">绑定手机号</label>
                                    <div className="flex gap-2">
                                        <input className="flex-1 rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none"
                                            placeholder="请输入手机号" value={form.buyerPhone} onChange={(e: any) => updateForm('buyerPhone', e.target.value.replace(/\D/g, ''))} />
                                        <button type="button" onClick={handleSendSms} disabled={smsCountdown > 0}
                                            className={cn('shrink-0 rounded-[20px] px-6 text-[10px] font-black text-white shadow-lg transition active:scale-90', smsCountdown > 0 ? 'bg-slate-200' : 'bg-slate-900 shadow-slate-100')}>
                                            {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                                        </button>
                                    </div>
                                </div>
                                <FormInput label="短息验证码" required placeholder="6位数字验证码" value={form.smsCode} onChange={(e: any) => updateForm('smsCode', e.target.value.replace(/\D/g, ''))} maxLength={6} />
                            </Card>
                        </div>
                    )}

                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">资质截图</h3>
                        <Card className="rounded-[40px] border-none bg-white p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-x-6 gap-y-10">
                            {platformConfig.requiredImages.map(imgConfig => (
                                <ImageUploader key={imgConfig.key} config={imgConfig} value={images[imgConfig.key] || ''} onChange={v => updateImage(imgConfig.key, v)} />
                            ))}
                        </Card>
                    </div>

                    {/* Guidelines */}
                    <div className="rounded-[40px] bg-amber-50/50 p-10 border border-amber-100/50 space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-900 border-b border-amber-900/10 pb-4">绑定须知</h3>
                        <div className="space-y-4 text-[10px] font-bold text-amber-800/70 leading-relaxed italic">
                            {platformConfig.tips.map((tip, i) => <p key={i}>{i + 1}. {tip}</p>)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Submit */}
            <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl border-t border-slate-50">
                <button onClick={handleSubmit} disabled={submitting}
                    className="w-full rounded-[28px] bg-blue-600 py-6 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-30">
                    {submitting ? <Spinner size="sm" /> : '立即提交绑定申请'}
                </button>
            </div>
        </div>
    );
}
