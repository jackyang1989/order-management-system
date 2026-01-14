'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn, formatDate } from '../../../lib/utils';
import { toastSuccess, toastError } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';
import { adminService } from '../../../services/adminService';

interface Order {
    id: string;
    taskId: string;
    taskTitle: string;
    taskNumber?: string;
    userId: string;
    userName?: string;
    buynoId: string;
    buynoAccount: string;
    platform: string;
    productName: string;
    productPrice: number;
    commission: number;
    userPrincipal: number;
    sellerPrincipal: number;
    depositPayment?: number;
    silverPayment?: number;
    finalAmount: number;
    refundAmount: number;
    platformOrderNumber: string;
    deliveryState: number;
    delivery: string;
    deliveryNum: string;
    keywordImg: string;
    chatImg: string;
    orderDetailImg: string;
    receiveImg: string;
    praiseContent: string;
    praiseImages: string[];
    addressName: string;
    addressPhone: string;
    address: string;
    status: string;
    rejectReason: string;
    cancelRemarks: string;
    createdAt: string;
    completedAt: string;
    merchant?: { id: string; username: string; shopName?: string };
    // Task关联数据
    task?: {
        shopName?: string;
        // 浏览要求
        needCompare?: boolean;
        compareCount?: number;
        needFavorite?: boolean;
        needFollow?: boolean;
        needAddCart?: boolean;
        needContactCS?: boolean;
        contactCSContent?: string;
        totalBrowseMinutes?: number;
        compareBrowseMinutes?: number;
        mainBrowseMinutes?: number;
        subBrowseMinutes?: number;
        hasSubProduct?: boolean;
        // 增值服务
        weight?: number;
        fastRefund?: boolean;
        extraReward?: number;
        addReward?: number;
        isPasswordEnabled?: boolean;
        checkPassword?: string;
        isFreeShipping?: boolean;
        isTimingPublish?: boolean;
        publishTime?: string;
        isTimingPay?: boolean;
        timingPayTime?: string;
        isRepay?: boolean;
        isNextDay?: boolean;
        isCycleTime?: boolean;
        cycleTime?: number;
        // 好评相关 (JSON strings from backend)
        isPraise?: boolean;
        praiseList?: string;
        isImgPraise?: boolean;
        praiseImgList?: string;
        isVideoPraise?: boolean;
        praiseVideoList?: string;
        // 下单提示
        memo?: string;
        // 费用明细
        baseServiceFee?: number;
        praiseFee?: number;
        imgPraiseFee?: number;
        videoPraiseFee?: number;
        shippingFee?: number;
        margin?: number;
        goodsPrice?: number;
        totalDeposit?: number;
        totalCommission?: number;
    };
}

const statusLabels: Record<string, { text: string; color: 'blue' | 'amber' | 'green' | 'red' | 'slate' }> = {
    PENDING: { text: '进行中', color: 'blue' },
    SUBMITTED: { text: '待审核', color: 'amber' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已驳回', color: 'red' },
    COMPLETED: { text: '已完成', color: 'slate' },
    CANCELLED: { text: '已取消', color: 'slate' },
};

// 解析JSON字段的辅助函数
const parsePraiseList = (jsonStr: string | undefined): string[] => {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr) || []; } catch { return []; }
};

const parsePraiseImgList = (jsonStr: string | undefined): string[] => {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr) || []; } catch { return []; }
};

const parsePraiseVideoList = (jsonStr: string | undefined): string[] => {
    if (!jsonStr) return [];
    try { return JSON.parse(jsonStr) || []; } catch { return []; }
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState<string>('');
    const [keyword, setKeyword] = useState('');
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Order | null>(null);

    useEffect(() => { loadOrders(); }, [page, filter]);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const res = await adminService.getOrders({ page, limit: 20, status: filter, keyword });
            if (res.data) { setOrders(res.data.data || []); setTotal(res.data.total || 0); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSearch = () => { setPage(1); loadOrders(); };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            const res = await fetch(`${BASE_URL}/excel/export/orders?status=${filter}&keyword=${keyword}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `orders_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                toastSuccess('导出成功');
            } else { toastError('导出失败'); }
        } catch (e) { toastError('导出失败'); } finally { setExporting(false); }
    };

    const columns: Column<Order>[] = [
        {
            key: 'taskNumber',
            title: '任务编号',
            className: 'w-[120px]',
            render: (row) => <code className="text-xs text-[#6b7280]">{row.taskNumber || '-'}</code>,
        },
        {
            key: 'platformOrderNumber',
            title: '平台订单号',
            className: 'w-[130px]',
            render: (row) => <code className="text-xs text-[#6b7280]">{row.platformOrderNumber || '-'}</code>,
        },
        {
            key: 'merchant',
            title: '卖家/店铺',
            className: 'w-[130px]',
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-[#3b4559]">{row.merchant?.username || '-'}</div>
                    {row.merchant?.shopName && (
                        <div className="text-xs text-[#9ca3af]">{row.merchant.shopName}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'buyer',
            title: '买家/买号',
            className: 'w-[130px]',
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-[#3b4559]">{row.userName || '-'}</div>
                    {row.buynoAccount && (
                        <div className="text-xs text-[#9ca3af]">{row.buynoAccount}</div>
                    )}
                </div>
            ),
        },
        {
            key: 'productPrice',
            title: '商家支付',
            className: 'w-[90px] text-right',
            render: (row) => <span className="font-medium">¥{Number(row.productPrice).toFixed(2)}</span>,
        },
        {
            key: 'commission',
            title: '用户佣金',
            className: 'w-[80px] text-right',
            render: (row) => <span className="font-medium text-success-400">¥{Number(row.commission).toFixed(2)}</span>,
        },
        {
            key: 'depositPayment',
            title: '押金/银锭',
            className: 'w-[90px]',
            render: (row) => (
                <div className="text-xs">
                    <div>押金: {Number(row.depositPayment || row.userPrincipal || 0).toFixed(2)}</div>
                    <div className="text-primary-600">银锭: {Number(row.silverPayment || 0).toFixed(2)}</div>
                </div>
            ),
        },
        {
            key: 'status',
            title: '状态',
            className: 'w-[90px] text-center',
            render: (row) => {
                const conf = statusLabels[row.status] || statusLabels.PENDING;
                return <Badge variant="soft" color={conf.color}>{conf.text}</Badge>;
            },
        },
        {
            key: 'createdAt',
            title: '添加时间',
            className: 'w-[100px]',
            render: (row) => <span className="text-xs text-[#6b7280]">{formatDate(row.createdAt)}</span>,
        },
        {
            key: 'actions',
            title: '操作',
            className: 'w-[100px]',
            render: (row) => (
                <Button size="sm" variant="outline" onClick={() => setDetailModal(row)}>
                    详情
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">订单列表</span>
                    <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索订单号/商品名..."
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-56"
                    />
                    <Select
                        value={filter}
                        onChange={(v) => { setFilter(v); setPage(1); }}
                        options={[
                            { value: '', label: '全部状态' },
                            { value: 'PENDING', label: '进行中' },
                            { value: 'SUBMITTED', label: '待审核' },
                            { value: 'APPROVED', label: '已通过' },
                            { value: 'REJECTED', label: '已驳回' },
                            { value: 'COMPLETED', label: '已完成' },
                        ]}
                        className="w-28"
                    />
                    <Button onClick={handleSearch}>
                        搜索
                    </Button>
                    <Button variant="secondary" onClick={loadOrders}>
                        刷新
                    </Button>
                    <Button
                        onClick={handleExport}
                        loading={exporting}
                        variant="success"
                    >
                        导出
                    </Button>
                </div>


                <div className="overflow-hidden">
                    <Table
                        columns={columns}
                        data={orders}
                        rowKey={(r) => r.id}
                        loading={loading}
                        emptyText="暂无订单数据"
                    />
                    <div className="mt-4 flex justify-end px-6 pb-6">
                        <Pagination
                            current={page}
                            total={total}
                            pageSize={20}
                            onChange={setPage}
                        />
                    </div>
                </div>
            </Card >

            <Modal
                title="订单详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-3xl"
            >
                {detailModal && (() => {
                    // 从task对象读取字段
                    const task = detailModal.task || {};
                    const praiseTexts = parsePraiseList(task.praiseList);
                    const praiseImages = parsePraiseImgList(task.praiseImgList);
                    const praiseVideos = parsePraiseVideoList(task.praiseVideoList);

                    return (
                    <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
                        {/* 订单信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">订单信息</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">平台订单号</div>
                                    <div className="font-mono text-sm">{detailModal.platformOrderNumber || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">状态</div>
                                    <div>
                                        <Badge variant="soft" color={statusLabels[detailModal.status]?.color}>
                                            {statusLabels[detailModal.status]?.text}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <div className="text-xs text-[#6b7280]">商品名称</div>
                                    <div className="text-sm font-medium">{detailModal.productName}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">买号</div>
                                    <div className="text-sm font-medium">{detailModal.buynoAccount}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">平台</div>
                                    <div className="text-sm font-medium">{detailModal.platform || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* 金额信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">金额信息</h3>
                            <div className="grid grid-cols-3 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">商品价格</div>
                                    <div className="text-sm font-medium">¥{Number(detailModal.productPrice).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">佣金</div>
                                    <div className="text-sm font-medium text-success-400">¥{Number(detailModal.commission).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">实付金额</div>
                                    <div className="text-sm font-medium">¥{Number(detailModal.finalAmount || 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">用户本金</div>
                                    <div className="text-sm">¥{Number(detailModal.userPrincipal || 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">商家本金</div>
                                    <div className="text-sm">¥{Number(detailModal.sellerPrincipal || 0).toFixed(2)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">退款金额</div>
                                    <div className="text-sm">¥{Number(detailModal.refundAmount || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* 物流信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">物流信息</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">物流状态</div>
                                    <div>
                                        {detailModal.deliveryState === 1 ? (
                                            <Badge variant="soft" color="green">已发货</Badge>
                                        ) : (
                                            <Badge variant="soft" color="slate">待发货</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">快递公司</div>
                                    <div className="text-sm">{detailModal.delivery || '-'}</div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <div className="text-xs text-[#6b7280]">快递单号</div>
                                    <div className="font-mono text-sm">{detailModal.deliveryNum || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">收货人</div>
                                    <div className="text-sm">{detailModal.addressName || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">联系电话</div>
                                    <div className="text-sm">{detailModal.addressPhone || '-'}</div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <div className="text-xs text-[#6b7280]">收货地址</div>
                                    <div className="text-sm">{detailModal.address || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* 评价信息 */}
                        {detailModal.praiseContent && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">评价信息</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    <div className="text-sm">{detailModal.praiseContent}</div>
                                </div>
                            </div>
                        )}

                        {/* 截图凭证 */}
                        {(detailModal.keywordImg || detailModal.orderDetailImg) && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">截图凭证</h3>
                                <div className="flex flex-wrap gap-3">
                                    {detailModal.keywordImg && (
                                        <img src={detailModal.keywordImg} alt="关键词截图" className="h-24 w-24 rounded-md object-cover" />
                                    )}
                                    {detailModal.orderDetailImg && (
                                        <img src={detailModal.orderDetailImg} alt="订单详情" className="h-24 w-24 rounded-md object-cover" />
                                    )}
                                    {detailModal.receiveImg && (
                                        <img src={detailModal.receiveImg} alt="收货截图" className="h-24 w-24 rounded-md object-cover" />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Browse Requirements 浏览要求 */}
                        {(task.needCompare || task.needFavorite || task.needFollow || task.needAddCart || task.needContactCS) && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">浏览要求</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    {/* 浏览时长 */}
                                    <div className={`grid gap-3 text-center mb-4 ${task.hasSubProduct ? 'grid-cols-4' : 'grid-cols-3'}`}>
                                        <div className="rounded-md bg-white p-3">
                                            <div className="text-lg font-bold text-primary-600">{task.totalBrowseMinutes || 15}</div>
                                            <div className="text-xs text-[#6b7280]">总计/分钟</div>
                                        </div>
                                        <div className="rounded-md bg-white p-3">
                                            <div className="text-lg font-bold text-warning-500">{task.compareBrowseMinutes || 3}</div>
                                            <div className="text-xs text-[#6b7280]">货比/分钟</div>
                                        </div>
                                        <div className="rounded-md bg-white p-3">
                                            <div className="text-lg font-bold text-success-600">{task.mainBrowseMinutes || 8}</div>
                                            <div className="text-xs text-[#6b7280]">主品/分钟</div>
                                        </div>
                                        {task.hasSubProduct && (
                                            <div className="rounded-md bg-white p-3">
                                                <div className="text-lg font-bold text-[#6b7280]">{task.subBrowseMinutes || 2}</div>
                                                <div className="text-xs text-[#6b7280]">副品/分钟</div>
                                            </div>
                                        )}
                                    </div>
                                    {/* 浏览行为 */}
                                    <div className="flex flex-wrap gap-2">
                                        {task.needCompare && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                货比 ({task.compareCount || 3}家)
                                            </span>
                                        )}
                                        {task.needFavorite && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                收藏商品
                                            </span>
                                        )}
                                        {task.needFollow && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                关注店铺
                                            </span>
                                        )}
                                        {task.needAddCart && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                加入购物车
                                            </span>
                                        )}
                                        {task.needContactCS && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                联系客服
                                            </span>
                                        )}
                                    </div>
                                    {task.contactCSContent && (
                                        <div className="mt-3 rounded-md bg-blue-50 p-3 text-xs text-blue-700">
                                            <span className="font-bold">客服内容：</span>{task.contactCSContent}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Value-added Services 增值服务 */}
                        {(task.weight || task.fastRefund || task.extraReward || task.addReward || task.isPasswordEnabled || task.isTimingPublish || task.isTimingPay || task.isRepay || task.isNextDay || task.isCycleTime) && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">增值服务</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {task.weight && task.weight > 0 && (
                                        <div className="rounded-md bg-[#f9fafb] p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">包裹重量</div>
                                            <div className="text-sm font-medium">{task.weight}kg</div>
                                        </div>
                                    )}
                                    {task.fastRefund && (
                                        <div className="rounded-md bg-green-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">快速返款</div>
                                            <div className="text-sm font-medium text-green-600">已开通</div>
                                        </div>
                                    )}
                                    {(task.extraReward || task.addReward) && ((task.extraReward ?? 0) > 0 || (task.addReward ?? 0) > 0) && (
                                        <div className="rounded-md bg-warning-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">额外赏金</div>
                                            <div className="text-sm font-medium text-warning-600">+¥{task.extraReward || task.addReward}/单</div>
                                        </div>
                                    )}
                                    {task.isPasswordEnabled && task.checkPassword && (
                                        <div className="rounded-md bg-purple-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">验证口令</div>
                                            <div className="text-sm font-medium text-purple-600">{task.checkPassword}</div>
                                        </div>
                                    )}
                                    <div className="rounded-md bg-[#f9fafb] p-4">
                                        <div className="text-xs text-[#6b7280] mb-1">运费</div>
                                        <div className={`text-sm font-medium ${task.isFreeShipping ? 'text-green-600' : 'text-amber-600'}`}>
                                            {task.isFreeShipping ? '包邮' : '非包邮'}
                                        </div>
                                    </div>
                                    {task.isTimingPublish && (
                                        <div className="rounded-md bg-blue-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">定时发布</div>
                                            <div className="text-sm font-medium text-blue-600">
                                                {task.publishTime ? new Date(task.publishTime).toLocaleString('zh-CN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '已启用'}
                                            </div>
                                        </div>
                                    )}
                                    {task.isTimingPay && (
                                        <div className="rounded-md bg-indigo-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">定时付款</div>
                                            <div className="text-sm font-medium text-indigo-600">
                                                {task.timingPayTime ? new Date(task.timingPayTime).toLocaleString('zh-CN', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }) : '已启用'}
                                            </div>
                                        </div>
                                    )}
                                    {task.isRepay && (
                                        <div className="rounded-md bg-cyan-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">回购任务</div>
                                            <div className="text-sm font-medium text-cyan-600">已启用</div>
                                        </div>
                                    )}
                                    {task.isNextDay && (
                                        <div className="rounded-md bg-teal-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">隔天任务</div>
                                            <div className="text-sm font-medium text-teal-600">已启用</div>
                                        </div>
                                    )}
                                    {task.isCycleTime && (
                                        <div className="rounded-md bg-rose-50 p-4">
                                            <div className="text-xs text-[#6b7280] mb-1">延长买号周期</div>
                                            <div className="text-sm font-medium text-rose-600">{task.cycleTime || 30}天</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Praise Details 好评详情 */}
                        {(task.isPraise || task.isImgPraise || task.isVideoPraise) && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">好评详情</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {task.isPraise && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700 font-medium">
                                                文字好评 ({praiseTexts.length}条)
                                            </span>
                                        )}
                                        {task.isImgPraise && (
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700 font-medium">
                                                图片好评 ({praiseImages.length}张)
                                            </span>
                                        )}
                                        {task.isVideoPraise && (
                                            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700 font-medium">
                                                视频好评 ({praiseVideos.length}个)
                                            </span>
                                        )}
                                    </div>
                                    {/* 文字好评内容 */}
                                    {task.isPraise && praiseTexts.length > 0 && (
                                        <div className="rounded-md bg-white p-3 mb-3">
                                            <div className="text-xs text-[#6b7280] mb-2">好评内容：</div>
                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                {praiseTexts.slice(0, 3).map((txt: string, i: number) => (
                                                    <div key={i} className="text-xs text-[#3b4559] border-l-2 border-primary-200 pl-2">
                                                        {i + 1}. {txt}
                                                    </div>
                                                ))}
                                                {praiseTexts.length > 3 && (
                                                    <div className="text-xs text-[#6b7280]">...共 {praiseTexts.length} 条</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {/* 好评图片 */}
                                    {task.isImgPraise && praiseImages.length > 0 && (
                                        <div className="rounded-md bg-white p-3 mb-3">
                                            <div className="text-xs text-[#6b7280] mb-2">好评图片：</div>
                                            <div className="flex flex-wrap gap-2">
                                                {praiseImages.map((img: string, i: number) => (
                                                    <img
                                                        key={i}
                                                        src={img}
                                                        alt={`好评图${i + 1}`}
                                                        className="h-20 w-20 rounded-md object-cover cursor-pointer hover:opacity-80"
                                                        onClick={() => window.open(img, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {/* 好评视频 */}
                                    {task.isVideoPraise && praiseVideos.length > 0 && (
                                        <div className="rounded-md bg-white p-3">
                                            <div className="text-xs text-[#6b7280] mb-2">好评视频：</div>
                                            <div className="flex flex-wrap gap-2">
                                                {praiseVideos.map((_video: string, i: number) => (
                                                    <div key={i} className="relative h-20 w-20 rounded-md bg-slate-100 flex items-center justify-center cursor-pointer hover:bg-slate-200">
                                                        <span className="text-2xl">▶️</span>
                                                        <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                                                            视频{i + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Merchant Memo 下单提示 */}
                        {task.memo && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">下单提示</h3>
                                <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 whitespace-pre-wrap">
                                    {task.memo}
                                </div>
                            </div>
                        )}

                        {/* Fee Details 费用明细 */}
                        {(task.baseServiceFee || task.praiseFee || task.margin) && (
                            <div>
                                <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">费用明细</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    <div className="space-y-2 text-sm">
                                        {task.baseServiceFee && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">基础服务费</span>
                                                <span className="font-medium">¥{task.baseServiceFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.praiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">文字好评费</span>
                                                <span className="font-medium">¥{task.praiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.imgPraiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">图片好评费</span>
                                                <span className="font-medium">¥{task.imgPraiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.videoPraiseFee && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">视频好评费</span>
                                                <span className="font-medium">¥{task.videoPraiseFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.shippingFee && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">邮费</span>
                                                <span className="font-medium">¥{task.shippingFee.toFixed(2)}</span>
                                            </div>
                                        )}
                                        {task.margin && (
                                            <div className="flex justify-between">
                                                <span className="text-[#6b7280]">保证金</span>
                                                <span className="font-medium">¥{task.margin.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                                            <span className="font-bold text-[#3b4559]">总计</span>
                                            <span className="font-bold text-primary-600">¥{Number(detailModal.productPrice).toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 时间信息 */}
                        <div>
                            <h3 className="mb-3 border-l-4 border-primary pl-2 text-sm font-semibold text-[#3b4559]">时间信息</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">创建时间</div>
                                    <div className="text-sm">{detailModal.createdAt ? new Date(detailModal.createdAt).toLocaleString('zh-CN') : '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs text-[#6b7280]">完成时间</div>
                                    <div className="text-sm">{detailModal.completedAt ? new Date(detailModal.completedAt).toLocaleString('zh-CN') : '-'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button variant="secondary" onClick={() => setDetailModal(null)}>
                                关闭
                            </Button>
                        </div>
                    </div>
                    );
                })()}
            </Modal>
        </div >
    );
}
