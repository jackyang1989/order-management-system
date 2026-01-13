'use client';

import { useState, useEffect, useMemo } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { formatDate } from '../../../lib/utils';
import { toastError, toastSuccess } from '../../../lib/toast';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Table, Column } from '../../../components/ui/table';
import { Modal } from '../../../components/ui/modal';
import { Pagination } from '../../../components/ui/pagination';

import { 
    PlatformLabels, 
    TerminalLabels, 
    TaskStatusLabels,
    OrderStatusLabels
} from '@/shared/taskSpec';
import { formatDateTime, formatMoney } from '@/shared/formatters';

// 临时类型定义（待移除）
interface ColumnConfig {
    key: string;
    visible: boolean;
    width: number;
    order: number;
}

interface ColumnMeta {
    key: string;
    title: string;
}

interface EnhancedColumn<T> {
    key: string;
    title: string;
    render: (row: T) => React.ReactNode;
    cellClassName?: string;
}

// 临时模拟 useTablePreferences Hook
const useTablePreferences = ({ tableKey, defaultColumns }: { tableKey: string; defaultColumns: ColumnConfig[] }) => ({
    columnConfig: defaultColumns,
    savePreferences: () => {},
    resetPreferences: () => {},
    updateLocalConfig: () => {},
});

// 临时模拟 EnhancedTable 组件
const EnhancedTable = ({ columns, data, rowKey, loading, emptyText, selectable, selectedKeys, onRowSelect, columnConfig, onColumnConfigChange, sortField, sortOrder, onSort, onColumnSettingsClick }: any) => (
    <Table columns={columns} data={data} rowKey={rowKey} loading={loading} emptyText={emptyText} />
);

// 临时模拟 ColumnSettingsPanel
const ColumnSettingsPanel = (props: any) => null;

interface Task {

    id: string;
    taskNumber: string;
    title: string;
    taskType: number;
    shopName: string;
    shopAccount?: string;
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
    channelImages?: string;
    remark: string;
    memo?: string;
    merchantId: string;
    merchant?: { id: string; username: string; merchantName: string; phone: string };
    goodsMoney: number;
    shippingFee: number;
    margin: number;
    extraReward: number;
    extraCommission?: number;
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
    praiseType: string;
    praiseList: string;
    praiseImgList: string;
    praiseVideoList: string;
    isTimingPublish: boolean;
    publishTime: string;
    isTimingPay: boolean;
    timingTime?: string;
    isRepay: boolean;
    isNextDay: boolean;
    cycle?: number;
    unionInterval?: number;
    needCompare: boolean;
    compareKeyword?: string;
    needFavorite: boolean;
    needFollow: boolean;
    needContactCS: boolean;
    needAddCart: boolean;
    totalBrowseMinutes: number;
    mainBrowseMinutes: number;
    subBrowseMinutes: number;
    isPasswordEnabled?: boolean;
    checkPassword?: string;
    updatedAt: string;
    goodsNum?: number;
    // Multi-goods and multi-keywords from refactored version
    goodsList?: TaskGoodsItem[];
    keywords?: TaskKeywordItem[];
    // 新增审计字段
    fastRefund?: boolean;
    weight?: number;
    contactCSContent?: string;
    compareCount?: number;
}

// Multi-goods item from task_goods table
interface TaskGoodsItem {
    id: string;
    taskId: string;
    goodsId?: string;
    name: string;
    pcImg?: string;
    link?: string;
    specName?: string;
    specValue?: string;
    price: number;
    num: number;
    totalPrice: number;
}

// Multi-keyword item from task_keywords table
interface TaskKeywordItem {
    id: string;
    taskId: string;
    taskGoodsId?: string;
    keyword: string;
    terminal: number;
    discount?: string;
    filter?: string;
    sort?: string;
    maxPrice: number;
    minPrice: number;
    province?: string;
}

const terminalLabels: Record<number, string> = TerminalLabels;

export default function AdminTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<number | undefined>(undefined);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [exporting, setExporting] = useState(false);
    const [detailModal, setDetailModal] = useState<Task | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // 排序状态
    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    // 列设置面板状态
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // 默认列配置
    const defaultColumns: ColumnConfig[] = useMemo(() => [
        { key: 'taskNumber', visible: true, width: 130, order: 0 },
        { key: 'merchant', visible: true, width: 140, order: 1 },
        { key: 'taskType', visible: true, width: 80, order: 2 },
        { key: 'terminal', visible: true, width: 90, order: 3 },
        { key: 'goodsPrice', visible: true, width: 100, order: 4 },
        { key: 'progress', visible: true, width: 110, order: 5 },
        { key: 'shipping', visible: true, width: 80, order: 6 },
        { key: 'status', visible: true, width: 90, order: 7 },
        { key: 'createdAt', visible: true, width: 100, order: 8 },
        { key: 'actions', visible: true, width: 180, order: 9 },
    ], []);

    // 列配置 Hook
    const { columnConfig, savePreferences, resetPreferences, updateLocalConfig } = useTablePreferences({
        tableKey: 'admin_tasks',
        defaultColumns,
    });

    // 列元信息 (用于列设置面板)
    const columnMeta: ColumnMeta[] = useMemo(() => [
        { key: 'taskNumber', title: '任务编号' },
        { key: 'merchant', title: '商家' },
        { key: 'taskType', title: '平台' },
        { key: 'terminal', title: '返款方式' },
        { key: 'goodsPrice', title: '商品售价' },
        { key: 'progress', title: '已接/完成' },
        { key: 'shipping', title: '邮费' },
        { key: 'status', title: '状态' },
        { key: 'createdAt', title: '发布时间' },
        { key: 'actions', title: '操作' },
    ], []);





    const statusOptions = useMemo(
        () =>
            Object.entries(TaskStatusLabels).map(([k, v]) => ({
                value: String(k),
                label: v,
            })),
        []
    );

    useEffect(() => { loadTasks(); }, [filter, page]);

    const loadTasks = async () => {
        const token = localStorage.getItem('adminToken');
        setLoading(true);
        setSelectedIds([]);
        try {
            let url = `${BASE_URL}/admin/tasks?page=${page}&limit=20`;
            if (filter !== undefined) url += `&status=${filter}`;
            if (search) url += `&taskNumber=${encodeURIComponent(search)}`;
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) { setTasks(json.data); setTotal(json.total || json.data.length); }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleSearch = () => {
        setPage(1);
        loadTasks();
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === tasks.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(tasks.map(t => t.id));
        }
    };

    const handleBatchApprove = async () => {
        if (selectedIds.length === 0) {
            toastError('请先选择任务');
            return;
        }
        if (!confirm(`确定要批量通过 ${selectedIds.length} 个任务吗？`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            for (const id of selectedIds) {
                await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: 1 })
                });
            }
            toastSuccess(`已批量通过 ${selectedIds.length} 个任务`);
            loadTasks();
        } catch (e) {
            toastError('批量操作失败');
        }
    };

    const handleBatchReject = async () => {
        if (selectedIds.length === 0) {
            toastError('请先选择任务');
            return;
        }
        if (!confirm(`确定要批量拒绝 ${selectedIds.length} 个任务吗？`)) return;
        const token = localStorage.getItem('adminToken');
        try {
            for (const id of selectedIds) {
                await fetch(`${BASE_URL}/admin/tasks/${id}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ status: 3 })
                });
            }
            toastSuccess(`已批量拒绝 ${selectedIds.length} 个任务`);
            loadTasks();
        } catch (e) {
            toastError('批量操作失败');
        }
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

    const columns: EnhancedColumn<Task>[] = [
        {
            key: 'taskNumber',
            title: '任务编号',
            render: (row) => <code className="text-[12px] text-[#6b7280]">{row.taskNumber}</code>,
            cellClassName: 'w-[130px]',
        },
        {
            key: 'merchant',
            title: '商家',
            render: (row) => (
                <div className="text-sm">
                    <div className="font-medium text-[#3b4559]">{row.merchant?.username || row.merchant?.merchantName || '-'}</div>
                    <div className="text-xs text-[#9ca3af]">{row.shopName || '-'}</div>
                </div>
            ),
            cellClassName: 'w-[140px]',
        },
        {
            key: 'taskType',
            title: '平台',
            render: (row) => <span className="text-[#5a6577]">{PlatformLabels[row.taskType] || '其他'}</span>,
            cellClassName: 'w-[80px]',
        },
        {
            key: 'terminal',
            title: '返款方式',
            render: (row) => (
                <Badge variant="soft" color={row.terminal === 1 ? 'blue' : 'green'}>
                    {terminalLabels[row.terminal] || '-'}
                </Badge>
            ),
            cellClassName: 'w-[90px]',
        },
        {
            key: 'goodsPrice',
            title: '商品售价',
            render: (row) => <span className="font-medium text-[#3b4559]">¥{Number(row.goodsPrice).toFixed(2)}</span>,
            cellClassName: 'w-[100px] text-right',
        },
        {
            key: 'progress',
            title: '已接/完成',
            render: (row) => (
                <div className="text-sm">
                    <span className="text-primary-600">{row.claimedCount}</span>
                    <span className="text-[#9ca3af]"> / </span>
                    <span className="text-success-500">{row.completedCount || 0}</span>
                    <span className="text-[#9ca3af]"> / </span>
                    <span className="text-[#6b7280]">{row.count}</span>
                </div>
            ),
            cellClassName: 'w-[110px]',
        },
        {
            key: 'shipping',
            title: '邮费',
            render: (row) => (
                <Badge variant="soft" color={row.isFreeShipping ? 'green' : 'slate'}>
                    {row.isFreeShipping ? '包邮' : '非包邮'}
                </Badge>
            ),
            cellClassName: 'w-[80px] text-center',
        },
        {
            key: 'status',
            title: '状态',
            render: (row) => {
                const text = TaskStatusLabels[row.status] || '未知';
                const color = (row.status === 0 ? 'slate' : row.status === 1 ? 'green' : row.status === 2 ? 'blue' : row.status === 3 ? 'red' : 'amber') as any;
                return (
                    <Badge variant="soft" color={color}>
                        {text}
                    </Badge>
                );
            },
            cellClassName: 'w-[90px] text-center',
        },
        {
            key: 'createdAt',
            title: '发布时间',
            render: (row) => <span className="text-xs text-[#6b7280]">{formatDateTime(row.createdAt)}</span>,
            cellClassName: 'w-[100px]',
        },
        {
            key: 'actions',
            title: '操作',
            render: (row) => (
                <div className="flex items-center justify-between whitespace-nowrap">
                    <Button size="sm" variant="secondary" onClick={() => setDetailModal(row)}>
                        详情
                    </Button>
                    <Select
                        value={String(row.status)}
                        onChange={(value) => handleUpdateStatus(row.id, Number(value))}
                        options={statusOptions}
                        className="w-20"
                        size="sm"
                        placeholder="状态"
                    />
                </div>
            ),
            cellClassName: 'w-[180px]',
        },
    ];

    return (
        <div className="space-y-6">
            <Card className="bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-base font-medium">任务列表</span>
                        <span className="text-sm text-[#6b7280]">共 {total} 条记录</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="secondary" onClick={loadTasks}>
                            刷新
                        </Button>
                        <Button
                            onClick={handleExport}
                            loading={exporting}
                            variant="success"
                        >
                            导出Excel
                        </Button>
                    </div>
                </div>
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <Input
                        placeholder="搜索任务编号..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-52"
                    />
                    <Select
                        value={String(filter ?? 'all')}
                        onChange={(val) => {
                            setFilter(val === 'all' ? undefined : Number(val));
                            setPage(1);
                        }}
                        options={[
                            { value: 'all', label: '全部状态' },
                            { value: '1', label: '进行中' },
                            { value: '4', label: '待审核' },
                            { value: '2', label: '已完成' },
                            { value: '3', label: '已取消' },
                        ]}
                        className="w-32"
                    />
                    <Button onClick={handleSearch}>搜索</Button>
                    <div className="ml-auto flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <>
                                <span className="text-sm text-[#6b7280]">已选 {selectedIds.length} 项</span>
                                <Button onClick={handleBatchApprove}>
                                    批量通过
                                </Button>
                                <Button variant="destructive" onClick={handleBatchReject}>
                                    批量拒绝
                                </Button>
                            </>
                        )}
                    </div>
                </div>


                <div className="overflow-hidden">
                    <EnhancedTable
                        columns={columns}
                        data={tasks}
                        rowKey={(r: Task) => r.id}
                        loading={loading}
                        emptyText="暂无任务数据"
                        selectable
                        selectedKeys={selectedIds}
                        onRowSelect={(keys: string[]) => setSelectedIds(keys)}
                        columnConfig={columnConfig}
                        onColumnConfigChange={updateLocalConfig}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSort={(field: string, order: 'asc' | 'desc') => {
                            setSortField(field);
                            setSortOrder(order);
                        }}
                        onColumnSettingsClick={() => setShowColumnSettings(true)}
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

            {/* 列设置面板 */}
            <ColumnSettingsPanel
                open={showColumnSettings}
                onClose={() => setShowColumnSettings(false)}
                columns={columnMeta}
                config={columnConfig}
                onSave={savePreferences}
                onReset={resetPreferences}
            />

            <Modal
                title="任务详情"
                open={!!detailModal}
                onClose={() => setDetailModal(null)}
                className="max-w-4xl"
            >
                {detailModal && (() => {
                    // 解析 JSON 字段
                    const parsePraiseList = (jsonStr: string | undefined): string[] => {
                        if (!jsonStr) return [];
                        try { return JSON.parse(jsonStr) || []; } catch { return []; }
                    };
                    const parsePraiseImgList = (jsonStr: string | undefined): string[][] => {
                        if (!jsonStr) return [];
                        try { return JSON.parse(jsonStr) || []; } catch { return []; }
                    };
                    const parseChannelImages = (jsonStr: string | undefined): string[] => {
                        if (!jsonStr) return [];
                        try { return JSON.parse(jsonStr) || []; } catch { return []; }
                    };
                    const praiseTexts = parsePraiseList(detailModal.praiseList);
                    const praiseImgs = parsePraiseImgList(detailModal.praiseImgList);
                    const praiseVideos = parsePraiseList(detailModal.praiseVideoList);
                    const channelImgs = parseChannelImages(detailModal.channelImages);

                    // 判断进店方式
                    const getEntryMethod = () => {
                        if (detailModal.qrCode) return { type: '二维码', content: <img src={detailModal.qrCode} alt="二维码" className="h-20 w-20 rounded border" /> };
                        if (detailModal.taoWord) return { type: '淘口令', content: <code className="rounded bg-amber-50 px-2 py-1 text-sm text-amber-700">{detailModal.taoWord}</code> };
                        if (channelImgs.length > 0) return { type: '通道', content: <div className="flex flex-wrap gap-2">{channelImgs.map((img, i) => <img key={i} src={img} alt="" className="h-16 w-16 rounded border object-cover" />)}</div> };
                        return { type: '关键词', content: <span className="font-medium text-primary-600">{detailModal.keyword}</span> };
                    };
                    const entryMethod = getEntryMethod();

                    // 浏览行为配置
                    const browseActions = [
                        { label: '货比', enabled: detailModal.needCompare, extra: detailModal.needCompare ? `${detailModal.compareCount || 3}家商品` : undefined },
                        { label: '收藏商品', enabled: detailModal.needFavorite },
                        { label: '关注店铺', enabled: detailModal.needFollow },
                        { label: '加入购物车', enabled: detailModal.needAddCart },
                        { label: '联系客服', enabled: detailModal.needContactCS, extra: detailModal.contactCSContent }
                    ];

                    // 增值服务配置
                    const valueAddedServices = [
                        { label: '定时发布', enabled: detailModal.isTimingPublish, value: detailModal.publishTime ? formatDateTime(detailModal.publishTime) : '' },
                        { label: '定时付款', enabled: detailModal.isTimingPay, value: detailModal.timingTime ? formatDateTime(detailModal.timingTime) : '' },
                        { label: '回购任务', enabled: detailModal.isRepay },
                        { label: '隔天任务', enabled: detailModal.isNextDay },
                        { label: '延长周期', enabled: (detailModal.cycle || 0) > 0, value: detailModal.cycle ? `${detailModal.cycle}天` : '' },
                        { label: '接单间隔', enabled: (detailModal.unionInterval || 0) > 0, value: detailModal.unionInterval ? `${detailModal.unionInterval}分钟` : '' },
                        { label: '快速返款', enabled: !!detailModal.fastRefund },
                        { label: '包裹重量', enabled: (detailModal.weight || 0) > 0, value: `${detailModal.weight}kg` }
                    ];

                    return (
                        <div className="max-h-[70vh] overflow-y-auto pr-2">
                            {/* 顶部主图 */}
                            {detailModal.mainImage && (
                                <div className="mb-6 flex justify-center">
                                    <img src={detailModal.mainImage} alt="商品图" className="h-48 rounded-md object-contain" />
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
                                        <div className="text-[13px] font-medium text-[#3b4559]">{PlatformLabels[detailModal.taskType] || '其他'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[12px] text-[#6b7280]">状态</div>
                                        <div>
                                            <Badge variant="soft" color={detailModal.status === 0 ? 'slate' : detailModal.status === 1 ? 'green' : detailModal.status === 2 ? 'blue' : detailModal.status === 3 ? 'red' : 'amber'}>
                                                {TaskStatusLabels[detailModal.status] || '未知'}
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
                                        <div className="text-[12px] text-[#6b7280]">商家</div>
                                        <div className="text-[13px] font-medium text-[#3b4559]">{detailModal.merchant?.username || detailModal.merchant?.merchantName || '-'}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[12px] text-[#6b7280]">结算方式</div>
                                        <div className="text-[13px] font-medium text-[#3b4559]">{terminalLabels[detailModal.terminal] || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 商品信息 - Multi-goods Support */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">商品信息</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    {detailModal.goodsList && detailModal.goodsList.length > 0 ? (
                                        <div className="space-y-3">
                                            {detailModal.goodsList.map((goods, index) => (
                                                <div key={goods.id} className="flex gap-3 rounded border border-slate-200 bg-white p-3">
                                                    {goods.pcImg && (
                                                        <img src={goods.pcImg} alt="" className="h-16 w-16 rounded border border-slate-200 object-cover shrink-0" />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Badge variant="soft" color={index === 0 ? 'blue' : 'slate'}>
                                                                {index === 0 ? '主商品' : `副商品${index}`}
                                                            </Badge>
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
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        /* Fallback: single product display */
                                        <div className="flex gap-3">
                                            {detailModal.mainImage && (
                                                <img src={detailModal.mainImage} alt="" className="h-16 w-16 rounded border border-slate-200 object-cover shrink-0" />
                                            )}
                                            <div className="flex-1">
                                                <div className="text-sm text-slate-700">{detailModal.title}</div>
                                                <div className="text-danger-500 font-medium mt-1">¥{Number(detailModal.goodsPrice).toFixed(2)}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 进店方式 - Multi-keywords Support */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">进店方式</h3>
                                <div className="rounded-md bg-[#f9fafb] p-4">
                                    {detailModal.keywords && detailModal.keywords.length > 0 ? (
                                        <div className="space-y-3">
                                            {detailModal.keywords.map((kw, index) => (
                                                <div key={kw.id} className="rounded border border-slate-200 bg-white p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge variant="soft" color={index === 0 ? 'blue' : 'slate'}>
                                                            关键词 {index + 1}
                                                        </Badge>
                                                    </div>
                                                    <div className="rounded bg-primary-50 px-3 py-2 mb-2">
                                                        <span className="text-base font-bold text-primary-600">{kw.keyword}</span>
                                                    </div>
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
                                        <>
                                            <div className="flex items-start gap-3">
                                                <Badge variant="soft" color="blue">{entryMethod.type}</Badge>
                                                <div className="flex-1">{entryMethod.content}</div>
                                            </div>
                                            {detailModal.url && (
                                                <div className="mt-3">
                                                    <a href={detailModal.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-primary-500 hover:underline">查看商品链接 →</a>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* 浏览要求 */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">浏览要求</h3>
                                <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4">
                                    <div className="space-y-2">
                                        <div className="text-[12px] font-medium text-[#3b4559]">浏览行为</div>
                                        <div className="flex flex-wrap gap-2">
                                            {browseActions.map((action, i) => (
                                                <Badge key={i} variant="soft" color={action.enabled ? 'green' : 'slate'}>
                                                    {action.label}{action.enabled && action.extra && `: ${action.extra}`}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-[12px] font-medium text-[#3b4559]">浏览时长</div>
                                        <div className="grid grid-cols-3 gap-2 text-center">
                                            <div className="rounded bg-white p-2 border border-slate-200">
                                                <div className="text-lg font-bold text-primary-600">{detailModal.totalBrowseMinutes || 15}</div>
                                                <div className="text-[10px] text-[#6b7280]">总计/分钟</div>
                                            </div>
                                            <div className="rounded bg-white p-2 border border-slate-200">
                                                <div className="text-lg font-bold text-success-600">{detailModal.mainBrowseMinutes || 8}</div>
                                                <div className="text-[10px] text-[#6b7280]">主品/分钟</div>
                                            </div>
                                            <div className="rounded bg-white p-2 border border-slate-200">
                                                <div className="text-lg font-bold text-warning-500">{detailModal.subBrowseMinutes || 2}</div>
                                                <div className="text-[10px] text-[#6b7280]">副品/分钟</div>
                                            </div>
                                        </div>
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
                                        <div className="text-lg font-bold text-warning-500">{detailModal.count - detailModal.claimedCount}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 费用信息 */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">费用信息</h3>
                                <div className="grid grid-cols-1 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">商品单价</div>
                                        <div className="text-[13px] font-medium text-[#3b4559]">¥{Number(detailModal.goodsPrice).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">总押金</div>
                                        <div className="text-[13px] font-medium text-primary-600">¥{Number(detailModal.totalDeposit || 0).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">总佣金</div>
                                        <div className="text-[13px] font-medium text-danger-400">¥{Number(detailModal.totalCommission || 0).toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">额外加赏</div>
                                        <div className="text-[13px] font-medium text-warning-500">
                                            {(detailModal.extraReward || detailModal.extraCommission || 0) > 0 ? `+¥${detailModal.extraReward || detailModal.extraCommission}/单` : '无'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 增值服务 */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">增值服务</h3>
                                <div className="grid grid-cols-2 gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-4">
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">包邮</div>
                                        <Badge variant="soft" color={detailModal.isFreeShipping ? 'green' : 'amber'} className="mt-1">
                                            {detailModal.isFreeShipping ? '包邮' : '非包邮'}
                                        </Badge>
                                    </div>
                                    {valueAddedServices.filter(s => s.enabled).map((service, i) => (
                                        <div key={i}>
                                            <div className="text-[12px] text-green-600">{service.label}</div>
                                            <div className="text-[13px] font-medium text-green-700">{service.value || '是'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 好评设置 */}
                            <div className="mb-6">
                                <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">好评设置</h3>
                                <div className="grid grid-cols-3 gap-4 rounded-md bg-[#f9fafb] p-4">
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">文字好评</div>
                                        <Badge variant="soft" color={detailModal.isPraise ? 'green' : 'slate'} className="mt-1">
                                            {detailModal.isPraise ? `${praiseTexts.length}条` : '未设置'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">图片好评</div>
                                        <Badge variant="soft" color={detailModal.isImgPraise ? 'green' : 'slate'} className="mt-1">
                                            {detailModal.isImgPraise ? `${praiseImgs.length}组` : '未设置'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-[12px] text-[#6b7280]">视频好评</div>
                                        <Badge variant="soft" color={detailModal.isVideoPraise ? 'green' : 'slate'} className="mt-1">
                                            {detailModal.isVideoPraise ? `${praiseVideos.length}个` : '未设置'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* 好评内容详情 */}
                            {detailModal.isPraise && praiseTexts.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">文字好评内容</h3>
                                    <div className="rounded-md bg-[#f9fafb] p-4">
                                        <div className="space-y-2">
                                            {praiseTexts.map((txt: string, i: number) => (
                                                <div key={i} className="text-[13px] text-[#3b4559] flex gap-2">
                                                    <span className="text-[#9ca3af] font-mono shrink-0">{i + 1}.</span>
                                                    <span>{txt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 图片好评预览 */}
                            {detailModal.isImgPraise && praiseImgs.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">图片好评</h3>
                                    <div className="rounded-md bg-[#f9fafb] p-4 space-y-3">
                                        {praiseImgs.map((group: string[], i: number) => (
                                            <div key={i} className="flex flex-wrap gap-2">
                                                <span className="text-xs text-[#9ca3af]">第{i + 1}组:</span>
                                                {group.map((img: string, j: number) => (
                                                    <img key={j} src={img} alt="" className="h-16 w-16 rounded border object-cover" />
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 视频好评预览 */}
                            {detailModal.isVideoPraise && praiseVideos.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">视频好评</h3>
                                    <div className="rounded-md bg-[#f9fafb] p-4 space-y-3">
                                        {praiseVideos.map((video: string, i: number) => (
                                            <div key={i}>
                                                <span className="text-xs text-[#9ca3af]">第{i + 1}个视频:</span>
                                                <video src={video} controls className="mt-1 max-h-48 w-full rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 商家备注 */}
                            {detailModal.memo && (
                                <div className="mb-6">
                                    <h3 className="mb-3 text-[13px] font-semibold text-[#3b4559] border-l-4 border-primary-500 pl-2">下单提示/商家备注</h3>
                                    <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800 whitespace-pre-wrap">{detailModal.memo}</div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end">
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
