'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchBankCards, addBankCard, deleteBankCard, setDefaultBankCard, BankCard } from '../../../services/userService';

export default function PaymentSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [cards, setCards] = useState<BankCard[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        bankName: '', accountName: '', cardNumber: '', phone: '',
        province: '', city: '', branchName: '', alipayQrCode: '', wechatQrCode: ''
    });

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadCards(); }, []);

    const loadCards = async () => {
        setLoading(true);
        try { const result = await fetchBankCards(); setCards(result); }
        catch (error) { console.error('Load cards error:', error); }
        finally { setLoading(false); }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.bankName || !form.accountName || !form.cardNumber) { toastError('请填写完整必填信息'); return; }
        setSubmitting(true);
        try {
            const result = await addBankCard(form);
            if (result.success) {
                toastSuccess('银行卡添加成功');
                setShowAddModal(false);
                setForm({ bankName: '', accountName: '', cardNumber: '', phone: '', province: '', city: '', branchName: '', alipayQrCode: '', wechatQrCode: '' });
                loadCards();
            }
            else { toastError(result.message || '添加失败'); }
        } catch (error) { toastError('网络错误'); }
        finally { setSubmitting(false); }
    };

    const handleDeleteCard = async (id: string) => {
        if (!confirm('确定要删除这张银行卡吗？')) return;
        try {
            const result = await deleteBankCard(id);
            if (result.success) { toastSuccess('删除成功'); loadCards(); }
            else { toastError(result.message); }
        } catch (error) { toastError('网络错误'); }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const result = await setDefaultBankCard(id);
            if (result.success) { toastSuccess('设置成功'); loadCards(); }
            else { toastError(result.message); }
        } catch (error) { toastError('网络错误'); }
    };

    const getBankColor = (bankName: string) => {
        if (bankName.includes('招商')) return 'bg-red-600 shadow-red-100';
        if (bankName.includes('工商')) return 'bg-rose-700 shadow-rose-100';
        if (bankName.includes('建设')) return 'bg-blue-800 shadow-blue-100';
        if (bankName.includes('农业')) return 'bg-emerald-700 shadow-emerald-100';
        if (bankName.includes('中国银行')) return 'bg-red-800 shadow-red-100';
        return 'bg-slate-800 shadow-slate-100';
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">银行卡管理</h1>
                    <button onClick={() => setShowAddModal(true)} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition active:scale-90">
                        <span className="text-2xl font-light">+</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {loading ? (
                    <div className="flex py-20 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner">💳</div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">暂未绑定银行卡</h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">提现前请先绑定您的收款账户</p>
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="w-full rounded-[24px] bg-blue-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-50 transition active:scale-95">
                            立即去绑定
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cards.map(card => (
                            <div key={card.id} className={cn('relative rounded-[32px] p-8 text-white shadow-2xl transition-all active:scale-[0.98]', getBankColor(card.bankName))}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner text-2xl font-black">
                                            {card.bankName.slice(0, 1)}
                                        </div>
                                        <div>
                                            <div className="text-lg font-black tracking-tight">{card.bankName}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">储蓄卡</div>
                                        </div>
                                    </div>
                                    {card.isDefault && (
                                        <Badge className="rounded-full bg-white/20 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white border-none shadow-none backdrop-blur-md">
                                            Default
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-10 mb-8 flex justify-between items-end">
                                    <div className="text-2xl font-black tracking-[0.15em] font-mono">
                                        **** **** **** {card.cardNumber.slice(-4)}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">CARD HOLDER</div>
                                        <div className="text-xs font-black">{card.accountName}</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-6 pt-4 border-t border-white/10">
                                    {!card.isDefault && (
                                        <button onClick={() => handleSetDefault(card.id)} className="text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition">设为默认</button>
                                    )}
                                    <button onClick={() => handleDeleteCard(card.id)} className="text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition">移除卡片</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Binding Tips */}
                <div className="rounded-[24px] bg-amber-50 p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-900">
                        <span>⚠️</span> 绑定须知
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold leading-relaxed text-amber-700/80">
                        <li className="flex gap-2"><span>•</span>请核对开户行及支行信息，防止提现失败</li>
                        <li className="flex gap-2"><span>•</span>持卡人姓名必须与实名认证一致</li>
                        <li className="flex gap-2"><span>•</span>建议绑定主流银行卡以获得更佳到账速度</li>
                    </ul>
                </div>
            </div>

            {/* Flat Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300 sm:items-center">
                    <div className="w-full max-w-[515px] animate-in fade-in slide-in-from-bottom-10 rounded-t-[32px] bg-white p-8 shadow-2xl sm:rounded-[32px]">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-2xl shadow-inner">🏦</div>
                            <h3 className="text-xl font-black text-slate-900">添加银行卡</h3>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">请录入真实的账户信息</p>
                        </div>
                        <form onSubmit={handleAddCard} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">银行名称 <span className="text-red-500">*</span></label>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="如：招商银行" value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">持卡人姓名 <span className="text-red-500">*</span></label>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="姓名" value={form.accountName} onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">银行卡号 <span className="text-red-500">*</span></label>
                                <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="请输入银行卡号" value={form.cardNumber} onChange={e => setForm(f => ({ ...f, cardNumber: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">开户省份</label>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="省份" value={form.province} onChange={e => setForm(f => ({ ...f, province: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">开户城市</label>
                                    <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="城市" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">支行信息 <span className="text-red-500">*</span></label>
                                <input className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-900 focus:outline-none shadow-inner" placeholder="如：某某支行" value={form.branchName} onChange={e => setForm(f => ({ ...f, branchName: e.target.value }))} />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} disabled={submitting} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-bold text-slate-400 transition active:scale-95">取消</button>
                                <button type="submit" disabled={submitting} className={cn('flex-1 rounded-[20px] py-4 text-sm font-bold text-white shadow-lg shadow-blue-50 transition active:scale-95',
                                    submitting ? 'bg-slate-200' : 'bg-blue-600 shadow-blue-100')}>
                                    {submitting ? '处理中...' : '确认绑定'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
