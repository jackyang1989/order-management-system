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
                    <h1 className="text-2xl font-semibold">收款账户管理</h1>
                    <p className="mt-1 text-sm text-[#6b7280]">绑定收款账户用于接收佣金</p>
                </div>
                <Button onClick={() => setShowAddModal(true)}>+ 添加收款账户</Button>
            </div>

            {/* Cards List */}
            {loading ? (
                <div className="py-16 text-center text-[#6b7280]">加载中...</div>
            ) : cards.length === 0 ? (
                <Card className="bg-white py-16 text-center">
                    <div className="mb-4 text-5xl">💳</div>
                    <div className="mb-6 text-[#6b7280]">暂未添加收款账户</div>
                    <Button onClick={() => setShowAddModal(true)}>立即添加</Button>
                </Card>
            ) : (
                <div className="grid grid-cols-2 gap-5">
                    {cards.map(card => (
                        <div key={card.id} className="relative min-h-[180px] rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 p-6 text-white">
                            {card.isDefault && (
                                <span className="absolute right-4 top-4 rounded-full bg-white/20 px-3 py-1 text-xs">默认</span>
                            )}
                            <div className="mb-4 text-lg font-semibold">{card.bankName || '收款账户'}</div>
                            {card.cardNumber && (
                                <div className="mb-4 font-mono text-xl tracking-wider">{maskCardNumber(card.cardNumber)}</div>
                            )}
                            {/* 收款码标识 */}
                            <div className="mb-4 flex gap-2">
                                {card.wechatQrCode && (
                                    <span className="rounded bg-white/20 px-2 py-1 text-xs">微信 ✓</span>
                                )}
                                {card.alipayQrCode && (
                                    <span className="rounded bg-white/20 px-2 py-1 text-xs">支付宝 ✓</span>
                                )}
                            </div>
                            <div className="flex items-end justify-between">
                                <div className="text-sm opacity-90">{card.cardHolder || card.accountName}</div>
                                <div className="flex gap-3">
                                    {!card.isDefault && (
                                        <button onClick={() => handleSetDefault(card.id)} className="rounded-md bg-white/20 px-3 py-1.5 text-xs">设为默认</button>
                                    )}
                                    <button onClick={() => handleDelete(card.id)} className="rounded-md bg-white/20 px-3 py-1.5 text-xs">删除</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            <Modal title="添加收款账户" open={showAddModal} onClose={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false, wechatQrCode: '', alipayQrCode: '' }); }} className="max-w-md">
                <div className="space-y-4">
                    {/* 收款码上传区域 */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-[#4b5563]">收款码上传 <span className="text-danger-400">*</span></label>
                        <div className="grid grid-cols-2 gap-4">
                            {/* 微信收款码 */}
                            <div className="text-center">
                                <div className="mb-1 text-xs text-[#6b7280]">微信收款码</div>
                                {form.wechatQrCode ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={form.wechatQrCode}
                                            alt="微信收款码"
                                            width={100}
                                            height={100}
                                            className="h-[100px] w-[100px] cursor-pointer rounded border border-green-200 object-cover"
                                            onClick={() => setImageModal(form.wechatQrCode)}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, wechatQrCode: '' }))}
                                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                                        >×</button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex h-[100px] w-[100px] mx-auto cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-green-300 bg-green-50 text-green-500 transition-colors hover:bg-green-100",
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
                                            <span className="text-xs">上传中...</span>
                                        ) : (
                                            <>
                                                <span className="text-2xl">+</span>
                                                <span className="text-xs">点击上传</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                            {/* 支付宝收款码 */}
                            <div className="text-center">
                                <div className="mb-1 text-xs text-[#6b7280]">支付宝收款码</div>
                                {form.alipayQrCode ? (
                                    <div className="relative inline-block">
                                        <Image
                                            src={form.alipayQrCode}
                                            alt="支付宝收款码"
                                            width={100}
                                            height={100}
                                            className="h-[100px] w-[100px] cursor-pointer rounded border border-blue-200 object-cover"
                                            onClick={() => setImageModal(form.alipayQrCode)}
                                            unoptimized
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, alipayQrCode: '' }))}
                                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                                        >×</button>
                                    </div>
                                ) : (
                                    <label className={cn(
                                        "flex h-[100px] w-[100px] mx-auto cursor-pointer flex-col items-center justify-center rounded border-2 border-dashed border-blue-300 bg-blue-50 text-blue-500 transition-colors hover:bg-blue-100",
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
                                            <span className="text-xs">上传中...</span>
                                        ) : (
                                            <>
                                                <span className="text-2xl">+</span>
                                                <span className="text-xs">点击上传</span>
                                            </>
                                        )}
                                    </label>
                                )}
                            </div>
                        </div>
                        <div className="mt-2 text-center text-xs text-[#9ca3af]">至少上传一个收款码</div>
                    </div>

                    {/* 银行卡信息（根据系统配置显示） */}
                    {requireBankInfo && (
                        <>
                            <div className="border-t border-[#e5e7eb] pt-4">
                                <label className="mb-2 block text-sm font-medium text-[#4b5563]">银行卡信息</label>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm text-[#4b5563]">开户银行 <span className="text-danger-400">*</span></label>
                                <Select value={form.bankName} onChange={v => setForm({ ...form, bankName: v })} options={[{ value: '', label: '请选择银行' }, ...bankOptions.map(b => ({ value: b, label: b }))]} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm text-[#4b5563]">银行卡号 <span className="text-danger-400">*</span></label>
                                <Input type="text" value={form.cardNumber} onChange={e => setForm({ ...form, cardNumber: e.target.value.replace(/\D/g, '') })} placeholder="请输入银行卡号" maxLength={19} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm text-[#4b5563]">持卡人姓名 <span className="text-danger-400">*</span></label>
                                <Input type="text" value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value })} placeholder="请输入持卡人姓名" />
                            </div>
                        </>
                    )}

                    {/* 如果不需要银行卡信息，只显示收款人信息 */}
                    {!requireBankInfo && (
                        <div>
                            <label className="mb-1.5 block text-sm text-[#4b5563]">收款人姓名 <span className="text-danger-400">*</span></label>
                            <Input type="text" value={form.cardHolder} onChange={e => setForm({ ...form, cardHolder: e.target.value })} placeholder="请输入收款人姓名" />
                        </div>
                    )}

                    <label className="flex cursor-pointer items-center gap-2">
                        <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} />
                        <span className="text-sm text-[#4b5563]">设为默认收款账户</span>
                    </label>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="secondary" onClick={() => { setShowAddModal(false); setForm({ bankName: '', cardNumber: '', cardHolder: '', isDefault: false, wechatQrCode: '', alipayQrCode: '' }); }}>取消</Button>
                    <Button onClick={handleAdd} disabled={submitting} className={cn(submitting && 'cursor-not-allowed opacity-70')}>{submitting ? '添加中...' : '确定添加'}</Button>
                </div>
            </Modal>

            {/* Image Preview Modal */}
            {imageModal && (
                <div onClick={() => setImageModal(null)} className="fixed inset-0 z-[1100] flex cursor-zoom-out items-center justify-center bg-black/80">
                    <Image src={imageModal} alt="预览" width={400} height={400} className="max-h-[90%] max-w-[90%] object-contain" unoptimized />
                </div>
            )}
        </div>
    );
}
