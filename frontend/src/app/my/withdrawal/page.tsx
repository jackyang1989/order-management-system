'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

// ===================== 类型定义 =====================
interface RecordItem {
    id: number;
    price: number;       // 收支金额
    yprice: number;      // 结余
    creata_time: string; // 日期
    memo: string;        // 备注
}

interface AdminLimit {
    user_min_money: number;     // 本金提现最低金额
    user_cash_free: number;     // 手续费
    user_fee_max_price: number; // 免手续费门槛
    user_min_reward: number;    // 银锭提现最低
    reward_price: number;       // 银锭单价
}

// ===================== 主组件 =====================
export default function WithdrawalPage() {
    const router = useRouter();

    // ===================== 状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showType, setShowType] = useState(0); // 0: 提现, 1: 本金记录
    const [dialogVisible, setDialogVisible] = useState(false);

    // 用户余额
    const [balance, setBalance] = useState(0);   // 本金余额
    const [reward, setReward] = useState(0);     // 银锭余额

    // 提现类型
    const [radio, setRadio] = useState('1');     // 1: 本金提现, 2: 银锭提现

    // 提现表单
    const [tiXianNum, setTiXianNum] = useState(0);           // 提现金额
    const [tiXianPassWordValue, setTiXianPassWordValue] = useState(''); // 提现密码
    const [daoZhangPrice, setDaoZhangPrice] = useState(0);   // 到账金额
    const [tiXianPrice, setTiXianPrice] = useState(0);       // 最低提现金额
    const [tiXianContent, setTiXianContent] = useState('');  // 提示内容

    // 管理员配置
    const [adminLimit, setAdminLimit] = useState<AdminLimit>({
        user_min_money: 100,
        user_cash_free: 1,
        user_fee_max_price: 200,
        user_min_reward: 10,
        reward_price: 1,
    });

    // 本金记录
    const [list, setList] = useState<RecordItem[]>([]);
    const [total, setTotal] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [defaultDate, setDefaultDate] = useState('');
    const [defaultDate2, setDefaultDate2] = useState('');

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

    // 计算到账金额
    const calcDaoZhang = useCallback((value: number, type: string, limit: AdminLimit) => {
        if (type === '1') {
            // 本金提现
            if (value <= limit.user_fee_max_price) {
                return parseFloat((value - limit.user_cash_free).toFixed(2));
            } else {
                return parseFloat(value.toFixed(2));
            }
        } else {
            // 银锭提现
            return parseFloat((value * limit.reward_price).toFixed(2));
        }
    }, []);

    // 收支颜色
    const filterColor = (val: number): string => {
        return val > 0 ? '#74f574' : 'red';
    };

    // ===================== API 调用 =====================
    // 获取页面数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/money/withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    page: currentPage,
                    datetime1: defaultDate,
                    datetime2: defaultDate2,
                }),
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;

                // 用户余额
                if (data.users) {
                    setBalance(data.users.balance || 0);
                    setReward(data.users.reward || 0);
                }

                // 管理员配置
                if (data.admin_limit) {
                    const limit = data.admin_limit;
                    setAdminLimit(limit);
                    setTiXianNum(limit.user_min_money);
                    setTiXianPrice(limit.user_min_money);
                    setDaoZhangPrice(calcDaoZhang(limit.user_min_money, '1', limit));
                    setTiXianContent(`本金提现${limit.user_fee_max_price}元及以下操作平台将收取 ${limit.user_cash_free}元 的手续费`);
                }

                // 本金记录
                if (data.list) {
                    setList(data.list);
                }
                if (data.total !== undefined) {
                    setTotal(data.total);
                }
            } else {
                alertError(res.msg || '获取数据失败');
            }
        } catch (error) {
            console.error('获取数据失败:', error);
            alertError('获取数据失败');
        } finally {
            setLoading(false);
        }
    }, [getToken, alertError, currentPage, defaultDate, defaultDate2, calcDaoZhang]);

    // 提现类型切换
    const radioChange = (type: string) => {
        setRadio(type);
        if (type === '1') {
            // 本金提现
            setTiXianNum(adminLimit.user_min_money);
            setTiXianPrice(adminLimit.user_min_money);
            setDaoZhangPrice(calcDaoZhang(adminLimit.user_min_money, '1', adminLimit));
            setTiXianContent(`提现本金大于${adminLimit.user_fee_max_price}元免${adminLimit.user_cash_free}元手续费.`);
        } else {
            // 银锭提现
            setTiXianNum(adminLimit.user_min_reward);
            setTiXianPrice(adminLimit.user_min_reward);
            setDaoZhangPrice(calcDaoZhang(adminLimit.user_min_reward, '2', adminLimit));
            setTiXianContent(`银锭提现按当前单价${adminLimit.reward_price}自动取整`);
        }
    };

    // 提现金额变化
    const handleChange = (value: number) => {
        setTiXianNum(value);
        setDaoZhangPrice(calcDaoZhang(value, radio, adminLimit));
    };

    // 申请提现
    const tixianActive = async () => {
        if (!tiXianPassWordValue) {
            alertError('请输入支付密码');
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/money/creat_withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    price: tiXianNum,
                    password: tiXianPassWordValue,
                    radio: radio,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogVisible(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        getData();
                    }
                }, 3000);
            } else {
                alertError(data.msg);
                if (data.url) {
                    setTimeout(() => {
                        router.push(data.url);
                    }, 3000);
                }
            }
        } catch (error) {
            alertError('提现失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 搜索记录
    const search = () => {
        setCurrentPage(1);
        getData();
    };

    // ===================== 副作用 =====================
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        getData();
    }, []);

    // 分页变化时重新获取数据
    useEffect(() => {
        if (!loading) {
            getData();
        }
    }, [currentPage]);

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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>提现</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* Tab 切换 */}
            <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => setShowType(0)}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px',
                        color: showType === 0 ? '#409eff' : '#666',
                        borderBottom: showType === 0 ? '2px solid #409eff' : 'none',
                        cursor: 'pointer',
                    }}
                >
                    提现
                </div>
                <div
                    onClick={() => setShowType(1)}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px',
                        color: showType === 1 ? '#409eff' : '#666',
                        borderBottom: showType === 1 ? '2px solid #409eff' : 'none',
                        cursor: 'pointer',
                    }}
                >
                    本金记录
                </div>
            </div>

            {/* 提现内容 */}
            {showType === 0 && (
                <div style={{ padding: '15px' }}>
                    {/* 选择提现类型 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#333' }}>选择提现：</span>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="withdrawType"
                                    value="1"
                                    checked={radio === '1'}
                                    onChange={() => radioChange('1')}
                                    style={{ marginRight: '5px' }}
                                />
                                <span style={{ color: radio === '1' ? '#409eff' : '#666' }}>本金提现</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="withdrawType"
                                    value="2"
                                    checked={radio === '2'}
                                    onChange={() => radioChange('2')}
                                    style={{ marginRight: '5px' }}
                                />
                                <span style={{ color: radio === '2' ? '#409eff' : '#666' }}>银锭提现</span>
                            </label>
                        </div>
                    </div>

                    {/* 余额信息 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                            本金余额：<span style={{ color: '#f56c6c', fontWeight: 'bold' }}>{balance}</span> 元
                        </p>
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            银锭余额：<span style={{ color: '#e6a23c', fontWeight: 'bold' }}>{reward}</span> 银锭
                        </p>
                    </div>

                    {/* 打款方式 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '14px', color: '#333' }}>打款方式：</span>
                            <span style={{ fontSize: '14px', color: '#666' }}>收款码扫码或银行卡转账</span>
                        </div>
                        <a
                            href="/my/withdrawal-account"
                            style={{ fontSize: '13px', color: '#409eff', textDecoration: 'underline' }}
                        >
                            查看提现账户
                        </a>
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                            提示: 有问题请联系客服
                        </p>
                    </div>

                    {/* 提现金额 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '14px', color: '#333', marginRight: '10px' }}>提现金额：</span>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <button
                                    onClick={() => handleChange(Math.max(tiXianPrice, tiXianNum - 10))}
                                    style={{ padding: '5px 10px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={tiXianNum}
                                    onChange={(e) => handleChange(Number(e.target.value))}
                                    style={{ width: '100px', textAlign: 'center', padding: '5px', border: '1px solid #ddd', margin: '0 5px' }}
                                />
                                <button
                                    onClick={() => handleChange(tiXianNum + 10)}
                                    style={{ padding: '5px 10px', border: '1px solid #ddd', background: '#f5f5f5', cursor: 'pointer' }}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        <p style={{ fontSize: '12px', color: '#999' }}>
                            单笔提现最低 <span style={{ color: '#f56c6c' }}>{tiXianPrice}</span> {radio === '1' ? '元' : '银锭'}
                        </p>
                        <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '4px', marginTop: '10px', fontSize: '12px', color: '#856404' }}>
                            <p>{tiXianContent}</p>
                            <p style={{ marginTop: '5px' }}>预计2个工作日内平台完成提现操作，优先收款码扫码，银行转账到账时间以各大银行为准</p>
                        </div>
                    </div>

                    {/* 到账金额 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#333' }}>到账金额：</span>
                        <span style={{ fontSize: '20px', color: '#f56c6c', fontWeight: 'bold' }}>{daoZhangPrice}</span>
                        <span style={{ fontSize: '14px', color: '#666' }}> 元</span>
                    </div>

                    {/* 提现密码 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '14px', color: '#333', marginRight: '10px' }}>提现密码：</span>
                            <input
                                type="password"
                                value={tiXianPassWordValue}
                                onChange={(e) => setTiXianPassWordValue(e.target.value)}
                                placeholder="请输入6位提现密码"
                                maxLength={6}
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <a
                            href="/my/information?editpass=1"
                            style={{ fontSize: '13px', color: '#409eff', textDecoration: 'underline' }}
                        >
                            重置提现密码
                        </a>
                    </div>

                    {/* 申请提现按钮 */}
                    <button
                        onClick={() => setDialogVisible(true)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: '#f56c6c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                        }}
                    >
                        申请提现
                    </button>
                </div>
            )}

            {/* 本金记录内容 */}
            {showType === 1 && (
                <div style={{ padding: '15px' }}>
                    {/* 日期筛选 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                type="date"
                                value={defaultDate}
                                onChange={(e) => setDefaultDate(e.target.value)}
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            <input
                                type="date"
                                value={defaultDate2}
                                onChange={(e) => setDefaultDate2(e.target.value)}
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <button
                            onClick={search}
                            style={{
                                padding: '8px 20px',
                                background: '#409eff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            搜索
                        </button>
                    </div>

                    {/* 记录列表 */}
                    {list.length > 0 ? (
                        list.map((item, index) => (
                            <div key={index} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                                <div style={{ padding: '15px' }}>
                                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>收支：(0.00为立返单,平台已优先返本)</span>
                                            <span style={{ color: filterColor(item.price) }}>
                                                {Number(item.price).toFixed(2)}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>结余：</span>
                                            <span>{Number(item.yprice).toFixed(2)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>日期：</span>
                                            <span>{item.creata_time}</span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'linear-gradient(to bottom, #f0f0f0, #fff)',
                                    padding: '15px',
                                }}>
                                    <p style={{ fontSize: '13px', color: '#666' }}>备注：{item.memo}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ background: '#fff', borderRadius: '8px', padding: '30px', textAlign: 'center', color: '#999' }}>
                            暂无内容
                        </div>
                    )}

                    {/* 分页 */}
                    {total > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px' }}>
                            <span style={{ fontSize: '12px', color: '#666', marginRight: '10px' }}>共 {total} 条</span>
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '5px 10px',
                                    border: '1px solid #ddd',
                                    background: currentPage === 1 ? '#f5f5f5' : '#fff',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    marginRight: '5px',
                                }}
                            >
                                上一页
                            </button>
                            <span style={{ padding: '5px 15px', border: '1px solid #409eff', background: '#409eff', color: 'white' }}>
                                {currentPage}
                            </span>
                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage * 10 >= total}
                                style={{
                                    padding: '5px 10px',
                                    border: '1px solid #ddd',
                                    background: currentPage * 10 >= total ? '#f5f5f5' : '#fff',
                                    cursor: currentPage * 10 >= total ? 'not-allowed' : 'pointer',
                                    marginLeft: '5px',
                                }}
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* 确认提现弹框 */}
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
                        <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '20px' }}>
                            您确定要提现吗？
                        </p>
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
                                onClick={tixianActive}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    background: submitting ? '#fab6b6' : '#f56c6c',
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
