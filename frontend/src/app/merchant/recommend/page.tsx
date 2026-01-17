'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Spinner } from '../../../components/ui/spinner';

interface ReferralStats {
    totalReferrals: number;
    activeReferrals: number;
    totalEarnings: number;
    pendingEarnings: number;
}

interface ReferralRecord {
    id: string;
    merchantNo: string;
    registerTime: string;
    status: 'active' | 'inactive';
    totalOrders: number;
    commission: number;
}

export default function MerchantRecommendPage() {
    const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, activeReferrals: 0, totalEarnings: 0, pendingEarnings: 0 });
    const [records, setRecords] = useState<ReferralRecord[]>([]);
    const [referralCode, setReferralCode] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [featureEnabled, setFeatureEnabled] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) {
            setError('请先登录');
            setLoading(false);
            return;
        }
        try {
            const res = await fetch(`${BASE_URL}/merchant/referral-info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success && json.data) {
                // 检查功能是否启用
                if (json.data.enabled === false) {
                    setFeatureEnabled(false);
                    setLoading(false);
                    return;
                }
                setFeatureEnabled(true);
                setStats(json.data.stats || { totalReferrals: 0, activeReferrals: 0, totalEarnings: 0, pendingEarnings: 0 });
                setRecords(json.data.records || []);
                setReferralCode(json.data.referralCode || '');
                setReferralLink(json.data.referralLink || '');
            } else {
                setError(json.message || '获取数据失败');
            }
        } catch (err) {
            console.error('加载推荐数据失败:', err);
            setError('网络错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center font-bold text-slate-400">
                <Spinner size="lg" />
                <span className="ml-2">加载中...</span>
            </div>
        );
    }

    if (!featureEnabled) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center">
                <div className="mb-6 text-8xl">🚫</div>
                <h2 className="mb-3 text-2xl font-bold text-slate-800">推荐功能暂时关闭</h2>
                <p className="mb-8 text-center text-slate-500">
                    抱歉，商家邀请推荐功能暂时关闭。<br />
                    如需帮助，请联系管理员。
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center font-bold text-slate-400">
                <div className="mb-4 text-danger-400">{error}</div>
                <Button onClick={() => { setError(null); setLoading(true); loadData(); }}>重试</Button>
            </div>
        );
    }

    const statItems = [
        { label: '累计邀请', value: stats.totalReferrals, icon: '👥', color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: '活跃用户', value: stats.activeReferrals, icon: '✅', color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { label: '累计收益', value: `¥${stats.totalEarnings.toFixed(2)}`, icon: '💰', color: 'text-amber-500', bg: 'bg-amber-50' },
        { label: '待结算', value: `¥${stats.pendingEarnings.toFixed(2)}`, icon: '⏳', color: 'text-purple-500', bg: 'bg-purple-50' }
    ];

    return (
        <div className="space-y-8">
            {/* Referral Banner */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-white shadow-lg shadow-emerald-500/20">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <div className="mb-2 text-3xl font-black tracking-tight">邀请好友，共享收益</div>
                        <div className="mb-6 text-emerald-50 font-medium">每成功推荐一位商家，可获得其服务费的 10% 作为奖励</div>
                        {referralCode ? (
                            <div className="flex items-center gap-3">
                                <div className="rounded-[16px] bg-white/20 px-5 py-3 font-mono text-xl font-bold tracking-wider backdrop-blur-sm border border-white/10">{referralCode}</div>
                                <Button
                                    onClick={() => copyToClipboard(referralCode)}
                                    className="h-12 rounded-[16px] bg-white px-6 font-bold text-emerald-600 shadow-lg hover:bg-emerald-50"
                                >
                                    {copied ? '已复制!' : '复制邀请码'}
                                </Button>
                            </div>
                        ) : (
                            <div className="text-sm opacity-80">暂无邀请码</div>
                        )}
                    </div>
                    <div className="text-8xl drop-shadow-lg">🎁</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {statItems.map((stat, idx) => (
                    <Card key={idx} className="rounded-[24px] border-0 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="mb-1 text-sm font-bold text-slate-400">{stat.label}</div>
                                <div className={cn('text-2xl font-black', stat.color)}>{stat.value}</div>
                            </div>
                            <div className={cn("flex h-12 w-12 items-center justify-center rounded-[16px] text-2xl", stat.bg)}>{stat.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Share Options */}
            {referralLink && (
                <Card className="rounded-[24px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <h2 className="mb-6 text-xl font-bold text-slate-900">分享推广</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="mb-2 text-xs font-bold uppercase text-slate-400">推广链接</div>
                            <div className="break-all rounded-[16px] bg-slate-50 px-5 py-4 text-sm font-bold text-slate-700">{referralLink}</div>
                        </div>
                        <Button
                            onClick={() => copyToClipboard(referralLink)}
                            className="h-12 rounded-[16px] bg-slate-900 px-6 font-bold text-white shadow-none hover:bg-slate-800 self-end"
                        >
                            复制链接
                        </Button>
                    </div>
                </Card>
            )}

            {/* Referral Records */}
            <Card className="overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="border-b border-slate-50 px-8 py-6">
                    <h2 className="text-lg font-bold text-slate-900">邀请记录</h2>
                </div>
                {records.length === 0 ? (
                    <div className="py-20 text-center font-bold text-slate-400">
                        <div className="mb-4 text-5xl opacity-20">📭</div>
                        <div className="mb-2">暂无邀请记录</div>
                        <div className="text-sm font-medium opacity-60">快去分享邀请码给好友吧！</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-50 bg-slate-50/50">
                                    <th className="px-8 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">用户</th>
                                    <th className="px-8 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">注册时间</th>
                                    <th className="px-8 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">状态</th>
                                    <th className="px-8 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">订单数</th>
                                    <th className="px-8 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">贡献佣金</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {records.map(record => (
                                    <tr key={record.id} className="transition-colors hover:bg-slate-50/50">
                                        <td className="px-8 py-4 font-bold text-slate-900">{record.username}</td>
                                        <td className="px-8 py-4 text-sm font-medium text-slate-400">{record.registerTime}</td>
                                        <td className="px-8 py-4">
                                            <Badge variant="solid" color={record.status === 'active' ? 'green' : 'slate'} className="rounded-full">
                                                {record.status === 'active' ? '活跃' : '不活跃'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-4 text-sm font-bold text-slate-700">{record.totalOrders}</td>
                                        <td className="px-8 py-4 font-black text-amber-500">¥{record.commission.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Rules */}
            <div className="rounded-[24px] border border-amber-100 bg-amber-50/50 p-6">
                <h3 className="mb-4 flex items-center gap-2 font-bold text-amber-800">
                    <span className="text-xl">📜</span> 推荐规则
                </h3>
                <ul className="list-inside space-y-2 text-sm font-medium text-amber-900/70">
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400"></span>被推荐人通过您的邀请码注册并完成首单后，推荐关系生效</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400"></span>您可获得被推荐人每笔订单服务费的 10% 作为奖励</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400"></span>奖励会在被推荐人订单完成后的次月1日统一结算</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400"></span>同一用户只能被推荐一次，重复推荐无效</li>
                    <li className="flex items-start gap-2"><span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400"></span>平台保留对推荐活动的最终解释权</li>
                </ul>
            </div>
        </div>
    );
}
