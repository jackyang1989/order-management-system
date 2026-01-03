'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';

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

export default function MerchantRecommendPage() {
    const [stats, setStats] = useState<ReferralStats>({
        totalReferrals: 0,
        activeReferrals: 0,
        totalEarnings: 0,
        pendingEarnings: 0
    });
    const [records, setRecords] = useState<ReferralRecord[]>([]);
    const [referralCode, setReferralCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;

        try {
            const res = await fetch(`${BASE_URL}/merchant/referral-info`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            if (json.success) {
                setStats(json.data.stats || stats);
                setRecords(json.data.records || []);
                setReferralCode(json.data.referralCode || '');
            } else {
                // Mock data
                setReferralCode('MERCHANT_' + Math.random().toString(36).substring(2, 8).toUpperCase());
                setStats({
                    totalReferrals: 12,
                    activeReferrals: 8,
                    totalEarnings: 2580,
                    pendingEarnings: 320
                });
                setRecords([
                    { id: '1', username: '用户A***', registerTime: '2024-12-20', status: 'active', totalOrders: 15, commission: 450 },
                    { id: '2', username: '用户B***', registerTime: '2024-12-18', status: 'active', totalOrders: 8, commission: 240 },
                    { id: '3', username: '用户C***', registerTime: '2024-12-15', status: 'inactive', totalOrders: 3, commission: 90 },
                ]);
            }
        } catch (e) {
            // Mock data
            setReferralCode('MERCHANT_' + Math.random().toString(36).substring(2, 8).toUpperCase());
            setStats({
                totalReferrals: 12,
                activeReferrals: 8,
                totalEarnings: 2580,
                pendingEarnings: 320
            });
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const referralLink = `https://example.com/register?ref=${referralCode}`;

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                加载中...
            </div>
        );
    }

    return (
        <div>
            {/* Referral Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: '#fff',
                marginBottom: '24px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                            邀请好友，共享收益
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                            每成功推荐一位商家，可获得其服务费的 10% 作为奖励
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                fontFamily: 'monospace',
                                fontSize: '16px',
                                letterSpacing: '1px'
                            }}>
                                {referralCode}
                            </div>
                            <button
                                onClick={() => copyToClipboard(referralCode)}
                                style={{
                                    padding: '12px 24px',
                                    background: '#fff',
                                    color: '#059669',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                {copied ? '已复制!' : '复制邀请码'}
                            </button>
                        </div>
                    </div>
                    <div style={{ fontSize: '72px' }}>🎁</div>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: '累计邀请', value: stats.totalReferrals, icon: '👥', color: '#3b82f6' },
                    { label: '活跃用户', value: stats.activeReferrals, icon: '✅', color: '#10b981' },
                    { label: '累计收益', value: `¥${stats.totalEarnings.toFixed(2)}`, icon: '💰', color: '#f59e0b' },
                    { label: '待结算', value: `¥${stats.pendingEarnings.toFixed(2)}`, icon: '⏳', color: '#8b5cf6' },
                ].map((stat, idx) => (
                    <div key={idx} style={{
                        background: '#fff',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>{stat.label}</div>
                                <div style={{ fontSize: '24px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                            </div>
                            <div style={{ fontSize: '28px' }}>{stat.icon}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Share Options */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                border: '1px solid #e5e7eb'
            }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>分享推广</h2>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>推广链接</div>
                        <div style={{
                            background: '#f3f4f6',
                            padding: '12px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            color: '#374151',
                            wordBreak: 'break-all'
                        }}>
                            {referralLink}
                        </div>
                    </div>
                    <button
                        onClick={() => copyToClipboard(referralLink)}
                        style={{
                            padding: '12px 24px',
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        复制链接
                    </button>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                    {[
                        { name: '微信', icon: '💬', color: '#07c160' },
                        { name: 'QQ', icon: '🐧', color: '#12b7f5' },
                        { name: '微博', icon: '📢', color: '#e6162d' },
                    ].map((platform, idx) => (
                        <button
                            key={idx}
                            onClick={() => alert(`分享到${platform.name}（模拟）`)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                background: platform.color + '15',
                                color: platform.color,
                                border: `1px solid ${platform.color}30`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            <span>{platform.icon}</span>
                            <span>分享到{platform.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Referral Records */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>邀请记录</h2>
                </div>

                {records.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                        <div>暂无邀请记录</div>
                        <div style={{ fontSize: '14px', marginTop: '8px' }}>快去分享邀请码给好友吧！</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>用户</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>注册时间</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>状态</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>订单数</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', color: '#6b7280' }}>贡献佣金</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(record => (
                                <tr key={record.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                    <td style={{ padding: '16px', fontWeight: '500' }}>{record.username}</td>
                                    <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>{record.registerTime}</td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '999px',
                                            fontSize: '12px',
                                            background: record.status === 'active' ? '#d1fae5' : '#f3f4f6',
                                            color: record.status === 'active' ? '#059669' : '#6b7280'
                                        }}>
                                            {record.status === 'active' ? '活跃' : '不活跃'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px' }}>{record.totalOrders}</td>
                                    <td style={{ padding: '16px', fontWeight: '600', color: '#f59e0b' }}>
                                        ¥{record.commission.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Rules */}
            <div style={{
                marginTop: '24px',
                background: '#fffbeb',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #fef3c7'
            }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#92400e' }}>
                    推荐规则
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e', fontSize: '14px', lineHeight: '1.8' }}>
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
