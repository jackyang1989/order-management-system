'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';
import { cn } from '../../../../../lib/utils';

interface TaskData {
    img2: string;
    name2: string;
    taskBianHao: string;
    time: string;
    type: string;
    maiHao: string;
    kuaiDi: string;
    danHao: string;
    price: string;
}

export default function RefundPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [task_id, setTaskId] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [testData, setTestData] = useState<TaskData[]>([]);
    const [alertNum, setAlertNum] = useState(0);

    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const alertSuccess = useCallback((msg: string) => { alert(msg); }, []);
    const alertError = useCallback((msg: string) => { alert(msg); }, []);

    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/shoukuan`, {
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
                setAlertNum(data.list?.seller_principal || 0);

                if (data.product && Array.isArray(data.product)) {
                    const taskList: TaskData[] = data.product.map((vo: any) => ({
                        img2: vo.pc_img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.pc_img}` : '',
                        name2: vo.name || '',
                        taskBianHao: data.list?.task_number || '',
                        time: data.list?.create_time || '',
                        type: data.list?.task_type || '',
                        maiHao: data.list?.wwid || '',
                        kuaiDi: data.list?.delivery || '',
                        danHao: data.list?.delivery_num || '',
                        price: data.list?.seller_principal || '',
                    }));
                    setTestData(taskList);
                } else if (data.list) {
                    setTestData([{
                        img2: data.list.pc_img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${data.list.pc_img}` : '',
                        name2: data.list.name || '',
                        taskBianHao: data.list.task_number || '',
                        time: data.list.create_time || '',
                        type: data.list.task_type || '',
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

    const confirmRefund = async () => {
        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/confirm_refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ id: task_id }),
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
            alertError('确认返款失败');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmClick = () => setDialogVisible(true);

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
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <span className="text-sm text-slate-500">加载中...</span>
            </div>
        );
    }

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                <button onClick={() => router.back()} className="w-7 cursor-pointer text-xl">‹</button>
                <span className="text-base font-bold text-slate-800">待确认返款</span>
                <div className="w-7" />
            </header>

            {/* Title */}
            <div className="mb-2.5 bg-white px-4 py-3">
                <span className="font-bold text-blue-500">待确认返款</span>
            </div>

            {/* Task Content */}
            {testData.map((item, index) => (
                <div key={index}>
                    {/* Task Info Card */}
                    <div className="mx-2.5 mb-2.5 rounded-lg bg-white p-4">
                        <div className="mb-2.5 text-xs text-slate-500">
                            任务编号：{item.taskBianHao}
                        </div>

                        <div className="mb-4 flex justify-between text-xs text-slate-500">
                            <span>任务类型：<b className="text-slate-800">{item.type}</b></span>
                            <span>买号：<b className="text-slate-800">{item.maiHao}</b></span>
                        </div>

                        <div className="mb-4 flex gap-3">
                            {item.img2 && (
                                <img
                                    src={item.img2}
                                    alt="商品图片"
                                    className="h-20 w-20 shrink-0 rounded border border-slate-200 object-cover"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="line-clamp-2 text-sm leading-relaxed text-slate-800">
                                    {item.name2}
                                </p>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500">
                            接单时间：{item.time}
                        </div>
                    </div>

                    {/* Delivery Info Card */}
                    <div className="mx-2.5 mb-2.5 rounded-lg bg-white p-4">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>快递：<b className="text-slate-800">{item.kuaiDi}</b></span>
                            <span>快递单号：<b className="text-slate-800">{item.danHao}</b></span>
                        </div>
                    </div>
                </div>
            ))}

            {/* Fixed Confirm Button */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
                <div className="mx-auto w-full max-w-md px-4 py-3">
                    <button
                        onClick={handleConfirmClick}
                        className="w-full cursor-pointer rounded bg-blue-500 py-3 text-sm font-bold text-white"
                    >
                        确认返款
                    </button>
                </div>
            </div>

            {/* Confirm Dialog */}
            {dialogVisible && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-[90%] max-w-[400px] rounded-lg bg-white p-5">
                        <h3 className="mb-5 text-center text-base font-medium">温馨提示</h3>

                        <div className="mb-5 text-center">
                            <p className="text-sm text-slate-500">点击确认立即到账</p>
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => setDialogVisible(false)}
                                className="flex-1 cursor-pointer rounded bg-slate-200 py-2.5 text-slate-700"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmRefund}
                                disabled={submitting}
                                className={cn(
                                    'flex-1 rounded py-2.5 text-white',
                                    submitting ? 'cursor-not-allowed bg-blue-300' : 'cursor-pointer bg-blue-500'
                                )}
                            >
                                {submitting ? '处理中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
