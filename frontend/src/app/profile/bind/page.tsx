'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { Button } from '../../../components/ui/button';
import { fetchBuyerAccounts, addBuyerAccount } from '../../../services/userService';
import { MockBuyerAccount } from '../../../mocks/userMock';

export default function BindAccountPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
    const [accounts, setAccounts] = useState<MockBuyerAccount[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => { loadAccounts(); }, []);

    const loadAccounts = async () => { const list = await fetchBuyerAccounts(); setAccounts(list); };

    const [form, setForm] = useState({
        platform: '淘宝', account: '', receiverArgum: '', address: '', phone: '',
        screenshots: { profile: null, taoqizhi: null, alipay: null }
    });

    const platformConfig: Record<string, { accountLabel: string; screenshots: { label: string; sub: string; key: string }[] }> = {
        '淘宝': {
            accountLabel: '淘宝账号', screenshots: [
                { label: '账号截图', sub: '我的淘宝-个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '我的淘宝-评价管理截图', key: 'taoqizhi' },
                { label: '实名截图', sub: '支付宝-实名认证截图', key: 'alipay' }
            ]
        },
        '京东': {
            accountLabel: '京东账号', screenshots: [
                { label: '账号截图', sub: '我的京东-个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '我的京东-京享值截图', key: 'taoqizhi' },
                { label: '实名截图', sub: '京东金融-实名认证截图', key: 'alipay' }
            ]
        },
        '拼多多': {
            accountLabel: '拼多多号', screenshots: [
                { label: '账号截图', sub: '个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '个人中心-评价管理', key: 'taoqizhi' },
                { label: '实名截图', sub: '实名认证截图', key: 'alipay' }
            ]
        }
    };

    const currentConfig = platformConfig[form.platform] || platformConfig['淘宝'];

    const handleSubmit = async () => {
        if (!form.account || !form.receiverArgum) { alert('请完善必填信息'); return; }
        setSubmitting(true);
        try {
            const result = await addBuyerAccount({
                platform: form.platform as any, accountName: form.account,
                receiverName: form.receiverArgum, receiverPhone: form.phone, fullAddress: form.address
            });
            if (result.success) {
                alert(result.message);
                await loadAccounts();
                setActiveTab('list');
                setForm({ platform: '淘宝', account: '', receiverArgum: '', address: '', phone: '', screenshots: { profile: null, taoqizhi: null, alipay: null } });
            } else { alert(result.message); }
        } finally { setSubmitting(false); }
    };

    const getStatusStyle = (status: string | number) => {
        if (status === 'APPROVED' || status === 1) return 'bg-green-50 text-green-500';
        if (status === 'REJECTED' || status === 2) return 'bg-red-50 text-red-500';
        return 'bg-amber-50 text-amber-500';
    };
    const getStatusText = (status: string | number) => {
        if (status === 'APPROVED' || status === 1) return '已审核';
        if (status === 'REJECTED' || status === 2) return '审核失败';
        return '审核中';
    };
    const getPlatformStyle = (platform: string) => {
        if (platform === '淘宝') return 'bg-orange-500';
        if (platform === '京东') return 'bg-red-500';
        return 'bg-red-600';
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-16">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">买号管理</h1>
            </header>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-white">
                <button onClick={() => setActiveTab('list')}
                    className={cn('relative flex-1 py-3 text-center text-sm font-medium', activeTab === 'list' ? 'text-blue-500' : 'text-slate-500')}>
                    买号列表
                    {activeTab === 'list' && <div className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 bg-blue-500" />}
                </button>
                <button onClick={() => setActiveTab('add')}
                    className={cn('relative flex-1 py-3 text-center text-sm font-medium', activeTab === 'add' ? 'text-blue-500' : 'text-slate-500')}>
                    绑定买号
                    {activeTab === 'add' && <div className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 bg-blue-500" />}
                </button>
            </div>

            {/* List View */}
            {activeTab === 'list' && (
                <ProfileContainer className="py-4">
                    {accounts.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
                            <div className="mb-3 text-4xl">📭</div>
                            <div className="text-sm text-slate-400">暂无绑定买号，请点击上方"绑定买号"添加</div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {accounts.map(acc => (
                                <div key={acc.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={cn('rounded px-1.5 py-0.5 text-xs text-white', getPlatformStyle(acc.platform))}>{acc.platform}</span>
                                            <span className="font-medium text-slate-800">{acc.accountName}</span>
                                        </div>
                                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs', getStatusStyle(acc.status))}>{getStatusText(acc.status)}</span>
                                    </div>
                                    <div className="text-sm text-slate-500">收货人：{acc.receiverName || '-'}</div>
                                    {acc.rejectReason && <div className="mt-1 text-sm text-red-500">拒绝原因：{acc.rejectReason}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </ProfileContainer>
            )}

            {/* Add Form */}
            {activeTab === 'add' && (
                <ProfileContainer className="py-4">
                    <div className="mb-2 text-xs text-slate-400">基本信息</div>
                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <FormRow label="平台类型">
                            <select value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none">
                                <option value="淘宝">淘宝</option>
                                <option value="京东">京东</option>
                                <option value="拼多多">拼多多</option>
                            </select>
                        </FormRow>
                        <FormRow label={currentConfig.accountLabel}>
                            <input type="text" placeholder={`请输入${currentConfig.accountLabel}`} value={form.account}
                                onChange={e => setForm({ ...form, account: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                        </FormRow>
                        <FormRow label="收货人" last>
                            <input type="text" placeholder="请输入收货人姓名" value={form.receiverArgum}
                                onChange={e => setForm({ ...form, receiverArgum: e.target.value })}
                                className="flex-1 border-none bg-transparent text-right text-sm text-slate-800 outline-none placeholder:text-slate-400" />
                        </FormRow>
                    </div>

                    <div className="mb-2 text-xs text-slate-400">截图验证</div>
                    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {currentConfig.screenshots.map((item, idx) => (
                            <div key={item.key}
                                className={cn('flex items-center justify-between px-4 py-3', idx < currentConfig.screenshots.length - 1 && 'border-b border-slate-100')}>
                                <div>
                                    <div className="text-sm text-slate-700">{item.label}</div>
                                    <div className="mt-0.5 text-xs text-slate-400">{item.sub}</div>
                                </div>
                                <div className="relative">
                                    <button className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">上传图片</button>
                                    <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button onClick={handleSubmit} loading={submitting} className="w-full bg-blue-500 py-3 hover:bg-blue-600">
                        提交审核
                    </Button>
                    <div className="mt-3 text-center text-xs text-slate-400">提交后预计 1 个工作日内完成审核</div>
                </ProfileContainer>
            )}
        </div>
    );
}

function FormRow({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
    return (
        <div className={cn('flex items-center px-4 py-3', !last && 'border-b border-slate-100')}>
            <span className="w-20 text-sm text-slate-500">{label}</span>
            {children}
        </div>
    );
}
