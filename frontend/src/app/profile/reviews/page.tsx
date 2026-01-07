'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { isAuthenticated } from '../../../services/authService';
import { fetchReviewTasks, ReviewTask } from '../../../services/userService';

const STATUS_MAP: Record<string, { label: string; bg: string; textCol: string }> = {
    WAITING_SUBMIT: { label: '待提交', bg: 'bg-amber-100/50', textCol: 'text-amber-600' },
    WAITING_AUDIT: { label: '待审核', bg: 'bg-blue-50', textCol: 'text-blue-600' },
    APPROVED: { label: '已通过', bg: 'bg-blue-600', textCol: 'text-white' },
    REJECTED: { label: '未通过', bg: 'bg-rose-100/50', textCol: 'text-rose-600' },
};

export default function ReviewsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState<ReviewTask[]>([]);
    const [activeTab, setActiveTab] = useState<string>('ALL');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadTasks();
    }, [router]);

    const loadTasks = async () => {
        setLoading(true);
        try {
            const data = await fetchReviewTasks();
            setTasks(data);
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const filteredTasks = tasks.filter(t => {
        if (activeTab === 'ALL') return true;
        return t.status === activeTab;
    });

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">评价管理</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Tabs */}
                <div className="flex w-full overflow-x-auto gap-2 rounded-[24px] bg-slate-100/50 p-1.5 ring-1 ring-slate-200/50 no-scrollbar">
                    {['ALL', 'WAITING_SUBMIT', 'WAITING_AUDIT', 'APPROVED', 'REJECTED'].map((tab) => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={cn('whitespace-nowrap rounded-[20px] px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0',
                                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400')}>
                            {tab === 'ALL' ? '全部' : STATUS_MAP[tab]?.label}
                        </button>
                    ))}
                </div>

                {/* Tasks List */}
                <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                            <div className="text-4xl opacity-10 mb-4 italic">🎭</div>
                            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">暂无相关评价任务</h3>
                        </div>
                    ) : (
                        filteredTasks.map((task) => {
                            const status = STATUS_MAP[task.status] || STATUS_MAP.WAITING_SUBMIT;
                            return (
                                <Card key={task.id} onClick={() => router.push(`/profile/reviews/${task.id}`)}
                                    className="group relative overflow-hidden rounded-[32px] border-none bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-slate-100 transition-all hover:bg-slate-50 active:scale-[0.98]">

                                    <div className="flex items-start justify-between">
                                        <div className="space-y-4">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">No.</span>
                                                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">{task.orderNo.slice(-12)}</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">评价佣金</div>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-black text-blue-600 tracking-tight">{task.commission}</span>
                                                    <span className="text-[10px] font-black text-blue-400 uppercase italic">Silver</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors',
                                            status.bg.startsWith('bg-blue-600') ? 'shadow-lg shadow-blue-50' : '',
                                            status.bg, status.textCol)}>
                                            {status.label}
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-5">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-blue-400 transition-colors" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{new Date(task.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">查看详情</span>
                                            <svg className="h-3 w-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
