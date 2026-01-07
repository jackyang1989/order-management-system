"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import { Empty } from "../../../components/ui/empty";
import {
    BuyerAccount,
    list as listAccounts,
    setDefault,
    setStatus,
    remove,
} from "../../../services/buyerAccountService";

const STATUS_TEXT: Record<string, string> = {
    PENDING: "审核中",
    APPROVED: "已通过",
    REJECTED: "已拒绝",
    DISABLED: "已禁用",
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

    const renderStatus = (status: string) => {
        const color = status === "APPROVED" ? "green" : status === "PENDING" ? "amber" : "red";
        return <Badge variant="soft" color={color}>{STATUS_TEXT[status] || status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <Spinner size="lg" className="text-blue-600" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <div className="mx-auto max-w-[515px] px-4 py-10">
                    <Empty
                        title="加载失败"
                        description={error}
                        action={<Button onClick={loadAccounts}>重试</Button>}
                    />
                </div>
            </div>
        );
    }

    const isEmpty = accounts.length === 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-40">
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">买号管理</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 py-4 space-y-4">
                {isEmpty ? (
                    <Empty
                        title="暂无买号"
                        description="去绑定一个买号开始使用吧"
                        action={<Button onClick={() => router.push('/profile/bind')}>去绑定</Button>}
                    />
                ) : (
                    accounts.map(acc => {
                        const displayName = acc.platformAccount;
                        const working = actingId === acc.id;
                        return (
                            <Card key={acc.id} className="rounded-[24px] border-none bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl shadow-inner border border-white">
                                        {acc.platform === '淘宝' ? '🛍️' : acc.platform === '京东' ? '🐶' : acc.platform === '拼多多' ? '🍎' : '👤'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                                            {displayName}
                                            {acc.isDefault && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-600 uppercase tracking-widest">DEFAULT</span>}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">ID: {acc.id.slice(0, 8)} • {acc.platform}</div>
                                    </div>
                                    <div>{renderStatus(acc.status)}</div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2 pt-5 border-t border-slate-50">
                                    <Button size="sm" variant="secondary" disabled={working} onClick={() => router.push(`/profile/buyno/edit/${acc.id}`)}
                                        className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest">编辑</Button>
                                    <Button size="sm" variant="secondary" disabled={working || acc.status !== 'APPROVED'} onClick={() => handleSetDefault(acc.id, acc.status)}
                                        className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest">
                                        {working && actingId === acc.id ? '...' : '设默认'}
                                    </Button>
                                    <Button size="sm" variant="secondary" disabled={working} onClick={() => handleToggleStatus(acc.id, acc.status)}
                                        className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest">
                                        {working && actingId === acc.id ? '...' : acc.status === 'APPROVED' ? '禁用' : '启用'}
                                    </Button>
                                    <Button size="sm" variant="destructive" disabled={working} onClick={() => handleDelete(acc.id)}
                                        className="h-9 rounded-full px-4 text-[10px] font-black uppercase tracking-widest">
                                        {working && actingId === acc.id ? '...' : '删除'}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl">
                <Button className="w-full rounded-[24px] bg-slate-900 py-8 text-sm font-black uppercase tracking-widest text-white shadow-2xl transition-transform active:scale-95"
                    onClick={() => router.push('/profile/bind')}>
                    绑定新买号
                </Button>
            </div>
        </div>
    );
}
