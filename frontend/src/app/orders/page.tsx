'use client';

import { useEffect, useState, Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getToken } from '../../services/authService';
import BottomNav from '../../components/BottomNav';
import { fetchSystemConfig, getEnabledTaskTypes } from '../../services/systemConfigService';
import { TASK_TYPE_NAMES } from '../../constants/platformConfig';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

const STATUS_OPTIONS = [
    { value: '', label: '全部状态' }, { value: '1', label: '已打印快递单，待发货' }, { value: '2', label: '已发货，待确认收货' },
    { value: '3', label: '已确认收货，待商家返款' }, { value: '4', label: '商家已返款，待确认返款' }, { value: '5', label: '已完成' },
    { value: '6', label: '已超时' }, { value: '7', label: '已取消' }, { value: '8', label: '自动放弃' },
];

const TASK_TYPE_OPTIONS = [
    { value: 0, label: '全部' }, { value: 1, label: '关键词' }, { value: 2, label: '淘口令' },
    { value: 3, label: '二维码' }, { value: 4, label: '直通车' }, { value: 5, label: '通道任务' },
];

const REFUND_TYPE_OPTIONS = [{ value: '', label: '全部' }, { value: '3', label: '全部' }, { value: '2', label: '本立佣货' }, { value: '1', label: '本佣货返' }];

const REVIEW_STATUS_OPTIONS = [
    { value: '', label: '全部追评' }, { value: '1', label: '待处理追评任务' }, { value: '2', label: '待返款追评任务' },
    { value: '3', label: '已完成追评任务' }, { value: '4', label: '已拒接追评任务' },
];

interface OrderItem { id: string; taskNumber: string; shopName: string; shopImg: string; type: string; taskType: string; mainProductName: string; mainProductPcImg: string; state: string; indexState: string; buynoAccount: string; commission: number; userDivided: number; userPrincipal: number; createdAt: string; progress: string; reviewTaskId?: string; checked?: boolean; }
interface BuynoItem { id: string; platformAccount: string; }

function OrdersPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buynos, setBuynos] = useState<BuynoItem[]>([]);
    const [value1, setValue1] = useState(searchParams.get('status') || '');
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState<number | string>('');
    const [value4, setValue4] = useState('');
    const [value5, setValue5] = useState('');
    const [platformFilter, setPlatformFilter] = useState<number | string>(''); // 平台筛选
    const [enabledTaskTypes, setEnabledTaskTypes] = useState<number[]>([1, 2]); // 启用的平台类型
    const [indexorder, setIndexorder] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [datetime1, setDatetime1] = useState('');
    const [datetime2, setDatetime2] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [buttonvalue, setButtonvalue] = useState('查看详情');
    const [buttonvalue2] = useState('去追评');

    const alertSuccess = useCallback((msg: string) => alert(msg), []);
    const alertError = useCallback((msg: string) => alert(msg), []);

    // 加载启用的平台列表
    useEffect(() => {
        const loadConfig = async () => {
            const config = await fetchSystemConfig();
            const enabled = getEnabledTaskTypes(config);
            setEnabledTaskTypes(enabled);
        };
        loadConfig();
    }, []);

    // 根据启用平台生成平台筛选选项
    const platformOptions = useMemo(() => {
        const options = [{ value: '' as string | number, label: '全部平台' }];
        enabledTaskTypes.forEach(taskType => {
            const name = TASK_TYPE_NAMES[taskType];
            if (name) {
                options.push({ value: taskType, label: name });
            }
        });
        return options;
    }, [enabledTaskTypes]);

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadBuynos(); getData(); }, []);
    useEffect(() => { if (!loading) getData(); }, [value1, value2, value3, value4, value5, platformFilter, currentPage]);

    const loadBuynos = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/buyer-accounts`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setBuynos(data.data || []);
        } catch (error) { console.error('Load buynos error:', error); }
    };

    const getData = async (date1?: string, date2?: string) => {
        setLoading(true);
        try {
            const token = getToken();
            const params = new URLSearchParams({
                page: String(currentPage),
                ...(value1 ? { status: value1 } : {}),
                ...(value2 ? { buynoId: value2 } : {}),
                ...(value3 ? { taskType: String(value3) } : {}),
                ...(value4 ? { terminal: String(value4) } : {}),
                ...(platformFilter ? { platform: String(platformFilter) } : {}),
            });
            const response = await fetch(`${BASE_URL}/orders?${params.toString()}`, {
                method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) { const list = data.data || []; for (let i = 0; i < list.length; i++) list[i].progress = (list[i].progress || 0) + '%'; setOrders(list); setTotal(data.total || 0); }
            else alertError(data.message || '获取数据失败');
        } catch (error) { console.error('Failed to load orders:', error); }
        finally { setLoading(false); }
    };

    const searchOrder = () => { setCurrentPage(1); getData(); };

    const getChooseValue = (value: string) => {
        setValue5(''); setValue1(value); setCurrentPage(1);
        if (value === '4') setButtonvalue('确认返款');
        else if (value === '2') setButtonvalue('去收货');
        else setButtonvalue('查看详情');
    };

    const getZhuiPingValue = (value: string) => {
        setValue1(''); setValue5(value); setCurrentPage(1);
        if (value === '1') setButtonvalue('拒接任务');
        else setButtonvalue('查看详情');
    };

    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        if (newSelectAll) { setSelectedIds(orders.map(o => o.id)); setOrders(orders.map(o => ({ ...o, checked: true }))); }
        else { setSelectedIds([]); setOrders(orders.map(o => ({ ...o, checked: false }))); }
    };

    const handleSelectOrder = (orderId: string) => {
        const newOrders = orders.map(o => o.id === orderId ? { ...o, checked: !o.checked } : o);
        setOrders(newOrders);
        const checkedIds = newOrders.filter(o => o.checked).map(o => o.id);
        setSelectedIds(checkedIds);
        setSelectAll(checkedIds.length === orders.length);
    };

    const handleBatchConfirmRefund = async () => {
        if (selectedIds.length === 0) { alertError('请选择要确认返款的订单'); return; }
        try {
            const token = getToken();
            const principalRes = await fetch(`${BASE_URL}/orders/batch/principal`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ orderIds: selectedIds }),
            });
            const principalData = await principalRes.json();
            if (principalData.success) {
                if (confirm(`商家确认返款金额为: ${principalData.data.principal}，是否确认？`)) {
                    const res = await fetch(`${BASE_URL}/orders/batch/confirm-refund`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ orderIds: selectedIds }),
                    });
                    const data = await res.json();
                    if (data.success) { alertSuccess(data.message || '返款成功'); setTimeout(() => { if (data.redirectUrl) router.push(data.redirectUrl); else getData(); }, 3000); }
                    else alertError(data.message || '返款失败');
                }
            } else alertError(principalData.message || '获取返款金额失败');
        } catch (error) { alertError('网络错误'); }
    };

    const chooseTiao = (id: string) => {
        const val = value1;
        if (val === '4') router.push(`/orders/${id}`);
        else if (val === '2') router.push(`/orders/${id}/receive`);
        else router.push(`/orders/${id}`);
    };

    const chooseTiao2 = async (review_task_id: string) => {
        if (value5 === '1') {
            if (confirm('您确定要拒接追评任务吗？')) {
                try {
                    const token = getToken();
                    const res = await fetch(`${BASE_URL}/review-tasks/user/reject`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ reviewTaskId: review_task_id }),
                    });
                    const data = await res.json();
                    if (data.success) { alertSuccess(data.message || '已拒接追评任务'); getData(); }
                    else alertError(data.message || '操作失败');
                } catch (error) { alertError('网络错误'); }
            }
        } else router.push(`/orders/additional-review/${review_task_id}`);
    };

    const goZhuiPin = (review_task_id: string) => router.push(`/orders/additional-review/${review_task_id}`);

    const defaultBtn = (index_state: string) => { if (index_state === '4') return '确认返款'; if (index_state === '2') return '去收货'; return '查看详情'; };
    const defaultBtnClick = (index_state: string, id: string) => { if (!index_state || index_state === '4') router.push(`/orders/${id}`); else if (index_state === '2') router.push(`/orders/${id}/receive`); else router.push(`/orders/${id}`); };

    const getStatusColor = (state: string) => { if (state.includes('完成')) return 'bg-green-50 text-success-500'; if (state.includes('取消') || state.includes('放弃') || state.includes('超时')) return 'bg-slate-100 text-slate-500'; if (state.includes('返款')) return 'bg-amber-50 text-warning-500'; return 'bg-blue-50 text-primary-600'; };

    const totalPages = Math.ceil(total / pageSize);

    const QUICK_TABS = [{ key: '', label: '全部' }, { key: '1', label: '待发货' }, { key: '2', label: '待收货' }, { key: '3', label: '待返款' }, { key: '4', label: '待确认' }, { key: '5', label: '已完成' }, { key: '6', label: '已超时' }];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900">
            {/* Header Area */}
            <div className="sticky top-0 z-20 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="px-6 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">任务管理</h1>
                    <button onClick={() => setShowFilters(!showFilters)} className="text-sm font-bold text-primary-600 bg-white px-3 py-1.5 rounded-full">{showFilters ? '收起' : '筛选'}</button>
                </div>
                {/* Search */}
                <div className="px-4 pb-4">
                    <div className="flex gap-2">
                        <input type="text" placeholder="请输入任务编号" value={indexorder} onChange={(e) => setIndexorder(e.target.value)}
                            className="flex-1 rounded-xl border-none bg-white px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 outline-none" />
                        <button onClick={searchOrder} className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-bold text-white active:scale-95 transition-transform">搜索</button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[515px]">
                {/* Filters Panel */}
                {showFilters && (
                    <div className="mx-4 mb-4 rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">任务状态</div>
                                <div className="relative">
                                    <select value={value1} onChange={(e) => getChooseValue(e.target.value)} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">任务买号</div>
                                <div className="relative">
                                    <select value={value2} onChange={(e) => { setValue2(e.target.value); setCurrentPage(1); }} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        <option value="">全部买号</option>
                                        {buynos.map(b => <option key={b.id} value={b.id}>{b.platformAccount}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">返款方式</div>
                                <div className="relative">
                                    <select value={value4} onChange={(e) => { setValue4(e.target.value); setCurrentPage(1); }} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        {REFUND_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">平台筛选</div>
                                <div className="relative">
                                    <select value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">任务类型</div>
                                <div className="relative">
                                    <select value={value3} onChange={(e) => { setValue3(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        {TASK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">追评任务</div>
                                <div className="relative">
                                    <select value={value5} onChange={(e) => getZhuiPingValue(e.target.value)} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                        {REVIEW_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="mb-2 text-xs font-bold text-slate-500">任务起止时间</div>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={datetime1} onChange={(e) => { setDatetime1(e.target.value); setCurrentPage(1); }} className="w-full rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20" />
                                <input type="date" value={datetime2} onChange={(e) => { setDatetime2(e.target.value); setCurrentPage(1); getData(datetime1, e.target.value); }} className="w-full rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Tabs */}
                <div className="no-scrollbar flex overflow-x-auto px-4 pb-2">
                    {QUICK_TABS.map(tab => (
                        <button key={tab.key} onClick={() => getChooseValue(tab.key)}
                            className={cn('flex-none whitespace-nowrap px-4 py-2 text-sm font-bold mr-2 rounded-full transition-all', value1 === tab.key ? 'bg-primary-600 text-white' : 'bg-white text-slate-500')}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Batch Select (when value1 === '4') */}
                {value1 === '4' && (
                    <div className="mx-4 mt-2 flex items-center justify-between rounded-[20px] bg-white px-5 py-3 shadow-sm">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} className="h-4 w-4 rounded-md border-slate-300 text-primary-600 focus:ring-primary-500" /> 全选
                        </label>
                        <button onClick={handleBatchConfirmRefund} disabled={selectedIds.length === 0}
                            className={cn('rounded-xl px-5 py-2 text-sm font-bold text-white transition-all', selectedIds.length > 0 ? 'bg-warning-500 active:scale-95' : 'cursor-not-allowed bg-slate-200')}>
                            确认返款 ({selectedIds.length})
                        </button>
                    </div>
                )}

                {/* Order List */}
                <div className="mt-4 space-y-4 px-4 pb-8">
                    {loading ? (
                        <div className="rounded-[24px] bg-white py-16 text-center text-slate-400">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                            <div className="mt-4 text-xs font-bold">加载中...</div>
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="rounded-[24px] bg-white py-20 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="mb-4 text-5xl opacity-30 grayscale">📦</div>
                            <div className="text-sm font-bold text-slate-300">暂无订单数据</div>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <div key={order.id} className="overflow-hidden rounded-[24px] bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-md">
                                {/* Order Header */}
                                <div className="flex items-center justify-between border-b border-slate-50 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {value1 === '4' && <input type="checkbox" checked={order.checked || false} onChange={() => handleSelectOrder(order.id)} className="h-5 w-5 rounded-md border-slate-300 text-primary-600 focus:ring-primary-500" />}
                                        {order.shopImg ? <img src={order.shopImg} alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm bg-slate-50" /> : <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">🏪</div>}
                                        <div>
                                            <div className="text-sm font-bold text-slate-900">{order.type}店铺：{order.shopName?.substring(0, 3)}...</div>
                                            <div className="mt-0.5 text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded inline-block">类型：{order.taskType}</div>
                                        </div>
                                    </div>
                                    <span className={cn('rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1', getStatusColor(order.state))}>
                                        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
                                        {order.state}
                                    </span>
                                </div>
                                {/* Order Body */}
                                <div className="px-5 py-4">
                                    <div className="mb-3 text-xs font-medium text-slate-400 flex items-center gap-2">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">编号</span>
                                        {order.taskNumber}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="text-[10px] text-slate-400 mb-1">买号</div>
                                            <div className="font-bold text-slate-700">{order.buynoAccount}</div>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <div className="text-[10px] text-slate-400 mb-1">佣金</div>
                                            <div className="font-bold text-success-500">+{order.commission}+{order.userDivided}银锭</div>
                                        </div>
                                        <div className="rounded-xl bg-slate-50 p-3 col-span-2 flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] text-slate-400 mb-1">垫付资金</div>
                                                <div className="font-bold text-slate-900">¥{order.userPrincipal}</div>
                                            </div>
                                            <div className="text-xs font-medium text-slate-400">{order.createdAt}</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Order Footer */}
                                <div className="flex justify-end gap-3 border-t border-slate-50 px-5 py-4 bg-slate-50/50">
                                    {!value5 && !value1 && <button onClick={() => defaultBtnClick(order.indexState, order.id)} className="rounded-xl bg-white border border-slate-200 px-5 py-2 text-xs font-bold text-slate-600 active:scale-95 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300">{defaultBtn(order.indexState)}</button>}
                                    {(value5 || value1) && <button onClick={() => value5 ? chooseTiao2(order.reviewTaskId || '') : chooseTiao(order.id)} className="rounded-xl bg-white border border-slate-200 px-5 py-2 text-xs font-bold text-slate-600 active:scale-95 transition-all hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300">{buttonvalue}</button>}
                                    {value5 === '1' && order.reviewTaskId && <button onClick={() => goZhuiPin(order.reviewTaskId!)} className="rounded-xl bg-primary-600 px-5 py-2 text-xs font-bold text-white active:scale-95 transition-all hover:bg-primary-700">{buttonvalue2}</button>}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && orders.length > 0 && (
                    <div className="mt-4 text-center pb-8">
                        <div className="mb-3 text-xs font-medium text-slate-400/80">共 {total} 条数据</div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                    className={cn('h-10 w-10 text-xl flex items-center justify-center rounded-xl bg-white font-bold transition-all', currentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-600 active:scale-95')}>←</button>
                                <span className="text-sm font-black text-slate-900 bg-white px-4 py-2 rounded-xl">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                    className={cn('h-10 w-10 text-xl flex items-center justify-center rounded-xl bg-white font-bold transition-all', currentPage === totalPages ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-600 active:scale-95')}>→</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" /></div>}>
            <OrdersPageContent />
        </Suspense>
    );
}
