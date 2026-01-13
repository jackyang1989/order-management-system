'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTaskDetail, TaskItem, TaskGoodsItem, TaskKeywordItem } from '../../../services/taskService';
import { createOrder } from '../../../services/orderService';
import { fetchBuyerAccounts } from '../../../services/userService';
import { MockBuyerAccount } from '../../../mocks/userMock';
import { isAuthenticated } from '../../../services/authService';
import { cn } from '../../../lib/utils';

import { 
    PlatformLabels, 
    TerminalLabels, 
    TaskStatusLabels,
} from '@/shared/taskSpec';
import { formatDateTime, formatMoney } from '@/shared/formatters';

const TaskTypeMap: Record<number, string> = PlatformLabels;
const TerminalMap: Record<number, string> = TerminalLabels;

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [task, setTask] = useState<TaskItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [buyerAccount, setBuyerAccount] = useState('');
    const [buyerAccounts, setBuyerAccounts] = useState<MockBuyerAccount[]>([]);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadTask();
        loadBuyerAccounts();
    }, [id, router]);

    const loadBuyerAccounts = async () => {
        const accounts = await fetchBuyerAccounts();
        setBuyerAccounts(accounts.filter(acc => acc.status === 'APPROVED'));
    };

    const loadTask = async () => {
        setLoading(true);
        try {
            const found = await fetchTaskDetail(id);
            setTask(found);
        } catch (error) {
            alert('任务不存在');
            router.back();
        }
        setLoading(false);
    };

    const handleClaim = async () => {
        if (!buyerAccount) {
            alert('请选择买号');
            return;
        }
        if (!task) return;

        if (!confirm(`确认使用买号 ${buyerAccount} 领取该任务吗？`)) return;

        setSubmitting(true);
        try {
            const result = await createOrder(task.id, buyerAccount);
            if (result && result.orderId) {
                alert('领取成功！立即开始任务');
                router.push(`/orders/${result.orderId}/execute`);
            } else {
                alert('领取失败，请稍后重试');
            }
        } catch (e) {
            console.error(e);
            alert('领取出错');
        } finally {
            setSubmitting(false);
        }
    };

    // 解析 JSON 字段
    const parsePraiseList = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr) || []; } catch { return []; }
    };

    const parseChannelImages = (jsonStr: string | undefined): string[] => {
        if (!jsonStr) return [];
        try { return JSON.parse(jsonStr) || []; } catch { return []; }
    };

    // 判断进店方式
    const getEntryMethod = (t: TaskItem): { type: string; content: React.ReactNode } => {
        if (t.qrCode) {
            return { type: '二维码', content: <img src={t.qrCode} alt="二维码" className="h-28 w-28 mx-auto rounded border" /> };
        }
        if (t.taoWord) {
            return { type: '淘口令', content: <code className="block rounded bg-amber-50 px-3 py-2 text-sm text-amber-700 break-all">{t.taoWord}</code> };
        }
        const channelImgs = parseChannelImages(t.channelImages);
        if (channelImgs.length > 0) {
            return {
                type: '通道',
                content: (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {channelImgs.map((img, i) => (
                            <img key={i} src={img} alt={`通道图${i + 1}`} className="h-20 w-20 rounded border object-cover" />
                        ))}
                    </div>
                )
            };
        }
        return {
            type: '关键词',
            content: (
                <div className="rounded bg-primary-50 px-3 py-2 text-center">
                    <div className="text-xs text-slate-500 mb-1">搜索关键词</div>
                    <div className="text-base font-bold text-primary-600">{t.keyword}</div>
                </div>
            )
        };
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <span className="text-sm text-slate-500">加载中...</span>
            </div>
        );
    }

    if (!task) return null;

    const entryMethod = getEntryMethod(task);
    const praiseTexts = parsePraiseList(task.praiseList);
    const isFreeShipping = task.isFreeShipping === 1 || task.isFreeShipping === true;
    const platformName = task.taskType ? TaskTypeMap[task.taskType] : task.platform;
    const remainCount = (task.count || 0) - (task.claimedCount || 0);

    // 浏览行为配置
    const browseActions = [
        { label: '货比', enabled: task.needCompare, extra: task.needCompare ? `${task.compareCount || 3}家商品` : undefined },
        { label: '收藏商品', enabled: task.needFavorite },
        { label: '关注店铺', enabled: task.needFollow },
        { label: '加入购物车', enabled: task.needAddCart },
        { label: '联系客服', enabled: task.needContactCS, extra: task.contactCSContent }
    ].filter(a => a.enabled);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-3 sticky top-0 z-10">
                <button onClick={() => router.back()} className="w-7 cursor-pointer text-xl">‹</button>
                <span className="text-base font-bold text-slate-800">任务详情</span>
                <div className="w-7" />
            </header>

            {/* Product Info Card - Multi-Goods Support */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-bold text-slate-800">商品信息</div>

                {/* Multi-goods list */}
                {task.goodsList && task.goodsList.length > 0 ? (
                    <div className="space-y-3">
                        {task.goodsList.map((goods, index) => (
                            <div key={goods.id} className="flex gap-3 rounded border border-slate-100 p-2">
                                {goods.pcImg && (
                                    <img src={goods.pcImg} alt="" className="h-16 w-16 rounded border border-slate-200 object-cover shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={cn(
                                            'rounded px-1.5 py-0.5 text-xs',
                                            index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                                        )}>
                                            {index === 0 ? '主商品' : `副商品${index}`}
                                        </span>
                                    </div>
                                    <div className="text-sm text-slate-700 line-clamp-2">{goods.name}</div>
                                    {goods.specName && goods.specValue && (
                                        <div className="text-xs text-slate-400 mt-1">
                                            规格：{goods.specName}: {goods.specValue}
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-danger-500 font-medium">¥{goods.price}</span>
                                        <span className="text-xs text-slate-400">x{goods.num}</span>
                                    </div>
                                    {/* 下单规格显示 */}
                                    {goods.orderSpecs && (() => {
                                        try {
                                            const specs = JSON.parse(goods.orderSpecs);
                                            if (Array.isArray(specs) && specs.length > 0) {
                                                return (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="text-xs font-medium text-slate-500">下单规格:</div>
                                                        {specs.map((spec: { specName: string; specValue: string; quantity: number }, idx: number) => (
                                                            <div key={idx} className="flex items-center gap-2 rounded bg-slate-50 px-2 py-1 text-xs">
                                                                <span className="text-slate-600">{spec.specName}: {spec.specValue}</span>
                                                                <span className="text-slate-400">× {spec.quantity}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        } catch {
                                            return null;
                                        }
                                    })()}
                                    {/* 核对口令显示 */}
                                    {goods.verifyCode && (
                                        <div className="mt-1 text-xs text-slate-500">
                                            核对口令: <span className="font-medium text-primary-600">{goods.verifyCode}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Fallback: single product display */
                    <div className="flex gap-3">
                        {task.mainImage && (
                            <img src={task.mainImage} alt="" className="h-20 w-20 rounded-md border border-slate-200 object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-800 line-clamp-2">{task.title}</div>
                            <div className="mt-1 flex items-center gap-2">
                                <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-600">{platformName}</span>
                                <span className="text-xs text-slate-500">{task.shopName}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-lg font-bold text-danger-400">¥{task.price}</span>
                                <span className="text-sm text-success-500">佣金 ¥{task.commission}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 任务统计 */}
                {task.count && (
                    <div className="mt-3 flex justify-around border-t border-slate-100 pt-3">
                        <div className="text-center">
                            <div className="text-lg font-bold text-slate-700">{task.count}</div>
                            <div className="text-xs text-slate-400">总单数</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-primary-600">{task.claimedCount || 0}</div>
                            <div className="text-xs text-slate-400">已领取</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-success-500">{remainCount}</div>
                            <div className="text-xs text-slate-400">剩余</div>
                        </div>
                    </div>
                )}

                {/* Commission and platform info for multi-goods */}
                {task.goodsList && task.goodsList.length > 0 && (
                    <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-600">{platformName}</span>
                            <span className="text-xs text-slate-500">{task.shopName}</span>
                        </div>
                        <span className="text-sm text-success-500 font-medium">佣金 ¥{task.commission}</span>
                    </div>
                )}
            </div>

            {/* Entry Method 进店方式 - Multi-Keywords Support */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-800">进店方式</span>
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600">
                        {task.keywords && task.keywords.length > 0 ? '关键词' : entryMethod.type}
                    </span>
                </div>

                {/* Multi-keywords display */}
                {task.keywords && task.keywords.length > 0 ? (
                    <div className="space-y-3">
                        {task.keywords.map((kw, index) => (
                            <div key={kw.id} className="rounded border border-slate-100 p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={cn(
                                        'rounded px-1.5 py-0.5 text-xs',
                                        index === 0 ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500'
                                    )}>
                                        关键词 {index + 1}
                                    </span>
                                </div>
                                <div className="rounded bg-primary-50 px-3 py-2 mb-2">
                                    <div className="text-base font-bold text-primary-600">{kw.keyword}</div>
                                </div>
                                {/* Filter settings */}
                                <div className="flex flex-wrap gap-1.5 text-xs">
                                    {kw.sort && (
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                                            排序: {kw.sort === 'default' ? '综合' : kw.sort === 'sales' ? '销量' : kw.sort}
                                        </span>
                                    )}
                                    {kw.province && (
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                                            发货地: {kw.province}
                                        </span>
                                    )}
                                    {(kw.minPrice > 0 || kw.maxPrice > 0) && (
                                        <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                                            价格: ¥{kw.minPrice || 0}-{kw.maxPrice || '不限'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Fallback: legacy entry method */
                    <div>{entryMethod.content}</div>
                )}
            </div>

            {/* Browse Requirements 浏览要求 */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-bold text-slate-800">浏览要求</div>

                {/* 浏览时长 */}
                <div className={`grid gap-2 text-center mb-3 ${task.hasSubProduct ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    <div className="rounded bg-slate-50 p-2">
                        <div className="text-lg font-bold text-primary-600">{task.totalBrowseMinutes || 15}</div>
                        <div className="text-xs text-slate-400">总计/分钟</div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                        <div className="text-lg font-bold text-warning-500">{task.compareBrowseMinutes || 3}</div>
                        <div className="text-xs text-slate-400">货比/分钟</div>
                    </div>
                    <div className="rounded bg-slate-50 p-2">
                        <div className="text-lg font-bold text-success-600">{task.mainBrowseMinutes || 8}</div>
                        <div className="text-xs text-slate-400">主品/分钟</div>
                    </div>
                    {task.hasSubProduct && (
                        <div className="rounded bg-slate-50 p-2">
                            <div className="text-lg font-bold text-slate-500">{task.subBrowseMinutes || 2}</div>
                            <div className="text-xs text-slate-400">副品/分钟</div>
                        </div>
                    )}
                </div>

                {/* 浏览行为 */}
                {browseActions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {browseActions.map((action, i) => (
                            <span key={i} className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                {action.label}{action.extra && `: ${action.extra}`}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Praise Requirements 好评要求 */}
            {(task.isPraise || task.isImgPraise || task.isVideoPraise) && (
                <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                    <div className="mb-3 text-sm font-bold text-slate-800">好评要求</div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {task.isPraise && (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                文字好评 {praiseTexts.length > 0 && `(已指定${praiseTexts.length}条)`}
                            </span>
                        )}
                        {task.isImgPraise && (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                图片好评 {task.praiseImgList && task.praiseImgList.length > 0 && `(已指定${task.praiseImgList.length}张)`}
                            </span>
                        )}
                        {task.isVideoPraise && (
                            <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                视频好评 {task.praiseVideoList && task.praiseVideoList.length > 0 && `(已指定${task.praiseVideoList.length}个)`}
                            </span>
                        )}
                    </div>
                    <div className="rounded bg-blue-50 p-3 text-xs text-blue-700">
                        📝 商家已指定好评内容，领取任务后在收货页面查看详细内容
                    </div>
                </div>
            )}

            {/* Task Info 任务信息 */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-3 text-sm font-bold text-slate-800">任务信息</div>
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                        <span className="text-slate-500">任务编号</span>
                        <span className="text-slate-700 font-mono">{task.taskNumber || task.id}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">结算方式</span>
                        <span className="text-slate-700">{task.terminal ? TerminalMap[task.terminal] : '-'}</span>
                    </div>
                         <div className="flex justify-between">
                             <span className="text-slate-500">运费</span>
                             <span className={isFreeShipping ? 'text-green-600' : 'text-amber-600'}>{isFreeShipping ? '包邮' : '非包邮'}</span>
                         </div>
                         {task.isPasswordEnabled && task.checkPassword && (
                             <div className="flex justify-between">
                                 <span className="text-slate-500">验证口令</span>
                                 <span className="text-danger-400 font-medium">{task.checkPassword}</span>
                             </div>
                         )}
                         {(task.weight || 0) > 0 && (
                             <div className="flex justify-between">
                                 <span className="text-slate-500">包裹重量</span>
                                 <span className="text-slate-700">{task.weight}kg</span>
                             </div>
                         )}
                         {task.fastRefund && (
                             <div className="flex justify-between">
                                 <span className="text-slate-500">快速返款</span>
                                 <span className="text-green-600">已开通</span>
                             </div>
                         )}

                    {(task.extraReward || 0) > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">额外加赏</span>
                            <span className="text-warning-500 font-medium">+¥{task.extraReward}/单</span>
                        </div>
                    )}
                    {task.isRepay && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">回购任务</span>
                            <span className="text-green-600">是（需曾在此店铺购买过）</span>
                        </div>
                    )}
                    {task.isNextDay && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">隔天任务</span>
                            <span className="text-amber-600">是（次日16:40前完成）</span>
                        </div>
                    )}
                    {task.unionInterval && task.unionInterval > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">接单间隔</span>
                            <span className="text-slate-700">{task.unionInterval}天</span>
                        </div>
                    )}
                    {task.isTimingPublish && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">定时发布</span>
                            <span className="text-blue-600">是{task.publishTime && ` (${task.publishTime})`}</span>
                        </div>
                    )}
                    {task.isTimingPay && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">定时付款</span>
                            <span className="text-blue-600">是{task.timingTime && ` (${task.timingTime})`}</span>
                        </div>
                    )}
                    {task.cycle && task.cycle > 0 && (
                        <div className="flex justify-between">
                            <span className="text-slate-500">延长周期</span>
                            <span className="text-slate-700">{task.cycle}天</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Merchant Memo 商家提示 */}
            {task.memo && (
                <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                    <div className="mb-2 text-sm font-bold text-slate-800">商家提示</div>
                    <div className="rounded bg-amber-50 p-3 text-xs text-amber-800 whitespace-pre-wrap">{task.memo}</div>
                </div>
            )}

            {/* Task Requirements 注意事项 */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-2.5 text-sm font-bold text-slate-800">注意事项</div>
                <div className="space-y-1 text-xs leading-relaxed text-slate-500">
                    <p>1. 必须使用指定的买号进行操作。</p>
                    <p>2. 请严格按照进店方式找到商品。</p>
                    <p>3. 浏览时长需满足上述要求。</p>
                    <p>4. 禁止秒拍，需按要求完成浏览行为。</p>
                    <div className="mt-2.5 rounded bg-amber-50 p-2.5 text-warning-500">
                        注意：未按要求操作可能导致无法审核通过或佣金扣除。
                    </div>
                </div>
            </div>

            {/* Buyer Account Selection */}
            <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
                <div className="mb-2.5 text-sm font-bold text-slate-800">选择接单买号</div>
                <select
                    value={buyerAccount}
                    onChange={(e) => setBuyerAccount(e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white p-2.5 text-sm"
                >
                    <option value="">请选择买号...</option>
                    {buyerAccounts.map(acc => (
                        <option key={acc.id} value={acc.platformAccount}>
                            {acc.platformAccount} ({acc.platform})
                        </option>
                    ))}
                </select>
            </div>

            {/* Fixed Bottom Button Bar */}
            <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white">
                <div className="mx-auto flex w-full max-w-md gap-2.5 px-4 py-2.5">
                    <button
                        onClick={() => router.back()}
                        className="flex-1 rounded border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-600"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleClaim}
                        disabled={submitting}
                        className={cn(
                            'flex-[2] rounded px-2.5 py-2.5 text-sm font-bold text-white',
                            submitting ? 'bg-blue-300' : 'bg-primary-500'
                        )}
                    >
                        {submitting ? '领取中...' : '立即领取'}
                    </button>
                </div>
            </div>
        </div>
    );
}
