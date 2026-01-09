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
    username: string;
    registerTime: string;
    status: 'active' | 'inactive';
    totalOrders: number;
    commission: number;
}

const statColorMap: Record<string, string> = { blue: 'text-primary-500', green: 'text-success-400', amber: 'text-warning-400', purple: 'text-purple-500' };

export default function MerchantRecommendPage() {
    const [stats, setStats] = useState<ReferralStats>({ totalReferrals: 0, activeReferrals: 0, totalEarnings: 0, pendingEarnings: 0 });
    const [records, setRecords] = useState<ReferralRecord[]>([]);
    const [referralCode, setReferralCode] = useState('');
    const [referralLink, setReferralLink] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            <div className="flex h-[400px] items-center justify-center text-[#6b7280]">
                <Spinner size="lg" />
                <span className="ml-2">加载中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center text-[#6b7280]">
                <div className="mb-4 text-danger-400">{error}</div>
                <Button onClick={() => { setError(null); setLoading(true); loadData(); }}>重试</Button>
            </div>
        );
    }

    const statItems = [
        { label: '累计邀请', value: stats.totalReferrals, icon: '👥', colorKey: 'blue' },
        { label: '活跃用户', value: stats.activeReferrals, icon: '✅', colorKey: 'green' },
        { label: '累计收益', value: `¥${stats.totalEarnings.toFixed(2)}`, icon: '💰', colorKey: 'amber' },
        { label: '待结算', value: `¥${stats.pendingEarnings.toFixed(2)}`, icon: '⏳', colorKey: 'purple' }
    ];

    return (
        <div className="space-y-6">
            {/* Referral Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-green-500 to-green-600 p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="mb-2 text-2xl font-bold">邀请好友，共享收益</div>
                        <div className="mb-4 text-sm opacity-90">每成功推荐一位商家，可获得其服务费的 10% 作为奖励</div>
                        {referralCode ? (
                            <div className="flex items-center gap-3">
                                <div className="rounded-md bg-white/20 px-5 py-3 font-mono text-base tracking-wider">{referralCode}</div>
                                <Button onClick={() => copyToClipboard(referralCode)} className="bg-white font-medium text-success-400 hover:bg-[#f9fafb]">{copied ? '已复制!' : '复制邀请码'}</Button>
                            </div>
                        ) : (
                            <div className="text-sm opacity-80">暂无邀请码</div>
                        )}
                    </div>
                    <div className="text-7xl">🎁</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                {statItems.map((stat, idx) => (
                    <Card key={idx} className="bg-white p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="mb-2 text-sm text-[#6b7280]">{stat.label}</div>
                                <div className={cn('text-2xl font-bold', statColorMap[stat.colorKey])}>{stat.value}</div>
                            </div>
                            <div className="text-3xl">{stat.icon}</div>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Share Options */}
            {referralLink && (
                <Card className="bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold">分享推广</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="mb-2 text-sm text-[#6b7280]">推广链接</div>
                            <div className="break-all rounded-md bg-[#f3f4f6] px-4 py-3 text-sm text-[#374151]">{referralLink}</div>
                        </div>
                        <Button onClick={() => copyToClipboard(referralLink)}>复制链接</Button>
                    </div>
                </Card>
            )}

            {/* Referral Records */}
            <Card className="overflow-hidden bg-white p-0">
                <div className="border-b border-[#f3f4f6] px-6 py-5">
                    <h2 className="text-lg font-semibold">邀请记录</h2>
                </div>
                {records.length === 0 ? (
                    <div className="py-16 text-center text-[#6b7280]">
                        <div className="mb-4 text-5xl">📭</div>
                        <div>暂无邀请记录</div>
                        <div className="mt-2 text-sm">快去分享邀请码给好友吧！</div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-[600px] w-full border-collapse">
                            <thead>
                                <tr className="border-b border-[#f3f4f6] bg-[#f9fafb]">
                                    <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7280]">用户</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7280]">注册时间</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7280]">状态</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7280]">订单数</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-[#6b7280]">贡献佣金</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(record => (
                                    <tr key={record.id} className="border-b border-[#f3f4f6]">
                                        <td className="px-4 py-4 font-medium">{record.username}</td>
                                        <td className="px-4 py-4 text-sm text-[#6b7280]">{record.registerTime}</td>
                                        <td className="px-4 py-4">
                                            <Badge variant="soft" color={record.status === 'active' ? 'green' : 'slate'}>{record.status === 'active' ? '活跃' : '不活跃'}</Badge>
                                        </td>
                                        <td className="px-4 py-4 text-sm">{record.totalOrders}</td>
                                        <td className="px-4 py-4 font-semibold text-warning-400">¥{record.commission.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* Rules */}
            <div className="rounded-md border border-amber-200 bg-amber-50 p-5">
                <h3 className="mb-3 font-semibold text-amber-800">推荐规则</h3>
                <ul className="list-inside list-disc space-y-1 text-sm leading-relaxed text-amber-800">
                    <li>被推荐人通过您的邀请码注册并完成首单后，推荐关系生效</li>
                    <li>您可获得被推荐人每笔订单服务费的 10% 作为奖励</li>
                    <li>奖励会在被推荐人订单完成后的次月1日统一结算</li>
                    <li>同一用户只能被推荐一次，重复推荐无效</li>
                    <li>平台保留对推荐活动的最终解释权</li>
                </ul>
            </div>
        </div>
    );
}
