'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getToken } from '../../services/authService';
import BottomNav from '../../components/BottomNav';
import { fetchEnabledPlatforms, getEnabledTaskTypesFromPlatforms } from '../../services/systemConfigService';
import { fetchEnabledEntryTypes, EntryTypeData } from '../../services/entryTypeService';
import { TASK_TYPE_NAMES } from '../../constants/platformConfig';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

const TERMINAL_OPTIONS = [{ value: 1, label: '本佣货返' }, { value: 2, label: '本立佣货' }];

const PRICE_OPTIONS = [
    { value: '', label: '全部价格' }, { value: 1, label: '0-200' }, { value: 2, label: '200-500' },
    { value: 3, label: '500-1000' }, { value: 4, label: '1000-2000' }, { value: 5, label: '>2000' },
];

interface BuynoItem { id: string; platformAccount: string; count: number; dailyTaskLimit?: string; }
interface TaskItem { id: string; randNum: string; taskNumber: string; sellerName: string; mobile: string; totalPrice: number; userReward: number; userDivided: number; num: number; progress: string; }

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buynos, setBuynos] = useState<BuynoItem[]>([]);
    const [value2, setValue2] = useState('');
    const [value3, setValue3] = useState<number | string>('');
    const [value4, setValue4] = useState<number | string>('');
    const [value5, setValue5] = useState<number | string>('');
    const [platformFilter, setPlatformFilter] = useState<number | string>(''); // 平台筛选
    const [enabledTaskTypes, setEnabledTaskTypes] = useState<number[]>([1, 2]); // 启用的平台类型
    const [entryTypes, setEntryTypes] = useState<EntryTypeData[]>([]); // 入口类型列表
    const [loadingFilters, setLoadingFilters] = useState(true); // 筛选选项加载状态
    const [op2count, setOp2count] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const alertSuccess = useCallback((msg: string) => alert(msg), []);
    const alertError = useCallback((msg: string) => alert(msg), []);

    // 加载启用的平台列表和入口类型
    useEffect(() => {
        const loadFilters = async () => {
            setLoadingFilters(true);
            try {
                const platforms = await fetchEnabledPlatforms();
                const enabled = getEnabledTaskTypesFromPlatforms(platforms);
                setEnabledTaskTypes(enabled);
                
                const types = await fetchEnabledEntryTypes();
                setEntryTypes(types);
            } catch (error) {
                console.error('加载筛选选项失败:', error);
            } finally {
                setLoadingFilters(false);
            }
        };
        loadFilters();
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

    // 根据启用入口类型生成任务类型筛选选项
    const taskTypeOptions = useMemo(() => {
        const options = [{ value: '' as string | number, label: '全部类型' }];
        entryTypes
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .forEach(entryType => {
                options.push({ value: entryType.value, label: entryType.name });
            });
        return options;
    }, [entryTypes]);

    useEffect(() => { if (!isAuthenticated()) { router.push('/login'); return; } loadBuynos(); getData(); }, []);
    useEffect(() => { if (!loading) getData(); }, [value3, value4, value5, platformFilter, currentPage]);

    const loadBuynos = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/buyer-accounts`, { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) { setBuynos(data.data || []); if (data.data?.length > 0) { setValue2(data.data[0].id); setOp2count(data.data[0].dailyTaskLimit || '0'); } }
        } catch (error) { console.error('Load buynos error:', error); }
    };

    const getData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const params = new URLSearchParams({
                page: String(currentPage),
                ...(value3 ? { taskType: String(value3) } : {}),
                ...(value4 ? { terminal: String(value4) } : {}),
                ...(value5 ? { priceRange: String(value5) } : {}),
                ...(platformFilter ? { platform: String(platformFilter) } : {}),
            });
            const response = await fetch(`${BASE_URL}/tasks?${params.toString()}`, {
                method: 'GET', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) { const list = data.data || []; for (let i = 0; i < list.length; i++) list[i].progress = parseInt(list[i].progress || '0') + '%'; setTasks(list); setTotal(data.total || 0); }
            else alertError(data.message || '获取任务失败');
        } catch (error) { console.error('Failed to load tasks:', error); }
        finally { setLoading(false); }
    };

    const selectChange = (val: string) => { setValue2(val); for (let i = 0; i < buynos.length; i++) if (buynos[i].id === val) setOp2count(String(buynos[i].count)); };

    const addTask = async (index: number) => {
        if (!value2) { alertError('请先选择买号'); return; }
        if (!value4) { alertError('请先选择返款方式'); return; }
        if (confirm('是否添加此任务？')) {
            try {
                const task = tasks[index];
                const token = getToken();
                const response = await fetch(`${BASE_URL}/tasks/${task.id}/claim`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ buyerAccountId: value2, terminal: value4 }),
                });
                const data = await response.json();
                if (data.success) { alertSuccess(data.message || '添加任务成功'); setTimeout(() => { if (data.orderId) router.push(`/orders/${data.orderId}/execute`); else getData(); }, 3000); }
                else alertError(data.message || '添加任务失败');
            } catch (error) { alertError('网络错误'); }
        }
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-20 mx-auto max-w-[515px] bg-[#F8FAFC]/80 backdrop-blur-md">
                <div className="flex h-16 items-center px-6">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-xl font-bold text-slate-900">任务大厅</h1>
                </div>
            </header>

            <div className="mx-auto max-w-[515px] px-4 pt-4 pb-24">
                {/* Filters */}
                <div className="rounded-[24px] bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 text-xs font-bold text-slate-500">选择买号 <span className="text-danger-500">*</span></div>
                            <div className="relative">
                                <select value={value2} onChange={(e) => selectChange(e.target.value)} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                    <option value="">请选择买号</option>
                                    {buynos.map(b => <option key={b.id} value={b.id}>{b.platformAccount}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</div>
                            </div>
                            {op2count && <div className="mt-1.5 text-xs font-medium text-warning-500 flex items-center gap-1"><span>⚡</span>今日可接 {op2count} 单</div>}
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-bold text-slate-500">返款方式 <span className="text-danger-500">*</span></div>
                            <div className="relative">
                                <select value={value4} onChange={(e) => setValue4(e.target.value ? Number(e.target.value) : '')} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                    <option value="">请选择</option>
                                    {TERMINAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">平台筛选</div>
                                <div className="relative">
                                    <select 
                                        value={platformFilter} 
                                        onChange={(e) => { setPlatformFilter(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
                                        className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                                        disabled={loadingFilters}
                                    >
                                        {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                            <div>
                                <div className="mb-2 text-xs font-bold text-slate-500">任务类型</div>
                                <div className="relative">
                                    <select 
                                        value={value3} 
                                        onChange={(e) => { setValue3(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} 
                                        className="w-full appearance-none rounded-xl border-none bg-slate-100 px-3 py-2.5 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20"
                                        disabled={loadingFilters}
                                    >
                                        {taskTypeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">▼</div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="mb-2 text-xs font-bold text-slate-500">任务价格</div>
                            <div className="relative">
                                <select value={value5} onChange={(e) => { setValue5(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full appearance-none rounded-xl border-none bg-slate-100 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20">
                                    {PRICE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">▼</div>
                            </div>
                        </div>

                        <div className="rounded-[16px] bg-amber-50 p-3 text-xs font-bold text-amber-600 flex items-center gap-2">
                            <span>⚠️</span> 当日只可以接同一个商家的1单任务
                        </div>
                    </div>
                </div>

                {/* Task List */}
                <div className="mt-6 space-y-4">
                    {loading ? (
                        <div className="rounded-[24px] bg-white py-16 text-center text-slate-400">
                            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />
                            <div className="mt-4 text-xs font-bold">加载中...</div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-[24px] bg-white py-20 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                            <div className="mb-4 text-5xl opacity-30 grayscale">📋</div>
                            <div className="text-sm font-bold text-slate-300">暂无任务数据</div>
                        </div>
                    ) : (
                        tasks.map((task, index) => (
                            <div key={task.id} className="relative overflow-hidden rounded-[24px] bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all active:scale-[0.99]">
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm">🆔</div>
                                        <span className="font-bold text-slate-900">{task.randNum}</span>
                                    </div>
                                    <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                        商家：{task.sellerName?.substring(0, 4)}...
                                    </div>
                                </div>
                                <div className="mb-5 grid grid-cols-2 gap-4 rounded-[16px] bg-slate-50 p-4">
                                    <div>
                                        <div className="mb-1 text-[10px] text-slate-400">垫付资金</div>
                                        <div className="text-base font-black text-slate-900">¥{task.totalPrice}</div>
                                    </div>
                                    <div>
                                        <div className="mb-1 text-[10px] text-slate-400">预计佣金</div>
                                        <div className="text-base font-black text-success-500">+{task.userReward}+{(task.userDivided / task.num).toFixed(2)}</div>
                                    </div>
                                </div>
                                <button onClick={() => addTask(index)} className="w-full rounded-[16px] bg-primary-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-600/20 transition-transform active:scale-95 hover:bg-primary-700">添加任务单</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && tasks.length > 0 && (
                    <div className="mt-8 text-center">
                        <div className="mb-3 text-xs font-medium text-slate-400/80">共 {total} 条数据</div>
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                    className={cn('h-10 w-10 text-xl flex items-center justify-center rounded-xl bg-white shadow-sm font-bold transition-all', currentPage === 1 ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-600 active:scale-95')}>←</button>
                                <span className="text-sm font-black text-slate-900 bg-white px-4 py-2 rounded-xl shadow-sm">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                    className={cn('h-10 w-10 text-xl flex items-center justify-center rounded-xl bg-white shadow-sm font-bold transition-all', currentPage === totalPages ? 'opacity-50 cursor-not-allowed text-slate-300' : 'text-slate-600 active:scale-95')}>→</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
