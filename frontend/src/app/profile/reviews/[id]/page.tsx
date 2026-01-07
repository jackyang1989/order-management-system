'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { cn } from '../../../../lib/utils';
import { Card } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Spinner } from '../../../../components/ui/spinner';
import { isAuthenticated } from '../../../../services/authService';
import {
    fetchReviewTaskDetail,
    submitReviewTask,
    rejectReviewTask,
    ReviewTask,
    ReviewTaskPraise,
    ReviewTaskStatus,
    ReviewTaskStatusLabels
} from '../../../../services/reviewTaskService';

export default function ReviewTaskDetailPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [task, setTask] = useState<ReviewTask | null>(null);
    const [praises, setPraises] = useState<ReviewTaskPraise[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadTask();
    }, [router, taskId]);

    const loadTask = async () => {
        setLoading(true);
        try {
            const result = await fetchReviewTaskDetail(taskId);
            if (result) {
                setTask(result.task);
                setPraises(result.praises);
            }
        } catch (error) { console.error('Load task error:', error); }
        finally { setLoading(false); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newImages = [...uploadedImages];
        for (let i = 0; i < files.length && newImages.length < 3; i++) {
            const url = URL.createObjectURL(files[i]);
            newImages.push(url);
        }
        setUploadedImages(newImages);
    };

    const handleRemoveImage = (index: number) => {
        const newImages = [...uploadedImages];
        newImages.splice(index, 1);
        setUploadedImages(newImages);
    };

    const handleSubmit = async () => {
        if (uploadedImages.length === 0) { alert('请上传追评截图'); return; }
        setSubmitting(true);
        try {
            const result = await submitReviewTask(taskId, uploadedImages);
            if (result.success) { alert('追评提交成功，等待商家确认'); router.push('/profile/reviews'); }
            else { alert(result.message); }
        } catch (error) { alert('提交失败，请稍后重试'); }
        finally { setSubmitting(false); }
    };

    const handleReject = async () => {
        setSubmitting(true);
        try {
            const result = await rejectReviewTask(taskId, rejectReason);
            if (result.success) { alert('已拒绝追评任务'); router.push('/profile/reviews'); }
            else { alert(result.message); }
        } catch (error) { alert('操作失败，请稍后重试'); }
        finally { setSubmitting(false); setShowRejectModal(false); }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('复制成功');
    };

    const getStatusConfig = (state: ReviewTaskStatus) => {
        const label = ReviewTaskStatusLabels[state] || { text: '未知' };
        const configs: Record<string, { bg: string; textCol: string }> = {
            [ReviewTaskStatus.APPROVED]: { bg: 'bg-emerald-50', textCol: 'text-emerald-600' },
            [ReviewTaskStatus.UPLOADED]: { bg: 'bg-blue-50', textCol: 'text-blue-600' },
            [ReviewTaskStatus.REJECTED]: { bg: 'bg-rose-50', textCol: 'text-rose-600' },
            [ReviewTaskStatus.COMPLETED]: { bg: 'bg-slate-50', textCol: 'text-slate-400' },
            [ReviewTaskStatus.PAID]: { bg: 'bg-indigo-50', textCol: 'text-indigo-600' },
        };
        const conf = configs[state] || { bg: 'bg-slate-50', textCol: 'text-slate-500' };
        return { text: label.text, ...conf };
    };

    if (loading || !task) {
        return <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><Spinner size="lg" className="text-blue-600" /></div>;
    }

    const canSubmit = task.state === ReviewTaskStatus.APPROVED;
    const textPraises = praises.filter(p => p.type === 1);
    const imagePraises = praises.filter(p => p.type === 2);
    const videoPraises = praises.filter(p => p.type === 3);
    const status = getStatusConfig(task.state);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 transition-transform active:scale-90">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">追评任务详情</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] space-y-6 px-4 py-4">
                {/* ID and Status Overview */}
                <div className="rounded-[28px] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">任务编号</div>
                            <div className="text-base font-black text-slate-900 tracking-tight">{task.taskNumber}</div>
                        </div>
                        <div className={cn('rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-widest', status.bg, status.textCol)}>
                            {status.text}
                        </div>
                    </div>
                </div>

                {/* Earnings Card */}
                <div className="rounded-[32px] bg-emerald-500/90 p-8 text-white shadow-2xl shadow-emerald-100 flex items-center justify-between">
                    <div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-white/70">预计奖励</div>
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-3xl font-black">+{Number(task.userMoney).toFixed(2)}</span>
                            <span className="text-xs font-bold opacity-80 uppercase tracking-widest">银锭</span>
                        </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">💰</div>
                </div>

                {/* Requirements */}
                <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-8">
                    <div className="flex items-center gap-2">
                        <div className="h-5 w-1.5 rounded-full bg-blue-600" />
                        <h2 className="text-base font-black text-slate-900">追评要求</h2>
                    </div>

                    <div className="space-y-6">
                        {/* Text Reviews */}
                        {textPraises.map((praise) => (
                            <div key={praise.id} className="relative rounded-[24px] bg-slate-50 p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="rounded-full bg-blue-100/50 px-3 py-1 text-[9px] font-black text-blue-600 uppercase tracking-widest">文字评价内容</div>
                                    <button onClick={() => copyText(praise.content)} className="rounded-full bg-white px-4 py-1.5 text-[10px] font-black text-blue-600 shadow-sm border border-slate-100 transition active:scale-95">一键复制</button>
                                </div>
                                <div className="text-sm font-bold text-slate-700 leading-relaxed italic">"{praise.content}"</div>
                            </div>
                        ))}

                        {/* Image Reviews */}
                        {imagePraises.map((praise) => {
                            let images: string[] = [];
                            try { images = JSON.parse(praise.content); } catch { images = praise.content.split(','); }
                            return (
                                <div key={praise.id} className="space-y-4">
                                    <div className="rounded-full bg-amber-100/50 px-3 py-1 text-[9px] font-black text-amber-600 uppercase tracking-widest inline-block">追评参考图片</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.map((img, i) => (
                                            <div key={i} className="aspect-square rounded-[20px] overflow-hidden shadow-sm shadow-slate-100 border border-slate-100">
                                                <img src={img} alt="" className="h-full w-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic px-1">💡 提示：请保存图片后上传到对应的追评位置</p>
                                </div>
                            );
                        })}

                        {/* Video Reviews */}
                        {videoPraises.map((praise) => (
                            <div key={praise.id} className="space-y-4">
                                <div className="rounded-full bg-rose-100/50 px-3 py-1 text-[9px] font-black text-rose-600 uppercase tracking-widest inline-block">追评参考视频</div>
                                <div className="rounded-[24px] overflow-hidden shadow-lg shadow-slate-200">
                                    <video src={praise.content} controls className="w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Upload Section */}
                {canSubmit ? (
                    <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1.5 rounded-full bg-blue-600" />
                            <h2 className="text-base font-black text-slate-900">提交作业</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {uploadedImages.map((img, idx) => (
                                <div key={idx} className="relative aspect-square">
                                    <img src={img} alt="" className="h-full w-full rounded-[20px] object-cover shadow-lg" />
                                    <button onClick={() => handleRemoveImage(idx)} className="absolute -right-2 -top-2 h-6 w-6 flex items-center justify-center rounded-full bg-rose-500 text-white shadow-xl transition active:scale-90">×</button>
                                </div>
                            ))}
                            {uploadedImages.length < 3 && (
                                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 text-slate-300 transition hover:bg-slate-100 active:scale-95">
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                    <span className="text-3xl font-light mb-1">+</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">上传截图</span>
                                </label>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 italic px-1">请上传已经追评成功的应用截图（最少 1 张，最多 3 张）</p>
                    </Card>
                ) : task.img && (
                    <Card className="rounded-[32px] border-none bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-1.5 rounded-full bg-slate-300" />
                            <h2 className="text-base font-black text-slate-900">已提交的凭证</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {(() => {
                                let images: string[] = [];
                                try { images = JSON.parse(task.img); } catch { images = task.img.split(','); }
                                return images.map((img, i) => (
                                    <div key={i} className="aspect-square rounded-[20px] overflow-hidden shadow-sm border border-slate-50">
                                        <img src={img} alt="" className="h-full w-full object-cover" />
                                    </div>
                                ));
                            })()}
                        </div>
                    </Card>
                )}

                {/* Guidelines */}
                <div className="rounded-[24px] bg-amber-50 p-6">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-900">
                        <span>ℹ️</span> 注意事项
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold leading-relaxed text-amber-700/80">
                        <li className="flex gap-2"><span>•</span>请严格按照商家提供的文案或图片进行追评</li>
                        <li className="flex gap-2"><span>•</span>禁止出现与商品无关或其他违规诱导性词语</li>
                        <li className="flex gap-2"><span>•</span>审核通过后奖金将实时充值到您的资金账户</li>
                    </ul>
                </div>
            </div>

            {/* Bottom Actions */}
            {canSubmit && (
                <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[515px] -translate-x-1/2 bg-white/80 p-6 backdrop-blur-xl border-t border-slate-50">
                    <div className="flex gap-4">
                        <button onClick={() => setShowRejectModal(true)} disabled={submitting}
                            className="flex-1 rounded-[24px] bg-slate-50 py-5 text-sm font-black text-rose-500 shadow-sm transition active:scale-95 disabled:opacity-50">
                            放弃任务
                        </button>
                        <button onClick={handleSubmit} disabled={submitting || uploadedImages.length === 0}
                            className={cn('flex-[2] rounded-[24px] py-5 text-sm font-black text-white shadow-2xl transition active:scale-95',
                                submitting || uploadedImages.length === 0 ? 'bg-slate-200 shadow-none' : 'bg-blue-600 shadow-blue-50')}>
                            {submitting ? '提交中...' : '确认并提交追评'}
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-6">
                    <div className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95">
                        <div className="mb-6 text-center">
                            <h3 className="text-xl font-black text-slate-900">确认拒绝该任务？</h3>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">拒绝后无法撤回，且可能影响信用等级</p>
                        </div>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                            placeholder="请输入拒绝原因（选填）"
                            className="h-32 w-full rounded-[20px] bg-slate-50 p-5 text-sm font-bold text-slate-900 focus:outline-none shadow-inner border-none mb-6"
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setShowRejectModal(false)} className="flex-1 rounded-[20px] bg-slate-50 py-4 text-sm font-black text-slate-400 transition active:scale-95">取消</button>
                            <button onClick={handleReject} disabled={submitting} className="flex-1 rounded-[20px] bg-rose-500 py-4 text-sm font-black text-white shadow-lg shadow-rose-50 transition active:scale-95 disabled:opacity-50">
                                {submitting ? '处理中...' : '确认拒绝'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
