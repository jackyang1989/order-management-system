'use client';

import { useState, useEffect, useMemo } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { toastError, toastSuccess } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';
import { Tabs } from '../../../components/ui/tabs';
import { TASK_TYPE_NAMES } from '../../../constants/platformConfig';

interface Task {
    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    goodsPrice: number;
    count: number;
    claimedCount: number;
    completedCount: number;
    status: number;
    createdAt: string;
    url: string;
    mainImage: string;
    keyword: string;
    taoWord: string;
    platformProductId: string;
    qrCode: string;
    remark: string;
    merchantId: string;
    merchant?: { id: string; merchantName: string; phone: string };
    goodsMoney: number;
    shippingFee: number;
    margin: number;
    extraReward: number;
    baseServiceFee: number;
    refundServiceFee: number;
    totalDeposit: number;
    totalCommission: number;
    isPraise: boolean;
    praiseFee: number;
    isImgPraise: boolean;
    imgPraiseFee: number;
    isVideoPraise: boolean;
    videoPraiseFee: number;
    terminal: number;
    taskTimeLimit: number;
    isFreeShipping: boolean;
    isPresale: boolean;
    isTimingPublish: boolean;
    publishTime: string;
    updatedAt: string;
}

const statusLabels: Record<number, { text: string; color: 'slate' | 'green' | 'blue' | 'red' | 'amber' }> = {
    0: { text: '待支付', color: 'slate' },
    1: { text: '进行中', color: 'green' },
    2: { text: '已完成', color: 'blue' },
    3: { text: '已取消', color: 'red' },
    4: { text: '待审核', color: 'amber' },
};

const terminalLabels: Record<number, string> = { 1: '本佣货返', 2: '本立佣货' };

function progressWidthClass(percent: number) {
    if (percent <= 0) return 'w-0';
    if (percent <= 10) return 'w-1/6';
    if (percent <= 20) return 'w-1/4';
    if (percent <= 35) return 'w-1/3';
    if (percent <= 45) return 'w-2/5';
    if (percent <= 55) return 'w-1/2';
    if (percent <= 65) return 'w-3/5';
    if (percent <= 75) return 'w-2/3';
    if (percent <= 85) return 'w-3/4';
    if (percent <= 95) return 'w-5/6';
    return 'w-full';
}

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Task | null>(null);

    const statusOptions = useMemo(
        () =>
            Object.entries(statusLabels).map(([k, v]) => ({
                value: String(k),
                label: v.text,
            })),
        []
    );

    useEffect(() => { loadTasks(); }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { setTasks(json.data); setTotal(json.total || json.data.length); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleUpdateStatus = async (id: string, status: number) => {
        const token = localStorage.getItem('adminToken');
        try {
            const res = await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            const json = await res.json();
            if (json.success) {
                toastSuccess('状态更新成功');
                loadTasks();
            }
        } catch (e) {
            toastError('操作失败');
        }
    };

    const handleExport = async () => {
        const token = localStorage.getItem('adminToken');
        setExporting(true);
        try {
            let url = `${BASE_URL}/excel/export/tasks?`;
            if (filter !== undefined) url += `status=${filter}&`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `tasks_${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(downloadUrl);
                toastSuccess('导出成功');
            } else {
                toastError('导出失败');
            }
        } catch (e) {
            toastError('导出失败');
        } finally {
            setExporting(false);
        }
    };

    const columns: Column<Task>[] = [
        {
            key: 'taskNumber',
            title: '任务编号',
            render: (row) => <code className="text-[12px] text-[#6b7280]">{row.taskNumber}</code>,
            className: 'w-[140px]',
        },
        {
            key: 'title',
            title: '标题',
            render: (row) => <span className="line-clamp-1 text-[#3b4559]">{row.title}</span>,
            className: 'min-w-[180px]',
        },
        {
            key: 'taskType',
            title: '平台',
            render: (row) => <span className="text-[#5a6577]">{TASK_TYPE_NAMES[row.taskType] || '其他'}</span>,
            className: 'w-[90px]',
        },
        {
            key: 'goodsPrice',
            title: '单价',
            render: (row) => <span className="font-medium text-[#3b4559]">¥{Number(row.goodsPrice).toFixed(2)}</span>,
            className: 'w-[120px] text-right',
        },
        {
            key: 'progress',
            title: '进度',
            render: (row) => {
                const percent = Math.min(100, Math.round((row.claimedCount / row.count) * 100));
                const barClass = percent >= 100 ? 'bg-success-500' : 'bg-primary-500';
                return (
                    <div className="space-y-1">
                        <div className="h-2 w-full rounded-full bg-[#e5e7eb]">
                            <div className={cn('h-2 rounded-full', barClass, progressWidthClass(percent))} />
                        </div>
                        <span className="text-[12px] text-[#6b7280]">
                            {row.claimedCount} / {row.count} ({percent}%)
                        </span>
                    </div>
                );
            },
            className: 'w-[180px]',
        },
        {
            key: 'status',
            title: '状态',
            render: (row) => {
                const config = statusLabels[row.status] || statusLabels[0];
                return (
                    <Badge variant="soft" color={config.color}>
                        {config.text}
                    </Badge>
                );
            },
            className: 'w-[110px] text-center',
        },
        {
            key: 'createdAt',
            title: '创建时间',
            render: (row) => <span className="text-[#6b7280]">{new Date(row.createdAt).toLocaleDateString('zh-CN')}</span>,
            className: 'w-[120px]',
        },
        {
            key: 'actions',
            title: '操作',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(row)}>
                        查看
                    </Button>
                    <div className="w-28">
                        <Select
                            value={String(row.status)}
                            onChange={(value) => handleUpdateStatus(row.id, Number(value))}
                            options={statusOptions}
                        />
                    </div>
                </div>
            ),
            className: 'w-[220px]',
        },
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-white">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[13px] font-medium text-[#3b4559]">状态筛选：</span>
                    <Tabs
                        value={String(filter ?? 'all')}
                        onChange={(val) => {
                            setFilter(val === 'all' ? undefined : Number(val));
                            setPage(1);
                        }}
                        items={[
                            { key: 'all', label: '全部' },
                            { key: '1', label: '进行中' },
                            { key: '4', label: '待审核' },
                            { key: '2', label: '已完成' },
                            { key: '3', label: '已取消' },
                        ]}
                    />
                    <div className="ml-auto flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={loadTasks}
                            className="flex items-center gap-1"
                        >
                            <span>🔄</span> 刷新
                        </Button>
                        <Button
                            onClick={handleExport}
                            loading={exporting}
                            className="flex items-center gap-1 bg-success-500 hover:bg-success-600"
                        >
                            <span>📥</span> 导出Excel
                        </Button>
                    </div>
                </div>
            </Card>

            <Card className="overflow-hidden bg-white">
                <Table
                    columns={columns}
                    data={tasks}
                    rowKey={(r) => r.id}
                    loading={loading}
                    emptyText="暂无任务数据"
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
                title="任务详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-4xl"
            >
                {detailModal && (
                    <div className="max-h-[70vh] overflow-y-auto pr-2">
                        {/* 顶部主图 */}
                        {detailModal.mainImage && (
                            <div className="mb-6 flex justify-center">
                                <img
                                    src={detailModal.mainImage}
                                    alt="商品图"
                                    className="h-48 rounded-md object-contain"
                                />
                            </div>
                        )}

                        {/* 基本信息 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">基本信息</h3>
                            <div className="grid grid-cols-1 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-3">
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">任务编号</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.taskNumber}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">平台</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{TASK_TYPE_NAMES[detailModal.taskType]}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">状态</div>
                                    <div>
                                        <Badge variant="soft" color={statusLabels[detailModal.status]?.color}>
                                            {statusLabels[detailModal.status]?.text}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1 sm:col-span-3">
                                    <div className="text-[12px] text-[#6b7280]">标题</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.title}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">店铺</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.shopName || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">关键词</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.keyword || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[12px] text-[#6b7280]">结算方式</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">{terminalLabels[detailModal.terminal] || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* 任务进度 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">任务进度</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总单数</div>
                                    <div className="text-lg font-bold text-[#3b4559]">{detailModal.count}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">已领取</div>
                                    <div className="text-lg font-bold text-primary-600">{detailModal.claimedCount}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">已完成</div>
                                    <div className="text-lg font-bold text-success-500">{detailModal.completedCount || 0}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">剩余</div>
                                    <div className="text-lg font-bold text-warning-500">
                                        {detailModal.count - detailModal.claimedCount}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 费用信息 */}
                        <div className="mb-6">
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">费用信息</h3>
                            <div className="grid grid-cols-1 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-3">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">商品单价</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.goodsPrice).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总押金</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.totalDeposit || 0).toFixed(2)}</div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">总佣金</div>
                                    <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.totalCommission || 0).toFixed(2)}</div>
                                </div>
                            </div>
                        </div>

                        {/* 增值服务 */}
                        <div>
                            <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">增值服务</h3>
                            <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">文字好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">图片好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isImgPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isImgPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">视频好评</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isVideoPraise ? "text-success-500" : "text-[#9ca3af]")}>
                                        {detailModal.isVideoPraise ? '是' : '否'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[12px] text-[#6b7280]">包邮</div>
                                    <div className={cn("text-[13px] font-medium", detailModal.isFreeShipping ? "text-primary-600" : "text-[#9ca3af]")}>
                                        {detailModal.isFreeShipping ? '是' : '否'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
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
