"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import {
    BuyerAccount,
    list as listAccounts,
    setDefault,
    setStatus,
    remove,
} from "../../../services/buyerAccountService";

const STATUS_CONFIG: Record<string, { text: string; bg: string; textCol: string }> = {
    PENDING: { text: "审核中", bg: "bg-amber-50", textCol: "text-amber-600" },
    APPROVED: { text: "已通过", bg: "bg-emerald-50", textCol: "text-emerald-600" },
    REJECTED: { text: "已拒绝", bg: "bg-rose-50", textCol: "text-rose-600" },
    DISABLED: { text: "已禁用", bg: "bg-slate-50", textCol: "text-slate-400" },
};

export default function BuynoPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actingId, setActingId] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await listAccounts();
            setAccounts(list);
        } catch (e: any) {
            setError(e?.message || "加载失败");
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
                    <button onClick={() => router.push('/profile/bind')} className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition active:scale-90">
                        <span className="text-2xl font-light">+</span>
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 py-4 space-y-6">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center py-32 px-8 text-center space-y-6">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner">👤</div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">暂无买号</h3>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">目前没有任何绑定的买号，请先去绑定</p>
                        </div>
                        <button onClick={() => router.push('/profile/bind')} className="w-full rounded-[24px] bg-blue-600 py-4 text-sm font-black text-white shadow-xl shadow-blue-50 transition active:scale-95">
                            立即去绑定
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {accounts.map(acc => {
                            const displayName = acc.platformAccount;
                            const working = actingId === acc.id;
                            const status = STATUS_CONFIG[acc.status] || STATUS_CONFIG.DISABLED;
                            const isTaobao = acc.platform.includes('淘宝');

                            return (
                                <div key={acc.id} className="relative rounded-[32px] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all active:scale-[0.98]">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={cn('flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-inner',
                                                isTaobao ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500')}>
                                                {isTaobao ? '🛒' : '🏪'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-base font-black text-slate-900 tracking-tight">{displayName}</span>
                                                    {acc.isDefault && (
                                                        <Badge className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-600 border-none shadow-none">
                                                            DEFAULT
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                                    平台: {acc.platform}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest', status.bg, status.textCol)}>
                                            {status.text}
                                        </div>
                                    </div>

                                    <div className="mt-8 grid grid-cols-4 gap-2">
                                        <button
                                            disabled={working}
                                            onClick={() => router.push(`/profile/buyno/edit/${acc.id}`)}
                                            className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-slate-50 py-3 transition active:scale-90"
                                        >
                                            <span className="text-xs">✏️</span>
                                            <span className="text-[9px] font-black text-slate-600">编辑</span>
                                        </button>
                                        <button
                                            disabled={working || acc.status !== 'APPROVED'}
                                            onClick={() => handleSetDefault(acc.id, acc.status)}
                                            className={cn('flex flex-col items-center justify-center gap-2 rounded-[20px] py-3 transition active:scale-90',
                                                acc.isDefault ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600')}
                                        >
                                            <span className="text-xs">⭐</span>
                                            <span className="text-[9px] font-black">{acc.isDefault ? '已默认' : '设默认'}</span>
                                        </button>
                                        <button
                                            disabled={working}
                                            onClick={() => handleToggleStatus(acc.id, acc.status)}
                                            className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-slate-50 py-3 transition active:scale-90"
                                        >
                                            <span className="text-xs">{acc.status === 'APPROVED' ? '🚫' : '✅'}</span>
                                            <span className="text-[9px] font-black text-slate-600">{acc.status === 'APPROVED' ? '禁用' : '启用'}</span>
                                        </button>
                                        <button
                                            disabled={working}
                                            onClick={() => handleDelete(acc.id)}
                                            className="flex flex-col items-center justify-center gap-2 rounded-[20px] bg-rose-50 py-3 text-rose-500 transition active:scale-90"
                                        >
                                            <span className="text-xs">🗑️</span>
                                            <span className="text-[9px] font-black">删除</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Bottom Button */}
            <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-6 backdrop-blur-xl border-t border-slate-50">
                <button
                    className="w-full rounded-[24px] bg-blue-600 py-5 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95"
                    onClick={() => router.push('/profile/bind')}
                >
                    绑定新买号
                </button>
            </div>
        </div>
    );
}
