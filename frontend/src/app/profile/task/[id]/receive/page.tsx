'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';

interface TaskData {
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
    const [task_id, setTaskId] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [testData, setTestData] = useState<TaskData[]>([]);
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const alertSuccess = useCallback((msg: string) => { alert(msg); }, []);
    const alertError = useCallback((msg: string) => { alert(msg); }, []);

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

    const copyText = (text: string) => {
        if (!text) return;
        const oInput = document.createElement('input');
        oInput.value = text;
        document.body.appendChild(oInput);
        oInput.select();
        document.execCommand('Copy');
        oInput.style.display = 'none';
        document.body.removeChild(oInput);
        alertSuccess('复制成功');
    };

    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/shouhuo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ id }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                setTaskId(data.list?.id || id);

                if (data.product && Array.isArray(data.product)) {
                    const taskList: TaskData[] = data.product.map((vo: any) => ({
                        taskBianHao: data.list?.task_number || '',
                        time: data.list?.create_time || '',
                        type: data.list?.task_type || '',
                        title: vo.name || '',
                        content: vo.text_praise || '',
                        img: vo.img_praise || '',
                        video: vo.video_praise ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.video_praise}` : '',
                        maiHao: data.list?.wwid || '',
                        kuaiDi: data.list?.delivery || '',
                        danHao: data.list?.delivery_num || '',
                        price: data.list?.seller_principal || '',
                    }));
                    setTestData(taskList);
                } else if (data.list) {
                    setTestData([{
                        taskBianHao: data.list.task_number || '',
                        time: data.list.create_time || '',
                        type: data.list.task_type || '',
                        title: data.list.name || '',
                        content: data.list.text_praise || '',
                        img: data.list.img_praise || '',
                        video: data.list.video_praise ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${data.list.video_praise}` : '',
                        maiHao: data.list.wwid || '',
                        kuaiDi: data.list.delivery || '',
                        danHao: data.list.delivery_num || '',
                        price: data.list.seller_principal || '',
                    }]);
                }
            } else {
                alertError(res.msg || '获取任务数据失败');
            }
        } catch (error) {
            console.error('获取任务数据失败:', error);
            alertError('获取任务数据失败');
        } finally {
            setLoading(false);
        }
    }, [id, getToken, alertError]);

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
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    high_praise_img: localFile.content,
                    task_id: task_id,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    router.push(data.url || '/orders');
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        getData();
    }, [getData, getToken, router]);

    if (loading) {
        return (
            <div className="p-5 text-center text-slate-500">
                加载中...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <button onClick={() => router.back()} className="w-7 text-xl text-slate-600">‹</button>
                <span className="text-base font-bold text-slate-800">去收货</span>
                <div className="w-7" />
            </header>

            {/* Title */}
            <div className="mb-2.5 bg-white px-4 py-3">
                <span className="font-bold text-blue-500">去收货</span>
            </div>

            {/* Confirm Button */}
            <div className="mb-4 px-4">
                <button
                    onClick={() => setDialogVisible(true)}
                    className="w-full cursor-pointer rounded bg-red-500 px-3 py-3 text-sm font-bold text-white"
                >
                    确认收货
                </button>
            </div>

            {/* Task Content */}
            {testData.map((item, index) => (
                <div key={index} className="mx-2.5 mb-2.5 rounded-lg bg-white p-4">
                    <div className="space-y-1 text-xs leading-relaxed text-slate-500">
                        <div className="flex justify-between"><span>任务编号：</span><span>{item.taskBianHao}</span></div>
                        <div className="flex justify-between"><span>发布时间：</span><span>{item.time}</span></div>
                        <div className="flex justify-between"><span>任务类型：</span><span>{item.type}</span></div>
                        <div className="flex justify-between"><span>商品标题：</span><span>{item.title}</span></div>
                    </div>

                    {/* Text Review */}
                    <div className="mt-4 rounded bg-slate-50 p-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <b className="text-xs text-slate-800">文字好评：</b>
                                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                                    {item.content || '无指定好评内容，请自由发挥15字以上与商品相关的评语'}
                                </p>
                            </div>
                        </div>
                        {item.content && (
                            <button
                                onClick={() => copyText(item.content)}
                                className="mt-2.5 cursor-pointer rounded bg-red-500 px-4 py-1.5 text-xs text-white"
                            >
                                一键复制
                            </button>
                        )}
                    </div>

                    {/* Image Review */}
                    {item.img && item.img.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs font-bold text-slate-800">照片好评：</span>
                            <div className="mt-2.5 flex flex-wrap gap-2.5">
                                {item.img.split(',').filter(Boolean).map((imgUrl, imgIndex) => (
                                    <img
                                        key={imgIndex}
                                        src={imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`}
                                        alt={`好评图${imgIndex + 1}`}
                                        className="h-20 w-20 cursor-pointer rounded border border-slate-200 object-cover"
                                        onClick={() => setPreviewImage(imgUrl.startsWith('http') ? imgUrl : `https://b--d.oss-cn-guangzhou.aliyuncs.com${imgUrl}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Video Review */}
                    {item.video && (
                        <div className="mt-4">
                            <span className="text-xs font-bold text-slate-800">视频好评：</span>
                            <div className="mt-2.5">
                                <video
                                    src={item.video}
                                    controls
                                    className="max-h-[200px] w-full rounded"
                                />
                                <a
                                    href={item.video}
                                    download="视频"
                                    className="mt-2.5 inline-block rounded bg-blue-500 px-4 py-1.5 text-xs text-white no-underline"
                                >
                                    下载视频
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Tips */}
            <div className="mx-2.5 rounded-lg bg-amber-100 p-4">
                <p className="mb-2.5 text-sm font-bold text-amber-700">提示</p>
                <div className="space-y-1 text-xs leading-relaxed text-amber-700">
                    <p className="text-red-500">1.请复制以上指定文字好评内容进行5星好评，若有照片好评内容需长按每张照片保存到相册再到评价页面上传买家秀，若有视频好评内容先点击下载视频保存到相册后再到评价页面上传视频，评价提交后将评价页面截图上传。</p>
                    <p className="text-red-500">2.无指定评价内容时需全5星并自由发挥15字以上与商品相关的评语。</p>
                    <p>3.未按指定文字、照片、视频好评将扣除本次任务的银锭(佣金)。</p>
                    <p>4.评价环节若胡乱评价、复制店内他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，买号将永久拉黑。</p>
                </div>
            </div>

            {/* Upload Dialog */}
            {dialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[90%] max-w-[400px] rounded-lg bg-white p-5">
                        <h3 className="mb-5 text-center text-base font-medium">温馨提示</h3>

                        <div className="mb-5">
                            <p className="mb-2.5 text-sm text-slate-500">请上传好评截图：</p>
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
                                        className="h-20 w-20 rounded object-cover"
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
                                onClick={() => setDialogVisible(false)}
                                className="flex-1 cursor-pointer rounded bg-slate-200 py-2.5 text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={dialogConfirm}
                                disabled={submitting}
                                className={`flex-1 rounded py-2.5 text-white ${submitting ? 'cursor-not-allowed bg-blue-300' : 'cursor-pointer bg-blue-500'}`}
                            >
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="预览"
                        className="max-h-[90%] max-w-[90%] object-contain"
                    />
                </div>
            )}
        </div>
    );
}
