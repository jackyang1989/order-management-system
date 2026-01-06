'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { ProfileContainer } from '../../../components/ProfileContainer';
import { isAuthenticated } from '../../../services/authService';

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
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadRecords();
    }, [router]);

    const loadRecords = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';
            const response = await fetch(`${BASE_URL}/vip/records`, {
                headers: { 'Authorization': `Bearer ${token}` },
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
            'register': { text: '注册赠送', color: 'text-green-500 bg-green-50' },
            'purchase': { text: '购买', color: 'text-blue-500 bg-blue-50' },
            'reward': { text: '奖励', color: 'text-amber-500 bg-amber-50' },
            'admin': { text: '管理员调整', color: 'text-slate-500 bg-slate-100' },
        };
        return labels[type] || { text: type, color: 'text-slate-500 bg-slate-100' };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-4">
            {/* Header */}
            <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white px-4">
                <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                <h1 className="flex-1 text-base font-medium text-slate-800">VIP 记录</h1>
            </header>

            <ProfileContainer className="py-4">
                {records.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
                        <div className="mb-3 text-4xl">👑</div>
                        <div className="text-sm text-slate-400">暂无 VIP 记录</div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {records.map((record) => {
                            const typeInfo = getTypeLabel(record.type);
                            return (
                                <div key={record.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="font-medium text-slate-700">{record.remark || 'VIP 变更'}</div>
                                            <div className="mt-1 text-xs text-slate-400">
                                                {record.createdAt ? new Date(record.createdAt).toLocaleString('zh-CN') : '-'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={cn('rounded px-2 py-0.5 text-xs font-medium', typeInfo.color)}>
                                                {typeInfo.text}
                                            </span>
                                            {record.days > 0 && (
                                                <div className="mt-1.5 text-base font-bold text-green-500">+{record.days} 天</div>
                                            )}
                                            {record.amount > 0 && (
                                                <div className="mt-0.5 text-xs text-slate-400">¥{record.amount}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </ProfileContainer>
        </div>
    );
}
