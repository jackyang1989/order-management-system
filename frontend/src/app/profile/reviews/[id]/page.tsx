'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Card } from '../../../components/ui/card';
import { Spinner } from '../../../components/ui/spinner';
import { toastSuccess, toastError } from '../../../lib/toast';
import { isAuthenticated } from '../../../services/authService';
import { fetchReviewTaskById, submitReviewTask, ReviewTask } from '../../../services/userService';

const STATUS_MAP: Record<string, { label: string; bg: string; textCol: string }> = {
    WAITING_SUBMIT: { label: '待提交评价', bg: 'bg-amber-100/50', textCol: 'text-amber-600' },
    WAITING_AUDIT: { label: '审核中', bg: 'bg-blue-50', textCol: 'text-blue-600' },
    APPROVED: { label: '审核通过', bg: 'bg-blue-600', textCol: 'text-white' },
    REJECTED: { label: '审核驳回', bg: 'bg-rose-100/50', textCol: 'text-rose-600' },
};

export default function ReviewDetailPage() {
    const router = useRouter();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<ReviewTask | null>(null);
    const [screenshot, setScreenshot] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadTask();
    }, [id]);

    const loadTask = async () => {
        try {
            const data = await fetchReviewTaskById(id as string);
            setTask(data);
            setScreenshot(data.screenshot || '');
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setScreenshot(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!screenshot) { toastError('请上传评价截图'); return; }
        setSubmitting(true);
        try {
            await submitReviewTask(id as string, screenshot);
            toastSuccess('提交成功，请等待审核');
            loadTask();
        } catch (error: any) {
            toastError(error.message || '提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toastSuccess('已复制到剪贴板');
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
            <Spinner size="lg" className="text-blue-600" />
        </div>
    );

    if (!task) return null;

    const status = STATUS_MAP[task.status] || STATUS_MAP.WAITING_SUBMIT;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">评价任务详情</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* Status Hero */}
                <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">当前任务状态</div>
                            <div className={cn('text-xl font-black tracking-tight', status.textCol)}>{status.label}</div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-300">预期奖励</div>
                            <div className="text-xl font-black text-blue-600 tracking-tight">{task.commission} <span className="text-[10px] uppercase font-bold text-blue-400 italic">Silver</span></div>
                        </div>
                    </div>
                </Card>

                {/* Requirements Section */}
                <div className="space-y-4">
                    <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">任务要求</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-[24px] bg-slate-50 p-6 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">评价字数</div>
                            <div className="text-lg font-black text-slate-900 tracking-tight">{task.wordCount || '不限'} <span className="text-[10px] font-bold text-slate-400">字以上</span></div>
                        </div>
                        <div className="rounded-[24px] bg-slate-50 p-6 space-y-3">
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">图片/视频</div>
                            <div className="flex gap-2">
                                {task.requireImage && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-black text-blue-600 border border-blue-100">需带图</span>}
                                {task.requireVideo && <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[8px] font-black text-indigo-600 border border-indigo-100">需视频</span>}
                                {!task.requireImage && !task.requireVideo && <span className="text-[10px] font-bold text-slate-400">无需媒体</span>}
                            </div>
                        </div>
                    </div>

                    <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">推荐评语 (五星好评)</h4>
                                <button onClick={() => copyText(task.content)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest">一键拷贝</button>
                            </div>
                            <div className="rounded-[24px] bg-slate-50 p-6 text-sm font-bold text-slate-600 leading-relaxed italic border border-slate-100">
                                {task.content || '暂无特定评语要求，请自由发挥且保证五星好评。'}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Submission Area */}
                <div className="space-y-4">
                    <h3 className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 text-center">评价反馈上传</h3>
                    <div className="relative overflow-hidden rounded-[40px] bg-white p-8 shadow-xl shadow-slate-100 ring-1 ring-slate-100 text-center flex flex-col items-center justify-center min-h-[320px]">
                        {screenshot ? (
                            <div className="relative group w-full h-full flex items-center justify-center">
                                <img src={screenshot} alt="Review Screenshot" className="max-h-[300px] w-auto rounded-[24px] shadow-2xl transition-transform group-hover:scale-[1.02]" />
                                {task.status === 'WAITING_SUBMIT' && (
                                    <button onClick={() => setScreenshot('')} className="absolute -top-4 -right-4 h-10 w-10 rounded-full bg-rose-500 text-white shadow-xl flex items-center justify-center transition active:scale-95">×</button>
                                )}
                            </div>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center justify-center p-12 group">
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <div className="h-20 w-20 rounded-[28px] bg-blue-50 flex items-center justify-center text-3xl shadow-inner transition-transform group-hover:scale-110">📸</div>
                                <div className="mt-6 text-sm font-black text-slate-900 tracking-tight">上传评价截图</div>
                                <div className="mt-2 text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">请确认图片清晰可见且包含评价内容</div>
                            </label>
                        )}

                        {task.status === 'REJECTED' && (
                            <div className="mt-8 rounded-[20px] bg-rose-50 p-5 border border-rose-100/50">
                                <div className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">驳回原因</div>
                                <div className="text-[10px] font-bold text-rose-900/60 leading-relaxed italic">{task.rejectReason || '图片不符合要求'}</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            {task.status === 'WAITING_SUBMIT' && (
                <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-8 backdrop-blur-xl border-t border-slate-50">
                    <button onClick={handleSubmit} disabled={submitting || !screenshot}
                        className="w-full rounded-[28px] bg-blue-600 py-6 text-sm font-black text-white shadow-2xl shadow-blue-100 transition active:scale-95 disabled:opacity-50">
                        {submitting ? <Spinner size="sm" /> : '立即提交审核'}
                    </button>
                </div>
            )}
        </div>
    );
}
