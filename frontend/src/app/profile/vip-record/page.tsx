'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';

interface VipRecord {
    id: string;
    remark: string;
    days: number;
    amount: number;
    type: string;
    createdAt: string;
}

export default function VipRecordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<VipRecord[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadRecords();
    }, [router]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/vip/records', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setRecords(result.data.data || result.data || []);
                }
            }
        } catch (error) {
            console.error('Load VIP records error:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, { text: string; color: string }> = {
            'register': { text: '注册赠送', color: '#67c23a' },
            'purchase': { text: '购买', color: '#409eff' },
            'reward': { text: '奖励', color: '#e6a23c' },
            'admin': { text: '管理员调整', color: '#909399' },
        };
        return labels[type] || { text: type, color: '#666' };
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f7' }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f5f5f7',
            paddingBottom: '80px'
        }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #ffa940 0%, #ff7a45 100%)',
                padding: '20px',
                color: 'white',
                textAlign: 'center'
            }}>
                <div onClick={() => router.back()} style={{
                    position: 'absolute',
                    left: '16px',
                    top: '20px',
                    fontSize: '20px',
                    cursor: 'pointer'
                }}>←</div>
                <div style={{ fontSize: '20px', fontWeight: '700' }}>VIP 记录</div>
                <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                    查看您的 VIP 变更记录
                </div>
            </div>

            {/* 记录列表 */}
            <div style={{ margin: '16px' }}>
                {records.length === 0 ? (
                    <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        padding: '60px 20px',
                        textAlign: 'center',
                        color: '#999'
                    }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>👑</div>
                        <div>暂无 VIP 记录</div>
                    </div>
                ) : (
                    records.map((record) => {
                        const typeInfo = getTypeLabel(record.type);
                        return (
                            <div
                                key={record.id}
                                style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '6px' }}>
                                            {record.remark || 'VIP 变更'}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#999' }}>
                                            {record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : '-'}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '2px 8px',
                                            background: `${typeInfo.color}20`,
                                            color: typeInfo.color,
                                            borderRadius: '4px'
                                        }}>
                                            {typeInfo.text}
                                        </span>
                                        {record.days > 0 && (
                                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#67c23a', marginTop: '8px' }}>
                                                +{record.days} 天
                                            </div>
                                        )}
                                        {record.amount > 0 && (
                                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                                ¥{record.amount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <BottomNav />
        </div>
    );
}
