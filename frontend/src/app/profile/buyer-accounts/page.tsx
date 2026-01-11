"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Empty } from "../../../components/ui/empty";
import {
    BuyerAccount,
    list as listAccounts,
    setDefault,
    setStatus,
    remove,
} from "../../../services/buyerAccountService";
import { PLATFORM_CONFIG, PLATFORM_NAME_MAP } from "../../../constants/platformConfig";
import { cn } from "../../../lib/utils";
import Image from "next/image";

// 根据平台名获取对应的账号标签
const getAccountLabel = (platformName: string): string => {
    const platformId = PLATFORM_NAME_MAP[platformName];
    if (platformId && PLATFORM_CONFIG[platformId]) {
        return PLATFORM_CONFIG[platformId].accountLabel;
    }
    return `${platformName}账号`;
};

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
    const [error, setError] = useState<string>('');
    const [actingId, setActingId] = useState<string | null>(null);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        setLoading(true);
        setError('');
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
        return <Badge variant="soft" color={color} className="font-bold">{STATUS_TEXT[status] || status}</Badge>;
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] pb-24">
                <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                    <div className="flex h-16 items-center justify-between px-6">
                        <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                        <h1 className="flex-1 text-xl font-bold text-slate-900">买号管理</h1>
                    </div>
                </header>
                <div className="mx-auto max-w-[515px] px-4 py-10">
                    <Empty
                        title="加载失败"
                        description={error}
                        action={<Button onClick={loadAccounts} className="rounded-full font-bold">重试</Button>}
                    />
                </div>
            </div>
        );
    }

    const isEmpty = accounts.length === 0;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <header className="sticky top-0 z-10 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center justify-between px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">买号管理</h1>
                    <button
                        onClick={() => router.push('/profile/bind')}
                        className="flex h-9 items-center rounded-full bg-primary-600 px-4 text-xs font-bold text-white transition-transform active:scale-95"
                    >
                        绑定
                    </button>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] cx px-4 py-4 space-y-4">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center rounded-[24px] bg-white p-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="mb-4 text-4xl">🛍️</div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900">暂无买号</h3>
                        <p className="mb-6 text-sm font-medium text-slate-400">去绑定一个买号开始使用吧</p>
                        <Button className="h-10 rounded-full bg-primary-600 px-8 font-bold hover:bg-primary-700" onClick={() => router.push('/profile/bind')}>去绑定</Button>
                    </div>
                ) : (
                    accounts.map(acc => {
                        const displayName = acc.platformAccount;
                        const working = actingId === acc.id;
                        return (
                            <div key={acc.id} className={cn('relative overflow-hidden rounded-[24px] border-none bg-white p-6 transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]', acc.isDefault ? 'ring-2 ring-primary-600' : '')}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-lg font-black text-slate-900">{displayName}</div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">{acc.platform}</span>
                                            {acc.isDefault && <span className="rounded-lg bg-primary-50 px-2 py-0.5 text-xs font-bold text-primary-600">默认</span>}
                                        </div>
                                        <div className="mt-1 text-xs font-medium text-slate-400">{getAccountLabel(acc.platform)}：{displayName}</div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {renderStatus(acc.status)}
                                    </div>
                                </div>
                                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-50 pt-4">
                                    <button
                                        disabled={working}
                                        onClick={() => router.push(`/profile/buyer-accounts/edit/${acc.id}`)}
                                        className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        编辑
                                    </button>
                                    <button
                                        disabled={working || acc.status !== 'APPROVED'}
                                        onClick={() => handleSetDefault(acc.id, acc.status)}
                                        className="rounded-lg bg-primary-50 px-3 py-2 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-100 disabled:opacity-50"
                                    >
                                        {working && actingId === acc.id ? '...' : '设默认'}
                                    </button>
                                    <button
                                        disabled={working}
                                        onClick={() => handleToggleStatus(acc.id, acc.status)}
                                        className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50"
                                    >
                                        {working && actingId === acc.id ? '...' : acc.status === 'APPROVED' ? '禁用' : '启用'}
                                    </button>
                                    <button
                                        disabled={working}
                                        onClick={() => handleDelete(acc.id)}
                                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-danger-400 transition-colors hover:bg-red-100 disabled:opacity-50"
                                    >
                                        {working && actingId === acc.id ? '...' : '删除'}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Fixed Bottom Button - keeping broadly consistent with logic but styling improved */}
            <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[515px] -translate-x-1/2 bg-white/80 backdrop-blur-md px-4 py-4 border-t border-slate-100">
                <Button
                    className="w-full h-12 rounded-full bg-primary-600 text-base font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700"
                    onClick={() => router.push('/profile/bind')}
                >
                    绑定新买号
                </Button>
            </div>
        </div>
    );
}
