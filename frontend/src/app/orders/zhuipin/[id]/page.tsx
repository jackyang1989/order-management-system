'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../../services/authService';
import BottomNav from '../../../../components/BottomNav';
import { cn } from '../../../../lib/utils';
import { toastSuccess, toastError } from '../../../../lib/toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface PraiseContent {
    id: string;
    type: number; // 1=文字, 2=图片, 3=视频
    content: string;
    goodsId?: string;
}

interface ReviewTaskDetail {
    id: string;
    taskNumber: string;
    userTaskId: string;
    state: number;
    money: number;
    userMoney: number;
    payPrice: number;
    createdAt: string;
    uploadTime?: string;
    img?: string;
    remarks?: string;
    praises: PraiseContent[];
    orderInfo?: {
        taskTitle: string;
        platformOrderNumber?: string;
        buyerAccountName?: string;
    };
}

// 状态映射
const STATE_MAP: Record<number, { text: string; color: string }> = {
    0: { text: '未支付', color: 'bg-slate-100 text-slate-600' },
    1: { text: '待审核', color: 'bg-amber-100 text-amber-600' },
    2: { text: '待追评', color: 'bg-blue-100 text-blue-600' },
    3: { text: '待确认', color: 'bg-purple-100 text-purple-600' },
    4: { text: '已完成', color: 'bg-green-100 text-green-600' },
    5: { text: '已取消', color: 'bg-slate-100 text-slate-500' },
    6: { text: '已拒接', color: 'bg-red-100 text-red-600' },
    7: { text: '已拒绝', color: 'bg-red-100 text-red-600' },
};

export default function ZhuipinPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [taskDetail, setTaskDetail] = useState<ReviewTaskDetail | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [rejectDialogVisible, setRejectDialogVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [uploadedImages, setUploadedImages] = useState<{ file: File; content: string }[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/review-tasks/${id}/detail`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const res = await response.json();

            if (res.success) {
                setTaskDetail(res.data);
            } else {
                toastError(res.message || '获取追评任务失败');
            }
        } catch (error) {
            console.error('Load data error:', error);
            toastError('网络错误');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router, loadData]);

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: { file: File; content: string }[] = [];
        for (let i = 0; i < files.length; i++) {
            const content = await fileToBase64(files[i]);
            newImages.push({ file: files[i], content });
        }
        setUploadedImages(prev => [...prev, ...newImages]);
    };

    const handleRemoveImage = (index: number) => {
        setUploadedImages(prev => prev.filter((_, i) => i !== index));
    };

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toastSuccess('复制成功');
        } catch {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            toastSuccess('复制成功');
        }
    };

    // 提交追评截图
    const handleSubmit = async () => {
        if (uploadedImages.length === 0) {
            toastError('请上传追评截图');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/review-tasks/user/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reviewTaskId: id,
                    images: uploadedImages.map(img => img.content),
                }),
            });
            const data = await response.json();

            if (data.success) {
                setDialogVisible(false);
                toastSuccess(data.message || '提交成功');
                loadData();
            } else {
                toastError(data.message || '提交失败');
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    // 拒绝追评
    const handleReject = async () => {
        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/review-tasks/user/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    reviewTaskId: id,
                    reason: rejectReason || '买手拒接',
                }),
            });
            const data = await response.json();

            if (data.success) {
                setRejectDialogVisible(false);
                toastSuccess(data.message || '已拒绝追评任务');
                router.push('/orders');
            } else {
                toastError(data.message || '操作失败');
            }
        } catch (error) {
            toastError('网络错误');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <div className="text-sm text-slate-400">加载中...</div>
            </div>
        );
    }

    if (!taskDetail) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-slate-100">
                <div className="text-sm text-slate-400">追评任务不存在</div>
                <button onClick={() => router.back()} className="mt-4 text-blue-500">返回</button>
            </div>
        );
    }

    const stateInfo = STATE_MAP[taskDetail.state] || { text: '未知', color: 'bg-slate-100 text-slate-600' };
    const canSubmit = taskDetail.state === 2; // 待追评状态可提交
    const canReject = taskDetail.state === 2; // 待追评状态可拒接

    // 分类追评内容
    const textPraises = taskDetail.praises.filter(p => p.type === 1);
    const imagePraises = taskDetail.praises.filter(p => p.type === 2);
    const videoPraises = taskDetail.praises.filter(p => p.type === 3);

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-5 pt-12 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="cursor-pointer text-2xl">‹</button>
                    <span className="text-lg font-semibold">追评任务</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Status Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 flex items-center justify-between">
                <span className="text-sm text-slate-600">任务编号: {taskDetail.taskNumber}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-medium', stateInfo.color)}>
                    {stateInfo.text}
                </span>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3">
                {/* 任务信息卡片 */}
                <div className="rounded-xl bg-white p-4">
                    <div className="text-sm font-semibold text-slate-800 mb-3">任务信息</div>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">原订单编号：</span>
                            <span className="text-slate-800">{taskDetail.userTaskId?.slice(0, 8) || '-'}</span>
                        </div>
                        {taskDetail.orderInfo?.taskTitle && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">商品标题：</span>
                                <span className="text-slate-800 max-w-[200px] truncate text-right">{taskDetail.orderInfo.taskTitle}</span>
                            </div>
                        )}
                        {taskDetail.orderInfo?.buyerAccountName && (
                            <div className="flex justify-between">
                                <span className="text-slate-500">买号：</span>
                                <span className="text-slate-800">{taskDetail.orderInfo.buyerAccountName}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-slate-500">追评佣金：</span>
                            <span className="font-medium text-red-500">+{taskDetail.userMoney} 银锭</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">创建时间：</span>
                            <span className="text-slate-800">{new Date(taskDetail.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                    </div>
                </div>

                {/* 追评要求 */}
                <div className="rounded-xl bg-white p-4">
                    <div className="text-sm font-semibold text-slate-800 mb-3">追评要求</div>

                    {/* 文字追评 */}
                    {textPraises.map((praise, index) => (
                        <div key={praise.id || index} className="mb-3 rounded-lg bg-slate-50 p-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <span className="text-xs font-semibold text-slate-800">文字追评：</span>
                                    <span className="text-xs text-red-500">{praise.content}</span>
                                </div>
                                <button
                                    onClick={() => copyText(praise.content)}
                                    className="shrink-0 cursor-pointer whitespace-nowrap rounded bg-red-500 px-3 py-1 text-xs text-white"
                                >
                                    一键复制
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 图片追评 */}
                    {imagePraises.length > 0 && (
                        <div className="mb-3">
                            <span className="text-xs font-semibold text-slate-800">图片追评：</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {imagePraises.map((praise, idx) => (
                                    <img
                                        key={praise.id || idx}
                                        src={praise.content.startsWith('http') ? praise.content : `${BASE_URL}${praise.content}`}
                                        alt="追评图片"
                                        className="h-[60px] w-[60px] cursor-pointer rounded object-cover"
                                        onClick={() => setPreviewImage(praise.content.startsWith('http') ? praise.content : `${BASE_URL}${praise.content}`)}
                                    />
                                ))}
                            </div>
                            <p className="mt-1 text-xs text-slate-400">长按保存图片到相册后上传</p>
                        </div>
                    )}

                    {/* 视频追评 */}
                    {videoPraises.length > 0 && (
                        <div className="mb-3">
                            <span className="text-xs font-semibold text-slate-800">视频追评：</span>
                            {videoPraises.map((praise, idx) => (
                                <div key={praise.id || idx} className="mt-2">
                                    <video
                                        src={praise.content.startsWith('http') ? praise.content : `${BASE_URL}${praise.content}`}
                                        controls
                                        className="w-full max-w-[300px] rounded-lg"
                                    />
                                    <a
                                        href={praise.content.startsWith('http') ? praise.content : `${BASE_URL}${praise.content}`}
                                        download="追评视频"
                                        className="mt-2 inline-block text-xs text-blue-500"
                                    >
                                        下载视频
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}

                    {taskDetail.praises.length === 0 && (
                        <div className="text-xs text-slate-400">暂无追评要求，请自由发挥15字以上追评</div>
                    )}
                </div>

                {/* 已上传的截图 (如果有) */}
                {taskDetail.img && taskDetail.state >= 3 && (
                    <div className="rounded-xl bg-white p-4">
                        <div className="text-sm font-semibold text-slate-800 mb-3">已上传截图</div>
                        <div className="flex flex-wrap gap-2">
                            {taskDetail.img.split(',').filter(Boolean).map((imgUrl, idx) => (
                                <img
                                    key={idx}
                                    src={imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`}
                                    alt="追评截图"
                                    className="h-[60px] w-[60px] cursor-pointer rounded object-cover"
                                    onClick={() => setPreviewImage(imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* 审核备注 */}
                {taskDetail.remarks && (
                    <div className="rounded-xl bg-amber-50 p-4">
                        <div className="text-sm font-semibold text-amber-700 mb-2">审核备注</div>
                        <div className="text-xs text-amber-600">{taskDetail.remarks}</div>
                    </div>
                )}

                {/* 提示 */}
                <div className="rounded-xl bg-amber-100 p-4">
                    <div className="mb-2 text-sm font-semibold text-amber-700">提示</div>
                    <div className="space-y-2 text-xs leading-relaxed text-amber-700">
                        <p className="text-red-500">
                            1. 请按照上方追评要求进行追评，完成后截图上传。
                        </p>
                        <p className="text-red-500">
                            2. 追评需在收货后7天内完成，否则无法提交。
                        </p>
                        <p>3. 未按要求追评将扣除本次追评佣金。</p>
                        <p>4. 恶意追评或差评将永久拉黑买号。</p>
                    </div>
                </div>

                {/* 操作按钮 */}
                {canSubmit && (
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setRejectDialogVisible(true)}
                            className="flex-1 rounded-lg bg-slate-200 py-3 text-sm font-medium text-slate-700"
                        >
                            拒绝追评
                        </button>
                        <button
                            onClick={() => setDialogVisible(true)}
                            className="flex-1 rounded-lg bg-blue-500 py-3 text-sm font-medium text-white"
                        >
                            上传追评截图
                        </button>
                    </div>
                )}
            </div>

            {/* 提交追评弹框 */}
            {dialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[85%] max-w-[360px] rounded-xl bg-white p-5">
                        <h3 className="mb-5 text-center text-base font-medium text-slate-800">上传追评截图</h3>

                        <div className="mb-5">
                            <p className="mb-2.5 text-xs text-slate-600">请上传追评完成后的截图：</p>
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="w-full rounded border border-slate-200 p-2 text-sm"
                            />
                            {uploadedImages.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {uploadedImages.map((img, idx) => (
                                        <div key={idx} className="relative inline-block">
                                            <img
                                                src={img.content}
                                                alt="预览"
                                                className="h-16 w-16 rounded object-cover"
                                            />
                                            <button
                                                onClick={() => handleRemoveImage(idx)}
                                                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => {
                                    setDialogVisible(false);
                                    setUploadedImages([]);
                                }}
                                className="flex-1 rounded-md bg-slate-200 py-2.5 text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className={cn(
                                    'flex-1 rounded-md py-2.5 text-white',
                                    submitting ? 'bg-blue-300' : 'bg-blue-500'
                                )}
                            >
                                {submitting ? '提交中...' : '确认提交'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 拒绝追评弹框 */}
            {rejectDialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[85%] max-w-[360px] rounded-xl bg-white p-5">
                        <h3 className="mb-5 text-center text-base font-medium text-slate-800">拒绝追评</h3>

                        <div className="mb-5">
                            <p className="mb-2.5 text-xs text-slate-600">请输入拒绝原因（可选）：</p>
                            <textarea
                                className="w-full rounded border border-slate-200 p-2 text-sm"
                                rows={3}
                                placeholder="请输入拒绝原因..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <p className="mt-2 text-xs text-amber-600">
                                注意：拒绝追评后，追评费用将退还给商家。
                            </p>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => {
                                    setRejectDialogVisible(false);
                                    setRejectReason('');
                                }}
                                className="flex-1 rounded-md bg-slate-200 py-2.5 text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={submitting}
                                className={cn(
                                    'flex-1 rounded-md py-2.5 text-white',
                                    submitting ? 'bg-red-300' : 'bg-red-500'
                                )}
                            >
                                {submitting ? '处理中...' : '确认拒绝'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 图片预览 */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="大图预览"
                        className="max-h-[90%] max-w-[90%] object-contain"
                    />
                </div>
            )}

            <BottomNav />
        </div>
    );
}
