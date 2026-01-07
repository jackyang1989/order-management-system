"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileContainer from "../../../components/ProfileContainer";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { toastError, toastSuccess } from "../../../lib/toast";
import { Spinner } from "../../../components/ui/spinner";
import {
    BuyerAccount,
    list as listAccounts,
    create as createAccount,
} from "../../../services/buyerAccountService";

export default function BindAccountPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        platform: "淘宝" as "淘宝" | "京东" | "拼多多",
        accountId: "",
        accountName: "",
    });

    const boundCount = useMemo(() => accounts.length, [accounts]);

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

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        const accountId = form.accountId.trim();
        const accountName = (form.accountName || accountId).trim();
        if (!form.platform || !accountId) {
            toastError("请填写必填信息");
            return;
        }
        setSubmitting(true);
        try {
            await createAccount({
                platform: form.platform,
                accountId,
                accountName,
            });
            toastSuccess("提交成功，等待审核");
            router.push("/profile/buyno");
        } catch (e: any) {
            toastError(e?.message || "提交失败");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
                <div className="mx-auto flex h-14 max-w-[515px] items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">绑定买号</h1>
                </div>
            </header>

            <ProfileContainer className="py-4 space-y-4">
                <Card className="border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                        <div>已绑定买号</div>
                        {loading ? (
                            <div className="flex items-center gap-2"><Spinner size="sm" /> 加载中...</div>
                        ) : (
                            <div>{boundCount} 个</div>
                        )}
                    </div>
                </Card>

                <Card className="border-slate-200 p-5 shadow-sm">
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">选择平台 <span className="text-red-500">*</span></label>
                            <select
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                value={form.platform}
                                onChange={e => setForm(f => ({ ...f, platform: e.target.value as any }))}
                            >
                                <option value="淘宝">淘宝</option>
                                <option value="京东">京东</option>
                                <option value="拼多多">拼多多</option>
                            </select>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">账号ID <span className="text-red-500">*</span></label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="账号唯一标识"
                                value={form.accountId}
                                onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-slate-500">展示名称</label>
                            <input
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
                                placeholder="用于列表展示，默认同账号ID"
                                value={form.accountName}
                                onChange={e => setForm(f => ({ ...f, accountName: e.target.value }))}
                            />
                        </div>
                        <Button type="submit" loading={submitting} className="mt-2 w-full bg-blue-500 py-6 text-base font-medium hover:bg-blue-600">
                            提交申请
                        </Button>
                    </form>
                </Card>
            </ProfileContainer>
        </div>
    );
}
