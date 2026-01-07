"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import {
    list as listAccounts,
    create as createAccount,
    sendSmsCode,
    MAX_ACCOUNTS_PER_PLATFORM,
    CreateBuyerAccountInput,
} from "../../../services/buyerAccountService";
import { getProvinces, getCities, getDistricts } from "../../../data/chinaRegions";

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

        // 简单的 base64 处理 (生产环境应使用 OSS)
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
                <label className="text-xs text-slate-500">{label} <span className="text-red-500">*</span></label>
                {example && (
                    <button
                        type="button"
                        onClick={() => setShowExample(true)}
                        className="text-xs text-blue-500 hover:underline"
                    >
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
                        {uploading ? (
                            <Spinner size="sm" />
                        ) : (
                            <>
                                <span className="text-2xl">+</span>
                                <span className="text-xs">上传图片</span>
                            </>
                        )}
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                )}
            </div>
            {/* 示例弹窗 */}
            {showExample && example && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowExample(false)}>
                    <div className="max-w-sm rounded-lg bg-white p-4" onClick={e => e.stopPropagation()}>
                        <div className="mb-2 text-sm font-medium text-slate-800">示例图片</div>
                        <img src={example} alt="示例" className="max-h-64 rounded-lg" />
                        <div className="mt-3 text-center">
                            <button onClick={() => setShowExample(false)} className="rounded-lg bg-blue-500 px-4 py-2 text-sm text-white">
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BindAccountPage() {
    const router = useRouter();
    const [accountCount, setAccountCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [smsCountdown, setSmsCountdown] = useState(0);

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
        profileImg: '',
        creditImg: '',
        payAuthImg: '',
        scoreImg: '',
        smsCode: '',
    });

    const updateForm = useCallback((key: keyof CreateBuyerAccountInput, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    }, []);

    useEffect(() => {
        loadAccounts();
    }, []);

    useEffect(() => {
        if (smsCountdown > 0) {
            const timer = setTimeout(() => setSmsCountdown(smsCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCountdown]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const list = await listAccounts();
            setAccountCount(list.length);
        } catch (e: any) {
            toastError(e?.message || '加载失败');
        } finally {
            setLoading(false);
        }
    };

    const platformCount = useMemo(() => {
        return accountCount; // 简化处理，实际应按平台分组
    }, [accountCount]);

    // 发送验证码
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

    // 表单验证
    const validateForm = (): string | null => {
        if (!form.platformAccount) return '请输入淘宝账号';
        if (!form.loginProvince || !form.loginCity) return '请选择常用登录地';
        if (!form.buyerName) return '请输入收货人姓名';
        if (!form.province || !form.city || !form.district) return '请选择收货地址';
        if (!form.fullAddress) return '请输入详细地址';
        if (!form.buyerPhone || form.buyerPhone.length !== 11) return '请输入正确的11位手机号';
        if (!form.smsCode || form.smsCode.length < 4) return '请输入验证码';
        if (!form.realName) return '请输入支付宝认证姓名';
        if (!form.profileImg) return '请上传淘宝档案截图';
        if (!form.creditImg) return '请上传淘气值截图';
        if (!form.payAuthImg) return '请上传支付宝认证截图';
        if (!form.scoreImg) return '请上传芝麻信用截图';
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const error = validateForm();
        if (error) {
            toastError(error);
            return;
        }
        if (platformCount >= MAX_ACCOUNTS_PER_PLATFORM) {
            toastError(`每个平台最多绑定 ${MAX_ACCOUNTS_PER_PLATFORM} 个买号`);
            return;
        }
        setSubmitting(true);
        try {
            await createAccount(form);
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
                    <h1 className="flex-1 text-base font-medium text-slate-800">绑定买号</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-4 px-4 py-4">
                {/* 已绑定数量 */}
                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <span>已绑定买号</span>
                        <span>{accountCount} 个</span>
                    </div>
                </Card>

                {/* 温馨提示 */}
                <div className="rounded-lg bg-amber-50 p-3">
                    <div className="mb-2 flex items-center gap-1 text-sm font-medium text-amber-600">⚠️ 温馨提示</div>
                    <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                        <p>1. 淘宝账号必须与常用登录地一致，否则审核不通过</p>
                        <p>2. 收货地址需真实有效，用于商家发货</p>
                        <p>3. 所有截图需清晰完整，模糊或不完整将被拒绝</p>
                        <p>4. 审核通过后方可使用该买号接单</p>
                    </div>
                </div>

                {/* 表单 */}
                <Card className="border-slate-200 p-5 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 1. 平台选择 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">选择平台 <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                value={form.platform}
                                onChange={e => updateForm('platform', e.target.value)}
                            >
                                <option value="淘宝">淘宝</option>
                                <option value="京东">京东</option>
                                <option value="拼多多">拼多多</option>
                            </select>
                        </div>

                        {/* 2. 淘宝账号 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">淘宝账号 <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入您的淘宝账号"
                                value={form.platformAccount}
                                onChange={e => updateForm('platformAccount', e.target.value)}
                            />
                        </div>

                        {/* 3-4. 常用登录地 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">常用登录地 <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-2 gap-2">
                                <select
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                    value={form.loginProvince}
                                    onChange={e => {
                                        updateForm('loginProvince', e.target.value);
                                        updateForm('loginCity', '');
                                    }}
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
                            <p className="mt-1 text-xs text-slate-400">请选择您淘宝账号的常用登录位置</p>
                        </div>

                        {/* 分隔线 */}
                        <div className="border-t border-slate-200 pt-4">
                            <div className="mb-3 text-sm font-medium text-slate-700">收货信息</div>
                        </div>

                        {/* 5. 收货人姓名 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货人姓名 <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入收货人姓名"
                                value={form.buyerName}
                                onChange={e => updateForm('buyerName', e.target.value)}
                            />
                        </div>

                        {/* 6-8. 收货地址三级联动 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货地址 <span className="text-red-500">*</span></label>
                            <div className="grid grid-cols-3 gap-2">
                                <select
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800"
                                    value={form.province}
                                    onChange={e => {
                                        updateForm('province', e.target.value);
                                        updateForm('city', '');
                                        updateForm('district', '');
                                    }}
                                >
                                    <option value="">省份</option>
                                    {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                                </select>
                                <select
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800"
                                    value={form.city}
                                    onChange={e => {
                                        updateForm('city', e.target.value);
                                        updateForm('district', '');
                                    }}
                                    disabled={!form.province}
                                >
                                    <option value="">城市</option>
                                    {addressCities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                                <select
                                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-800"
                                    value={form.district}
                                    onChange={e => updateForm('district', e.target.value)}
                                    disabled={!form.city}
                                >
                                    <option value="">区县</option>
                                    {addressDistricts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* 9. 详细地址 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">详细地址 <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入具体的街道、门牌号等信息"
                                value={form.fullAddress}
                                onChange={e => updateForm('fullAddress', e.target.value)}
                            />
                        </div>

                        {/* 10-11. 收货人手机 + 验证码 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">收货人手机 <span className="text-red-500">*</span></label>
                            <div className="flex gap-2">
                                <input
                                    className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                    placeholder="请输入11位手机号"
                                    maxLength={11}
                                    value={form.buyerPhone}
                                    onChange={e => updateForm('buyerPhone', e.target.value.replace(/\D/g, ''))}
                                />
                                <button
                                    type="button"
                                    onClick={handleSendSms}
                                    disabled={smsCountdown > 0}
                                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-white ${smsCountdown > 0 ? 'bg-slate-400' : 'bg-blue-500'}`}
                                >
                                    {smsCountdown > 0 ? `${smsCountdown}s` : '发送验证码'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs text-slate-500">验证码 <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入短信验证码"
                                maxLength={6}
                                value={form.smsCode}
                                onChange={e => updateForm('smsCode', e.target.value.replace(/\D/g, ''))}
                            />
                        </div>

                        {/* 12. 支付宝认证姓名 */}
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">支付宝认证姓名 <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="请输入支付宝实名认证的姓名"
                                value={form.realName}
                                onChange={e => updateForm('realName', e.target.value)}
                            />
                        </div>

                        {/* 分隔线 */}
                        <div className="border-t border-slate-200 pt-4">
                            <div className="mb-3 text-sm font-medium text-slate-700">资质截图（4张必传）</div>
                        </div>

                        {/* 4张图片上传 */}
                        <div className="grid grid-cols-2 gap-4">
                            <ImageUploader
                                label="淘宝档案截图"
                                value={form.profileImg || ''}
                                onChange={v => updateForm('profileImg', v)}
                                example="/examples/taobao-profile.jpg"
                            />
                            <ImageUploader
                                label="淘气值截图"
                                value={form.creditImg || ''}
                                onChange={v => updateForm('creditImg', v)}
                                example="/examples/taoqi-score.jpg"
                            />
                            <ImageUploader
                                label="支付宝认证截图"
                                value={form.payAuthImg || ''}
                                onChange={v => updateForm('payAuthImg', v)}
                                example="/examples/alipay-auth.jpg"
                            />
                            <ImageUploader
                                label="芝麻信用截图"
                                value={form.scoreImg || ''}
                                onChange={v => updateForm('scoreImg', v)}
                                example="/examples/zhima-credit.jpg"
                            />
                        </div>

                        {/* 提交按钮 */}
                        {platformCount >= MAX_ACCOUNTS_PER_PLATFORM && (
                            <div className="text-xs text-red-500">该平台已绑定 {platformCount} 个，已达上限</div>
                        )}
                        <Button
                            type="submit"
                            loading={submitting}
                            disabled={platformCount >= MAX_ACCOUNTS_PER_PLATFORM || submitting}
                            className="mt-2 w-full bg-blue-500 py-6 text-base font-medium hover:bg-blue-600"
                        >
                            提交申请
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
}
