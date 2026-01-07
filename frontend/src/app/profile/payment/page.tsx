"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import { Modal } from "../../../components/ui/modal";
import {
    BankCard,
    list as listCards,
    create as createCard,
    setDefault,
    remove,
} from "../../../services/bankCardService";

export default function BankCardPage() {
    const router = useRouter();
    const [cards, setCards] = useState<BankCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        bankName: "",
        cardNo: "",
        realName: "",
        isDefault: false,
    });

    useEffect(() => {
        loadCards();
    }, []);

    const loadCards = async () => {
        setLoading(true);
        try {
            const list = await listCards();
            setCards(list);
        } catch (e: any) {
            toastError("加载失败: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.bankName || !form.cardNo || !form.realName) {
            toastError("请填写完整信息");
            return;
        }
        setSubmitting(true);
        try {
            await createCard(form);
            toastSuccess("绑定成功");
            setShowAddModal(false);
            setForm({ bankName: "", cardNo: "", realName: "", isDefault: false });
            loadCards();
        } catch (e: any) {
            toastError("绑定失败: " + e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSetDefault = async (id: string) => {
        setActingId(id);
        try {
            await setDefault(id);
            toastSuccess("已设为默认");
            loadCards();
        } catch (e: any) {
            toastError("设置失败: " + e.message);
        } finally {
            setActingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要解绑该银行卡吗？")) return;
        setActingId(id);
        try {
            await remove(id);
            toastSuccess("解绑成功");
            loadCards();
        } catch (e: any) {
            toastError("操作失败: " + e.message);
        } finally {
            setActingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <Spinner size="lg" className="text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">绑卡管理</h1>
                    <button onClick={() => setShowAddModal(true)} className="group flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition-all active:scale-95">
                        <span className="text-xl font-light text-blue-600">+</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 pt-6 space-y-6">
                {cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-xl shadow-slate-100 text-4xl mb-8 font-light italic">🏧</div>
                        <h3 className="text-lg font-black text-slate-900 tracking-tight">尚未添加银行卡</h3>
                        <p className="mt-3 text-xs font-medium text-slate-400 leading-relaxed italic">
                            添加银行卡后即可申请提现<br />资金将安全打入您的实名账户
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-10 h-14 w-full rounded-[24px] bg-blue-600 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95"
                        >
                            立即添加银行卡
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="px-2">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">已绑定的收款账户</h3>
                        </div>
                        {cards.map(card => {
                            const acting = actingId === card.id;
                            const isCCB = card.bankName.includes('建设');
                            const isICBC = card.bankName.includes('工商');
                            const isABC = card.bankName.includes('农业');

                            return (
                                <Card key={card.id}
                                    className={cn('relative rounded-[32px] border-none p-8 text-white shadow-2xl transition-all active:scale-[0.98] overflow-hidden group',
                                        isCCB ? 'bg-blue-600 shadow-blue-100' : isICBC ? 'bg-rose-600 shadow-rose-100' : isABC ? 'bg-emerald-600 shadow-emerald-100' : 'bg-slate-800 shadow-slate-200')}>
                                    <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl transition-transform group-hover:scale-110" />

                                    <div className="relative z-10 flex items-start justify-between">
                                        <div className="space-y-1">
                                            <div className="text-xl font-black tracking-tight">{card.bankName}</div>
                                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">Debit Card</div>
                                        </div>
                                        {card.isDefault && (
                                            <span className="rounded-full bg-white/20 px-3 py-1 text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">DEFAULT</span>
                                        )}
                                    </div>

                                    <div className="relative z-10 mt-12">
                                        <div className="text-xl font-black tracking-[0.15em] font-mono">
                                            **** **** **** {card.cardNo.slice(-4)}
                                        </div>
                                        <div className="mt-6 flex items-end justify-between">
                                            <div className="space-y-1">
                                                <div className="text-[8px] font-bold uppercase tracking-widest opacity-40">Card Holder</div>
                                                <div className="text-xs font-black uppercase tracking-wider">{card.realName}</div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!card.isDefault && (
                                                    <button onClick={() => handleSetDefault(card.id)} disabled={acting} className="rounded-full bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-widest backdrop-blur-sm transition hover:bg-white/20">设为默认</button>
                                                )}
                                                <button onClick={() => handleDelete(card.id)} disabled={acting} className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm transition hover:bg-rose-500/30 text-[10px]">🗑️</button>
                                            </div>
                                        </div>
                                    </div>

                                    {acting && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-sm rounded-[32px]">
                                            <Spinner size="sm" className="text-white" />
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Redesigned Add Modal */}
            <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="添加银行卡">
                <div className="p-8 pb-10">
                    <form onSubmit={handleAddCard} className="space-y-6">
                        <div className="space-y-2">
                            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">开户行名称</label>
                            <input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="例如：中国建设银行"
                                className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none border-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">银行卡号</label>
                            <input value={form.cardNo} onChange={e => setForm({ ...form, cardNo: e.target.value.replace(/\D/g, '') })} placeholder="请输入 16-19 位卡号" maxLength={19}
                                className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none border-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="px-2 text-[10px] font-black uppercase tracking-widest text-slate-400">持卡人姓名</label>
                            <input value={form.realName} onChange={e => setForm({ ...form, realName: e.target.value })} placeholder="必须与银行预留信息一致"
                                className="w-full rounded-[20px] bg-slate-50 px-5 py-4 text-xs font-black text-slate-900 shadow-inner focus:outline-none border-none" />
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={submitting}
                                className="w-full rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                                {submitting ? <Spinner size="sm" /> : '立即绑定收款账户'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}
