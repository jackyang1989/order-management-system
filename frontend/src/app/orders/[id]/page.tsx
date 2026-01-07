'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';
import BottomNav from '../../../components/BottomNav';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

interface TaskData {
    maiHao: string;
    type: string;
    zhongDuan: string;
    benJin: string;
    yongJin: string;
    user_divided: string;
    money: string;
    dianPu: string;
    taskNum: string;
    time: string;
    taskType: string;
    delType: string;
    goods_price: string;
    seller_name: string;
}

interface TaskData2 {
    img: string;
    img2: string;
    zhiFu: string;
    order: string;
    style: string;
    num: string;
    type1: string;
    time: string;
    step_two_complete: string;
    upload_order_time: string;
    delivery_time: string;
    platform_refund_time: string;
}

interface ProductInfo {
    name: string;
    text_praise: string;
    img_praise: string[];
    video_praise: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [taskData, setTaskData] = useState<TaskData | null>(null);
    const [taskData2, setTaskData2] = useState<TaskData2 | null>(null);
    const [products, setProducts] = useState<ProductInfo[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const alertError = useCallback((msg: string) => { alert(msg); }, []);

    const loadDetail = useCallback(async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/detail`, {
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

                setTaskData({
                    maiHao: list.wwid || '',
                    type: list.task_type || '',
                    zhongDuan: list.terminal === 1 ? '本佣货返' : list.terminal === 2 ? '本立佣货' : list.terminal || '',
                    benJin: list.seller_principal || '',
                    yongJin: list.commission || '',
                    user_divided: list.user_divided || '',
                    money: list.seller_principal || '',
                    dianPu: list.shop_name || '',
                    taskNum: list.task_number || '',
                    time: list.create_time || '',
                    taskType: list.state || '',
                    delType: list.deltask_type || '',
                    goods_price: list.goods_price || '',
                    seller_name: list.seller_name || '',
                });

                setTaskData2({
                    img: list.keywordimg || '',
                    img2: list.chatimg || '',
                    zhiFu: list.table_order_id ? '已上传订单' : '待上传',
                    order: list.table_order_id || '',
                    style: list.delivery || '',
                    num: list.delivery_num || '',
                    type1: list.state || '',
                    time: list.update_time || '',
                    step_two_complete: list.step_two_complete || '',
                    upload_order_time: list.upload_order_time || '',
                    delivery_time: list.delivery_time || '',
                    platform_refund_time: list.platform_refund_time || '',
                });

                if (data.product && Array.isArray(data.product)) {
                    setProducts(data.product.map((item: any) => ({
                        name: item.name || '',
                        text_praise: item.text_praise || '',
                        img_praise: item.img_praise || [],
                        video_praise: item.video_praise || '',
                    })));
                }
            } else {
                alertError(res.msg || '获取详情失败');
                router.back();
            }
        } catch (error) {
            console.error('Load detail error:', error);
            alertError('网络错误');
        } finally {
            setLoading(false);
        }
    }, [id, alertError, router]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadDetail();
    }, [router, loadDetail]);

    const showImage = (img: string) => {
        if (img && img.length > 0) {
            setPreviewImage(img);
        } else {
            alertError('当前没有图片');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-100">
                <div className="text-sm text-slate-400">加载中...</div>
            </div>
        );
    }

    if (!taskData) return null;

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 px-4 pb-5 pt-12 text-white">
                <div className="flex items-center justify-between">
                    <button onClick={() => router.back()} className="cursor-pointer text-2xl">‹</button>
                    <span className="text-lg font-semibold">任务详情</span>
                    <div className="w-6" />
                </div>
            </div>

            {/* Title Bar */}
            <div className="border-b border-slate-200 bg-white px-4 py-3.5 text-center text-sm font-semibold text-blue-500">
                任务详情
            </div>

            {/* Content */}
            <div className="p-3">
                {/* Task Info Card */}
                <div className="mb-3 overflow-hidden rounded-xl bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                        <span className="text-sm font-semibold text-red-500">任务信息</span>
                        <div className="flex gap-3">
                            <button
                                onClick={() => router.push('/profile/records?type=silver')}
                                className="cursor-pointer text-xs text-blue-500"
                            >
                                银锭记录
                            </button>
                            <button
                                onClick={() => router.push('/profile/records?type=principal')}
                                className="cursor-pointer text-xs text-blue-500"
                            >
                                本金记录
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3 p-4 text-xs">
                        <div className="flex justify-between">
                            <span className="text-slate-500">买号：</span>
                            <span className="text-slate-800">{taskData.maiHao}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">任务类型：</span>
                            <span className="text-slate-800">{taskData.type}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">返款方式：</span>
                            <span className="text-slate-800">{taskData.zhongDuan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">佣金：</span>
                            <span className="font-semibold text-blue-500">
                                {taskData.yongJin}<span className="text-amber-400">+{taskData.user_divided}银锭</span>
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">任务金额：</span>
                            <span className="text-slate-800">{taskData.goods_price}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">垫付金额：</span>
                            <span className="font-semibold text-blue-500">{taskData.benJin}元</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">返款金额：</span>
                            <span className="text-slate-800">{taskData.money}元</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">任务编号：</span>
                            <span className="text-slate-800">{taskData.taskNum}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">店铺：</span>
                            <span className="text-slate-800">{taskData.dianPu?.substring(0, 3)}...</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">创建时间：</span>
                            <span className="text-slate-800">{taskData.time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">任务状态：</span>
                            <span className="text-slate-800">
                                {taskData.taskType}
                                {taskData.taskType === '已取消' && taskData.delType && (
                                    <span className="ml-2.5 text-red-500">{taskData.delType}</span>
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Task Progress Card */}
                {taskData2 && (
                    <div className="mb-3 overflow-hidden rounded-xl bg-white">
                        <div className="border-b border-slate-100 px-4 py-3.5">
                            <span className="text-sm font-semibold text-red-500">任务进度</span>
                        </div>

                        <div className="overflow-x-auto p-4">
                            <table className="min-w-[500px] w-full border-collapse text-xs">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="border border-slate-200 p-2.5 text-left">服务项目</th>
                                        <th className="border border-slate-200 p-2.5 text-center">完成状态</th>
                                        <th className="border border-slate-200 p-2.5 text-center">完成时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">浏览店铺及在线客服聊天</td>
                                        <td className="border border-slate-200 p-2.5 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button onClick={() => showImage(taskData2.img)} className="cursor-pointer text-blue-500">
                                                    点击查看
                                                </button>
                                                <button onClick={() => showImage(taskData2.img2)} className="cursor-pointer text-blue-500">
                                                    点击查看
                                                </button>
                                            </div>
                                        </td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.step_two_complete}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">下单/支付</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.zhiFu}</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.upload_order_time}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">订单编号</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.order}</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.upload_order_time}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">商家发货</td>
                                        <td className="border border-slate-200 p-2.5">
                                            <div>
                                                <p className="mb-1">快递方式：<span>{taskData2.style || '-'}</span></p>
                                                <p>快递单号：<span>{taskData2.num || '-'}</span></p>
                                            </div>
                                        </td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.delivery_time}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">平台返款</td>
                                        <td className="border border-slate-200 p-2.5 text-center">
                                            {taskData2.type1 === '待确认返款' || taskData2.type1 === '已完成' ? (
                                                <span className="text-green-500">已返款</span>
                                            ) : (
                                                <span className="text-amber-500">待返款</span>
                                            )}
                                        </td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.platform_refund_time}</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">任务状态</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.type1}</td>
                                        <td className="border border-slate-200 p-2.5 text-center">{taskData2.time}</td>
                                    </tr>
                                    {products.map((vo, index) => (
                                        <tr key={index}>
                                            <td className="border border-slate-200 p-2.5">好评内容</td>
                                            <td className="border border-slate-200 p-2.5 text-red-500">{vo.text_praise || '暂无内容'}</td>
                                            <td className="border border-slate-200 p-2.5 text-center">暂无内容</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">图片</td>
                                        <td className="border border-slate-200 p-2.5">
                                            <div className="flex flex-wrap gap-2">
                                                {products.flatMap(p => p.img_praise || []).map((img, idx) => (
                                                    <img
                                                        key={idx}
                                                        src={`https://b--d.oss-cn-guangzhou.aliyuncs.com${img}`}
                                                        alt="好评图片"
                                                        className="h-[50px] w-[50px] cursor-pointer rounded object-cover"
                                                        onClick={() => setPreviewImage(`https://b--d.oss-cn-guangzhou.aliyuncs.com${img}`)}
                                                    />
                                                ))}
                                                {products.flatMap(p => p.img_praise || []).length === 0 && (
                                                    <span className="text-slate-400">暂无图片</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="border border-slate-200 p-2.5 text-center">暂无内容</td>
                                    </tr>
                                    <tr>
                                        <td className="border border-slate-200 p-2.5">视频</td>
                                        <td className="border border-slate-200 p-2.5">
                                            {products.some(p => p.video_praise) ? (
                                                <video
                                                    src={`https://b--d.oss-cn-guangzhou.aliyuncs.com${products.find(p => p.video_praise)?.video_praise}`}
                                                    controls
                                                    className="h-20 w-[120px] rounded"
                                                />
                                            ) : (
                                                <span className="text-slate-400">暂无视频</span>
                                            )}
                                        </td>
                                        <td className="border border-slate-200 p-2.5 text-center">
                                            {products.some(p => p.video_praise) && (
                                                <a
                                                    href={`https://b--d.oss-cn-guangzhou.aliyuncs.com${products.find(p => p.video_praise)?.video_praise}`}
                                                    download="视频"
                                                    className="text-blue-500"
                                                >
                                                    下载
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="预览"
                        className="max-h-[90%] max-w-[90%] object-contain"
                    />
                </div>
            )}

            {/* Action Bar */}
            {taskData && (
                <div className="fixed bottom-16 left-0 right-0 border-t border-slate-200 bg-white p-3">
                    <div className="mx-auto flex max-w-[515px] justify-center gap-3">
                        {/* 待下单状态 - 可取消 */}
                        {taskData.taskType === '待下单' && (
                            <button
                                onClick={() => {
                                    if (confirm('确定要取消此任务吗？')) {
                                        // TODO: Call cancel API
                                        alertError('取消功能开发中');
                                    }
                                }}
                                className="flex-1 rounded-lg border border-red-500 px-4 py-2.5 text-sm font-medium text-red-500 active:bg-red-50"
                            >
                                取消任务
                            </button>
                        )}

                        {/* 待上传截图状态 */}
                        {taskData.taskType === '待上传截图' && (
                            <button
                                onClick={() => router.push(`/orders/${id}/receive`)}
                                className="flex-1 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white active:bg-blue-600"
                            >
                                上传截图
                            </button>
                        )}

                        {/* 待确认收货状态 */}
                        {taskData.taskType === '待确认收货' && (
                            <button
                                onClick={() => {
                                    if (confirm('确定已收到货物？')) {
                                        // TODO: Call confirm receive API
                                        alertError('确认收货功能开发中');
                                    }
                                }}
                                className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white active:bg-green-600"
                            >
                                确认收货
                            </button>
                        )}

                        {/* 待追评状态 - 上传追评截图 */}
                        {taskData.taskType === '待追评' && (
                            <button
                                onClick={() => router.push(`/orders/${id}/receive?type=zhuiping`)}
                                className="flex-1 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white active:bg-amber-600"
                            >
                                上传追评截图
                            </button>
                        )}

                        {/* 已完成/已取消状态 - 无操作 */}
                        {(taskData.taskType === '已完成' || taskData.taskType === '已取消') && (
                            <div className="flex-1 rounded-lg bg-slate-100 px-4 py-2.5 text-center text-sm font-medium text-slate-400">
                                {taskData.taskType === '已完成' ? '任务已完成' : '任务已取消'}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <BottomNav />
        </div>
    );
}
