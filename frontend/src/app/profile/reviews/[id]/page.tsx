'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import BottomNav from '../../../../components/BottomNav';
import { cn } from '../../../../lib/utils';
import { toastSuccess, toastError } from '../../../../lib/toast';
import { Spinner } from '../../../../components/ui/spinner';
import { Card } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';

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
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
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
        } catch (error) {
            console.error('Load task error:', error);
        } finally {
            setLoading(false);
        }
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
        if (uploadedImages.length === 0) {
            alert('请上传追评截图');
            return;
        }

        setSubmitting(true);
        try {
            const result = await submitReviewTask(taskId, uploadedImages);
            if (result.success) {
                toastSuccess('追评提交成功，等待商家确认');
                router.push('/profile/reviews');
            } else {
                toastError(result.message);
            }
        } catch (error) {
            toastError('提交失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        setSubmitting(true);
        try {
            const result = await rejectReviewTask(taskId, rejectReason);
            if (result.success) {
                toastSuccess('已拒绝追评任务');
                router.push('/profile/reviews');
            } else {
                toastError(result.message);
            }
        } catch (error) {
            toastError('操作失败，请稍后重试');
        } finally {
            setSubmitting(false);
            setShowRejectModal(false);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        toastSuccess('复制成功');
    };

    if (loading || !task) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
                <Spinner size="lg" className="text-blue-600" />
            </div>
        );
    }

    const statusInfo = ReviewTaskStatusLabels[task.state];
    const canSubmit = task.state === ReviewTaskStatus.APPROVED;

    const textPraises = praises.filter(p => p.type === 1);
    const imagePraises = praises.filter(p => p.type === 2);
    const videoPraises = praises.filter(p => p.type === 3);

    return (
        <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] pb-40">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="mx-auto flex h-16 max-w-[515px] items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600 active:scale-95 transition-transform">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-900 truncate">追评任务详情</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 tabular-nums">{task.taskNumber}</p>
                    </div>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-6 py-6 space-y-6">
                {/* Status Card */}
                <Card className="rounded-[32px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-none">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">任务状态 / STATUS</div>
                            <div className={cn(
                                'text-2xl font-black tracking-tight',
                                task.state === ReviewTaskStatus.UNPAID && 'text-amber-500',
                                task.state === ReviewTaskStatus.PAID && 'text-indigo-500',
                                task.state === ReviewTaskStatus.APPROVED && 'text-blue-500',
                                task.state === ReviewTaskStatus.UPLOADED && 'text-purple-500',
                                task.state === ReviewTaskStatus.COMPLETED && 'text-emerald-500',
                                task.state === ReviewTaskStatus.CANCELLED && 'text-slate-500',
                                task.state === ReviewTaskStatus.BUYER_REJECTED && 'text-red-500',
                                task.state === ReviewTaskStatus.REJECTED && 'text-red-600'
                            )}>
                                {statusInfo.text}
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">追评佣金 / COMMISSION</div>
                            <div className="text-3xl font-black text-emerald-500 tabular-nums">
                                ¥{Number(task.userMoney).toFixed(2)}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Review Content */}
                <Card className="rounded-[32px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-none">
                    <div className="mb-6 flex items-baseline justify-between">
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">追评要求 / REQUIREMENTS</div>
                    </div>

                    <div className="space-y-4">
                        {/* Text Reviews */}
                        {textPraises.map((praise) => (
                            <div key={praise.id} className="rounded-[24px] bg-slate-50 p-6 shadow-inner space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="rounded-full bg-blue-100/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-blue-600">
                                        TEXT REVIEW • 📝
                                    </span>
                                    <button onClick={() => copyText(praise.content)}
                                        className="rounded-full bg-white px-4 py-2 text-[9px] font-black uppercase tracking-widest text-blue-600 shadow-sm transition-all active:scale-95">
                                        COPY TEXT
                                    </button>
                                </div>
                                <div className="text-sm font-bold text-slate-800 leading-relaxed">
                                    {praise.content}
                                </div>
                            </div>
                        ))}

                        {/* Image Reviews */}
                        {imagePraises.map((praise) => {
                            let images: string[] = [];
                            try { images = JSON.parse(praise.content); } catch { images = praise.content.split(','); }
                            return (
                                <div key={praise.id} className="rounded-[24px] bg-slate-50 p-6 shadow-inner space-y-4">
                                    <span className="inline-block rounded-full bg-amber-100/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-amber-600">
                                        IMAGE REVIEW • 🖼️
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                        {images.map((img, i) => (
                                            <img key={i} src={img} alt="" className="h-20 w-20 rounded-[16px] object-cover shadow-sm ring-2 ring-white" />
                                        ))}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                        Save images to your device
                                    </div>
                                </div>
                            );
                        })}

                        {/* Video Reviews */}
                        {videoPraises.map((praise) => (
                            <div key={praise.id} className="rounded-[24px] bg-slate-50 p-6 shadow-inner space-y-4">
                                <span className="inline-block rounded-full bg-pink-100/50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-pink-600">
                                    VIDEO REVIEW • 📹
                                </span>
                                <video src={praise.content} controls className="w-full max-h-[240px] rounded-[20px] bg-black shadow-lg" />
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                                    Download video to upload
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                {/* Upload Section - only for approved state */}
                {canSubmit && (
                    <Card className="rounded-[32px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-none">
                        <div className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">上传追评截图 / UPLOAD PROOF</div>

                        <div className="flex flex-wrap gap-4">
                            {uploadedImages.map((img, idx) => (
                                <div key={idx} className="relative group">
                                    <img src={img} alt="" className="h-24 w-24 rounded-[20px] object-cover shadow-lg ring-2 ring-white" />
                                    <button onClick={() => handleRemoveImage(idx)}
                                        className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg active:scale-95 transition-all">
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            {uploadedImages.length < 3 && (
                                <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:bg-slate-100 text-slate-400">
                                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                    <div className="text-3xl font-light mb-1">+</div>
                                    <div className="text-[9px] font-black uppercase tracking-widest">UPLOAD</div>
                                </label>
                            )}
                        </div>
                        <div className="mt-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Maximum 3 screenshots</div>
                    </Card>
                )}

                {/* Submitted Images - non-approved state */}
                {!canSubmit && task.img && (
                    <Card className="rounded-[32px] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border-none">
                        <div className="mb-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">已提交的截图 / SUBMITTED PROOF</div>
                        <div className="flex flex-wrap gap-4">
                            {(() => {
                                let images: string[] = [];
                                try { images = JSON.parse(task.img); } catch { images = task.img.split(','); }
                                return images.map((img, i) => (
                                    <img key={i} src={img} alt="" className="h-24 w-24 rounded-[20px] object-cover shadow-lg ring-2 ring-white" />
                                ));
                            })()}
                        </div>
                    </Card>
                )}

                {/* Tips */}
                <div className="rounded-[24px] bg-amber-50/50 p-6 border border-amber-100/50">
                    <div className="mb-3 flex items-center gap-2 text-xs font-black text-amber-700 uppercase tracking-widest leading-none">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        温馨提示 • IMPORTANT TIPS
                    </div>
                    <ul className="space-y-2 text-[10px] font-bold text-amber-800/60 leading-relaxed uppercase tracking-wide">
                        <li className="flex gap-2">请按指定内容进行追评，不符合要求将扣除佣金</li>
                        <li className="flex gap-2">胡乱评价、复制他人评价等行为将被拉黑</li>
                        <li className="flex gap-2">追评截图需清晰完整</li>
                    </ul>
                </div>
            </div>

            {/* Fixed Bottom Actions */}
            {canSubmit && (
                <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 pb-safe">
                    <div className="mx-auto flex max-w-[515px] gap-3 px-6 py-6">
                        <Button
                            variant="secondary"
                            onClick={() => setShowRejectModal(true)}
                            disabled={submitting}
                            className="flex-1 rounded-[20px] py-8 text-[11px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 border-none transition-all active:scale-95"
                        >
                            REJECT TASK
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting || uploadedImages.length === 0}
                            className={cn(
                                'flex-[2] rounded-[20px] py-8 text-[11px] font-black uppercase tracking-widest text-white shadow-2xl transition-all active:scale-95',
                                submitting || uploadedImages.length === 0
                                    ? 'bg-slate-200'
                                    : 'bg-slate-900 shadow-slate-900/20'
                            )}
                        >
                            {submitting ? 'PROCESSING...' : 'SUBMIT PROOF'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
                    <Card className="w-full max-w-sm rounded-[32px] bg-white p-8 shadow-2xl border-none">
                        <div className="mb-6 text-center space-y-1">
                            <h3 className="text-xl font-black text-slate-900">CONFIRM REJECTION?</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">THIS ACTION CANNOT BE UNDONE</p>
                        </div>
                        <div className="mb-6">
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="REASON (OPTIONAL)"
                                className="h-32 w-full resize-none rounded-[20px] border-none bg-slate-50 p-4 text-sm font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/10 shadow-inner"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowRejectModal(false)}
                                className="flex-1 rounded-[16px] bg-slate-100 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all active:scale-95">
                                CANCEL
                            </button>
                            <button onClick={handleReject} disabled={submitting}
                                className="flex-1 rounded-[16px] bg-rose-500 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-rose-200 transition-all active:scale-95">
                                {submitting ? 'HOLD ON...' : 'CONFIRM'}
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
