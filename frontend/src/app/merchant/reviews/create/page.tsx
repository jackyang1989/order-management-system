'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';
import { cn } from '../../../../lib/utils';
import { Button } from '../../../../components/ui/button';
import { Card } from '../../../../components/ui/card';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    productName: string;
    productPrice: number;
    buynoAccount: string;
    platformOrderNumber: string;
    completedAt: string;
}

interface GoodsPraiseSetting {
    goodsId: string;
    goodsName: string;
    isPraise: boolean;
    praiseContent: string;
    isImgPraise: boolean;
    praiseImages: string[];
    isVideoPraise: boolean;
    praiseVideo: string;
}

const REVIEW_PRICE = { TEXT: 2, IMAGE: 3, VIDEO: 10 };

function CreateReviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('orderId');

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [order, setOrder] = useState<Order | null>(null);
    const [goodsSettings, setGoodsSettings] = useState<GoodsPraiseSetting[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!orderId) { router.push('/merchant/reviews'); return; }
        loadOrderInfo();
    }, [orderId, router]);

    const loadOrderInfo = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) { router.push('/merchant/login'); return; }
        setLoading(true);
        try {
            const checkRes = await fetch(`${BASE_URL}/review-tasks/merchant/check/${orderId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const checkJson = await checkRes.json();
            if (!checkJson.success || !checkJson.data?.canReview) { setError(checkJson.data?.reason || '该订单不可追评'); setLoading(false); return; }
            setOrder(checkJson.data.order);
            setGoodsSettings([{ goodsId: checkJson.data.order.taskId, goodsName: checkJson.data.order.productName || '商品', isPraise: false, praiseContent: '', isImgPraise: false, praiseImages: [], isVideoPraise: false, praiseVideo: '' }]);
        } catch (e) { console.error(e); setError('加载订单信息失败'); }
        finally { setLoading(false); }
    };

    const calculateTotal = (): number => {
        let total = 0;
        for (const goods of goodsSettings) {
            if (goods.isPraise) total += REVIEW_PRICE.TEXT;
            if (goods.isImgPraise) total += REVIEW_PRICE.IMAGE;
            if (goods.isVideoPraise) total += REVIEW_PRICE.VIDEO;
        }
        return total;
    };

    const updateGoodsSetting = (index: number, field: keyof GoodsPraiseSetting, value: any) => {
        const newSettings = [...goodsSettings];
        (newSettings[index] as any)[field] = value;
        setGoodsSettings(newSettings);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !orderId) return;
        const total = calculateTotal();
        if (total <= 0) { alert('请至少选择一种追评类型'); return; }
        for (const goods of goodsSettings) {
            if (goods.isPraise && !goods.praiseContent.trim()) { alert('请填写文字追评内容'); return; }
            if (goods.isImgPraise && goods.praiseImages.length === 0) { alert('请上传图片追评'); return; }
            if (goods.isVideoPraise && !goods.praiseVideo) { alert('请上传视频追评'); return; }
        }
        setSubmitting(true);
        try {
            const res = await fetch(`${BASE_URL}/review-tasks/merchant/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userTaskId: orderId, goods: goodsSettings.map(g => ({ goodsId: g.goodsId, isPraise: g.isPraise, praiseContent: g.praiseContent, isImgPraise: g.isImgPraise, praiseImages: g.praiseImages, isVideoPraise: g.isVideoPraise, praiseVideo: g.praiseVideo })) })
            });
            const json = await res.json();
            if (json.success) router.push(`/merchant/reviews/pay/${json.data.id}`);
            else alert(json.message || '创建失败');
        } catch { alert('网络错误'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="py-12 text-center text-[#f9fafb]0">加载中...</div>;

    if (error) {
        return (
            <div className="py-12 text-center">
                <div className="mb-4 text-5xl">⚠️</div>
                <div className="mb-6 text-red-500">{error}</div>
                <Button variant="secondary" onClick={() => router.push('/merchant/reviews')}>返回</Button>
            </div>
        );
    }

    const total = calculateTotal();

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold">发布追评任务</h1>
                <p className="mt-2 text-sm text-[#f9fafb]0">为已完成的订单发布追评任务，买手完成追评后可获得佣金</p>
            </div>

            {/* Order Info */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 text-base font-semibold">订单信息</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-[#f9fafb]0">商品名称：</span>{order?.productName}</div>
                    <div><span className="text-[#f9fafb]0">买号：</span>{order?.buynoAccount}</div>
                    <div><span className="text-[#f9fafb]0">平台订单号：</span>{order?.platformOrderNumber || '-'}</div>
                    <div><span className="text-[#f9fafb]0">完成时间：</span>{order?.completedAt ? new Date(order.completedAt).toLocaleString('zh-CN') : '-'}</div>
                </div>
            </Card>

            {/* Review Settings */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 text-base font-semibold">追评内容设置</h2>
                {goodsSettings.map((goods, idx) => (
                    <div key={goods.goodsId} className="mb-4 rounded-md bg-[#f9fafb] p-4">
                        <div className="mb-4 font-medium">{goods.goodsName}</div>

                        {/* Text Review */}
                        <div className="mb-4">
                            <label className="mb-2 flex items-center gap-2">
                                <input type="checkbox" checked={goods.isPraise} onChange={(e) => updateGoodsSetting(idx, 'isPraise', e.target.checked)} />
                                <span className="font-medium">文字追评</span>
                                <span className="text-sm text-green-600">+{REVIEW_PRICE.TEXT}元</span>
                            </label>
                            {goods.isPraise && (
                                <textarea
                                    value={goods.praiseContent}
                                    onChange={(e) => updateGoodsSetting(idx, 'praiseContent', e.target.value)}
                                    placeholder="请输入追评文字内容..."
                                    className="h-24 w-full resize-none rounded-md border border-[#e5e7eb] p-3 text-sm"
                                />
                            )}
                        </div>

                        {/* Image Review */}
                        <div className="mb-4">
                            <label className="mb-2 flex items-center gap-2">
                                <input type="checkbox" checked={goods.isImgPraise} onChange={(e) => updateGoodsSetting(idx, 'isImgPraise', e.target.checked)} />
                                <span className="font-medium">图片追评</span>
                                <span className="text-sm text-green-600">+{REVIEW_PRICE.IMAGE}元</span>
                            </label>
                            {goods.isImgPraise && <div className="text-sm text-[#f9fafb]0">图片上传功能需要集成OSS（暂未实现）</div>}
                        </div>

                        {/* Video Review */}
                        <div>
                            <label className="mb-2 flex items-center gap-2">
                                <input type="checkbox" checked={goods.isVideoPraise} onChange={(e) => updateGoodsSetting(idx, 'isVideoPraise', e.target.checked)} />
                                <span className="font-medium">视频追评</span>
                                <span className="text-sm text-green-600">+{REVIEW_PRICE.VIDEO}元</span>
                            </label>
                            {goods.isVideoPraise && <div className="text-sm text-[#f9fafb]0">视频上传功能需要集成OSS（暂未实现）</div>}
                        </div>
                    </div>
                ))}
            </Card>

            {/* Cost Summary */}
            <Card className="bg-white p-5">
                <h2 className="mb-4 text-base font-semibold">费用汇总</h2>
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm text-[#f9fafb]0">追评费用</div>
                        <div className="mt-1 text-xs text-[#9ca3af]">买手获得50%佣金</div>
                    </div>
                    <div className="text-3xl font-bold text-red-500">¥{total.toFixed(2)}</div>
                </div>
            </Card>

            {/* Actions */}
            <div className="flex gap-3">
                <Button variant="secondary" onClick={() => router.back()} className="flex-1">取消</Button>
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || total <= 0}
                    className={cn('flex-[2]', (submitting || total <= 0) && 'cursor-not-allowed opacity-50')}
                >
                    {submitting ? '提交中...' : '下一步：支付'}
                </Button>
            </div>
        </div>
    );
}

export default function CreateReviewPage() {
    return (
        <Suspense fallback={<div className="py-12 text-center text-[#f9fafb]0">加载中...</div>}>
            <CreateReviewContent />
        </Suspense>
    );
}
