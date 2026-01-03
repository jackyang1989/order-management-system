'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../services/authService';
import BottomNav from '../../components/BottomNav';

// 对齐旧版 API 基础路径
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================
// 对齐旧版 task/index.html 选项
// ========================

// 平台 options1 - 对齐旧版 value1
const PLATFORM_OPTIONS = [
    { value: 0, label: '全部' },
    { value: 1, label: '天猫' },
    { value: 2, label: '淘宝' },
];

// 任务类型 options3 - 对齐旧版 value3 (含通道任务)
const TASK_TYPE_OPTIONS = [
    { value: 0, label: '全部' },
    { value: 1, label: '关键词' },
    { value: 2, label: '淘口令' },
    { value: 3, label: '二维码' },
    { value: 4, label: '直通车' },
    { value: 5, label: '通道任务' },
];

// 返款方式 options4 - 对齐旧版 value4
const TERMINAL_OPTIONS = [
    { value: 1, label: '本佣货返' },
    { value: 2, label: '本立佣货' },
];

// 价格区间 options5 - 对齐旧版 value5 (补齐价格筛选)
const PRICE_OPTIONS = [
    { value: '', label: '全部价格' },
    { value: 1, label: '0-200' },
    { value: 2, label: '200-500' },
    { value: 3, label: '500-1000' },
    { value: 4, label: '1000-2000' },
    { value: 5, label: '>2000' },
];

// 买号类型
interface BuynoItem {
    id: string;
    wwid: string;
    count: number;  // 今日可接单数
}

// 任务类型
interface TaskItem {
    id: string;
    rand_num: string;
    task_number: string;
    seller_name: string;
    mobile: string;
    total_price: number;
    user_reward: number;
    user_divided: number;
    num: number;
    progress: string;
}

export default function TasksPage() {
    const router = useRouter();
    const [tasks, setTasks] = useState<TaskItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buynos, setBuynos] = useState<BuynoItem[]>([]);

    // ========================
    // 筛选状态 - 完全对齐旧版参数名
    // ========================
    const [value1, setValue1] = useState<number | string>('');  // 平台
    const [value2, setValue2] = useState('');  // 买号ID
    const [value3, setValue3] = useState<number | string>('');  // 任务类型
    const [value4, setValue4] = useState<number | string>('');  // 返款方式
    const [value5, setValue5] = useState<number | string>('');  // 价格区间 (补齐)
    const [op2count, setOp2count] = useState('');  // 今日可接单数

    // 日期筛选 - 对齐旧版
    const [defaultDate, setDefaultDate] = useState('');
    const [defaultDate2, setDefaultDate2] = useState('');

    // 分页 - 对齐旧版
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadBuynos();
        getData();
    }, []);

    // 当筛选条件变化时重新加载
    useEffect(() => {
        if (!loading) {
            getData();
        }
    }, [value3, value4, value5, currentPage]);

    // ========================
    // 加载买号列表 - 对齐旧版 options2
    // ========================
    const loadBuynos = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/buynolist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.code === 1) {
                setBuynos(data.data || []);
                // 自动选择第一个买号
                if (data.data && data.data.length > 0) {
                    setValue2(data.data[0].id);
                    setOp2count(data.data[0].count);
                }
            }
        } catch (error) {
            console.error('Load buynos error:', error);
        }
    };

    // ========================
    // 获取任务列表 - 完全对齐旧版 getData
    // POST mobile/task/index
    // 参数: page, datetime1, datetime2, task_type, buyno_id, terminal, getprice
    // ========================
    const getData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/index`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    page: currentPage,
                    datetime1: defaultDate,
                    datetime2: defaultDate2,
                    task_type: value3,
                    buyno_id: value2,
                    terminal: value4,
                    getprice: value5,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                const list = data.data?.list || [];
                // 添加 progress 百分号
                for (let i = 0; i < list.length; i++) {
                    list[i].progress = parseInt(list[i].progress) + '%';
                }
                setTasks(list);
                setTotal(data.data?.total || 0);
            } else {
                alertError(data.msg || '获取任务失败');
            }
        } catch (error) {
            console.error('Failed to load tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    // 买号选择变化 - 对齐旧版 selectChange
    const selectChange = (val: string) => {
        setValue2(val);
        for (let i = 0; i < buynos.length; i++) {
            if (buynos[i].id === val) {
                setOp2count(String(buynos[i].count));
            }
        }
    };

    // 搜索 - 对齐旧版 search
    const search = () => {
        setCurrentPage(1);
        getData();
    };

    // 分页事件 - 对齐旧版 pageChange
    const pageChange = (val: number) => {
        setCurrentPage(val);
    };

    // ========================
    // 添加任务单 - 对齐旧版 addTask
    // POST mobile/task/get_task
    // 参数: task_number, buyno_id, commission, total_price, terminal, user_divided
    // ========================
    const addTask = async (index: number) => {
        if (!value2) {
            alertError('请先选择买号');
            return;
        }
        if (!value4) {
            alertError('请先选择返款方式');
            return;
        }

        if (confirm('是否添加此任务？')) {
            try {
                const task = tasks[index];
                const token = getToken();
                const response = await fetch(`${BASE_URL}/mobile/task/get_task`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        task_number: task.task_number,
                        buyno_id: value2,
                        commission: task.user_reward,
                        total_price: task.total_price,
                        terminal: value4,
                        user_divided: task.user_divided,
                    }),
                });
                const data = await response.json();

                if (data.code === 1) {
                    alertSuccess(data.msg || '添加任务成功');
                    setTimeout(() => {
                        if (data.url) {
                            router.push(data.url);
                        } else {
                            getData();
                        }
                    }, 3000);
                } else {
                    alertError(data.msg || '添加任务失败');
                }
            } catch (error) {
                alertError('网络错误');
            }
        }
    };

    // 计算总页数
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 - 对齐旧版 page-header */}
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>任务大厅</div>
                    <div style={{ width: '24px' }}></div>
                </div>
            </div>

            {/* 筛选区 - 对齐旧版 task-admin */}
            <div style={{
                background: '#fff',
                padding: '16px',
                marginBottom: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}>
                {/* 选择买号 */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>选择买号：</div>
                    <select
                        value={value2}
                        onChange={(e) => selectChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e5e5e5',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">请选择买号</option>
                        {buynos.map(b => (
                            <option key={b.id} value={b.id}>{b.wwid}</option>
                        ))}
                    </select>
                    {/* 今日可接单数展示 - 补齐 */}
                    {op2count && (
                        <div style={{ fontSize: '12px', color: '#ff9500', marginTop: '6px' }}>
                            今日可接 {op2count} 单
                        </div>
                    )}
                </div>

                {/* 返款方式 */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>返款方式：</div>
                    <select
                        value={value4}
                        onChange={(e) => { setValue4(e.target.value ? Number(e.target.value) : ''); }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e5e5e5',
                            fontSize: '14px'
                        }}
                    >
                        <option value="">请选择</option>
                        {TERMINAL_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 任务类型 */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>任务类型：</div>
                    <select
                        value={value3}
                        onChange={(e) => { setValue3(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e5e5e5',
                            fontSize: '14px'
                        }}
                    >
                        {TASK_TYPE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 价格区间 - 补齐 */}
                <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>任务价格：</div>
                    <select
                        value={value5}
                        onChange={(e) => { setValue5(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                        style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #e5e5e5',
                            fontSize: '14px'
                        }}
                    >
                        {PRICE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                {/* 提示信息 */}
                <div style={{
                    padding: '10px',
                    background: '#fff5e6',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#ff9500'
                }}>
                    当日只可以接同一个商家的1单任务
                </div>
            </div>

            {/* 任务列表 - 对齐旧版 public-accept-mask-box */}
            <div style={{ padding: '0 12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : tasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px',
                        fontSize: '14px',
                        color: '#999',
                        background: '#fff',
                        borderRadius: '12px'
                    }}>
                        暂无数据
                    </div>
                ) : (
                    tasks.map((task, index) => (
                        <div key={task.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            {/* 任务信息 - 对齐旧版 public-accept-mask-show */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '10px',
                                fontSize: '13px',
                                color: '#666'
                            }}>
                                <span>ID：<span style={{ color: '#333' }}>{task.rand_num}</span></span>
                                <span>商家：<span style={{ color: '#333' }}>{task.seller_name?.substring(0, 4)}...</span></span>
                            </div>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginBottom: '10px',
                                fontSize: '13px',
                                color: '#666'
                            }}>
                                <span>垫付资金：<span style={{ color: '#409eff', fontWeight: '600' }}>¥{task.total_price}</span></span>
                                <span>佣金：<span style={{ color: '#07c160', fontWeight: '600' }}>
                                    {task.user_reward}+{(task.user_divided / task.num).toFixed(2)}
                                </span></span>
                            </div>

                            {/* 添加任务按钮 */}
                            <button
                                onClick={() => addTask(index)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: '#07c160',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                添加任务单
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* 分页 - 对齐旧版 public-page */}
            {!loading && tasks.length > 0 && (
                <div style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                        共 {total} 条
                    </div>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                                onClick={() => pageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                                    color: currentPage === 1 ? '#999' : '#333',
                                    fontSize: '14px',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >
                                上一页
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => pageChange(pageNum)}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            border: currentPage === pageNum ? 'none' : '1px solid #e5e5e5',
                                            background: currentPage === pageNum ? '#409eff' : '#fff',
                                            color: currentPage === pageNum ? '#fff' : '#333',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            minWidth: '36px'
                                        }}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => pageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e5e5',
                                    background: currentPage === totalPages ? '#f5f5f5' : '#fff',
                                    color: currentPage === totalPages ? '#999' : '#333',
                                    fontSize: '14px',
                                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </div>
            )}

            <BottomNav />
        </div>
    );
}
