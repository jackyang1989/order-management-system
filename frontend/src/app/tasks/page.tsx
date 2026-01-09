'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../lib/utils';
import { isAuthenticated, getToken } from '../../services/authService';
import BottomNav from '../../components/BottomNav';
import { fetchSystemConfig, getEnabledTaskTypes } from '../../services/systemConfigService';
import { TASK_TYPE_NAMES, getFilteredTaskPlatforms } from '../../constants/platformConfig';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

const TASK_TYPE_OPTIONS = [
    { value: 0, label: '全部' }, { value: 1, label: '关键词' }, { value: 2, label: '淘口令' },
    { value: 3, label: '二维码' }, { value: 4, label: '直通车' }, { value: 5, label: '通道任务' },
];

const TERMINAL_OPTIONS = [{ value: 1, label: '本佣货返' }, { value: 2, label: '本立佣货' }];

const PRICE_OPTIONS = [
    { value: '', label: '全部价格' }, { value: 1, label: '0-200' }, { value: 2, label: '200-500' },
    { value: 3, label: '500-1000' }, { value: 4, label: '1000-2000' }, { value: 5, label: '>2000' },
];

interface BuynoItem { id: string; platformAccount: string; count: number; }
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
    const [op2count, setOp2count] = useState('');
    const [defaultDate, setDefaultDate] = useState('');
    const [defaultDate2, setDefaultDate2] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

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
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-20 mx-auto max-w-[515px] border-b border-slate-200 bg-white">
                <div className="flex h-14 items-center px-4">
                    <button onClick={() => router.back()} className="mr-4 text-slate-600">←</button>
                    <h1 className="flex-1 text-base font-medium text-slate-800">任务大厅</h1>
                </div>
            </header>

            <div className="px-4 pb-24 pt-4">
                {/* Filters */}
                <div className="mx-4 mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="mb-3">
                        <div className="mb-1.5 text-xs text-slate-500">选择买号</div>
                        <select value={value2} onChange={(e) => selectChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            <option value="">请选择买号</option>
                            {buynos.map(b => <option key={b.id} value={b.id}>{b.platformAccount}</option>)}
                        </select>
                        {op2count && <div className="mt-1.5 text-xs text-warning-400">今日可接 {op2count} 单</div>}
                    </div>
                    <div className="mb-3">
                        <div className="mb-1.5 text-xs text-slate-500">返款方式</div>
                        <select value={value4} onChange={(e) => setValue4(e.target.value ? Number(e.target.value) : '')} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            <option value="">请选择</option>
                            {TERMINAL_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <div className="mb-1.5 text-xs text-slate-500">平台筛选</div>
                        <select value={platformFilter} onChange={(e) => { setPlatformFilter(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            {platformOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <div className="mb-1.5 text-xs text-slate-500">任务类型</div>
                        <select value={value3} onChange={(e) => { setValue3(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            {TASK_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div className="mb-3">
                        <div className="mb-1.5 text-xs text-slate-500">任务价格</div>
                        <select value={value5} onChange={(e) => { setValue5(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700">
                            {PRICE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-warning-500">当日只可以接同一个商家的1单任务</div>
                </div>

                {/* Task List */}
                <div className="mt-4 space-y-3 px-4">
                    {loading ? (
                        <div className="rounded-xl bg-white py-12 text-center text-slate-400">加载中...</div>
                    ) : tasks.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
                            <div className="mb-3 text-4xl">📋</div>
                            <div className="text-sm text-slate-400">暂无数据</div>
                        </div>
                    ) : (
                        tasks.map((task, index) => (
                            <div key={task.id} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="mb-2 flex justify-between text-sm text-slate-500">
                                    <span>ID：<span className="text-slate-700">{task.randNum}</span></span>
                                    <span>商家：<span className="text-slate-700">{task.sellerName?.substring(0, 4)}...</span></span>
                                </div>
                                <div className="mb-3 flex justify-between text-sm text-slate-500">
                                    <span>垫付资金：<span className="font-medium text-primary-500">¥{task.totalPrice}</span></span>
                                    <span>佣金：<span className="font-medium text-success-400">{task.userReward}+{(task.userDivided / task.num).toFixed(2)}</span></span>
                                </div>
                                <button onClick={() => addTask(index)} className="w-full rounded-lg bg-green-500 py-2.5 text-sm font-medium text-white">添加任务单</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {!loading && tasks.length > 0 && (
                    <div className="mt-4 text-center pb-4">
                        <div className="mb-2 text-xs text-slate-400">共 {total} 条</div>
                        {totalPages > 1 && (
                            <div className="flex justify-center gap-2">
                                <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
                                    className={cn('rounded-lg border px-3 py-1.5 text-sm', currentPage === 1 ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white text-slate-700')}>上一页</button>
                                <span className="px-3 py-1.5 text-sm text-slate-500">{currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
                                    className={cn('rounded-lg border px-3 py-1.5 text-sm', currentPage === totalPages ? 'border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-200 bg-white text-slate-700')}>下一页</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomNav />
        </div>
    );
}
