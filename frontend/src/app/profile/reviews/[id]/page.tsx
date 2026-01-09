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
                alert('追评提交成功，等待商家确认');
                router.push('/profile/reviews');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('提交失败，请稍后重试');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        setSubmitting(true);
        try {
            const result = await rejectReviewTask(taskId, rejectReason);
            if (result.success) {
                alert('已拒绝追评任务');
                router.push('/profile/reviews');
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('操作失败，请稍后重试');
        } finally {
            setSubmitting(false);
            setShowRejectModal(false);
        }
    };

    const copyText = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('复制成功');
    };

    if (loading || !task) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <span className="text-sm text-slate-400">加载中...</span>
            </div>
        );
    }

    const statusInfo = ReviewTaskStatusLabels[task.state];
    const canSubmit = task.state === ReviewTaskStatus.APPROVED;

    const textPraises = praises.filter(p => p.type === 1);
    const imagePraises = praises.filter(p => p.type === 2);
    const videoPraises = praises.filter(p => p.type === 3);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-32">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-500 px-5 py-5 text-center text-white">
                <button
                    onClick={() => router.back()}
                    className="absolute left-4 top-5 cursor-pointer text-xl"
                >
                    ←
                </button>
                <div className="text-xl font-bold">追评任务详情</div>
                <div className="mt-1 text-xs opacity-80">{task.taskNumber}</div>
            </div>

            {/* Status Card */}
            <div className="m-4 rounded-xl bg-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-slate-500">任务状态</div>
                        <div className={cn(
                            'mt-1 text-lg font-bold',
                            task.state === ReviewTaskStatus.UNPAID && 'text-warning-400',
                            task.state === ReviewTaskStatus.PAID && 'text-indigo-500',
                            task.state === ReviewTaskStatus.APPROVED && 'text-primary-500',
                            task.state === ReviewTaskStatus.UPLOADED && 'text-purple-500',
                            task.state === ReviewTaskStatus.COMPLETED && 'text-emerald-500',
                            task.state === ReviewTaskStatus.CANCELLED && 'text-slate-500',
                            task.state === ReviewTaskStatus.BUYER_REJECTED && 'text-danger-400',
                            task.state === ReviewTaskStatus.REJECTED && 'text-danger-500'
                        )}>
                            {statusInfo.text}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">追评佣金</div>
                        <div className="mt-1 text-2xl font-bold text-emerald-500">
                            ¥{Number(task.userMoney).toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Review Content */}
            <div className="m-4 rounded-xl bg-white p-4">
                <div className="mb-4 text-base font-bold text-slate-800">追评要求</div>

                {/* Text Reviews */}
                {textPraises.map((praise) => (
                    <div key={praise.id} className="mb-4 rounded-lg bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between">
                            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                文字追评 +2元
                            </span>
                            <button
                                onClick={() => copyText(praise.content)}
                                className="cursor-pointer rounded border border-indigo-500 bg-white px-2.5 py-1 text-xs text-indigo-500"
                            >
                                一键复制
                            </button>
                        </div>
                        <div className="text-sm leading-relaxed text-slate-800">
                            {praise.content}
                        </div>
                    </div>
                ))}

                {/* Image Reviews */}
                {imagePraises.map((praise) => {
                    let images: string[] = [];
                    try {
                        images = JSON.parse(praise.content);
                    } catch {
                        images = praise.content.split(',');
                    }
                    return (
                        <div key={praise.id} className="mb-4 rounded-lg bg-slate-50 p-3">
                            <span className="mb-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">
                                图片追评 +3元
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {images.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt=""
                                        className="h-20 w-20 rounded-lg object-cover"
                                    />
                                ))}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                                请长按保存图片后上传到追评
                            </div>
                        </div>
                    );
                })}

                {/* Video Reviews */}
                {videoPraises.map((praise) => (
                    <div key={praise.id} className="mb-4 rounded-lg bg-slate-50 p-3">
                        <span className="mb-2 inline-block rounded bg-pink-100 px-2 py-0.5 text-xs text-pink-700">
                            视频追评 +10元
                        </span>
                        <video
                            src={praise.content}
                            controls
                            className="w-full max-h-[200px] rounded-lg"
                        />
                        <div className="mt-2 text-xs text-slate-500">
                            请下载视频后上传到追评
                        </div>
                    </div>
                ))}
            </div>

            {/* Upload Section - only for approved state */}
            {canSubmit && (
                <div className="m-4 rounded-xl bg-white p-4">
                    <div className="mb-4 text-base font-bold text-slate-800">上传追评截图</div>

                    <div className="flex flex-wrap gap-3">
                        {uploadedImages.map((img, idx) => (
                            <div key={idx} className="relative">
                                <img
                                    src={img}
                                    alt=""
                                    className="h-20 w-20 rounded-lg object-cover"
                                />
                                <button
                                    onClick={() => handleRemoveImage(idx)}
                                    className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-danger-400 text-xs text-white"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {uploadedImages.length < 3 && (
                            <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-400">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <span className="text-2xl">+</span>
                                <span className="text-[11px]">上传</span>
                            </label>
                        )}
                    </div>
                    <div className="mt-3 text-xs text-slate-400">
                        最多上传3张追评截图
                    </div>
                </div>
            )}

            {/* Submitted Images - non-approved state */}
            {!canSubmit && task.img && (
                <div className="m-4 rounded-xl bg-white p-4">
                    <div className="mb-4 text-base font-bold text-slate-800">已提交的截图</div>
                    <div className="flex flex-wrap gap-2">
                        {(() => {
                            let images: string[] = [];
                            try {
                                images = JSON.parse(task.img);
                            } catch {
                                images = task.img.split(',');
                            }
                            return images.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt=""
                                    className="h-20 w-20 rounded-lg object-cover"
                                />
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* Tips */}
            <div className="m-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                <div className="mb-1 font-semibold">温馨提示</div>
                <ul className="m-0 list-disc pl-4 leading-relaxed">
                    <li>请按指定内容进行追评，不符合要求将扣除佣金</li>
                    <li>胡乱评价、复制他人评价等行为将被拉黑</li>
                    <li>追评截图需清晰完整</li>
                </ul>
            </div>

            {/* Fixed Bottom Actions */}
            {canSubmit && (
                <div className="fixed bottom-16 left-0 right-0 border-t border-slate-200 bg-white">
                    <div className="mx-auto flex w-full max-w-md gap-3 px-4 py-4">
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={submitting}
                            className="flex-1 cursor-pointer rounded-lg border border-red-500 bg-white py-3.5 text-base font-semibold text-danger-400"
                        >
                            拒绝追评
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || uploadedImages.length === 0}
                            className={cn(
                                'flex-[2] rounded-lg py-3.5 text-base font-semibold text-white',
                                submitting || uploadedImages.length === 0
                                    ? 'cursor-not-allowed bg-slate-300'
                                    : 'cursor-pointer bg-gradient-to-r from-indigo-500 to-purple-500'
                            )}
                        >
                            {submitting ? '提交中...' : '提交追评'}
                        </button>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5">
                    <div className="w-full max-w-[320px] rounded-2xl bg-white p-6">
                        <div className="mb-4 text-center text-lg font-bold">确认拒绝追评？</div>
                        <div className="mb-4">
                            <textarea
                                value={rejectReason}
                                onChange={e => setRejectReason(e.target.value)}
                                placeholder="请输入拒绝原因（可选）"
                                className="h-20 w-full resize-none rounded-lg border border-slate-200 p-3 text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white py-3 text-sm text-slate-600"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className="flex-1 cursor-pointer rounded-lg bg-danger-400 py-3 text-sm text-white"
                            >
                                {submitting ? '处理中...' : '确认拒绝'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
