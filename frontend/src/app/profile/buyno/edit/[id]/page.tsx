"use client";

import { useEffect, useState, useCallback, use } from "react";
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

// 图片上传组件
function ImageUploader({
    label,
    value,
    onChange,
    example,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    example?: string;
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
                <label className="text-xs text-slate-500">{label}</label>
                {example && (
                    <button type="button" onClick={() => setShowExample(true)} className="text-xs text-blue-500 hover:underline">
                        查看示例
                    </button>
                )}
            </div>
            <div className="relative">
                {value ? (
                    <div className="relative">
                        <img src={value} alt={label} className="h-24 w-24 rounded-lg border border-slate-200 object-cover" />
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
            {showExample && example && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExample(false)}>
                    <div className="max-w-sm rounded-lg bg-white p-4" onClick={e => e.stopPropagation()}>
                        <div className="mb-2 text-sm font-medium text-slate-800">示例图片</div>
                        <img src={example} alt="示例" className="max-h-64 rounded-lg" />
                        <div className="mt-3 text-center">
                            <button onClick={() => setShowExample(false)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white">关闭</button>
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
        profileImg: '',
        creditImg: '',
        payAuthImg: '',
        scoreImg: '',
        smsCode: '',
    });

    const updateForm = useCallback((key: keyof UpdateBuyerAccountInput, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
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
                profileImg: data.profileImg || '',
                creditImg: data.creditImg || '',
                payAuthImg: data.payAuthImg || '',
                scoreImg: data.scoreImg || '',
                smsCode: '',
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.smsCode || form.smsCode.length < 4) {
            toastError('请输入验证码');
            return;
        }
        setSubmitting(true);
        try {
            await updateAccount(resolvedParams.id, form);
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
                {/* 账号信息 */}
                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">淘宝账号</span>
                        <span className="font-medium text-slate-800">{account?.platformAccount}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                        <span className="text-slate-500">平台</span>
                        <span className="text-slate-600">{account?.platform}</span>
                    </div>
                </Card>

                {/* 编辑表单 */}
                <Card className="border-slate-200 p-5 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 常用登录地 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">常用登录地</label>
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

                        {/* 收货人姓名 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货人姓名</label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入收货人姓名"
                                value={form.buyerName}
                                onChange={e => updateForm('buyerName', e.target.value)}
                            />
                        </div>

                        {/* 收货地址三级联动 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货地址</label>
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

                        {/* 详细地址 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">详细地址</label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入详细地址" value={form.fullAddress} onChange={e => updateForm('fullAddress', e.target.value)} />
                        </div>

                        {/* 收货人手机 + 验证码 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货人手机</label>
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

                        {/* 支付宝认证姓名 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">支付宝认证姓名</label>
                            <input className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入支付宝实名认证的姓名" value={form.realName} onChange={e => updateForm('realName', e.target.value)} />
                        </div>

                        {/* 4张图片上传 */}
                        <div className="border-t border-slate-200 pt-4">
                            <div className="mb-3 text-sm font-medium text-slate-700">资质截图</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <ImageUploader label="淘宝档案截图" value={form.profileImg || ''} onChange={v => updateForm('profileImg', v)} />
                            <ImageUploader label="淘气值截图" value={form.creditImg || ''} onChange={v => updateForm('creditImg', v)} />
                            <ImageUploader label="支付宝认证截图" value={form.payAuthImg || ''} onChange={v => updateForm('payAuthImg', v)} />
                            <ImageUploader label="芝麻信用截图" value={form.scoreImg || ''} onChange={v => updateForm('scoreImg', v)} />
                        </div>

                        <Button type="submit" loading={submitting} disabled={submitting}
                            className="mt-2 w-full bg-blue-500 py-6 text-base font-medium hover:bg-blue-600">
                            保存修改
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
