"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { cn } from "../../../../../lib/utils";
import { Card } from "../../../../../components/ui/card";
import { toastError, toastSuccess } from "../../../../../lib/toast";
import { Spinner } from "../../../../../components/ui/spinner";
import { Modal } from "../../../../../components/ui/modal";
import {
    get as getAccount,
    update as updateAccount,
    sendSmsCode,
    UpdateBuyerAccountInput,
} from "../../../../../services/buyerAccountService";
import { getProvinces, getCities, getDistricts } from "../../../../../data/chinaRegions";
import { PLATFORM_CONFIG, PlatformConfig, PlatformImageConfig } from "../../../../../constants/platformConfig";

// Shared V2 ImageUploader
function ImageUploader({ config, value, onChange }: { config: PlatformImageConfig; value: string; onChange: (v: string) => void; }) {
    const [showExample, setShowExample] = useState(false);
    const [uploading, setUploading] = useState(false);
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return; setUploading(true);
        try {
            const reader = new FileReader();
            reader.onload = () => { onChange(reader.result as string); setUploading(false); };
            reader.readAsDataURL(file);
        } catch { toastError('图片上传失败'); setUploading(false); }
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{config.label} {config.required && <span className="text-rose-500">*</span>}</label>
                {config.example && <button type="button" onClick={() => setShowExample(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700">查看示例</button>}
            </div>
            <div className="relative">
                {value ? (
                    <div className="relative group inline-block overflow-hidden rounded-[24px]">
                        <img src={value} alt={config.label} className="h-32 w-32 object-cover shadow-2xl transition-transform group-hover:scale-105" />
                        <button type="button" onClick={() => onChange('')} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/40 text-sm text-white shadow-xl backdrop-blur-md transition hover:bg-rose-500 active:scale-90">×</button>
                    </div>
                ) : (
                    <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-[24px] bg-slate-50 text-slate-300 transition-all hover:bg-slate-100 shadow-inner border-none">
                        {uploading ? <Spinner size="sm" /> : <div className="flex flex-col items-center"><span className="text-3xl font-light mb-1">+</span><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">REPLACE</span></div>}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            {showExample && config.example && (
                <Modal open={showExample} onClose={() => setShowExample(false)} title="上传示例参考">
                    <div className="p-10 pb-12 text-center space-y-8">
                        <div className="overflow-hidden rounded-[32px] bg-slate-50 aspect-square flex items-center justify-center text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] shadow-inner italic border border-slate-100">Example Preview</div>
                        <button onClick={() => setShowExample(false)} className="w-full rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl transition active:scale-95">了解并返回</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

export default function EditBuyerAccountPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);
    const [images, setImages] = useState<Record<string, string>>({});
    const [form, setForm] = useState<UpdateBuyerAccountInput>({
        platformAccount: '', loginProvince: '', loginCity: '', province: '', city: '', district: '', buyerName: '', buyerPhone: '', fullAddress: '', realName: '', smsCode: '',
    });

    const platformConfig = useMemo<PlatformConfig>(() => {
        // Fallback or detected from existing account platform name
        const platformName = form.platform || '淘宝';
        if (platformName.includes('拼多多')) return PLATFORM_CONFIG.pinduoduo;
        if (platformName.includes('天猫')) return PLATFORM_CONFIG.taobao;
        return PLATFORM_CONFIG.taobao;
    }, [form.platform]);

    useEffect(() => {
        loadAccount();
    }, [id]);

    const loadAccount = async () => {
        try {
            const acc = await getAccount(id as string);
            setForm({
                platform: acc.platform,
                platformAccount: acc.platformAccount,
                loginProvince: acc.loginProvince || '',
                loginCity: acc.loginCity || '',
                province: acc.province || '',
                city: acc.city || '',
                district: acc.district || '',
                buyerName: acc.buyerName || '',
                buyerPhone: acc.buyerPhone || '',
                fullAddress: acc.fullAddress || '',
                realName: acc.realName || '',
                smsCode: '',
            });
            setImages({
                profileImg: acc.profileImg || '',
                creditImg: acc.creditImg || '',
                payAuthImg: acc.payAuthImg || '',
                scoreImg: acc.scoreImg || '',
            });
        } catch (e: any) { toastError(e?.message || "加载失败"); } finally { setLoading(false); }
    };

    const updateForm = useCallback((key: keyof UpdateBuyerAccountInput, value: string) => { setForm(prev => ({ ...prev, [key]: value })); }, []);
    const updateImage = useCallback((key: string, value: string) => { setImages(prev => ({ ...prev, [key]: value })); }, []);

    const handleSendSms = async () => {
        if (!form.buyerPhone || form.buyerPhone.length !== 11) { toastError('手机号格式错误'); return; }
        try { await sendSmsCode(form.buyerPhone); toastSuccess('验证码已发送'); setSmsCountdown(60); } catch (e: any) { toastError(e?.message); }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateAccount(id as string, { ...form, ...images });
            toastSuccess('修改提交成功');
            router.push('/profile/buyno');
        } catch (e: any) { toastError(e?.message || '修改失败'); } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>;

    const provinces = getProvinces();
    const loginCities = form.loginProvince ? getCities(form.loginProvince) : [];
    const addressCities = form.province ? getCities(form.province) : [];
    const addressDistricts = form.province && form.city ? getDistricts(form.province, form.city) : [];

    const FormInput = ({ label, value, onChange, placeholder, required }: any) => (
        <div className="space-y-2">
            <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label} {required && <span className="text-rose-500">*</span>}</label>
            <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 focus:outline-none shadow-inner border-none" placeholder={placeholder} value={value} onChange={onChange} />
        </div>
    );

    const FormSelect = ({ label, value, onChange, options, placeholder, required, disabled }: any) => (
        <div className="space-y-2">
            {label && <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">{label} {required && <span className="text-rose-500">*</span>}</label>}
            <div className="relative">
                <select className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 focus:outline-none appearance-none cursor-pointer border-none shadow-inner disabled:opacity-50" value={value} onChange={onChange} disabled={disabled}>
                    <option value="">{placeholder || '请选择'}</option>
                    {options.map((o: any) => <option key={o.value || o.id || o} value={o.value || o.id || o}>{o.label || o.name || o}</option>)}
                </select>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-active:scale-90"><svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                    <h1 className="text-xl font-bold text-slate-900">编辑买号信息</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-10 px-4 py-8">
                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">基本资料 (修改需重审)</h3>
                    <Card className="rounded-[40px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                        <div className="space-y-1 px-1">
                            <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">所属平台</div>
                            <div className="text-lg font-black text-slate-900">{form.platform}</div>
                        </div>
                        <FormInput label={platformConfig.accountLabel} required value={form.platformAccount} onChange={(e: any) => updateForm('platformAccount', e.target.value)} />
                        {platformConfig.hasLoginLocation && (
                            <div className="grid grid-cols-2 gap-3">
                                <FormSelect label="登录省份" options={provinces} value={form.loginProvince} onChange={(e: any) => { updateForm('loginProvince', e.target.value); updateForm('loginCity', ''); }} />
                                <FormSelect label="登录城市" options={loginCities} value={form.loginCity} onChange={(e: any) => updateForm('loginCity', e.target.value)} disabled={!form.loginProvince} />
                            </div>
                        )}
                        {platformConfig.hasRealName && <FormInput label="实名姓名" required value={form.realName} onChange={(e: any) => updateForm('realName', e.target.value)} />}
                    </Card>
                </div>

                {platformConfig.hasAddress && (
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">收货信息</h3>
                        <Card className="rounded-[40px] border-none bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.02)] space-y-8">
                            <FormInput label="收货人" required value={form.buyerName} onChange={(e: any) => updateForm('buyerName', e.target.value)} />
                            <div className="grid grid-cols-3 gap-2">
                                <FormSelect options={provinces} value={form.province} onChange={(e: any) => { updateForm('province', e.target.value); updateForm('city', ''); updateForm('district', ''); }} />
                                <FormSelect options={addressCities} value={form.city} onChange={(e: any) => { updateForm('city', e.target.value); updateForm('district', ''); }} disabled={!form.province} />
                                <FormSelect options={addressDistricts} value={form.district} onChange={(e: any) => updateForm('district', e.target.value)} disabled={!form.city} />
                            </div>
                            <FormInput label="详细地址" required value={form.fullAddress} onChange={(e: any) => updateForm('fullAddress', e.target.value)} />
                        </Card>
                    </div>
                )}

                <div className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 px-2 text-center italic">资质截图重新上传</h3>
                    <Card className="rounded-[40px] border-none bg-white p-10 shadow-[0_4px_30px_rgba(0,0,0,0.02)] grid grid-cols-2 gap-10">
                        {platformConfig.requiredImages.map(img => <ImageUploader key={img.key} config={img} value={images[img.key] || ''} onChange={v => updateImage(img.key, v)} />)}
                    </Card>
                </div>
            </div>

            <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl border-t border-slate-50">
                <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-[28px] bg-slate-900 py-6 text-sm font-black text-white shadow-2xl transition active:scale-95 disabled:opacity-50">
                    {submitting ? <Spinner size="sm" /> : '保存并提交重新审核'}
                </button>
            </div>
        </div>
    );
}
