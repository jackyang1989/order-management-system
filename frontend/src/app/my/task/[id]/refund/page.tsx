'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../../apiConfig';

// ===================== 类型定义 =====================
interface TaskData {
    img2: string;       // 商品图片
    name2: string;      // 商品名称
    taskBianHao: string; // 任务编号
    time: string;       // 接单时间
    type: string;       // 任务类型
    maiHao: string;     // 买号
    kuaiDi: string;     // 快递
    danHao: string;     // 快递单号
    price: string;      // 付款金额
}

// ===================== 主组件 =====================
export default function RefundPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    // ===================== 状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [task_id, setTaskId] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [testData, setTestData] = useState<TaskData[]>([]);
    const [alertNum, setAlertNum] = useState(0); // 返款金额

    // ===================== 工具函数 =====================
    const getToken = useCallback(() => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('token');
    }, []);

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // ===================== API 调用 =====================
    // 获取任务数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/shoukuan`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ id }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                setTaskId(data.list?.id || id);
                setAlertNum(data.list?.seller_principal || 0);

                // 构建 testData
                if (data.product && Array.isArray(data.product)) {
                    const taskList: TaskData[] = data.product.map((vo: any) => ({
                        img2: vo.pc_img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${vo.pc_img}` : '',
                        name2: vo.name || '',
                        taskBianHao: data.list?.task_number || '',
                        time: data.list?.create_time || '',
                        type: data.list?.task_type || '',
                        maiHao: data.list?.wwid || '',
                        kuaiDi: data.list?.delivery || '',
                        danHao: data.list?.delivery_num || '',
                        price: data.list?.seller_principal || '',
                    }));
                    setTestData(taskList);
                } else if (data.list) {
                    // 单条数据情况
                    setTestData([{
                        img2: data.list.pc_img ? `https://b--d.oss-cn-guangzhou.aliyuncs.com${data.list.pc_img}` : '',
                        name2: data.list.name || '',
                        taskBianHao: data.list.task_number || '',
                        time: data.list.create_time || '',
                        type: data.list.task_type || '',
                        maiHao: data.list.wwid || '',
                        kuaiDi: data.list.delivery || '',
                        danHao: data.list.delivery_num || '',
                        price: data.list.seller_principal || '',
                    }]);
                }
            } else {
                alertError(res.msg || '获取任务数据失败');
            }
        } catch (error) {
            console.error('获取任务数据失败:', error);
            alertError('获取任务数据失败');
        } finally {
            setLoading(false);
        }
    }, [id, getToken, alertError]);

    // 确认返款
    const confirmRefund = async () => {
        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/confirm_refund`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    id: task_id,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    router.push(data.url || '/orders');
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('确认返款失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 点击确认返款按钮
    const handleConfirmClick = () => {
        setDialogVisible(true);
    };

    // ===================== 副作用 =====================
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        getData();
    }, [getData, getToken, router]);

    // ===================== 渲染 =====================
    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                加载中...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 100,
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', width: '30px' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>待确认返款</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 标题 */}
            <div style={{ background: '#fff', padding: '12px 15px', marginBottom: '10px' }}>
                <span style={{ color: '#409eff', fontWeight: 'bold' }}>待确认返款</span>
            </div>

            {/* 任务内容 */}
            {testData.map((item, index) => (
                <div key={index}>
                    {/* 任务基本信息卡片 */}
                    <div style={{ background: '#fff', margin: '0 10px 10px', borderRadius: '8px', padding: '15px' }}>
                        {/* 任务编号 */}
                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
                            任务编号：{item.taskBianHao}
                        </div>

                        {/* 任务类型和买号 */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                            <span>任务类型：<b style={{ color: '#333' }}>{item.type}</b></span>
                            <span>买号：<b style={{ color: '#333' }}>{item.maiHao}</b></span>
                        </div>

                        {/* 商品信息 */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '15px' }}>
                            {item.img2 && (
                                <img
                                    src={item.img2}
                                    alt="商品图片"
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                    }}
                                />
                            )}
                            <div style={{ flex: 1 }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: '#333',
                                    lineHeight: '1.5',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                }}>
                                    {item.name2}
                                </p>
                            </div>
                        </div>

                        {/* 接单时间 */}
                        <div style={{ fontSize: '13px', color: '#666' }}>
                            接单时间：{item.time}
                        </div>
                    </div>

                    {/* 快递信息卡片 */}
                    <div style={{ background: '#fff', margin: '0 10px 10px', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#666' }}>
                            <span>快递：<b style={{ color: '#333' }}>{item.kuaiDi}</b></span>
                            <span>快递单号：<b style={{ color: '#333' }}>{item.danHao}</b></span>
                        </div>
                    </div>
                </div>
            ))}

            {/* 确认返款按钮 */}
            <div style={{ padding: '0 15px', marginTop: '20px' }}>
                <button
                    onClick={handleConfirmClick}
                    style={{
                        width: '100%',
                        padding: '12px',
                        background: '#409eff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    确认返款
                </button>
            </div>

            {/* 确认返款弹框 */}
            {dialogVisible && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        padding: '20px',
                    }}>
                        <h3 style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>温馨提示</h3>

                        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                            <p style={{ fontSize: '14px', color: '#666' }}>点击确认立即到账</p>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setDialogVisible(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: '#ddd',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmRefund}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: submitting ? '#a0cfff' : '#409eff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {submitting ? '处理中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
