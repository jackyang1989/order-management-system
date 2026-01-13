'use client';

import { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../../apiConfig';

// ===================== 类型定义 =====================
interface TaskInfo {
    taskNum: string;
    tasktype: string;
    maiHao: string;
    taskTime: string;
    principal: string;
    yongJin: string;
    userDivided: string;
    zhongDuan: string;
}

interface GoodsInfo {
    id: string;
    goodsId: string;
    productName: string;
    dianpuName: string;
    type: string;
    specname: string;
    specifications: string;
    buyNum: number;
    buyPrice: string;
    input: string;
    inputnum: string;
    img: string;
    imgdata: string[];
    key: string;
    goodsSpec: string;
    isMain?: boolean;
    orderSpecs?: { specName: string; specValue: string; quantity: number }[];
    keywords?: {
        id: string;
        keyword: string;
        terminal: number;
        sort: string;
        province: string;
        minPrice: number;
        maxPrice: number;
        discount: string;
        filter: string;
    }[];
}

interface OrderGoods {
    id: string;
    dianpuName: string;
    productName: string;
    price: string;
    count: number;
}

interface AreaData {
    province: string;
    city: string;
    region: string;
}

// ===================== 主组件 =====================
export default function OrderExecutePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    // ===================== 核心状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [active, setActive] = useState(1); // 当前步骤 1/2/3
    const [userTaskId, setUserTaskId] = useState('');

    // 任务类型相关
    const [tasktype, setTasktype] = useState('');
    const [taskTimeType, setTaskTimeType] = useState('');
    const [taskYsType, setTaskYsType] = useState('');
    const [is_video_praise, setIsVideoPraise] = useState('');
    const [zhongDuanmessage, setZhongDuanmessage] = useState('');
    const [taoword, setTaoword] = useState('');
    const [qrcode, setQrcode] = useState('');
    const [channelname, setChannelname] = useState('');
    const [keyWord, setKeyWord] = useState('');

    // 商品数据
    const [tableData, setTableData] = useState<TaskInfo[]>([]);
    const [tableData2, setTableData2] = useState<GoodsInfo[]>([]);
    const [tableData3, setTableData3] = useState<OrderGoods[]>([]);

    // 用户任务信息（从后端模板变量获取）
    const [userBuynoAccount, setUserBuynoAccount] = useState('');
    const [sellTaskMemo, setSellTaskMemo] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [platformName, setPlatformName] = useState(''); // 动态平台名称
    const [isFreeShipping, setIsFreeShipping] = useState(true);
    const [checkPassword, setCheckPassword] = useState('');
    const [compareCount, setCompareCount] = useState(3);
    const [contactCSContent, setContactCSContent] = useState('');
    const [mainProductFilter3, setMainProductFilter3] = useState(''); // 货比关键词
    const [mainProductFilter1, setMainProductFilter1] = useState(''); // 颜色
    const [mainProductFilter2, setMainProductFilter2] = useState(''); // 尺码
    const [mainProductFilter4, setMainProductFilter4] = useState(''); // 备选词
    const [adminLimitSwitch, setAdminLimitSwitch] = useState(0);
    const [weight, setWeight] = useState(0); // 包裹重量
    const [fastRefund, setFastRefund] = useState(false); // 快速返款服务

    // Step 1: 货比加购截图
    const [localFile2, setLocalFile2] = useState<{ file: File; content: string } | null>(null);

    // Step 2: 收藏截图 + 商品链接
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);
    const [inputValue3, setInputValue3] = useState(''); // 商品链接1
    const [inputValue4, setInputValue4] = useState(''); // 商品链接2

    // Step 3: 订单号 + 付款金额 + 订单截图
    const [inputValue7, setInputValue7] = useState(''); // 订单编号
    const [inputNumber, setInputNumber] = useState(''); // 付款金额
    const [localFile3, setLocalFile3] = useState<{ file: File; content: string } | null>(null);

    // Step 3: 收货地址修改
    const [threeRadio, setThreeRadio] = useState('1');
    const [area, setArea] = useState<AreaData>({ province: '请选择省', city: '请选择市', region: '请选择区' });
    const [inputStreet, setInputStreet] = useState('');
    const [inputPerson, setInputPerson] = useState('');
    const [inputMobile, setInputMobile] = useState('');

    // 倒计时
    const [curTime, setCurTime] = useState(0);
    const [countdown, setCountdown] = useState('');
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    // 图片预览
    const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    const handleFileSelect = async (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: React.Dispatch<React.SetStateAction<{ file: File; content: string } | null>>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            const content = await fileToBase64(file);
            setter({ file, content });
        }
    };

    // ===================== API 调用 =====================
    // 获取任务数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/execution-data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const res = await response.json();

            if (res.success) {
                const data = res.data;
                setUserTaskId(data.orderId);
                setUserBuynoAccount(data.buynoAccount || '');
                setSellTaskMemo(data.memo || '');
                setReceiverAddress(`${data.address || ''} ${data.addressName || ''} ${data.addressPhone || ''}`);
                setKeyWord(data.keyword || '');
                setMainProductFilter1('');
                setMainProductFilter2('');
                setMainProductFilter3(data.huobiKeyword || '');
                setMainProductFilter4('');
                setAdminLimitSwitch(data.isPasswordEnabled ? 1 : 0);
                setCheckPassword(data.checkPassword || '');
                setIsFreeShipping(data.isFreeShipping === 1 || data.isFreeShipping === true);
                setCompareCount(data.compareCount || 3);
                setContactCSContent(data.contactCSContent || '');
                setWeight(data.weight || 0);
                setFastRefund(data.fastRefund || false);
                setTaskTimeType('');
                setTaskYsType('');

                // 设置倒计时
                if (data.endingTime) {
                    setCurTime(new Date(data.endingTime).getTime());
                }

                // 构建 tableData
                const taskInfo: TaskInfo = {
                    maiHao: data.buynoAccount || '',
                    taskTime: data.endingTime || '',
                    principal: data.userPrincipal || '',
                    yongJin: data.commission || '',
                    userDivided: data.userDivided || '',
                    taskNum: data.taskNumber || '',
                    tasktype: String(data.taskType || ''),
                    zhongDuan: data.terminal === 1 ? '本佣货返' : '本立佣货',
                };
                setTableData([taskInfo]);

                // 设置任务类型相关信息
                setTasktype(String(data.taskType || ''));
                setPlatformName('平台');
                setQrcode(data.qrCode || '');
                setChannelname('');
                setTaoword(data.taoWord || '');
                setIsVideoPraise(data.isVideoPraise ? '1' : '');

                if (data.terminal === 1) {
                    setZhongDuanmessage('温馨提示：此任务本佣货返，任务完成后24小时内本金和佣金由平台返到买手账户。');
                } else {
                    setZhongDuanmessage('温馨提示：此任务本金立返佣金货返，买手提交订单商家审核通过后平台24小时内将本金充值到买手本金账户，佣金在任务完成后24小时内返到买手银锭账户。');
                }

                // 构建 tableData2 (商品信息) - 支持多商品
                let goodsList: GoodsInfo[] = [];

                // 优先使用新版多商品数据
                if (data.goodsList && data.goodsList.length > 0) {
                    goodsList = data.goodsList.map((goods: {
                        id: string;
                        goodsId: string;
                        name: string;
                        pcImg: string;
                        link: string;
                        specName: string;
                        specValue: string;
                        price: number;
                        num: number;
                        isMain: boolean;
                        verifyCode?: string;
                        orderSpecs?: { specName: string; specValue: string; quantity: number }[];
                        keywords?: {
                            id: string;
                            keyword: string;
                            terminal: number;
                            sort: string;
                            province: string;
                            minPrice: number;
                            maxPrice: number;
                            discount: string;
                            filter: string;
                        }[];
                    }) => ({
                        id: goods.id,
                        goodsId: goods.goodsId || goods.id,
                        productName: goods.name || '',
                        dianpuName: data.shopName || '',
                        type: goods.isMain ? '主商品' : '副商品',
                        specname: goods.specName || '',
                        specifications: goods.specValue || '',
                        buyNum: goods.num || 1,
                        buyPrice: String(goods.price || ''),
                        input: '',
                        inputnum: '',
                        img: goods.pcImg || '',
                        imgdata: goods.pcImg ? [goods.pcImg] : [],
                        key: goods.keywords?.[0]?.keyword || data.keyword || '',
                        goodsSpec: goods.verifyCode || data.maskedPassword || '',
                        isMain: goods.isMain,
                        orderSpecs: goods.orderSpecs,
                        keywords: goods.keywords,
                    }));

                    // 设置第一个商品的关键词为默认关键词
                    if (goodsList.length > 0 && goodsList[0].keywords && goodsList[0].keywords.length > 0) {
                        setKeyWord(goodsList[0].keywords[0].keyword);
                    }
                } else {
                    // 兼容旧版单商品数据
                    goodsList = [{
                        id: data.taskId,
                        goodsId: data.platformProductId || data.taskId,
                        productName: data.title || '',
                        dianpuName: data.shopName || '',
                        type: '主商品',
                        specname: '',
                        specifications: '',
                        buyNum: 1,
                        buyPrice: String(data.goodsPrice || ''),
                        input: '',
                        inputnum: '',
                        img: data.mainImage || '',
                        imgdata: data.mainImage ? [data.mainImage] : [],
                        key: data.keyword || '',
                        goodsSpec: data.maskedPassword || '',
                        isMain: true,
                    }];
                }
                setTableData2(goodsList);

                // 构建 tableData3 (订单商品表格)
                const orderGoods: OrderGoods[] = goodsList.map(g => ({
                    id: g.id,
                    dianpuName: g.dianpuName,
                    productName: g.productName,
                    price: g.buyPrice,
                    count: g.buyNum,
                }));
                setTableData3(orderGoods);
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

    // 商品链接核对
    const hedui = async (input: string, goodsId: string) => {
        if (!input) {
            alertError('商品地址不能为空');
            return;
        }
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/verify-link`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ link: input, goodsId: goodsId }),
            });
            const data = await response.json();
            if (data.success) {
                alertSuccess(data.message);
            } else {
                alertError(data.message);
            }
        } catch (error) {
            alertError('核对失败');
        }
    };

    // 商品口令核对
    const heduinum = async (inputnum: string, goodsId: string) => {
        if (!inputnum) {
            alertError('数字核对不能为空');
            return;
        }
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/verify-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ password: inputnum }),
            });
            const data = await response.json();
            if (data.success) {
                alertSuccess(data.message);
            } else {
                alertError(data.message);
            }
        } catch (error) {
            alertError('核对失败');
        }
    };

    // 验证付款金额
    const inputchange = async () => {
        const formattedNumber = Number(inputNumber).toFixed(2);
        setInputNumber(formattedNumber);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/orders/${id}/validate-payment`, {
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

    // 下一步
    const next = async () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (active === 1) {
            // 验证第一步
            if (!localFile2) {
                alertError('货比加购截图不能为空');
                return;
            }
            setActive(2);
        } else if (active === 2) {
            // 验证第二步
            if (!localFile) {
                alertError('商品收藏页面截图不能为空');
                return;
            }
            if (!inputValue3) {
                alertError('商品地址不能为空');
                return;
            }
            if (!inputValue4) {
                alertError('商品地址不能为空');
                return;
            }

            setSubmitting(true);
            try {
                const token = getToken();
                const response = await fetch(`${BASE_URL}/orders/${id}/submit-step`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        step: 2,
                        screenshot: localFile.content,
                        inputData: {
                            goodsLink1: inputValue3,
                            goodsLink2: inputValue4,
                            chatImg: localFile2?.content || '',
                        },
                    }),
                });
                const data = await response.json();
                if (data.success) {
                    alertSuccess(data.message);
                    setActive(3);
                } else {
                    alertError(data.message);
                }
            } catch (error) {
                alertError('提交失败');
            } finally {
                setSubmitting(false);
            }
        } else if (active === 3) {
            // 验证第三步
            const phoneReg = /^1[3-9]\d{9}$/;
            const numreg = /^[\w?%&=\-_]+$/;

            if (!inputValue7) {
                alertError('订单号不能为空');
                return;
            }
            if (!inputNumber) {
                alertError('付款金额不能为空');
                return;
            }
            if (!localFile3) {
                alertError('订单详情截图不能为空');
                return;
            }
            if (!numreg.test(inputValue7)) {
                alertError('订单号格式不规范,请检查后重新输入');
                return;
            }
            if (inputMobile && !phoneReg.test(inputMobile)) {
                alertError('手机号码格式不规范,请检查后重新输入');
                return;
            }

            setSubmitting(true);
            try {
                const token = getToken();

                // 如果修改了收货地址，先更新地址
                if (threeRadio === '2') {
                    await fetch(`${BASE_URL}/orders/${id}/address`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({
                            addressName: inputPerson,
                            addressPhone: inputMobile,
                            address: `${area.province} ${area.city} ${area.region} ${inputStreet}`,
                        }),
                    });
                }

                // 更新平台订单号
                await fetch(`${BASE_URL}/orders/${id}/platform-order`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        platformOrderNumber: inputValue7,
                    }),
                });

                // 提交步骤3
                const response = await fetch(`${BASE_URL}/orders/${id}/submit-step`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        step: 3,
                        screenshot: localFile3.content,
                        inputData: {
                            platformOrderNumber: inputValue7,
                            actualPayment: parseFloat(inputNumber),
                        },
                    }),
                });
                const data = await response.json();
                if (data.success) {
                    alertSuccess(data.message);
                    sessionStorage.setItem('active', '1');
                    setTimeout(() => {
                        router.push('/orders');
                    }, 3000);
                } else {
                    alertError(data.message);
                }
            } catch (error) {
                alertError('提交失败');
            } finally {
                setSubmitting(false);
            }
        }
    };

    // 上一步
    const prev = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (active > 1) {
            setActive(active - 1);
        }
    };

    // 取消任务
    const handleQuXiao = () => {
        router.push('/orders');
    };

    // 更新商品核对输入
    const updateGoodsInput = (index: number, field: 'input' | 'inputnum', value: string) => {
        setTableData2(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    // ===================== 副作用 =====================
    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.push('/login');
            return;
        }
        getData();

        // 从 sessionStorage 恢复步骤
        const savedActive = sessionStorage.getItem('active');
        if (savedActive) {
            setActive(Number(savedActive));
        }
    }, [getData, getToken, router]);

    // 倒计时逻辑
    useEffect(() => {
        if (!curTime) return;

        const updateCountdown = () => {
            const now = Date.now();
            const restTime = curTime - now;

            if (restTime <= 0) {
                setCountdown('00:00');
                if (countdownRef.current) {
                    clearInterval(countdownRef.current);
                }
                return;
            }

            const minutes = Math.floor(restTime / 60000);
            const seconds = Math.floor((restTime % 60000) / 1000);
            setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        updateCountdown();
        countdownRef.current = setInterval(updateCountdown, 1000);

        return () => {
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        };
    }, [curTime]);

    // 保存当前步骤到 sessionStorage
    useEffect(() => {
        sessionStorage.setItem('active', String(active));
    }, [active]);

    // ===================== 渲染 =====================
    if (loading) {
        return (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                加载中...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '100px' }}>
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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>任务执行</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 倒计时 */}
            {countdown && (
                <div style={{
                    background: countdown === '00:00' ? '#f56c6c' : '#409eff',
                    color: 'white',
                    padding: '8px 15px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                }}>
                    {countdown}
                </div>
            )}

            {/* 任务信息卡片 */}
            <div style={{ background: '#fff', margin: '10px', borderRadius: '8px', padding: '15px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>任务步骤</div>
                {tableData.map((item, index) => (
                    <div key={index} style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>任务编号：</span><span>{item.taskNum}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>任务类型：</span><span>{item.tasktype}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>接手买号：</span><span style={{ color: '#f56c6c' }}>{item.maiHao}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>截止时间：</span><span>{item.taskTime}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>垫付本金：</span><span>{item.principal}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>任务佣金：</span><span style={{ color: 'blue' }}>{item.yongJin}+{item.userDivided}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>返款方式：</span><span>{item.zhongDuan}</span>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={handleQuXiao}
                                style={{
                                    background: '#f56c6c',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                }}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 商家要求 */}
            <div style={{ background: '#fff3cd', margin: '10px', borderRadius: '8px', padding: '12px', fontSize: '13px', color: '#856404' }}>
                <p>{zhongDuanmessage}</p>
                <p>您当前接受任务的买号为 <span style={{ color: 'red' }}>"{userBuynoAccount}"</span> 请访问{platformName || '平台'}APP，确认登录的买号是否正确！</p>
                {sellTaskMemo && <p>商家订单要求: <span>{sellTaskMemo}</span></p>}
                {taskTimeType === '2' && (
                    <p style={{ color: 'red' }}>今天浏览收藏加购，提交到第三步，明天16点前付款并提交订单信息，超时订单取消。</p>
                )}
                {taskYsType === '1' && (
                    <p style={{ color: 'red', fontSize: '12px' }}>此任务是预售任务，领取任务当日只需要付预付金额</p>
                )}
            </div>

            {/* 步骤指示器 */}
            <div style={{ background: '#fff', margin: '10px', borderRadius: '8px', padding: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    {[1, 2, 3].map((step) => (
                        <div key={step} style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: step < active ? '#67c23a' : (step === active ? '#409eff' : '#ddd'),
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 5px',
                                fontWeight: 'bold',
                            }}>
                                {step < active ? '✓' : step}
                            </div>
                            <div style={{ fontSize: '12px', color: step === active ? '#409eff' : '#999' }}>
                                第{step === 1 ? '一' : step === 2 ? '二' : '三'}步
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ===================== 第一步 ===================== */}
            {active === 1 && (
                <div style={{ margin: '10px' }}>
                    {/* 温馨提示 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ color: '#409eff', marginRight: '5px' }}>ℹ</span>
                            <span style={{ fontWeight: 'bold', color: '#409eff' }}>温馨提示</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#f56c6c', lineHeight: '1.8' }}>
                            <p>1. 禁止使用任何返利平台，若有使用请退出返利平台并清空{platformName || '平台'}缓存后再继续任务；</p>
                            <p>2. 必须按照商家给的关键词和渠道搜索进店，不可擅自加词或更换指定进店渠道，后台可看到进店关键词和渠道；</p>
                            {contactCSContent && <p>3. 必须联系客服并发送以下内容：<span style={{ fontWeight: 'bold', color: 'blue' }}>{contactCSContent}</span>；</p>}
                            <p>{contactCSContent ? '4' : '3'}. 浏览主商品8分钟以上，副商品5分钟以上，然后随机浏览店铺其他2个商品各2分钟，浏览时间不够和未到支付步骤不要提前将购物车的商品下单付款，后台可看到各商品停留时间，总浏览时间低于15分钟无法提交订单；</p>
                            <p>{contactCSContent ? '5' : '4'}. 禁止修改订单截图上的实付金额，所有支付优惠商家后台都可查到；</p>
                            <p>{contactCSContent ? '6' : '5'}. 请在倒计时结束前完成任务并在平台提交，超时任务取消且系统会自动扣除1银锭；</p>
                            <p>{contactCSContent ? '7' : '6'}. 请严格按要求认真完成任务，否则将根据处罚细则进行处罚。</p>
                        </div>
                    </div>

                    {/* 任务类型指引 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        {tasktype === '3' && qrcode && (
                            <div>
                                <p>打开{platformName || '平台'}APP，扫描二维码：</p>
                                <img src={qrcode} alt="二维码" style={{ width: '100px', height: '100px', border: '1px solid #ddd' }} />
                            </div>
                        )}
                        {tasktype === '2' && taoword && (
                            <p>复制淘口令，打开{platformName || '平台'}APP：<span style={{ color: 'red' }}>{taoword}</span></p>
                        )}
                        {tasktype === '4' && (
                            <p>{platformName || '平台'}APP搜索框，手动输入搜索关键词：<span style={{ color: 'red', userSelect: 'none' }}>{keyWord}</span></p>
                        )}
                    </div>

                    {/* 壹：货比加购 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>壹</span>
                            <span style={{ fontWeight: 'bold' }}>货比加购</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <p>1. {platformName || '平台'}APP搜索框，搜索货比关键词：<span style={{ color: 'red' }}>{mainProductFilter3}</span></p>
                            <p>2. 根据搜索结果，浏览{compareCount}家同类商品，每家2分钟；</p>
                            <p>3. 将其中3个商家的货比商品加入购物车并截图；</p>
                            <p>4. 上传货比加购截图:</p>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, setLocalFile2)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile2 && (
                                <div style={{ marginTop: '10px' }}>
                                    <img
                                        src={localFile2.content}
                                        alt="预览"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => setPreviewImage(localFile2.content)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== 第二步 ===================== */}
            {active === 2 && (
                <div style={{ margin: '10px' }}>
                    {/* 贰：进店浏览 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>贰</span>
                            <span style={{ fontWeight: 'bold' }}>进店浏览</span>
                        </div>

                        {/* 任务类型指引 */}
                        {tasktype === '5' && (
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                <p>1.长按二维码将二维码保存到相册；</p>
                                <p>2.{platformName || '平台'}APP扫描二维码访问主商品；</p>
                                <p>3.副商品直接根据主图在店内查找。</p>
                                {is_video_praise === '1' && (
                                    <p style={{ color: 'red' }}>提示：此任务是视频好评任务，收货时需要下载视频上传评价哦。</p>
                                )}
                            </div>
                        )}
                        {tasktype === '1' && (
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                <p><span style={{ color: 'red' }}>进店{keyWord} 备选词：{mainProductFilter4}</span></p>
                                <p>{platformName || '平台'}APP搜索进店关键词找到主商品进行信息核对(若找不到可换备选词)，若有副商品直接在店铺内根据副商品图片查找并进行信息核对。</p>
                                {is_video_praise === '1' && (
                                    <p style={{ color: 'red' }}>提示：此任务是视频好评任务，收货时需要下载视频上传评价哦。</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 叁：商品信息核对 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>叁</span>
                            <span style={{ fontWeight: 'bold' }}>商品信息核对</span>
                        </div>

                        {tableData2.map((item, index) => (
                            <div key={index} style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                {/* 主/副商品标识 */}
                                <div style={{
                                    display: 'inline-block',
                                    background: item.isMain ? '#409eff' : '#67c23a',
                                    color: 'white',
                                    fontSize: '11px',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    marginBottom: '8px'
                                }}>
                                    {item.isMain ? '主商品' : '副商品'}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <img src={item.img} alt="商品" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '13px', color: '#333' }}>{item.productName}</div>
                                        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>店铺：{item.dianpuName}</div>
                                        {item.specname && item.specifications && (
                                            <div style={{ fontSize: '12px', color: '#409eff', marginTop: '5px', fontWeight: 'bold' }}>
                                                规格：{item.specname} - {item.specifications}
                                            </div>
                                        )}
                                        <div style={{ fontSize: '12px', color: '#f56c6c', marginTop: '5px' }}>¥{item.buyPrice} x {item.buyNum}</div>
                                    </div>
                                </div>

                                {/* 关键词及筛选设置显示 */}
                                {item.keywords && item.keywords.length > 0 && (
                                    <div style={{
                                        background: '#f0f9eb',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        marginBottom: '10px',
                                        fontSize: '12px'
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: '#67c23a', marginBottom: '8px' }}>搜索关键词：</div>
                                        {item.keywords.map((kw, kwIndex) => (
                                            <div key={kwIndex} style={{
                                                background: '#fff',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                marginBottom: kwIndex < item.keywords!.length - 1 ? '8px' : 0
                                            }}>
                                                <div style={{ color: '#f56c6c', fontWeight: 'bold' }}>
                                                    关键词{kwIndex + 1}：{kw.keyword}
                                                </div>
                                                {/* 筛选设置 */}
                                                <div style={{ marginTop: '5px', color: '#666' }}>
                                                    {kw.sort && <span style={{ marginRight: '10px' }}>排序：{kw.sort}</span>}
                                                    {kw.province && <span style={{ marginRight: '10px' }}>发货地：{kw.province}</span>}
                                                    {(kw.minPrice > 0 || kw.maxPrice > 0) && (
                                                        <span style={{ marginRight: '10px' }}>
                                                            价格区间：¥{kw.minPrice || 0} - ¥{kw.maxPrice || '不限'}
                                                        </span>
                                                    )}
                                                    {kw.discount && <span>折扣：{kw.discount}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 下单规格要求显示 */}
                                {item.orderSpecs && item.orderSpecs.length > 0 && (
                                    <div style={{
                                        background: '#fff7e6',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        marginBottom: '10px',
                                        fontSize: '12px',
                                        border: '1px solid #ffd591'
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: '#fa8c16', marginBottom: '8px' }}>⚠️ 下单规格要求：</div>
                                        {item.orderSpecs.map((spec, specIndex) => (
                                            <div key={specIndex} style={{
                                                background: '#fff',
                                                padding: '6px 10px',
                                                borderRadius: '4px',
                                                marginBottom: specIndex < item.orderSpecs!.length - 1 ? '6px' : 0,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ color: '#333' }}>
                                                    {spec.specName}：<span style={{ fontWeight: 'bold', color: '#fa8c16' }}>{spec.specValue}</span>
                                                </span>
                                                <span style={{ color: '#f56c6c', fontWeight: 'bold' }}>× {spec.quantity}</span>
                                            </div>
                                        ))}
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#f56c6c' }}>
                                            请严格按照上述规格下单，规格错误可能导致审核不通过
                                        </div>
                                    </div>
                                )}

                                {/* 核对输入 */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {/* 商品链接核对 */}
                                    <div>
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>商品链接核对：</div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                value={item.input}
                                                onChange={(e) => updateGoodsInput(index, 'input', e.target.value)}
                                                placeholder="长按商品标题-复制链接，粘贴核对"
                                                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                            />
                                            <button
                                                onClick={() => hedui(item.input, item.goodsId)}
                                                style={{ background: '#409eff', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px' }}
                                            >
                                                核对
                                            </button>
                                        </div>
                                    </div>
                                    {/* 商品口令核对 */}
                                    {adminLimitSwitch === 1 && (
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>商品口令核对：</div>
                                            {item.goodsSpec && (
                                                <div style={{
                                                    fontSize: '12px',
                                                    color: '#f56c6c',
                                                    marginBottom: '5px',
                                                    padding: '8px',
                                                    background: '#fff5f5',
                                                    borderRadius: '4px'
                                                }}>
                                                    口令提示：<span style={{ fontWeight: 'bold' }}>{item.goodsSpec}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    type="text"
                                                    value={item.inputnum}
                                                    onChange={(e) => updateGoodsInput(index, 'inputnum', e.target.value)}
                                                    placeholder="请输入商品详情页的完整口令"
                                                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                                />
                                                <button
                                                    onClick={() => heduinum(item.inputnum, item.goodsId)}
                                                    style={{ background: '#409eff', color: 'white', border: 'none', borderRadius: '4px', padding: '0 15px' }}
                                                >
                                                    核对
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                                商家要求：请在商品详情页找到包含上述文字的完整口令并输入。
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 肆：收藏/加购 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>肆</span>
                            <span style={{ fontWeight: 'bold' }}>收藏/加购/聊天</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <p>1. 分别浏览主/副宝贝深度验证；</p>
                            <p>2. 对目标商品进行收藏；</p>
                            <p>3. 上传收藏页面的截图：</p>
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, setLocalFile)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile && (
                                <div style={{ marginTop: '10px' }}>
                                    <img
                                        src={localFile.content}
                                        alt="预览"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => setPreviewImage(localFile.content)}
                                    />
                                </div>
                            )}
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>商品链接(主)：</p>
                            <input
                                type="text"
                                value={inputValue3}
                                onChange={(e) => setInputValue3(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>商品链接(副)：</p>
                            <input
                                type="text"
                                value={inputValue4}
                                onChange={(e) => setInputValue4(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== 第三步 ===================== */}
            {active === 3 && (
                <div style={{ margin: '10px' }}>
                    {/* 订单商品核对表格 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>伍</span>
                            <span style={{ fontWeight: 'bold', color: '#f56c6c' }}>核对订单商品</span>
                            <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>(滑动查看)</span>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', minWidth: '400px', borderCollapse: 'collapse', fontSize: '12px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'left' }}>#</th>
                                        <th style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'left' }}>店铺名称</th>
                                        <th style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'left' }}>商品标题</th>
                                        <th style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'right' }}>单价</th>
                                        <th style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'center' }}>数量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData3.length > 0 ? tableData3.map((item, index) => (
                                        <tr key={item.id}>
                                            <td style={{ padding: '8px', border: '1px solid #e5e5e5' }}>{index + 1}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e5e5e5', whiteSpace: 'nowrap' }}>{item.dianpuName}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e5e5e5', whiteSpace: 'nowrap' }}>{item.productName}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'right', color: '#f56c6c' }}>¥{item.price}</td>
                                            <td style={{ padding: '8px', border: '1px solid #e5e5e5', textAlign: 'center' }}>{item.count}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '15px', border: '1px solid #e5e5e5', textAlign: 'center', color: '#999' }}>暂无商品数据</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 伍：提交订单 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                            <span style={{
                                background: '#409eff',
                                color: 'white',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: '10px',
                                fontSize: '12px',
                            }}>陆</span>
                            <span style={{ fontWeight: 'bold', color: '#f56c6c' }}>填写订单信息并提交</span>
                        </div>

                        {/* 温馨提示 - 付款注意事项 */}
                        <div style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '4px', padding: '12px', marginBottom: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ color: '#fa8c16', marginRight: '5px' }}>⚠️</span>
                                <span style={{ fontWeight: 'bold', color: '#fa8c16', fontSize: '13px' }}>温馨提示</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#333', lineHeight: '1.8' }}>
                                <p>1. 请使用 <span style={{ color: '#f56c6c', fontWeight: 'bold' }}>{userBuynoAccount}</span> 下单和付款，付款完毕后请填写您的实付金额和订单号。</p>
                                <p>2. 只能使用银行借记卡或支付宝付款，<span style={{ color: '#f56c6c' }}>不可使用信用卡、花呗付款，也不可使用村淘(农村淘宝)、淘宝客和返利平台下单</span>，提交后会进行审核一旦发现订单退款和买号降权处理。</p>
                            </div>
                        </div>

                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8', marginBottom: '15px' }}>
                            <p>1. 核对收货地址信息，确认无误后下单付款；</p>
                            <p>2. 将付款后的订单详情截图上传；</p>
                            <p>3. 填写订单号和实际付款金额。</p>
                        </div>

                        {/* 订单设置信息 */}
                        {(weight > 0 || fastRefund) && (
                            <div style={{ marginBottom: '15px', padding: '10px', background: '#e6f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
                                <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#1890ff' }}>订单设置提醒：</p>
                                {weight > 0 && (
                                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                        📦 包裹重量：<span style={{ fontWeight: 'bold' }}>{weight}kg</span>
                                    </p>
                                )}
                                {fastRefund && (
                                    <p style={{ fontSize: '12px', color: '#52c41a', marginBottom: '4px' }}>
                                        ⚡ 快速返款服务：<span style={{ fontWeight: 'bold' }}>已开通</span>（0.6%费率）
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 收货地址 */}
                        <div style={{ marginBottom: '15px', padding: '10px', background: '#f9f9f9', borderRadius: '4px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>收货信息：</p>
                            <p style={{ fontSize: '13px', color: '#333' }}>{receiverAddress}</p>
                            <div style={{ marginTop: '10px' }}>
                                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={threeRadio === '2'}
                                        onChange={(e) => setThreeRadio(e.target.checked ? '2' : '1')}
                                        style={{ marginRight: '5px' }}
                                    />
                                    修改收货地址
                                </label>
                            </div>
                            {threeRadio === '2' && (
                                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <input
                                        type="text"
                                        value={inputPerson}
                                        onChange={(e) => setInputPerson(e.target.value)}
                                        placeholder="收货人"
                                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                    <input
                                        type="text"
                                        value={inputMobile}
                                        onChange={(e) => setInputMobile(e.target.value)}
                                        placeholder="手机号"
                                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                    <input
                                        type="text"
                                        value={inputStreet}
                                        onChange={(e) => setInputStreet(e.target.value)}
                                        placeholder="详细地址"
                                        style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* 订单信息输入 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', marginBottom: '5px' }}>订单编号：</p>
                            <input
                                type="text"
                                value={inputValue7}
                                onChange={(e) => setInputValue7(e.target.value)}
                                placeholder="请输入订单编号"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', marginBottom: '5px' }}>实际付款金额：</p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="number"
                                    value={inputNumber}
                                    onChange={(e) => setInputNumber(e.target.value)}
                                    onBlur={inputchange}
                                    placeholder="请输入金额"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginTop: '5px' }}>*实际金额必须在误差范围内，否则无法提交</p>
                        </div>

                        {/* 订单截图 */}
                        <div>
                            <p style={{ fontSize: '13px', marginBottom: '5px' }}>订单详情截图：</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, setLocalFile3)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {localFile3 && (
                                <div style={{ marginTop: '10px' }}>
                                    <img
                                        src={localFile3.content}
                                        alt="预览"
                                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => setPreviewImage(localFile3.content)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 底部操作栏 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#fff',
                padding: '10px 15px',
                borderTop: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <button
                    onClick={prev}
                    disabled={active === 1}
                    style={{
                        padding: '10px 30px',
                        background: active === 1 ? '#f5f5f5' : '#fff',
                        border: '1px solid #ddd',
                        color: active === 1 ? '#ccc' : '#666',
                        borderRadius: '4px',
                        cursor: active === 1 ? 'not-allowed' : 'pointer',
                    }}
                >
                    上一步
                </button>
                <button
                    onClick={next}
                    disabled={submitting}
                    style={{
                        padding: '10px 30px',
                        background: submitting ? '#a0cfff' : '#409eff',
                        border: 'none',
                        color: 'white',
                        borderRadius: '4px',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {active === 3 ? (submitting ? '提交中...' : '提交任务') : '下一步'}
                </button>
            </div>

            {/* 图片预览 Modal */}
            {previewImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        zIndex: 1000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <img
                        src={previewImage}
                        alt="预览"
                        style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}
                    />
                </div>
            )}
        </div>
    );
}
