"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import {
    BuyerAccount,
    list as listAccounts,
    setDefault,
    setStatus,
    remove,
} from "../../../services/buyerAccountService";

const STATUS_MAP: Record<string, { text: string; bg: string; textCol: string }> = {
    PENDING: { text: "审核中", bg: "bg-amber-100/50", textCol: "text-amber-600" },
    APPROVED: { text: "已通过", bg: "bg-blue-600", textCol: "text-white" },
    REJECTED: { text: "已拒绝", bg: "bg-rose-100/50", textCol: "text-rose-600" },
    DISABLED: { text: "已禁用", bg: "bg-slate-100", textCol: "text-slate-400" },
};

export default function BuynoPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [actingId, setActingId] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const list = await listAccounts();
            setAccounts(list);
        } catch (e: any) {
            toastError(e?.message || "加载失败");
        } finally {
            setLoading(false);
        }
    };

    const handleSetDefault = async (id: string, status: string) => {
        if (status !== "APPROVED") {
            toastError("仅已通过的买号可设为默认");
            return;
        }
        setActingId(id);
        try {
            await setDefault(id);
            toastSuccess("已设为默认");
            await loadAccounts();
        } catch (e: any) {
            toastError(e?.message || "设置失败");
        } finally {
            setActingId(null);
        }
    };

    const handleToggleStatus = async (id: string, status: string) => {
        setActingId(id);
        try {
            const next = status === "APPROVED" ? "DISABLED" : "APPROVED";
            await setStatus(id, next as any);
            toastSuccess(next === "APPROVED" ? "已启用" : "已禁用");
            await loadAccounts();
        } catch (e: any) {
            toastError(e?.message || "操作失败");
        } finally {
            setActingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("确定要删除该买号吗？")) return;
        setActingId(id);
        try {
            await remove(id);
            toastSuccess("删除成功");
            await loadAccounts();
        } catch (e: any) {
            toastError(e?.message || "删除失败");
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

    const isEmpty = accounts.length === 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">买号管理</h1>
                    <button onClick={() => router.push('/profile/bind')} className="group flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100 transition-all active:scale-95">
                        <span className="text-xl font-light text-blue-600">+</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 pt-2">
                {/* Capacity Summary */}
                {!isEmpty && (
                    <div className="px-2 pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-slate-900">绑定的买号 ({accounts.length})</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">最多可绑定 10 个买号</p>
                            </div>
                            <div className="flex -space-x-2">
                                {accounts.slice(0, 3).map((_, i) => (
                                    <div key={i} className="h-8 w-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] shadow-sm">👤</div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white shadow-xl shadow-slate-100 text-4xl mb-8">🏪</div>
                        <h3 className="text-lg font-black text-slate-900">尚未绑定买号</h3>
                        <p className="mt-3 text-xs font-medium text-slate-400 leading-relaxed">
                            绑定买号后即可开始接单赚取丰厚奖励<br />支持淘宝、天猫、拼多多等多平台
                        </p>
                        <button
                            onClick={() => router.push('/profile/bind')}
                            className="mt-10 h-14 w-full rounded-[24px] bg-blue-600 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95"
                        >
                            立即开始绑定
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {accounts.map(acc => {
                            const working = actingId === acc.id;
                            const status = STATUS_MAP[acc.status] || STATUS_MAP.DISABLED;
                            const isTaobao = acc.platform.includes('淘宝');

                            return (
                                <Card key={acc.id} className="group relative rounded-[32px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn('flex h-16 w-16 items-center justify-center rounded-[24px] text-2xl shadow-inner transition-transform group-hover:scale-110',
                                                isTaobao ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500')}>
                                                {isTaobao ? '🛒' : '📦'}
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-slate-900 tracking-tight">{acc.platformAccount}</span>
                                                    {acc.isDefault && (
                                                        <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-600">
                                                            DEFAULT
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.platform}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.realName || '已实名'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors',
                                            status.bg.startsWith('bg-blue') ? 'shadow-lg shadow-blue-50' : '',
                                            status.bg, status.textCol)}>
                                            {status.text}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-5">
                                        <div className="flex gap-4">
                                            <button
                                                disabled={working}
                                                onClick={() => router.push(`/profile/buyno/edit/${acc.id}`)}
                                                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-1.5"
                                            >
                                                <span>✏️</span> 编辑
                                            </button>
                                            <button
                                                disabled={working || acc.status !== 'APPROVED'}
                                                onClick={() => handleSetDefault(acc.id, acc.status)}
                                                className={cn('text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5',
                                                    acc.isDefault ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600')}
                                            >
                                                <span>⭐</span> {acc.isDefault ? '默认' : '设为默认'}
                                            </button>
                                        </div>
                                        <div className="flex gap-2 text-xs">
                                            <button
                                                disabled={working}
                                                onClick={() => handleToggleStatus(acc.id, acc.status)}
                                                className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                                            >
                                                {acc.status === 'APPROVED' ? '🚫' : '✅'}
                                            </button>
                                            <button
                                                disabled={working}
                                                onClick={() => handleDelete(acc.id)}
                                                className="h-10 w-10 flex items-center justify-center rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all active:scale-95"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>

                                    {working && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[32px] bg-white/60 backdrop-blur-[2px]">
                                            <Spinner size="sm" className="text-blue-600" />
                                        </div>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Float Action Button */}
            {!isEmpty && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40">
                    <button
                        onClick={() => router.push('/profile/bind')}
                        className="flex items-center gap-3 rounded-full bg-slate-900 px-6 py-4 shadow-2xl transition-all hover:bg-slate-800 active:scale-95"
                    >
                        <span className="text-lg text-white">+</span>
                        <span className="text-xs font-black text-white uppercase tracking-widest">绑定新账号</span>
                    </button>
                </div>
            )}
        </div>
    );
}
