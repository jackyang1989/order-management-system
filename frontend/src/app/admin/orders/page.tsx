'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
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
}

const statusLabels: Record<string, { text: string; color: 'blue' | 'amber' | 'green' | 'red' | 'slate' }> = {
    PENDING: { text: '进行中', color: 'blue' },
    SUBMITTED: { text: '待审核', color: 'amber' },
    APPROVED: { text: '已通过', color: 'green' },
    REJECTED: { text: '已驳回', color: 'red' },
    COMPLETED: { text: '已完成', color: 'slate' },
    CANCELLED: { text: '已取消', color: 'slate' },
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
                    <div className="text-xs text-[#9ca3af]">{row.merchant?.shopName || '-'}</div>
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
                    <div className="text-xs text-[#9ca3af]">{row.buynoAccount || '-'}</div>
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
            render: (row) => <span className="text-xs text-[#6b7280]">{row.createdAt ? new Date(row.createdAt).toLocaleDateString('zh-CN') : '-'}</span>,
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
            <Card className="bg-white">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-base font-medium">订单列表</span>
                    <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
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
            </Card>

            <Card className="overflow-hidden bg-white">
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
            </Card>

            <Modal
                title="订单详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-3xl"
            >
                {detailModal && (
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
                )}
            </Modal>
        </div>
    );
}
