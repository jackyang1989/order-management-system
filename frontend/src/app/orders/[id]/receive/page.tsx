'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../../services/authService';
import BottomNav from '../../../../components/BottomNav';
import { cn } from '../../../../lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface ProductInfo {
    taskBianHao: string;
    time: string;
    type: string;
    title: string;
    content: string;
    img: string;
    video: string;
    maiHao: string;
    kuaiDi: string;
    danHao: string;
    price: string;
}

export default function ReceivePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [taskId, setTaskId] = useState('');
    const [testData, setTestData] = useState<ProductInfo[]>([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const alertSuccess = useCallback((msg: string) => { alert(msg); }, []);
    const alertError = useCallback((msg: string) => { alert(msg); }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/shouhuo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                const list = data.list || {};
                setTaskId(list.id || id);

                if (data.product && Array.isArray(data.product)) {
                    setTestData(data.product.map((vo: any) => ({
                        taskBianHao: list.task_number || '',
                        time: list.create_time || '',
                        type: list.task_type || '',
                        title: vo.name || '',
                        content: vo.text_praise || '',
                        img: vo.img_praise || '',
                        video: vo.video_praise ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.video_praise}` : '',
                        maiHao: list.wwid || '',
                        kuaiDi: list.delivery || '',
                        danHao: list.delivery_num || '',
                        price: list.seller_principal || '',
                    })));
                }
            } else {
                alertError(res.msg || '获取数据失败');
            }
        } catch (error) {
            console.error('Load data error:', error);
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    }, [id, alertError]);

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
        const file = e.target.files?.[0];
        if (file) {
            const content = await fileToBase64(file);
            setLocalFile({ file, content });
        }
    };

    const handleRemove = () => setLocalFile(null);

    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alertSuccess('复制成功');
        } catch {
            const input = document.createElement('input');
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand('Copy');
            document.body.removeChild(input);
            alertSuccess('复制成功');
        }
    };

    const dialogConfirm = async () => {
        if (!localFile) {
            alertError('请上传好评截图！');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/take_delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    high_praise_img: localFile.content,
                    task_id: taskId,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg || '确认收货成功');
                router.push('/orders'); // Redirect to order list
            } else {
                alertError(data.msg || '操作失败');
            }
        } catch (error) {
            alertError('网络错误');
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

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-5 pt-12 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="cursor-pointer text-2xl">‹</button>
                    <span className="text-lg font-semibold">去收货</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Title Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-blue-500">
                去收货
            </div>

            {/* Content */}
            <div className="p-3">
                <div className="mb-3 text-right">
                    <button
                        onClick={() => setDialogVisible(true)}
                        className="cursor-pointer rounded-md bg-red-500 px-6 py-2.5 text-sm font-semibold text-white"
                    >
                        确认收货
                    </button>
                </div>

                {testData.map((item, index) => (
                    <div key={index} className="mb-3 rounded-xl bg-white p-4">
                        <div className="mb-2.5 flex justify-between text-xs">
                            <span className="text-slate-500">任务编号：</span>
                            <span className="text-slate-800">{item.taskBianHao}</span>
                        </div>
                        <div className="mb-2.5 flex justify-between text-xs">
                            <span className="text-slate-500">发布时间：</span>
                            <span className="text-slate-800">{item.time}</span>
                        </div>
                        <div className="mb-2.5 flex justify-between text-xs">
                            <span className="text-slate-500">任务类型：</span>
                            <span className="text-slate-800">{item.type}</span>
                        </div>
                        <div className="mb-2.5 flex justify-between text-xs">
                            <span className="text-slate-500">商品标题：</span>
                            <span className="min-w-0 flex-1 truncate text-right text-slate-800">{item.title}</span>
                        </div>

                        {item.content && (
                            <div className="my-3 rounded-lg bg-slate-50 p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-xs font-semibold text-slate-800">文字好评：</span>
                                        <span className="text-xs text-red-500">{item.content}</span>
                                    </div>
                                    <button
                                        onClick={() => copyText(item.content)}
                                        className="shrink-0 cursor-pointer whitespace-nowrap rounded bg-red-500 px-3 py-1 text-xs text-white"
                                    >
                                        一键复制
                                    </button>
                                </div>
                            </div>
                        )}

                        {item.img && item.img.length > 0 && (
                            <div className="mb-3">
                                <span className="mr-2 text-xs font-semibold text-slate-800">照片好评：</span>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {item.img.split(',').filter(Boolean).map((imgUrl, idx) => (
                                        <img
                                            key={idx}
                                            src={imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`}
                                            alt="好评图片"
                                            className="h-[60px] w-[60px] rounded object-cover"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {item.video && (
                            <div className="mb-3">
                                <span className="mr-2 text-xs font-semibold text-slate-800">视频好评：</span>
                                <div className="mt-2">
                                    <video
                                        src={item.video}
                                        controls
                                        className="w-full max-w-[300px] rounded-lg"
                                    />
                                </div>
                                <a
                                    href={item.video}
                                    download="视频"
                                    className="mt-2 inline-block text-xs text-blue-500"
                                >
                                    下载视频
                                </a>
                            </div>
                        )}
                    </div>
                ))}

                {/* Tips */}
                <div className="mt-3 rounded-xl bg-amber-100 p-4">
                    <div className="mb-2 text-sm font-semibold text-amber-700">提示</div>
                    <div className="space-y-2 text-xs leading-relaxed text-amber-700">
                        <p className="text-red-500">
                            1.请复制以上指定文字好评内容进行5星好评，若有照片好评内容需长按每张照片保存到相册再到评价页面上传买家秀，若有视频好评内容先点击下载视频保存到相册后再到评价页面上传视频，评价提交后将评价页面截图上传。
                        </p>
                        <p className="text-red-500">
                            2.无指定评价内容时需全5星并自由发挥15字以上与商品相关的评语。
                        </p>
                        <p>3.未按指定文字、照片、视频好评将扣除本次任务的银锭(佣金)。</p>
                        <p>4.评价环节若胡乱评价、复制店内他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，买号将永久拉黑。</p>
                    </div>
                </div>
            </div>

            {/* Dialog */}
            {dialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[85%] max-w-[360px] rounded-xl bg-white p-5">
                        <h3 className="mb-5 text-center text-base font-medium text-slate-800">温馨提示</h3>

                        <div className="mb-5">
                            <p className="mb-2.5 text-xs text-slate-800">请上传好评截图：</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="w-full rounded border border-slate-200 p-2"
                            />
                            {localFile && (
                                <div className="relative mt-2.5 inline-block">
                                    <img
                                        src={localFile.content}
                                        alt="预览"
                                        className="h-20 w-20 cursor-pointer rounded object-cover"
                                        onClick={() => setPreviewImage(localFile.content)}
                                    />
                                    <button
                                        onClick={handleRemove}
                                        className="absolute -right-2 -top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full bg-red-500 text-xs text-white"
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => {
                                    setDialogVisible(false);
                                    setLocalFile(null);
                                }}
                                className="flex-1 cursor-pointer rounded-md bg-slate-200 py-2.5 text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={dialogConfirm}
                                disabled={submitting}
                                className={cn(
                                    'flex-1 rounded-md py-2.5 text-white',
                                    submitting ? 'cursor-not-allowed bg-blue-300' : 'cursor-pointer bg-blue-500'
                                )}
                            >
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Full-Size Image Preview Modal */}
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
