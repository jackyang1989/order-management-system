'use client';

import { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated, getToken } from '../../services/authService';
import BottomNav from '../../components/BottomNav';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// ========================

// ========================

// 任务状态 options1 - 对齐旧版 value1
const STATUS_OPTIONS = [
    { value: '', label: '全部状态' },
    { value: '1', label: '已打印快递单，待发货' },
    { value: '2', label: '已发货，待确认收货' },
    { value: '3', label: '已确认收货，待商家返款' },
    { value: '4', label: '商家已返款，待确认返款' },
    { value: '5', label: '已完成' },
    { value: '6', label: '已超时' },
    { value: '7', label: '已取消' },
    { value: '8', label: '自动放弃' },
];

// 任务类型 options3 - 对齐旧版 value3 (含通道任务)
const TASK_TYPE_OPTIONS = [
    { value: 0, label: '全部' },
    { value: 1, label: '关键词' },
    { value: 2, label: '淘口令' },
    { value: 3, label: '二维码' },
    { value: 4, label: '直通车' },
    { value: 5, label: '通道任务' },  // 补齐通道任务
];

// 返款方式 options4 - 对齐旧版 value4
const REFUND_TYPE_OPTIONS = [
    { value: '', label: '全部' },
    { value: '3', label: '全部' },
    { value: '2', label: '本立佣货' },
    { value: '1', label: '本佣货返' },
];

// 追评任务状态 options5 - 对齐旧版 value5
const REVIEW_STATUS_OPTIONS = [
    { value: '', label: '全部追评' },
    { value: '1', label: '待处理追评任务' },
    { value: '2', label: '待返款追评任务' },
    { value: '3', label: '已完成追评任务' },
    { value: '4', label: '已拒接追评任务' },
];

// 订单数据类型
interface OrderItem {
    id: string;
    task_number: string;
    shop_name: string;
    shop_img: string;
    type: string;
    task_type: string;
    main_product_name: string;
    main_product_pc_img: string;
    state: string;
    index_state: string;
    wwid: string;
    commission: number;
    user_divided: number;
    user_principal: number;
    create_time: string;
    progress: string;
    review_task_id?: string;
    checked?: boolean;
}

// 买号数据类型
interface BuynoItem {
    id: string;
    wwid: string;
}

// 内部组件，使用 useSearchParams
function OrdersPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [buynos, setBuynos] = useState<BuynoItem[]>([]);

    // ========================
    // 筛选状态 - 完全对齐旧版参数名
    // ========================
    const [value1, setValue1] = useState(searchParams.get('status') || ''); // 任务状态 choose_a
    const [value2, setValue2] = useState(''); // 买号 buyno
    const [value3, setValue3] = useState<number | string>(''); // 任务类型 task_type
    const [value4, setValue4] = useState(''); // 返款方式 terminal
    const [value5, setValue5] = useState(''); // 追评任务 zhuipin
    const [indexorder, setIndexorder] = useState(''); // 搜索任务编号
    const [showFilters, setShowFilters] = useState(false);

    // 日期筛选 - 对齐旧版 datetime1, datetime2
    const [datetime1, setDatetime1] = useState('');
    const [datetime2, setDatetime2] = useState('');

    // 分页 - 对齐旧版真实分页
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const pageSize = 10;

    // 批量选择 - 对齐旧版 arrchecedk
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // 按钮文字 - 对齐旧版 buttonvalue
    const [buttonvalue, setButtonvalue] = useState('查看详情');
    const [buttonvalue2] = useState('去追评');

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
            }
        } catch (error) {
            console.error('Load buynos error:', error);
        }
    };

    // ========================
    // 获取数据 - 完全对齐旧版 getData
    // POST mobile/my/taskmanagement
    // 参数: page, datetime1, datetime2, choose_a, buyno, task_type, terminal, zhuipin, indexorder
    // ========================
    const getData = async (date1?: string, date2?: string) => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/taskmanagement`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    page: currentPage,
                    datetime1: date1 || datetime1,
                    datetime2: date2 || datetime2,
                    choose_a: value1,
                    buyno: value2,
                    task_type: value3,
                    terminal: value4,
                    zhuipin: value5,
                    indexorder: indexorder,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                const list = data.data?.list || [];
                // 添加 progress 百分号
                for (let i = 0; i < list.length; i++) {
                    list[i].progress = list[i].progress + '%';
                }
                setOrders(list);
                setTotal(data.data?.total || 0);
            } else {
                alertError(data.msg || '获取数据失败');
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    // 搜索 - 对齐旧版 searchOrder
    const searchOrder = () => {
        setCurrentPage(1);
        getData();
    };

    // 任务状态变化 - 对齐旧版 getChooseValue
    const getChooseValue = (value: string) => {
        setValue5(''); // 清除追评筛选
        setValue1(value);
        setCurrentPage(1);

        // 更新按钮文字
        if (value === '4') {
            setButtonvalue('确认返款');
        } else if (value === '2') {
            setButtonvalue('去收货');
        } else {
            setButtonvalue('查看详情');
        }
    };

    // 追评任务变化 - 对齐旧版 getZhuiPingValue
    const getZhuiPingValue = (value: string) => {
        setValue1(''); // 清除状态筛选
        setValue5(value);
        setCurrentPage(1);

        if (value === '1') {
            setButtonvalue('拒接任务');
        } else {
            setButtonvalue('查看详情');
        }
    };

    // 分页事件 - 对齐旧版 pageChange
    const pageChange = (val: number) => {
        setCurrentPage(val);
    };

    // 当筛选条件变化时重新加载
    useEffect(() => {
        if (!loading) {
            getData();
        }
    }, [value1, value2, value3, value4, value5, currentPage]);

    // 全选 - 对齐旧版 setCheckedAll
    const handleSelectAll = () => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        if (newSelectAll) {
            setSelectedIds(orders.map(o => o.id));
            // 更新每个订单的 checked 状态
            setOrders(orders.map(o => ({ ...o, checked: true })));
        } else {
            setSelectedIds([]);
            setOrders(orders.map(o => ({ ...o, checked: false })));
        }
    };

    // 单选 - 对齐旧版 setCheckedItem
    const handleSelectOrder = (orderId: string) => {
        const newOrders = orders.map(o => {
            if (o.id === orderId) {
                return { ...o, checked: !o.checked };
            }
            return o;
        });
        setOrders(newOrders);

        const checkedIds = newOrders.filter(o => o.checked).map(o => o.id);
        setSelectedIds(checkedIds);
        setSelectAll(checkedIds.length === orders.length);
    };

    // ========================
    // 批量确认返款 - 对齐旧版 allfankuan
    // ========================
    const handleBatchConfirmRefund = async () => {
        if (selectedIds.length === 0) {
            alertError('请选择要确认返款的订单');
            return;
        }

        try {
            const token = getToken();
            // 先获取返款金额
            const principalRes = await fetch(`${BASE_URL}/mobile/task/all_seller_principal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ taskid: selectedIds }),
            });
            const principalData = await principalRes.json();

            if (principalData.code === 1) {
                if (confirm(`商家确认返款金额为: ${principalData.data.principal}，是否确认？`)) {
                    // 确认返款
                    const res = await fetch(`${BASE_URL}/mobile/task/allfankuan`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ taskid: selectedIds }),
                    });
                    const data = await res.json();

                    if (data.code === 1) {
                        alertSuccess(data.msg || '返款成功');
                        setTimeout(() => {
                            if (data.url) {
                                router.push(data.url);
                            } else {
                                getData();
                            }
                        }, 3000);
                    } else {
                        alertError(data.msg || '返款失败');
                    }
                }
            } else {
                alertError(principalData.msg || '获取返款金额失败');
            }
        } catch (error) {
            alertError('网络错误');
        }
    };

    // ========================
    // 查看详情/去收货/确认返款 - 对齐旧版 chooseTiao
    // ========================
    const chooseTiao = (id: string) => {
        const val = value1;
        if (val === '4') {
            router.push(`/orders/${id}?action=shoukuan`);
        } else if (val === '2') {
            router.push(`/orders/${id}?action=shouhuo`);
        } else {
            router.push(`/orders/${id}`);
        }
    };

    // ========================
    // 去追评 - 对齐旧版 chooseTiao2 和 goZhuiPin
    // ========================
    const chooseTiao2 = async (review_task_id: string) => {
        if (value5 === '1') {
            // 拒接任务
            if (confirm('您确定要拒接任务吗？')) {
                try {
                    const token = getToken();
                    const res = await fetch(`${BASE_URL}/mobile/my/refuse_zhuipin`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ id: review_task_id }),
                    });
                    const data = await res.json();

                    if (data.code === 1) {
                        alertSuccess(data.msg || '已拒接');
                        setTimeout(() => {
                            if (data.url) {
                                router.push(data.url);
                            } else {
                                getData();
                            }
                        }, 3000);
                    } else {
                        alertError(data.msg || '操作失败');
                    }
                } catch (error) {
                    alertError('网络错误');
                }
            }
        } else {
            router.push(`/orders/zhuipin/${review_task_id}`);
        }
    };

    // 去追评详情
    const goZhuiPin = (review_task_id: string) => {
        router.push(`/orders/zhuipin/${review_task_id}`);
    };

    // 默认按钮文字 - 对齐旧版 defaultBtn
    const defaultBtn = (index_state: string) => {
        if (index_state === '4') {
            return '确认返款';
        } else if (index_state === '2') {
            return '去收货';
        } else {
            return '查看详情';
        }
    };

    // 默认按钮点击 - 对齐旧版 defaultBtnClick
    const defaultBtnClick = (index_state: string, id: string) => {
        if (!index_state || index_state === '4') {
            router.push(`/orders/${id}?action=shoukuan`);
        } else if (index_state === '2') {
            router.push(`/orders/${id}?action=shouhuo`);
        } else {
            router.push(`/orders/${id}`);
        }
    };

    // 获取状态颜色
    const getStatusColor = (state: string) => {
        if (state.includes('完成')) return '#07c160';
        if (state.includes('取消') || state.includes('放弃') || state.includes('超时')) return '#999';
        if (state.includes('返款')) return '#ff9500';
        return '#409eff';
    };

    // 计算总页数
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: 'linear-gradient(135deg, #1d1d1f 0%, #2c2c2e 100%)',
                padding: '50px 16px 20px',
                color: '#fff'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div onClick={() => router.back()} style={{ fontSize: '24px', cursor: 'pointer' }}>‹</div>
                    <div style={{ fontSize: '18px', fontWeight: '600' }}>任务管理</div>
                    <div
                        onClick={() => setShowFilters(!showFilters)}
                        style={{ fontSize: '14px', cursor: 'pointer', opacity: 0.8 }}
                    >
                        {showFilters ? '收起' : '筛选'}
                    </div>
                </div>

                {/* 搜索框 - 对齐旧版 indexorder */}
                <div style={{
                    marginTop: '16px',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <input
                        type="text"
                        placeholder="请输入任务编号"
                        value={indexorder}
                        onChange={(e) => setIndexorder(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px',
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            outline: 'none'
                        }}
                    />
                    <button
                        onClick={searchOrder}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#ffd700',
                            color: '#1d1d1f',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        搜索
                    </button>
                </div>
            </div>

            {/* 筛选面板 - 完全对齐旧版所有筛选项 */}
            {showFilters && (
                <div style={{
                    background: '#fff',
                    padding: '16px',
                    borderBottom: '1px solid #e5e5e5'
                }}>
                    {/* 第一行：任务状态 + 任务买号 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务状态</div>
                            <select
                                value={value1}
                                onChange={(e) => getChooseValue(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            >
                                {STATUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务买号</div>
                            <select
                                value={value2}
                                onChange={(e) => { setValue2(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            >
                                <option value="">全部买号</option>
                                {buynos.map(b => (
                                    <option key={b.id} value={b.id}>{b.wwid}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* 第二行：返款方式 + 任务类型 */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>返款方式</div>
                            <select
                                value={value4}
                                onChange={(e) => { setValue4(e.target.value); setCurrentPage(1); }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            >
                                {REFUND_TYPE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务类型</div>
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
                    </div>

                    {/* 追评任务 */}
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>追评任务</div>
                        <select
                            value={value5}
                            onChange={(e) => getZhuiPingValue(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '8px',
                                border: '1px solid #e5e5e5',
                                fontSize: '14px'
                            }}
                        >
                            {REVIEW_STATUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* 日期范围筛选 - 对齐旧版 datetime1, datetime2 */}
                    <div>
                        <div style={{ fontSize: '12px', color: '#86868b', marginBottom: '8px' }}>任务起止时间</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input
                                type="date"
                                value={datetime1}
                                onChange={(e) => {
                                    setDatetime1(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            />
                            <input
                                type="date"
                                value={datetime2}
                                onChange={(e) => {
                                    setDatetime2(e.target.value);
                                    setCurrentPage(1);
                                    getData(datetime1, e.target.value);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e5e5',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* 快捷Tab切换 */}
            <div style={{
                background: '#fff',
                display: 'flex',
                overflowX: 'auto',
                borderBottom: '1px solid #e5e5e5',
                marginBottom: '10px'
            }}>
                {[
                    { key: '', label: '全部' },
                    { key: '1', label: '待发货' },
                    { key: '2', label: '待收货' },
                    { key: '3', label: '待返款' },
                    { key: '4', label: '待确认' },
                    { key: '5', label: '已完成' },
                    { key: '6', label: '已超时' },
                ].map((tab) => (
                    <div
                        key={tab.key}
                        onClick={() => getChooseValue(tab.key)}
                        style={{
                            flex: 'none',
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: value1 === tab.key ? '#409eff' : '#666',
                            borderBottom: value1 === tab.key ? '2px solid #409eff' : 'none',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {tab.label}
                    </div>
                ))}
            </div>

            {/* 批量操作栏 - 对齐旧版 value1==4 时显示 */}
            {value1 === '4' && (
                <div style={{
                    background: '#fff',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #e5e5e5',
                    marginBottom: '10px'
                }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                        <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            style={{ width: '18px', height: '18px' }}
                        />
                        全选
                    </label>
                    <button
                        onClick={handleBatchConfirmRefund}
                        disabled={selectedIds.length === 0}
                        style={{
                            padding: '8px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            background: selectedIds.length > 0 ? '#ff9500' : '#ccc',
                            color: '#fff',
                            fontWeight: '600',
                            cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed'
                        }}
                    >
                        确认返款 ({selectedIds.length})
                    </button>
                </div>
            )}

            {/* 订单列表 - 对齐旧版 taskHezi 结构 */}
            <div style={{ padding: '0 12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        加载中...
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '14px', color: '#999' }}>
                        暂无订单
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            marginBottom: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}>
                            {/* 卡片头部 - 对齐旧版 task-line */}
                            <div style={{
                                padding: '12px 16px',
                                borderBottom: '1px solid #f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {value1 === '4' && (
                                        <input
                                            type="checkbox"
                                            checked={order.checked || false}
                                            onChange={() => handleSelectOrder(order.id)}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                    )}
                                    {order.shop_img ? (
                                        <img
                                            src={order.shop_img}
                                            alt=""
                                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '8px',
                                            background: '#f5f5f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '18px'
                                        }}>
                                            🏪
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                                            {order.type}店铺：{order.shop_name?.substring(0, 3)}...
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#999' }}>
                                            任务类型：{order.task_type}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: getStatusColor(order.state),
                                    padding: '4px 10px',
                                    background: `${getStatusColor(order.state)}15`,
                                    borderRadius: '12px'
                                }}>
                                    {order.state}
                                </div>
                            </div>

                            {/* 卡片内容 - 对齐旧版 task-center 和 task-bottom */}
                            <div style={{ padding: '12px 16px' }}>
                                <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                                    任务编号：{order.task_number}
                                </div>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '8px',
                                    fontSize: '13px',
                                    color: '#666'
                                }}>
                                    <div>买号：<span style={{ color: '#333' }}>{order.wwid}</span></div>
                                    <div>
                                        佣金：<span style={{ color: '#07c160', fontWeight: '600' }}>
                                            {order.commission}+{order.user_divided}银锭
                                        </span>
                                    </div>
                                    <div>
                                        垫付资金：<span style={{ color: '#409eff', fontWeight: '600' }}>¥{order.user_principal}</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#999' }}>
                                        {order.create_time}
                                    </div>
                                </div>
                            </div>

                            {/* 卡片底部操作 - 对齐旧版按钮逻辑 */}
                            <div style={{
                                padding: '12px 16px',
                                borderTop: '1px solid #f5f5f5',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                {/* 默认按钮 - 当没有筛选时显示 */}
                                {!value5 && !value1 && (
                                    <button
                                        onClick={() => defaultBtnClick(order.index_state, order.id)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#ff9500',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {defaultBtn(order.index_state)}
                                    </button>
                                )}

                                {/* 根据条件渲染的按钮 */}
                                {(value5 || value1) && (
                                    <button
                                        onClick={() => value5 ? chooseTiao2(order.review_task_id || '') : chooseTiao(order.id)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#ff9500',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {buttonvalue}
                                    </button>
                                )}

                                {/* 去追评按钮 - 当 value5 === '1' 时显示 */}
                                {value5 === '1' && order.review_task_id && (
                                    <button
                                        onClick={() => goZhuiPin(order.review_task_id!)}
                                        style={{
                                            padding: '6px 16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#409eff',
                                            color: '#fff',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {buttonvalue2}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 分页 - 对齐旧版真实分页 */}
            {!loading && orders.length > 0 && (
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

// 导出的主组件，使用 Suspense 包装
export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f7'
            }}>
                <div style={{ color: '#86868b', fontSize: '14px' }}>加载中...</div>
            </div>
        }>
            <OrdersPageContent />
        </Suspense>
    );
}
