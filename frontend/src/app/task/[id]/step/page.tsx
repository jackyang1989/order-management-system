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
    user_divided: string;
    zhongDuan: string;
}

interface GoodsInfo {
    id: string;
    goods_id: string;
    productName: string;
    dianpuName: string;
    type: string;
    specname: string;
    specifications: string;
    buy_num: number;
    buy_price: string;
    input: string;
    inputnum: string;
    img: string;
    imgdata: string[];
    key: string;
    goods_spec: string;
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
export default function TaskStepPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    // ===================== 核心状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [active, setActive] = useState(1); // 当前步骤 1/2/3
    const [user_task_id, setUserTaskId] = useState('');

    // 任务类型相关
    const [tasktype, setTasktype] = useState('');
    const [task_time_type, setTaskTimeType] = useState('');
    const [task_ys_type, setTaskYsType] = useState('');
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
    const [userBuynoWangwang, setUserBuynoWangwang] = useState('');
    const [sellTaskMemo, setSellTaskMemo] = useState('');
    const [receiverAddress, setReceiverAddress] = useState('');
    const [mainProductFilter3, setMainProductFilter3] = useState(''); // 货比关键词
    const [mainProductFilter1, setMainProductFilter1] = useState(''); // 颜色
    const [mainProductFilter2, setMainProductFilter2] = useState(''); // 尺码
    const [mainProductFilter4, setMainProductFilter4] = useState(''); // 备选词
    const [adminLimitSwitch, setAdminLimitSwitch] = useState(0);

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
            const response = await fetch(`${BASE_URL}/mobile/task/taskstep`, {
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
                setUserTaskId(data.user_task_id);
                setUserBuynoWangwang(data.user_task?.user_buyno_wangwang || '');
                setSellTaskMemo(data.sell_task?.memo || '');
                setReceiverAddress(`${data.user_task?.address || ''} ${data.user_task?.addressname || ''} ${data.user_task?.addressphone || ''}`);
                setKeyWord(data.key_word || '');
                setMainProductFilter1(data.main_product_message_filter1 || '');
                setMainProductFilter2(data.main_product_message_filter2 || '');
                setMainProductFilter3(data.main_product_message_filter3 || '');
                setMainProductFilter4(data.main_product_message_filter4 || '');
                setAdminLimitSwitch(data.admin_limit_switch || 0);
                setTaskTimeType(data.user_task?.task_type || '');
                setTaskYsType(data.user_task?.is_ys || '');

                // 设置倒计时
                if (data.end_time) {
                    setCurTime(data.end_time);
                }

                // 构建 tableData
                const taskInfo: TaskInfo = {
                    maiHao: data.user_task?.user_buyno_wangwang || '',
                    taskTime: data.user_task?.ending_time || '',
                    principal: data.user_task?.principal || '',
                    yongJin: data.user_task?.commission || '',
                    user_divided: data.user_task?.user_divided || '',
                    taskNum: data.user_task?.task_number || '',
                    tasktype: data.type_array?.[data.sell_task?.task_type] || '',
                    zhongDuan: data.sell_task?.terminal === 1 ? '本佣货返' : '本立佣货',
                };
                setTableData([taskInfo]);

                // 设置任务类型相关信息
                setTasktype(String(data.sell_task?.task_type || ''));
                setQrcode(data.sell_task?.qr_code || '');
                setChannelname(data.sell_task?.channel_name || '');
                setTaoword(data.sell_task?.tao_word || '');
                setIsVideoPraise(String(data.sell_task?.is_video_praise || ''));

                if (data.sell_task?.terminal === 1) {
                    setZhongDuanmessage('温馨提示：此任务本佣货返，任务完成后24小时内本金和佣金由平台返到买手账户。');
                } else {
                    setZhongDuanmessage('温馨提示：此任务本金立返佣金货返，买手提交订单商家审核通过后平台24小时内将本金充值到买手本金账户，佣金在任务完成后24小时内返到买手银锭账户。');
                }

                // 构建 tableData2 (商品信息)
                if (data.goods_info && Array.isArray(data.goods_info)) {
                    const goodsList: GoodsInfo[] = data.goods_info.map((item: any) => ({
                        id: item.id,
                        goods_id: item.goods_id,
                        productName: item.name,
                        dianpuName: data.shop?.shop_name || '',
                        type: item.leixing,
                        specname: item.spec_name,
                        specifications: item.spec_value,
                        buy_num: item.buy_num,
                        buy_price: item.buy_price,
                        input: '',
                        inputnum: '',
                        img: item.pc_img?.[0] || '',
                        imgdata: item.pc_img || [],
                        key: item.key,
                        goods_spec: item.goods_spec,
                    }));
                    setTableData2(goodsList);

                    // 构建 tableData3 (订单商品表格)
                    const orderGoods: OrderGoods[] = data.goods_info.map((item: any) => ({
                        id: item.id,
                        dianpuName: item.shop_name || data.shop?.shop_name || '',
                        productName: item.name,
                        price: item.buy_price,
                        count: item.buy_num,
                    }));
                    setTableData3(orderGoods);
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

    // 商品链接核对
    const hedui = async (input: string, goods_id: string) => {
        if (!input) {
            alertError('商品地址不能为空');
            return;
        }
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/task_hedui`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ input, id: goods_id }),
            });
            const data = await response.json();
            if (data.code === 1) {
                alertSuccess(data.msg);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('核对失败');
        }
    };

    // 商品口令核对
    const heduinum = async (inputnum: string, goods_id: string) => {
        if (!inputnum) {
            alertError('数字核对不能为空');
            return;
        }
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/task/task_heduinum`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ inputnum, id: goods_id }),
            });
            const data = await response.json();
            if (data.code === 1) {
                alertSuccess(data.msg);
            } else {
                alertError(data.msg);
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
            const response = await fetch(`${BASE_URL}/mobile/task/tasknumberchange`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    number: formattedNumber,
                    task_id: user_task_id,
                }),
            });
            const data = await response.json();
            if (data.code !== 1) {
                alertError(data.msg);
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

            // 构建核对数据
            const arr = tableData2.map(item => ({ input: item.input, id: item.goods_id }));
            const arrnum = tableData2.map(item => ({ inputnum: item.inputnum, id: item.goods_id }));

            setSubmitting(true);
            try {
                const token = getToken();
                const response = await fetch(`${BASE_URL}/mobile/task/task_two`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        user_task_id,
                        keywordimg: localFile.content,
                        inputall: arr,
                        inputallnum: arrnum,
                        dizhi1: inputValue3,
                        dizhi2: inputValue4,
                        chatimg: localFile2?.content || '',
                    }),
                });
                const data = await response.json();
                if (data.code === 1) {
                    alertSuccess(data.msg);
                    setActive(3);
                } else {
                    alertError(data.msg);
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
                const response = await fetch(`${BASE_URL}/mobile/task/task_three`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({
                        user_task_id,
                        table_order_id: inputValue7,
                        user_principal: inputNumber,
                        order_detail_img: localFile3.content,
                        threeradio: threeRadio,
                        province: area.province,
                        city: area.city,
                        block: area.region,
                        inputstreet: inputStreet,
                        adressperson: inputPerson,
                        addressphone: inputMobile,
                    }),
                });
                const data = await response.json();
                if (data.code === 1) {
                    alertSuccess(data.msg);
                    sessionStorage.setItem('active', '1');
                    setTimeout(() => {
                        router.push(data.url || '/orders');
                    }, 3000);
                } else {
                    alertError(data.msg);
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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>任务大厅</div>
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
                            <span>任务佣金：</span><span style={{ color: 'blue' }}>{item.yongJin}+{item.user_divided}</span>
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
                <p>您当前接受任务的淘宝买号为 <span style={{ color: 'red' }}>"{userBuynoWangwang}"</span> 请访问淘宝APP，确认登录的买号是否正确！</p>
                {sellTaskMemo && <p>商家订单要求: <span>{sellTaskMemo}</span></p>}
                {task_time_type === '2' && (
                    <p style={{ color: 'red' }}>今天浏览收藏加购，提交到第三步，明天16点前付款并提交订单信息，超时订单取消。</p>
                )}
                {task_ys_type === '1' && (
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
                            <p>1. 禁止使用任何返利平台，若有使用请退出返利平台并清空淘宝缓存后再继续任务；</p>
                            <p>2. 必须按照商家给的关键词和渠道搜索进店，不可擅自加词或更换指定进店渠道，后台可看到进店关键词和渠道；</p>
                            <p>3. 浏览主商品8分钟以上，副商品5分钟以上，然后随机浏览店铺其他2个商品各2分钟，浏览时间不够和未到支付步骤不要提前将购物车的商品下单付款，后台可看到各商品停留时间，总浏览时间低于15分钟无法提交订单；</p>
                            <p>4. 禁止修改订单截图上的实付金额，所有支付优惠商家后台都可查到；</p>
                            <p>5. 请在倒计时结束前完成任务并在平台提交，超时任务取消且系统会自动扣除1银锭；</p>
                            <p>6. 请严格按要求认真完成任务，否则将根据处罚细则进行处罚。</p>
                        </div>
                    </div>

                    {/* 任务类型指引 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        {tasktype === '3' && qrcode && (
                            <div>
                                <p>打开淘宝APP，扫描二维码：</p>
                                <img src={qrcode} alt="二维码" style={{ width: '100px', height: '100px', border: '1px solid #ddd' }} />
                            </div>
                        )}
                        {tasktype === '2' && taoword && (
                            <p>复制淘口令，打开淘宝APP：<span style={{ color: 'red' }}>{taoword}</span></p>
                        )}
                        {tasktype === '4' && (
                            <p>淘宝APP搜索框，手动输入搜索关键词：<span style={{ color: 'red', userSelect: 'none' }}>{keyWord}</span></p>
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
                            <p>1. 淘宝APP搜索框，搜索货比关键词：<span style={{ color: 'red' }}>{mainProductFilter3}</span></p>
                            <p>2. 根据搜索结果，浏览5家同类商品，每家2分钟；</p>
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
                                <p>2.淘宝APP扫描二维码访问主商品；</p>
                                <p>3.副商品直接根据主图在店内查找。</p>
                                {is_video_praise === '1' && (
                                    <p style={{ color: 'red' }}>提示：此任务是视频好评任务，收货时需要下载视频上传评价哦。</p>
                                )}
                            </div>
                        )}
                        {tasktype === '1' && (
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                <p><span style={{ color: 'red' }}>进店{keyWord} 备选词：{mainProductFilter4}</span></p>
                                <p>淘宝APP搜索进店关键词找到主商品进行信息核对(若找不到可换备选词)，若有副商品直接在店铺内根据副商品图片查找并进行信息核对。</p>
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
                            <div key={index} style={{ border: '1px solid #eee', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>店铺名称:</span><span>{item.dianpuName?.substring(0, 1)}...</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>商品名称:</span><span>{item.productName?.substring(0, 1)}...</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>商品类型:</span><span>{item.type}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>商品价格:</span><span>{item.buy_price?.toString().substring(0, 1)}...</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>颜色尺码:</span><span>{mainProductFilter1} {mainProductFilter2}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>购买件数:</span><span>{item.buy_num}</span>
                                    </div>
                                </div>

                                {/* 商品图片 */}
                                {item.img && (
                                    <div style={{ marginTop: '10px' }}>
                                        <span style={{ fontSize: '13px', color: '#666' }}>商品图片：</span>
                                        <img
                                            src={item.img}
                                            alt="商品图"
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                            onClick={() => setPreviewImage(item.img)}
                                        />
                                    </div>
                                )}

                                {/* 商品链接核对 */}
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>商品链接核对：</div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input
                                            type="text"
                                            value={item.input}
                                            onChange={(e) => updateGoodsInput(index, 'input', e.target.value)}
                                            placeholder="请输入商品链接"
                                            style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                                        />
                                        <button
                                            onClick={() => hedui(item.input, item.goods_id)}
                                            style={{ background: '#409eff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            核对
                                        </button>
                                    </div>
                                </div>

                                {/* 商品口令核对 */}
                                {adminLimitSwitch === 1 && (
                                    <div style={{ marginTop: '10px' }}>
                                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '5px' }}>商品口令核对：</div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <input
                                                type="text"
                                                value={item.inputnum}
                                                onChange={(e) => updateGoodsInput(index, 'inputnum', e.target.value)}
                                                placeholder="请输入商品口令"
                                                style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '13px' }}
                                            />
                                            <button
                                                onClick={() => heduinum(item.inputnum, item.goods_id)}
                                                style={{ background: '#409eff', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}
                                            >
                                                核对
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 口令提示 */}
                                {item.goods_spec && (
                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#f56c6c' }}>
                                        商品口令提示：{item.goods_spec}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* 核对说明 */}
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}>
                            {adminLimitSwitch === 1 ? (
                                <>
                                    <p>链接与口令核对提示：</p>
                                    <p>商品链接核对：找到宝贝进店浏览后，长按商品名称-复制链接，粘贴到输入框核对。</p>
                                    <p>商品口令核对：根据口令提示在商品详情页找到与提示相符的文字填写进输入框进行核对(忽略文字间的标点符号)，口令提示里有几个星号就代表隐藏了几个字，需要将未隐藏的字和隐藏的字一起输入核对，链接和口令核对正确即可继续完成任务。</p>
                                </>
                            ) : (
                                <p>注：商品链接核对是找到宝贝进店浏览后，长按商品标题-复制链接，粘贴到输入框核对，链接核对正确即可继续做任务。</p>
                            )}
                        </div>
                    </div>

                    {/* 肆：浏览收藏 */}
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
                            }}>肆</span>
                            <span style={{ fontWeight: 'bold' }}>浏览收藏</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <p>1. 主商品自上到底浏览时间不少于8分钟，并点推荐（随便选3个选项）、收藏，然后加购商家指定的颜色尺码(若未指定，请加购自己日常穿着的尺码)；</p>
                            <p>2. 副商品自上到底浏览时间不少于5分钟，并点推荐（随便选3个选项）、收藏，然后加购商家指定的颜色尺码(若未指定，请加购自己日常穿着的尺码)。</p>
                            <p>3. 上传宝贝收藏页面截图(路径:我的淘宝-收藏)：</p>
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
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
                            注: 截图里需要能看到收藏的主商品和副商品。
                        </div>
                    </div>

                    {/* 伍：店铺浏览 */}
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
                            }}>伍</span>
                            <span style={{ fontWeight: 'bold' }}>店铺浏览</span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                            <p>1. 进入店铺首页并订阅店铺；</p>
                            <p>2. 在店铺内随便浏览2-3款与主副款不同的商品，每款浏览2分钟后，长按商品标题复制商品链接放入下面输入框。</p>
                        </div>
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ marginBottom: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#666' }}>3. 商品链接1：</span>
                                <input
                                    type="text"
                                    value={inputValue3}
                                    onChange={(e) => setInputValue3(e.target.value)}
                                    placeholder="请输入内容"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                                />
                            </div>
                            <div>
                                <span style={{ fontSize: '13px', color: '#666' }}>4. 商品链接2：</span>
                                <input
                                    type="text"
                                    value={inputValue4}
                                    onChange={(e) => setInputValue4(e.target.value)}
                                    placeholder="请输入内容"
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===================== 第三步 ===================== */}
            {active === 3 && (
                <div style={{ margin: '10px' }}>
                    {/* 核对订单商品 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px', marginBottom: '10px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f56c6c', marginBottom: '15px' }}>
                            核对订单商品(滑动查看)
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '400px' }}>
                                <thead>
                                    <tr style={{ background: '#f5f5f5' }}>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>#</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>店铺名称</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>商品标题</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>单价</th>
                                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>购买数量</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData3.length > 0 ? tableData3.map((item, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.id}</td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{item.dianpuName}</td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', whiteSpace: 'nowrap' }}>{item.productName}</td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.price}</td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>{item.count}</td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '20px', border: '1px solid #ddd', textAlign: 'center', color: '#999' }}>暂无内容</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* 填写订单信息 */}
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f56c6c', marginBottom: '15px' }}>
                            填写订单信息并提交
                        </div>

                        {/* 温馨提示 */}
                        <div style={{ background: '#f0f9ff', padding: '12px', borderRadius: '4px', marginBottom: '15px', fontSize: '12px', color: '#409eff' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ marginRight: '5px' }}>ℹ</span>
                                <span style={{ fontWeight: 'bold' }}>温馨提示</span>
                            </div>
                            <p>1. 请使用<span style={{ color: 'red' }}>{userBuynoWangwang}</span>下单和付款，付款完毕后请填写您的实付金额和订单号。</p>
                            <p>2. 只能使用银行借记卡或支付宝付款，<span style={{ color: 'red' }}>不可使用信用卡、花呗付款，也不可使用村淘(农村淘宝)、淘宝客和返利平台下单，提交后会进行审核一旦发现订单退款和买号降权处理。</span></p>
                        </div>

                        {/* 订单号 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>1. 填写当前订单信息:</p>
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginBottom: '10px' }}>*如任务商品拍下后产生2个订单号，请将2个订单号同时填写到下方，两个订单号中间用减号&apos;-&apos;隔开。</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>订单编号：</span>
                                <input
                                    type="text"
                                    value={inputValue7}
                                    onChange={(e) => setInputValue7(e.target.value)}
                                    placeholder="请输入订单号"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        {/* 付款金额 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>2. 填写实际付款金额:</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '13px', color: '#666', whiteSpace: 'nowrap' }}>付款金额：</span>
                                <input
                                    type="number"
                                    value={inputNumber}
                                    onChange={(e) => setInputNumber(e.target.value)}
                                    onBlur={inputchange}
                                    placeholder="请输入付款金额"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginTop: '5px' }}>*实际付款金额不得超过或者小于订单金额100元。</p>
                        </div>

                        {/* 订单截图 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '5px' }}>3. 订单详情截图上传:</p>
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
                            <p style={{ fontSize: '12px', color: '#f56c6c', marginTop: '5px' }}>*禁止修改截图上的付款金额，所有优惠后台可见。</p>
                        </div>

                        {/* 收货人信息 */}
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontSize: '13px', color: '#333', marginBottom: '10px' }}>4. 收货人信息：<span style={{ color: 'red' }}>{receiverAddress}</span></p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="address"
                                        value="1"
                                        checked={threeRadio === '1'}
                                        onChange={(e) => setThreeRadio(e.target.value)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ fontSize: '13px', color: threeRadio === '1' ? '#409eff' : '#666' }}>确认下单时是以上收货人信息</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name="address"
                                        value="2"
                                        checked={threeRadio === '2'}
                                        onChange={(e) => setThreeRadio(e.target.value)}
                                        style={{ marginRight: '8px' }}
                                    />
                                    <span style={{ fontSize: '13px', color: threeRadio === '2' ? '#409eff' : '#666' }}>不是以上内容，我要修改成实际下单人的收货信息</span>
                                </label>
                            </div>
                        </div>

                        {/* 修改收货地址 */}
                        {threeRadio === '2' && (
                            <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '4px' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#666' }}>所在地区：</span>
                                    <span>{area.province} {area.city} {area.region}</span>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#666' }}>详细地址：</span>
                                    <input
                                        type="text"
                                        value={inputStreet}
                                        onChange={(e) => setInputStreet(e.target.value)}
                                        placeholder="请输入内容"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                                    />
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#666' }}>收货人姓名：</span>
                                    <input
                                        type="text"
                                        value={inputPerson}
                                        onChange={(e) => setInputPerson(e.target.value)}
                                        placeholder="请输入内容"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                                    />
                                </div>
                                <div>
                                    <span style={{ fontSize: '13px', color: '#666' }}>手机号：</span>
                                    <input
                                        type="text"
                                        value={inputMobile}
                                        onChange={(e) => setInputMobile(e.target.value)}
                                        placeholder="请输入内容"
                                        maxLength={11}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 底部按钮 */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: '#fff',
                padding: '10px 15px',
                borderTop: '1px solid #ddd',
                display: 'flex',
                gap: '10px',
            }}>
                <button
                    onClick={prev}
                    disabled={active === 1}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: active === 1 ? '#ddd' : '#409eff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: active === 1 ? 'not-allowed' : 'pointer',
                    }}
                >
                    上一步
                </button>
                <button
                    onClick={next}
                    disabled={submitting}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: submitting ? '#a0cfff' : '#409eff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '15px',
                        fontWeight: 'bold',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                    }}
                >
                    {submitting ? '提交中...' : '下一步'}
                </button>
            </div>

            {/* 图片预览弹层 */}
            {previewImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
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
