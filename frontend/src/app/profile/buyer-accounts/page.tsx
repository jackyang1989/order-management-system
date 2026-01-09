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
import { PLATFORM_CONFIG, PLATFORM_NAME_MAP } from "../../../constants/platformConfig";

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
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Spinner size="lg" />
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
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">买号管理</h1>
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
                            <Card key={acc.id} className="border-slate-200 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-slate-800">{displayName}</div>
                                        <div className="text-xs text-slate-500">平台：{acc.platform}</div>
                                        <div className="text-xs text-slate-400">{getAccountLabel(acc.platform)}：{displayName}</div>
                                        {acc.isDefault && <div className="text-[11px] text-primary-600">默认买号</div>}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {renderStatus(acc.status)}
                                        <div className="flex flex-wrap justify-end gap-2 text-xs">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={working}
                                                onClick={() => router.push(`/profile/buyer-accounts/edit/${acc.id}`)}
                                            >
                                                编辑
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={working || acc.status !== 'APPROVED'}
                                                onClick={() => handleSetDefault(acc.id, acc.status)}
                                            >
                                                {working && actingId === acc.id ? '...' : '设默认'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled={working}
                                                onClick={() => handleToggleStatus(acc.id, acc.status)}
                                            >
                                                {working && actingId === acc.id ? '...' : acc.status === 'APPROVED' ? '禁用' : '启用'}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={working}
                                                onClick={() => handleDelete(acc.id)}
                                            >
                                                {working && actingId === acc.id ? '...' : '删除'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Fixed Bottom Button */}
            <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[515px] -translate-x-1/2 border-t border-slate-200 bg-white p-4">
                <Button
                    className="w-full bg-primary-500 py-6 text-base font-medium hover:bg-primary-600"
                    onClick={() => router.push('/profile/bind')}
                >
                    绑定新买号
                </Button>
            </div>
        </div>
    );
}
