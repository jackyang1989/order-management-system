'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';

// ===================== 类型定义 =====================
interface TaskData {
    taskBianHao: string;
    zhongDuan: string;    // 返款方式
    time: string;
    type: string;
    taskTime: string;     // 任务截止时间
    principal: string;    // 垫付本金
    taskNum: string;      // 任务编号
    title: string;
    content: string;
    img: string;
    video: string;
    maiHao: string;
    kuaiDi: string;
    danHao: string;
    price: string;
}

// ===================== 主组件 =====================
export default function PresalePaymentPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    // ===================== 状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [taskId, setTaskId] = useState('');
    const [dialogVisible, setDialogVisible] = useState(false);
    const [testData, setTestData] = useState<TaskData[]>([]);
    const [ystime, setYstime] = useState(''); // 尾款时间
    const [alertNum, setAlertNum] = useState(0);

    // 弹框表单数据
    const [inputValue, setInputValue] = useState(''); // 订单号
    const [inputNumber, setInputNumber] = useState(''); // 付款金额
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);

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

    // 文件转Base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // 处理文件选择
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const content = await fileToBase64(file);
            setLocalFile({ file, content });
        }
    };

    // 删除图片
    const handleRemove = () => {
        setLocalFile(null);
    };

    // ===================== API 调用 =====================
    // 获取任务数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/presale-details`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const res = await response.json();

            if (res.success) {
                const data = res.data;
                setTaskId(data.id || id);
                setYstime(data.endingTime || '');
                setAlertNum(data.sellerPrincipal || 0);

                // 构建 testData
                setTestData([{
                    taskBianHao: data.taskNumber || '',
                    zhongDuan: data.terminal || '',
                    time: data.createdAt || '',
                    type: data.taskType || '',
                    taskTime: data.endingTime || '',
                    principal: data.principal || '',
                    taskNum: data.taskNumber || '',
                    title: data.productName || '',
                    content: '',
                    img: '',
                    video: '',
                    maiHao: data.buynoAccount || '',
                    kuaiDi: data.delivery || '',
                    danHao: data.deliveryNum || '',
                    price: data.sellerPrincipal || '',
                }]);
            } else {
                alertError(res.message || '获取任务数据失败');
            }
        } catch (error) {
            console.error('获取任务数据失败:', error);
            alertError('获取任务数据失败');
        } finally {
            setLoading(false);
        }
    }, [id, getToken, alertError]);

    // 验证付款金额
    const inputchange = async () => {
        const formattedNumber = Number(inputNumber).toFixed(2);
        setInputNumber(formattedNumber);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/validate-final-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    amount: parseFloat(formattedNumber),
                }),
            });
            const data = await response.json();
            if (!data.success) {
                alertError(data.message);
                setTimeout(() => setInputNumber(''), 3000);
            }
        } catch (error) {
            alertError('验证失败');
        }
    };

    // 确认上传尾款截图
    const dialogConfirm = async () => {
        if (!inputValue) {
            alertError('请填写订单号！');
            return;
        }
        if (!inputNumber) {
            alertError('请填写金额！');
            return;
        }
        if (!localFile) {
            alertError('请上传好评截图！');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/presale/submit-final`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    screenshot: localFile.content,
                    orderNo: inputValue,
                    paymentAmount: inputNumber,
                }),
            });
            const data = await response.json();

            if (data.success) {
                setDialogVisible(false);
                alertSuccess(data.message);
                setTimeout(() => {
                    router.push(data.redirectUrl || '/orders');
                }, 3000);
            } else {
                alertError(data.message);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 取消任务
    const handleQuXiao = () => {
        router.push('/orders');
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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>待处理事项</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 标题 */}
            <div style={{ background: '#fff', padding: '12px 15px', marginBottom: '10px' }}>
                <span style={{ color: '#409eff', fontWeight: 'bold' }}>待处理事项</span>
            </div>

            {/* 任务卡片 */}
            {testData.length > 0 ? (
                testData.map((item, index) => (
                    <div key={index} style={{ background: '#fff', margin: '0 10px 10px', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '15px' }}>
                            {/* 任务信息 */}
                            <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>返款方式：</span><span>{item.zhongDuan}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>接手买号：</span><span>{item.taskBianHao}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>任务类型：</span><span>{item.type}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>任务截止时间：</span><span>{item.taskTime}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>垫付本金(元)：</span><span>{item.principal}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span>任务编号：</span><span>{item.taskNum}</span>
                                </div>
                            </div>
                        </div>

                        {/* 操作区域 */}
                        <div style={{
                            background: 'linear-gradient(to bottom, #f0f0f0, #fff)',
                            padding: '15px',
                            display: 'flex',
                            justifyContent: 'flex-end',
                        }}>
                            <span style={{ marginRight: '10px', color: '#666' }}>操作：</span>
                            <button
                                onClick={handleQuXiao}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#f56c6c',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                }}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <div style={{ background: '#fff', margin: '0 10px 10px', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#999' }}>
                    暂无内容
                </div>
            )}

            {/* 尾款时间 */}
            {ystime && (
                <div style={{ textAlign: 'center', fontSize: '14px', color: '#666', margin: '15px 0' }}>
                    尾款时间：{ystime}
                </div>
            )}

            {/* 上传尾款截图按钮 */}
            <div style={{ padding: '0 15px', marginBottom: '15px', textAlign: 'right' }}>
                <button
                    onClick={() => setDialogVisible(true)}
                    style={{
                        padding: '10px 20px',
                        background: '#f56c6c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                    }}
                >
                    上传尾款截图
                </button>
            </div>

            {/* 提示信息 */}
            <div style={{ background: '#fff3cd', margin: '10px', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontSize: '13px', color: '#856404', lineHeight: '1.8' }}>
                    <p>1. 商家订单要求：注意自己的号，注意自己的号，注意自己的号！最近查的比较紧，不要影响彼此之间的账号安全！无需联系客服，提交订单先不付款，到首页看同款【注意：在同款详情页里至少看1-2分钟】在回来对比下付款！</p>
                    <p>2. 未按指定文字好评，图片好评，将扣除10银锭</p>
                    <p>3. 评价环节，胡乱评价、复制他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，将下架买号一个月</p>
                    <p>4. 请复制以上指定内容到淘宝进行评价</p>
                    <p>5. 无指定好评可根据商品15字左右自由发挥</p>
                </div>
            </div>

            {/* 上传图片弹框 */}
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
                        maxHeight: '80vh',
                        overflowY: 'auto',
                    }}>
                        <h3 style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>温馨提示</h3>

                        {/* 订单号 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>1. 填写当前订单信息</p>
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginBottom: '10px' }}>*如任务商品拍下后产生2个订单号，请将2个订单号同时填写到下方，两个订单号中间用减号&apos;-&apos;隔开。</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>订单号：</span>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="请输入内容"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        {/* 付款金额 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>2. 填写实际付款金额</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>付款金额：</span>
                                <input
                                    type="number"
                                    value={inputNumber}
                                    onChange={(e) => setInputNumber(e.target.value)}
                                    onBlur={inputchange}
                                    placeholder="请输入金额"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginTop: '5px' }}>*实际付款金额不得超过或者小于订单金额100元</p>
                        </div>

                        {/* 上传截图 */}
                        <div style={{ marginBottom: '20px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '10px' }}>3. 请上传好评截图：</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile && (
                                <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                    <img
                                        src={localFile.content}
                                        alt="预览"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                    />
                                    <button
                                        onClick={handleRemove}
                                        style={{
                                            position: 'absolute',
                                            top: '-8px',
                                            right: '-8px',
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            background: '#f56c6c',
                                            color: 'white',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setDialogVisible(false);
                                    setLocalFile(null);
                                    setInputValue('');
                                    setInputNumber('');
                                }}
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
                                onClick={dialogConfirm}
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
                                {submitting ? '提交中...' : '确认'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
