'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';
import Image from 'next/image';

interface BankCard {
    id: string;
    bankName: string;
    cardNumber: string;
    cardHolder: string;
    accountName?: string;
    wechatQrCode?: string;
    alipayQrCode?: string;
    isDefault: boolean;
    createdAt: string;
}

export default function MerchantBankPage() {
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requireBankInfo, setRequireBankInfo] = useState(true);
    const [form, setForm] = useState({
        bankName: '',
        cardNumber: '',
        cardHolder: '',
        isDefault: false,
        wechatQrCode: '',
        alipayQrCode: ''
    });

    // 图片上传状态
    const [uploadingAlipay, setUploadingAlipay] = useState(false);
    const [uploadingWechat, setUploadingWechat] = useState(false);
    const [imageModal, setImageModal] = useState<string | null>(null);

    useEffect(() => {
        loadCards();
        loadSystemConfig();
    }, []);

    const loadSystemConfig = async () => {
        try {
            const res = await fetch(`${BASE_URL}/system-config/public`);
            const json = await res.json();
            if (json.success && json.data) {
                setRequireBankInfo(json.data.requireBankInfo !== false);
            }
        } catch (error) {
            console.error('Load system config error:', error);
        }
    };

    const loadCards = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setCards(json.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleImageUpload = async (file: File, type: 'alipay' | 'wechat') => {
        if (type === 'alipay') setUploadingAlipay(true);
        else setUploadingWechat(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = localStorage.getItem('merchantToken');
            const res = await fetch(`${BASE_URL}/upload/image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const json = await res.json();

            if (json.success && json.url) {
                if (type === 'alipay') {
                    setForm(f => ({ ...f, alipayQrCode: json.url }));
                } else {
                    setForm(f => ({ ...f, wechatQrCode: json.url }));
                }
            } else {
                alert(json.message || '上传失败');
            }
        } catch (error) {
            alert('上传失败');
        } finally {
            if (type === 'alipay') setUploadingAlipay(false);
            else setUploadingWechat(false);
        }
    };

    const handleAdd = async () => {
        // 根据系统配置验证必填项
        if (requireBankInfo) {
            if (!form.bankName || !form.cardNumber || !form.cardHolder) {
                alert('请填写完整银行卡信息');
                return;
            }
        }

        // 收款码至少需要一个
        if (!form.alipayQrCode && !form.wechatQrCode) {
            alert('请至少上传一个收款码（微信或支付宝）');
            return;
        }

        setSubmitting(true);
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    bankName: form.bankName || '收款账户',
                    cardNumber: form.cardNumber || '',
                    accountName: form.cardHolder,
                    isDefault: form.isDefault,
                    wechatQrCode: form.wechatQrCode,
                    alipayQrCode: form.alipayQrCode
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('添加成功');
                setShowAddModal(false);
                setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false, wechatQrCode: '', alipayQrCode: '' });
                loadCards();
            } else alert(json.message || '添加失败');
        } catch { alert('网络错误'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('确定要删除该收款账户吗？')) return;
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { alert('删除成功'); loadCards(); }
            else alert(json.message || '删除失败');
        } catch { alert('网络错误'); }
    };

    const handleSetDefault = async (id: string) => {
        const token = localStorage.getItem('merchantToken');
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards/${id}/set-default`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) loadCards();
            else alert(json.message || '设置失败');
        } catch { alert('网络错误'); }
    };

    const bankOptions = ['中国工商银行', '中国建设银行', '中国农业银行', '中国银行', '招商银行', '交通银行', '中国邮政储蓄银行', '中信银行', '光大银行', '浦发银行', '民生银行', '兴业银行', '平安银行'];
    const maskCardNumber = (num: string) => num.length <= 8 ? num : num.slice(0, 4) + ' **** **** ' + num.slice(-4);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">收款账户管理</h1>
                    <p className="mt-1 text-sm font-medium text-slate-400">绑定收款账户用于接收佣金</p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="flex h-11 items-center gap-1.5 rounded-[16px] bg-primary-600 px-5 text-base font-bold text-white shadow-none transition-all active:scale-95 hover:bg-primary-700"
                >
                    + 添加收款账户
                </Button>
            </div>

            {/* Cards List */}
            {loading ? (
                <div className="flex h-60 items-center justify-center font-medium text-slate-400">加载中...</div>
            ) : cards.length === 0 ? (
                <Card className="flex flex-col items-center justify-center py-20 text-center rounded-[24px] shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="mb-4 text-5xl opacity-20">💳</div>
                    <div className="mb-6 font-medium text-slate-400">暂未添加收款账户</div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        className="h-11 rounded-[16px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700"
                    >
                        立即添加
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-5">
                    {cards.map(card => (
                        <div key={card.id} className="relative min-h-[180px] rounded-[24px] bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white shadow-lg shadow-indigo-500/20">
                            {card.isDefault && (
                                <span className="absolute right-6 top-6 rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">默认</span>
                            )}
                            <div className="mb-4 text-lg font-bold">{card.bankName || '收款账户'}</div>
                            {card.cardNumber && (
                                <div className="mb-6 font-mono text-2xl font-bold tracking-wider opacity-90">{maskCardNumber(card.cardNumber)}</div>
                            )}
                            {/* 收款码标识 */}
                            <div className="mb-6 flex gap-2">
                                {card.wechatQrCode && (
                                    <span className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                                        <span>💬</span> 微信
                                    </span>
                                )}
                                {card.alipayQrCode && (
                                    <span className="flex items-center gap-1 rounded-full bg-black/20 px-3 py-1 text-xs font-bold backdrop-blur-sm">
                                        <span>🔷</span> 支付宝
                                    </span>
                                )}
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-sm font-medium opacity-80">{card.cardHolder || card.accountName}</div>
                                <div className="flex gap-2">
                                    {!card.isDefault && (
                                        <button onClick={() => handleSetDefault(card.id)} className="rounded-[10px] bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-colors hover:bg-white/30">设为默认</button>
                                    )}
                                    <button onClick={() => handleDelete(card.id)} className="rounded-[10px] bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-sm transition-colors hover:bg-red-500/50">删除</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal title="添加收款账户" open={showAddModal} onClose={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false, wechatQrCode: '', alipayQrCode: '' }); }} className="max-w-md rounded-[32px]">
                <div className="space-y-6">
                    {/* 收款码上传区域 */}
                    <div>
                        <label className="mb-3 block text-xs font-bold uppercase text-slate-400">收款码上传 <span className="text-danger-400">*</span></label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* 微信收款码 */}
                            <div className="text-center">
                                <div className="mb-2 text-xs font-bold text-slate-500">微信收款码</div>
                                {form.wechatQrCode ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={form.wechatQrCode}
                                            alt="微信收款码"
                                            width={100}
                                            height={100}
                                            className="h-[100px] w-[100px] cursor-pointer rounded-[16px] border border-slate-200 object-cover shadow-sm"
                                            onClick={() => setImageModal(form.wechatQrCode)}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, wechatQrCode: '' }))}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger-400 text-xs font-bold text-white shadow-sm"
                                        >×</button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex h-[100px] w-[100px] mx-auto cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500",
                                        uploadingWechat && "opacity-50 cursor-not-allowed"
                                    )}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingWechat}
                                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'wechat')}
                                        />
                                        {uploadingWechat ? (
                                            <span className="text-xs font-bold">上传中...</span>
                                        ) : (
                                            <>
                                                <span className="text-2xl">+</span>
                                                <span className="text-xs font-bold">微信</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                            {/* 支付宝收款码 */}
                            <div className="text-center">
                                <div className="mb-2 text-xs font-bold text-slate-500">支付宝收款码</div>
                                {form.alipayQrCode ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={form.alipayQrCode}
                                            alt="支付宝收款码"
                                            width={100}
                                            height={100}
                                            className="h-[100px] w-[100px] cursor-pointer rounded-[16px] border border-slate-200 object-cover shadow-sm"
                                            onClick={() => setImageModal(form.alipayQrCode)}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, alipayQrCode: '' }))}
                                            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-danger-400 text-xs font-bold text-white shadow-sm"
                                        >×</button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex h-[100px] w-[100px] mx-auto cursor-pointer flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500",
                                        uploadingAlipay && "opacity-50 cursor-not-allowed"
                                    )}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingAlipay}
                                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'alipay')}
                                        />
                                        {uploadingAlipay ? (
                                            <span className="text-xs font-bold">上传中...</span>
                                        ) : (
                                            <>
                                                <span className="text-2xl">+</span>
                                                <span className="text-xs font-bold">支付宝</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="mt-3 text-center text-xs font-medium text-slate-400">请至少上传一个收款码</div>
                    </div>

                    {/* 银行卡信息（根据系统配置显示） */}
                    {requireBankInfo && (
                        <>
                            <div className="border-t border-slate-100 pt-4">
                                <label className="mb-4 block text-sm font-bold text-slate-900">银行卡信息</label>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">开户银行 <span className="text-danger-400">*</span></label>
                                <Select value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} options={[{ value: '', label: '请选择银行' }, ...bankOptions.map(b => ({ value: b, label: b }))]} className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">银行卡号 <span className="text-danger-400">*</span></label>
                                <Input type="text" value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, '') })} placeholder="请输入银行卡号" maxLength={19} className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">持卡人姓名 <span className="text-danger-400">*</span></label>
                                <Input type="text" value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value })} placeholder="请输入持卡人姓名" className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                            </div>
                        </>
                    )}

                    {/* 如果不需要银行卡信息，只显示收款人信息 */}
                    {!requireBankInfo && (
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">收款人姓名 <span className="text-danger-400">*</span></label>
                            <Input type="text" value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value })} placeholder="请输入收款人姓名" className="h-12 w-full rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                        </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-3 rounded-[12px] bg-slate-50 p-3">
                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="h-4 w-4 accent-primary-600 rounded" />
                        <span className="text-sm font-bold text-slate-600">设为默认收款账户</span>
                    </label>
                </div>
                <div className="mt-8 flex justify-end gap-3 border-t border-slate-50 pt-5">
                    <Button
                        variant="secondary"
                        onClick={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false, wechatQrCode: '', alipayQrCode: '' }); }}
                        className="h-11 rounded-[16px] border-none bg-slate-100 px-6 font-bold text-slate-600 shadow-none hover:bg-slate-200"
                    >
                        取消
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={submitting}
                        className={cn(
                            "h-11 rounded-[16px] bg-primary-600 px-6 font-bold text-white shadow-none hover:bg-primary-700",
                            submitting && 'cursor-not-allowed opacity-70'
                        )}
                    >
                        {submitting ? '添加中...' : '确定添加'}
                    </Button>
                </div>
            </Modal>

            {/* Image Preview Modal */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80 backdrop-blur-sm">
                    <Image src={imageModal} alt="预览" width={400} height={400} className="max-h-[90%] max-w-[90%] rounded-[16px] object-contain shadow-2xl" unoptimized />
                </div>
            )}
        </div>
    );
}
