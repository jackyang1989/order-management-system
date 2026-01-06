'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// 中国省市区数据（简化版）
const PROVINCES = [
    '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
    '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
    '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
    '甘肃省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'
];

const CITIES: Record<string, string[]> = {
    '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区', '通州区', '大兴区', '房山区', '门头沟区', '昌平区', '平谷区', '密云区', '怀柔区', '延庆区'],
    '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
    '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
    '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
    '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
};

interface BuyerAccount {
    id: string;
    platform: string;
    accountName: string;
    receiverName?: string;
    receiverPhone?: string;
    fullAddress?: string;
    wangwangProvince?: string;
    wangwangCity?: string;
    status: number | string;
    rejectReason?: string;
    note?: string;
    star?: number;
    createdAt?: string;
}

interface FormData {
    platformAccount: string;     // R3映射: wangwangId -> platformAccount
    wangwangProvince: string;
    wangwangCity: string;
    img1: string | null;
    img2: string | null;
    receiverName: string;
    addressProvince: string;
    addressCity: string;
    addressDistrict: string;
    addressDetail: string;
    receiverPhone: string;
    smsCode: string;
    alipayName: string;
    img3: string | null;
    img4: string | null;
}

const statusConfig: Record<string, { text: string; className: string }> = {
    'PENDING': { text: '未审核', className: 'text-amber-500' },
    'APPROVED': { text: '审核通过', className: 'text-green-500' },
    'REJECTED': { text: '已禁用', className: 'text-red-500' },
    '0': { text: '未审核', className: 'text-amber-500' },
    '1': { text: '审核通过', className: 'text-green-500' },
    '2': { text: '已禁用', className: 'text-red-500' },
};

export default function BuynoPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const phoneReg = /^1[3-9]\d{9}$/;

    const [showWangwangArea, setShowWangwangArea] = useState(false);
    const [showAddressArea, setShowAddressArea] = useState(false);

    const [form, setForm] = useState<FormData>({
        platformAccount: '',
        wangwangProvince: '',
        wangwangCity: '',
        img1: null,
        img2: null,
        receiverName: '',
        addressProvince: '',
        addressCity: '',
        addressDistrict: '',
        addressDetail: '',
        receiverPhone: '',
        smsCode: '',
        alipayName: '',
        img3: null,
        img4: null,
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadAccounts();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [router]);

    const loadAccounts = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/buynolist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.code === 1) {
                setAccounts(data.data || []);
            }
        } catch (error) {
            console.error('Load accounts error:', error);
        } finally {
            setLoading(false);
        }
    };

    const sendSmsCode = async () => {
        if (!form.receiverPhone) {
            return toastError('手机号码不能为空');
        }
        if (!phoneReg.test(form.receiverPhone)) {
            return toastError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile: form.receiverPhone }),
            });
        } catch (error) {}

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`还剩 ${num} 秒`);

        timerRef.current = setInterval(() => {
            num--;
            setYzmMsg(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef.current!);
                setYzmMsg('重新发送');
                setYzmDisabled(false);
            } else if (num === 59) {
                toastSuccess('验证码发送成功');
            }
        }, 1000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const validateForm = (): string | null => {
        if (!form.wangwangProvince || !form.wangwangCity) return '请选择旺旺常用登陆地';
        if (!form.platformAccount) return '旺旺ID不能为空';
        if (!form.img1) return '旺旺档案截图不能为空';
        if (!form.img2) return '淘气值截图不能为空';
        if (!form.receiverName) return '收货人姓名不能为空';
        if (!form.addressProvince || !form.addressCity) return '收货地址不能为空';
        if (!form.addressDetail) return '收货地址详细信息不能为空';
        if (!form.receiverPhone) return '收货人手机号码不能为空';
        if (!phoneReg.test(form.receiverPhone)) return '手机号码格式不规范';
        if (!form.smsCode) return '请输入手机验证码';
        if (!form.alipayName) return '支付宝认证姓名不能为空';
        if (!form.img3) return '支付宝实名认证截图不能为空';
        if (!form.img4) return '芝麻信用截图不能为空';
        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            toastError(error);
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/addbuyno`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    wangwangId: form.platformAccount,
                    provinceValue2: form.wangwangProvince,
                    cityValue2: form.wangwangCity,
                    renZhengValue: form.alipayName,
                    provinceValue: form.addressProvince,
                    cityValue: form.addressCity,
                    districtValue: form.addressDistrict,
                    addressValue: form.addressDetail,
                    phoneNumValue: form.receiverPhone,
                    yzmNumValue: form.smsCode,
                    img1: form.img1,
                    img2: form.img2,
                    img3: form.img3,
                    img4: form.img4,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                toastSuccess(data.msg || '买号提交成功，请等待审核');
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        loadAccounts();
                        setActiveTab('list');
                        setForm({
                            platformAccount: '',
                            wangwangProvince: '',
                            wangwangCity: '',
                            img1: null,
                            img2: null,
                            receiverName: '',
                            addressProvince: '',
                            addressCity: '',
                            addressDistrict: '',
                            addressDetail: '',
                            receiverPhone: '',
                            smsCode: '',
                            alipayName: '',
                            img3: null,
                            img4: null,
                        });
                    }
                }, 3000);
            } else {
                toastError(data.msg || '提交失败');
            }
        } catch (error) {
            toastError('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="p-5 text-center text-slate-500">加载中...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* 页面头部 */}
            <header className="sticky top-0 z-10 flex h-11 items-center justify-center border-b border-slate-200 bg-white">
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 text-xl text-slate-600"
                >
                    ‹
                </button>
                <span className="text-base font-medium text-slate-800">买号添加</span>
            </header>

            {/* Tab切换 */}
            <div className="flex border-b border-slate-200 bg-white">
                <button
                    onClick={() => setActiveTab('list')}
                    className={cn(
                        'relative flex-1 py-3 text-center text-sm',
                        activeTab === 'list' ? 'text-primary' : 'text-slate-500'
                    )}
                >
                    买号信息
                    {activeTab === 'list' && (
                        <div className="absolute bottom-0 left-1/2 h-0.5 w-14 -translate-x-1/2 bg-primary" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={cn(
                        'relative flex-1 py-3 text-center text-sm',
                        activeTab === 'add' ? 'text-primary' : 'text-slate-500'
                    )}
                >
                    添加账号
                    {activeTab === 'add' && (
                        <div className="absolute bottom-0 left-1/2 h-0.5 w-14 -translate-x-1/2 bg-primary" />
                    )}
                </button>
            </div>

            {/* 买号信息列表 */}
            {activeTab === 'list' && (
                <div className="p-2.5">
                    {accounts.length === 0 ? (
                        <div className="rounded-lg bg-white p-10 text-center text-sm text-slate-400">
                            暂无内容
                        </div>
                    ) : (
                        accounts.map(acc => {
                            const status = String(acc.status);
                            const statusInfo = statusConfig[status] || { text: '未知', className: 'text-slate-400' };
                            return (
                                <div key={acc.id} className="mb-2.5 overflow-hidden rounded-lg bg-white shadow-sm">
                                    <div className="p-4">
                                        <div className="mb-2 flex text-xs">
                                            <span className="w-20 text-slate-400">旺旺ID：</span>
                                            <span className="text-slate-700">{acc.accountName}</span>
                                        </div>
                                        <div className="mb-2 flex text-xs">
                                            <span className="w-20 text-slate-400">收货人：</span>
                                            <span className="text-slate-700">{acc.receiverName || '-'}</span>
                                        </div>
                                        <div className="mb-2 flex text-xs">
                                            <span className="w-20 text-slate-400">收货地址：</span>
                                            <span className="flex-1 text-slate-700">{acc.fullAddress || '-'}</span>
                                        </div>
                                        <div className="mb-2 flex text-xs">
                                            <span className="w-20 text-slate-400">手机号码：</span>
                                            <span className="text-slate-700">{acc.receiverPhone || '-'}</span>
                                        </div>
                                        <div className="mb-2 flex text-xs">
                                            <span className="w-20 text-slate-400">买号状态：</span>
                                            <span className={statusInfo.className}>{statusInfo.text}</span>
                                        </div>
                                        {acc.note && (
                                            <div className="flex text-xs">
                                                <span className="w-20 text-slate-400">备注：</span>
                                                <span className="text-red-500">{acc.note}</span>
                                            </div>
                                        )}
                                        {acc.rejectReason && (
                                            <div className="flex text-xs">
                                                <span className="w-20 text-slate-400">拒绝原因：</span>
                                                <span className="text-red-500">{acc.rejectReason}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end border-t border-slate-100 bg-gradient-to-b from-slate-50 to-white px-4 py-2.5">
                                        <button
                                            onClick={() => router.push(`/profile/buyno/edit/${acc.id}`)}
                                            className="rounded-full bg-primary px-4 py-1.5 text-xs text-white"
                                        >
                                            信息修改
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div className="mt-2.5 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-slate-500">
                        提示：平台优先审核优质女号，买号提交审核后，平台预计在24小时内完成审核操作，只有审核通过的买号才能接手任务 (任务完成后25天后可以复购)
                    </div>
                </div>
            )}

            {/* 添加账号表单 */}
            {activeTab === 'add' && (
                <div>
                    {/* 旺旺信息 */}
                    <div className="m-2.5 overflow-hidden rounded-lg bg-white">
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                            旺旺信息
                        </div>

                        {/* 旺旺常用登陆地 */}
                        <button
                            onClick={() => setShowWangwangArea(!showWangwangArea)}
                            className="flex w-full items-center border-b border-slate-100 bg-white px-4 py-3"
                        >
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>旺旺常用登陆地：
                            </span>
                            <span className={cn('flex-1 text-right text-sm', form.wangwangProvince ? 'text-slate-700' : 'text-slate-400')}>
                                {form.wangwangProvince ? `${form.wangwangProvince} ${form.wangwangCity}` : '请选择省市'}
                            </span>
                            <span className="ml-2 text-slate-300">›</span>
                        </button>

                        {showWangwangArea && (
                            <div className="border-b border-slate-100 bg-slate-50 p-4">
                                <div className="flex gap-2.5">
                                    <select
                                        value={form.wangwangProvince}
                                        onChange={e => setForm({ ...form, wangwangProvince: e.target.value, wangwangCity: '' })}
                                        className="flex-1 rounded border border-slate-200 px-2 py-2 text-sm"
                                    >
                                        <option value="">请选择省</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <select
                                        value={form.wangwangCity}
                                        onChange={e => setForm({ ...form, wangwangCity: e.target.value })}
                                        className="flex-1 rounded border border-slate-200 px-2 py-2 text-sm"
                                    >
                                        <option value="">请选择市</option>
                                        {(CITIES[form.wangwangProvince] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <p className="mt-2 text-xs leading-relaxed text-amber-600">
                                    请选择该旺旺经常登录的城市或地区，一经选择后，所有买号对应的收货地址必须和旺旺登录的常用登录地保持一致，绑定后无法自行修改，请谨慎选择
                                </p>
                            </div>
                        )}

                        {/* 旺旺ID */}
                        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-3">
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>旺旺ID:
                            </span>
                            <input
                                type="text"
                                placeholder="请填写旺旺ID"
                                value={form.platformAccount}
                                onChange={e => setForm({ ...form, platformAccount: e.target.value })}
                                className="flex-1 bg-transparent text-right text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600">
                            请填写该买号使用的旺旺ID，绑定后无法修改，严禁绑定相似的买号。
                        </div>

                        {/* 旺旺档案截图 */}
                        <div className="border-b border-slate-100 p-4">
                            <div className="mb-2.5 text-sm text-slate-700">
                                <span className="text-red-500">*</span>旺旺档案截图:
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    {form.img1 ? (
                                        <img src={form.img1} alt="已上传" className="h-20 w-20 rounded object-cover" />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400">+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img1')}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">示例图</div>
                                    <span className="mt-1 text-xs text-slate-400">示例图</span>
                                </div>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-500">
                                请登录淘宝APP，点击"我的淘宝-官方客服-发送"评价管理"点"评价管理（电脑版）"截图即可，所绑定买号必须和截图上一致。绑定成功后无法自行修改，请谨慎选择。
                            </p>
                        </div>

                        {/* 淘气值截图 */}
                        <div className="p-4">
                            <div className="mb-2.5 text-sm text-slate-700">
                                <span className="text-red-500">*</span>淘气值截图:
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    {form.img2 ? (
                                        <img src={form.img2} alt="已上传" className="h-20 w-20 rounded object-cover" />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400">+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img2')}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">示例图</div>
                                    <span className="mt-1 text-xs text-slate-400">示例图</span>
                                </div>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
                                请登录淘宝APP，点击"我的淘宝-会员中心"截图即可，所绑定买号必须和截图上一致。
                            </p>
                        </div>
                    </div>

                    {/* 基本信息 */}
                    <div className="m-2.5 overflow-hidden rounded-lg bg-white">
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                            基本信息
                        </div>

                        {/* 收货人姓名 */}
                        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-3">
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>收货人姓名:
                            </span>
                            <input
                                type="text"
                                placeholder="请输入收货人姓名"
                                value={form.receiverName}
                                onChange={e => setForm({ ...form, receiverName: e.target.value })}
                                className="flex-1 bg-transparent text-right text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600">
                            绑定的买号必须是与支付宝实名认证一致的账号，支付宝认证姓名只允许输入6个字以内的中文
                        </div>

                        {/* 收货人地址 */}
                        <button
                            onClick={() => setShowAddressArea(!showAddressArea)}
                            className="flex w-full items-center border-b border-slate-100 bg-white px-4 py-3"
                        >
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>收货人地址：
                            </span>
                            <span className={cn('flex-1 text-right text-sm', form.addressProvince ? 'text-slate-700' : 'text-slate-400')}>
                                {form.addressProvince ? `${form.addressProvince} ${form.addressCity} ${form.addressDistrict}` : '请选择省市区'}
                            </span>
                            <span className="ml-2 text-slate-300">›</span>
                        </button>

                        {showAddressArea && (
                            <div className="border-b border-slate-100 bg-slate-50 p-4">
                                <div className="flex flex-wrap gap-2.5">
                                    <select
                                        value={form.addressProvince}
                                        onChange={e => setForm({ ...form, addressProvince: e.target.value, addressCity: '', addressDistrict: '' })}
                                        className="min-w-24 flex-1 rounded border border-slate-200 px-2 py-2 text-sm"
                                    >
                                        <option value="">请选择省</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <select
                                        value={form.addressCity}
                                        onChange={e => setForm({ ...form, addressCity: e.target.value, addressDistrict: '' })}
                                        className="min-w-24 flex-1 rounded border border-slate-200 px-2 py-2 text-sm"
                                    >
                                        <option value="">请选择市</option>
                                        {(CITIES[form.addressProvince] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-3">
                            <input
                                type="text"
                                placeholder="请输入详细地址（街道门牌号）"
                                value={form.addressDetail}
                                onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600">
                            填写的街道地址必须详细到"门牌号"，否则不予通过
                        </div>

                        {/* 收货人手机号 */}
                        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-3">
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>收货人手机号:
                            </span>
                            <input
                                type="text"
                                placeholder="请输入手机号"
                                value={form.receiverPhone}
                                onChange={e => setForm({ ...form, receiverPhone: e.target.value })}
                                className="flex-1 bg-transparent text-right text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600">
                            该手机号必须与您支付宝上认证的手机号码一致；否则不予审核通过
                        </div>

                        {/* 手机验证码 */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>手机验证码:
                            </span>
                            <div className="flex flex-1 items-center justify-end gap-2.5">
                                <input
                                    type="text"
                                    placeholder="请输入验证码"
                                    maxLength={6}
                                    value={form.smsCode}
                                    onChange={e => setForm({ ...form, smsCode: e.target.value })}
                                    className="w-24 rounded border border-slate-200 px-2.5 py-1.5 text-center text-sm"
                                />
                                <button
                                    onClick={sendSmsCode}
                                    disabled={yzmDisabled}
                                    className={cn(
                                        'whitespace-nowrap rounded px-3 py-1.5 text-xs text-white',
                                        yzmDisabled ? 'cursor-not-allowed bg-blue-300' : 'bg-primary'
                                    )}
                                >
                                    {yzmMsg}
                                </button>
                            </div>
                        </div>

                        {/* 支付宝认证姓名 */}
                        <div className="flex items-center border-b border-slate-100 bg-white px-4 py-3">
                            <span className="w-28 text-sm text-slate-700">
                                <span className="text-red-500">*</span>支付宝认证姓名:
                            </span>
                            <input
                                type="text"
                                placeholder="请输入支付宝认证姓名"
                                value={form.alipayName}
                                onChange={e => setForm({ ...form, alipayName: e.target.value })}
                                className="flex-1 bg-transparent text-right text-sm text-slate-700 outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="bg-amber-50 px-4 py-2 text-xs text-amber-600">
                            绑定多个买号必须使用不同身份认证的支付宝账号，支付宝认证姓名只允许输入6个字以内的中文
                        </div>
                    </div>

                    {/* 支付宝信息 */}
                    <div className="m-2.5 overflow-hidden rounded-lg bg-white">
                        <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                            支付宝信息
                        </div>

                        {/* 支付宝实名认证 */}
                        <div className="border-b border-slate-100 p-4">
                            <div className="mb-2.5 text-sm text-slate-700">
                                <span className="text-red-500">*</span>支付宝实名认证:
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    {form.img3 ? (
                                        <img src={form.img3} alt="已上传" className="h-20 w-20 rounded object-cover" />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400">+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img3')}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">示例图</div>
                                    <span className="mt-1 text-xs text-slate-400">示例图</span>
                                </div>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
                                请登录您的"支付宝"，点击"我的-支付宝昵称"，截取您的支付宝"个人信息"作为审核凭证，截图中的姓名必须和您填写的支付宝姓名保持一致、实名制淘宝会员名必须和您上传的旺旺档案截图一致。
                            </p>
                        </div>

                        {/* 芝麻信用截图 */}
                        <div className="p-4">
                            <div className="mb-2.5 text-sm text-slate-700">
                                <span className="text-red-500">*</span>芝麻信用截图:
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    {form.img4 ? (
                                        <img src={form.img4} alt="已上传" className="h-20 w-20 rounded object-cover" />
                                    ) : (
                                        <div className="flex h-20 w-20 items-center justify-center rounded border border-dashed border-slate-300 text-2xl text-slate-400">+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img4')}
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                    />
                                </div>
                                <div className="text-center">
                                    <div className="flex h-20 w-20 items-center justify-center rounded bg-slate-100 text-xs text-slate-400">示例图</div>
                                    <span className="mt-1 text-xs text-slate-400">示例图</span>
                                </div>
                            </div>
                            <p className="mt-2.5 text-xs leading-relaxed text-slate-700">
                                请登录您的"支付宝"，点击"我的-芝麻信用"，截取您的支付宝"芝麻信用"作为审核凭证，截图中的姓名必须和您的支付宝实名认证姓名一致。
                            </p>
                        </div>
                    </div>

                    {/* 保存按钮 */}
                    <div className="flex gap-4 p-4">
                        <Button
                            onClick={handleSubmit}
                            loading={submitting}
                            className="flex-1"
                        >
                            {submitting ? '提交中...' : '保存'}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.back()}
                            className="flex-1"
                        >
                            取消
                        </Button>
                    </div>

                    {/* 温馨提示 */}
                    <div className="mx-2.5 mb-5 rounded-lg bg-white p-4">
                        <div className="mb-2.5 flex items-center text-amber-600">
                            <span className="mr-1">⚠️</span>
                            <span className="text-sm font-medium">温馨提示</span>
                        </div>
                        <div className="space-y-1 text-xs leading-relaxed text-slate-500">
                            <p>1.平台优先审核优质女号，注册时间超过1年、实名认证、淘气值≥400，信誉等级3心以上、信誉大于2钻的买号注册时间要超过3年，好评率大于99%的安全号；</p>
                            <p>2.淘宝|天猫可绑1个买号，买号要求绑定的收货信息（收货人姓名、地址、电话均要求真实有效，能联系上买手本人）；</p>
                            <p>3.平台填写的收货信息，务必和淘宝网下单时收货信息保持一致，否则将封闭您的账号，并没收所有佣金；</p>
                            <p>4.必须确保绑定的所有买号收货地址与登录IP地址保持一致，建议还可以写公司地址；</p>
                            <p>5.当买号周评超过参考值或降权＞1以及其他条件不满足要求时，平台将停止派单，请及时申请更换买号；</p>
                            <p>6.买号提交审核后，平台预计在24小时内完成审核操作，超时未审核请咨询客服。</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
