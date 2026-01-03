'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getToken } from '../../../services/authService';


const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006';

// 中国省市区数据（简化版）
const PROVINCES = [
    '北京市', '天津市', '上海市', '重庆市', '河北省', '山西省', '辽宁省', '吉林省',
    '黑龙江省', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省', '河南省',
    '湖北省', '湖南省', '广东省', '海南省', '四川省', '贵州省', '云南省', '陕西省',
    '甘肃省', '青海省', '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区'
];

const CITIES: Record<string, string[]> = {
    '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '石景山区', '海淀区', '顺义区', '通州区', '大兴区', '房山区', '门头沟区', '昌平区', '平谷区', '密云区', '怀柔区', '延庆区'],
    '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', '松江区', '青浦区', '奉贤区', '崇明区'],
    '广东省': ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'],
    '浙江省': ['杭州市', '宁波市', '温州市', '嘉兴市', '湖州市', '绍兴市', '金华市', '衢州市', '舟山市', '台州市', '丽水市'],
    '江苏省': ['南京市', '无锡市', '徐州市', '常州市', '苏州市', '南通市', '连云港市', '淮安市', '盐城市', '扬州市', '镇江市', '泰州市', '宿迁市'],
};

interface BuyerAccount {
    id: string;
    platform: string;
    accountName: string;
    receiverName?: string;
    receiverPhone?: string;
    fullAddress?: string;
    wangwangProvince?: string;
    wangwangCity?: string;
    status: number | string;
    rejectReason?: string;
    note?: string;
    star?: number;
    createdAt?: string;
}

interface FormData {

    wangwangProvince: string;  // 对应旧版 provinceValue2
    wangwangCity: string;      // 对应旧版 cityValue2
    wangwangId: string;        // 对应旧版 wangwangIdValue
    img1: string | null;       // 旺旺档案截图 - 对应旧版 img1
    img2: string | null;       // 淘气值截图 - 对应旧版 img2
    // 基本信息
    receiverName: string;      // 对应旧版 renZhengValue (支付宝认证姓名)
    addressProvince: string;   // 对应旧版 provinceValue
    addressCity: string;       // 对应旧版 cityValue
    addressDistrict: string;   // 对应旧版 districtValue
    addressDetail: string;     // 对应旧版 addressValue
    receiverPhone: string;     // 对应旧版 phoneNumValue
    smsCode: string;           // 对应旧版 yzmNumValue
    alipayName: string;        // 对应旧版 renZhengValue
    // 支付宝信息
    img3: string | null;       // 支付宝实名认证截图 - 对应旧版 img3
    img4: string | null;       // 芝麻信用截图 - 对应旧版 img4
}

export default function BuynoPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');
    const [accounts, setAccounts] = useState<BuyerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [countdown, setCountdown] = useState(0);


    const [yzmDisabled, setYzmDisabled] = useState(false);
    const [yzmMsg, setYzmMsg] = useState('发送验证码');
    const timerRef = useRef<NodeJS.Timeout | null>(null);


    const phoneReg = /^1[3-9]\d{9}$/;

    const alertSuccess = useCallback((msg: string) => {
        alert(msg);
    }, []);

    const alertError = useCallback((msg: string) => {
        alert(msg);
    }, []);

    // 地区选择器显示状态
    const [showWangwangArea, setShowWangwangArea] = useState(false);
    const [showAddressArea, setShowAddressArea] = useState(false);

    const [form, setForm] = useState<FormData>({
        wangwangProvince: '',
        wangwangCity: '',
        wangwangId: '',
        img1: null,
        img2: null,
        receiverName: '',
        addressProvince: '',
        addressCity: '',
        addressDistrict: '',
        addressDetail: '',
        receiverPhone: '',
        smsCode: '',
        alipayName: '',
        img3: null,
        img4: null,
    });

    // 示例图URL
    const exampleImages = {
        archive: '/images/examples/wangwang-archive.png',
        taoqizhi: '/images/examples/taoqizhi.png',
        zhima: '/images/examples/zhima.png',
        alipay: '/images/examples/alipay-auth.png',
    };

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadAccounts();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [router]);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const loadAccounts = async () => {
        try {
            const token = getToken();
            const res = await fetch(`${BASE_URL}/mobile/my/buynolist`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.code === 1) {
                setAccounts(data.data || []);
            }
        } catch (error) {
            console.error('Load accounts error:', error);
        } finally {
            setLoading(false);
        }
    };

    // ========================

    // ========================
    const sendSmsCode = async () => {
        if (!form.receiverPhone) {
            return alertError('手机号码不能为空');
        }
        if (!phoneReg.test(form.receiverPhone)) {
            return alertError('手机号码格式不规范,请检查后重新输入');
        }

        try {
            await fetch(`${BASE_URL}/mobile/way/send_code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mobile: form.receiverPhone,
                }),
            });
        } catch (error) {

        }

        let num = 60;
        setYzmDisabled(true);
        setYzmMsg(`还剩 ${num} 秒`);

        timerRef.current = setInterval(() => {
            num--;
            setYzmMsg(`还剩 ${num} 秒`);
            if (num <= 0) {
                clearInterval(timerRef.current!);
                setYzmMsg('重新发送');
                setYzmDisabled(false);
            } else if (num === 59) {
                alertSuccess('验证码发送成功');
            }
        }, 1000);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 转为base64
        const reader = new FileReader();
        reader.onload = () => {
            setForm(prev => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    const validateForm = (): string | null => {
        if (!form.wangwangProvince || !form.wangwangCity) return '请选择旺旺常用登陆地';
        if (!form.wangwangId) return '旺旺ID不能为空';
        if (!form.img1) return '旺旺档案截图不能为空';
        if (!form.img2) return '淘气值截图不能为空';
        if (!form.receiverName) return '收货人姓名不能为空';
        if (!form.addressProvince || !form.addressCity) return '收货地址不能为空';
        if (!form.addressDetail) return '收货地址详细信息不能为空';
        if (!form.receiverPhone) return '收货人手机号码不能为空';
        if (!phoneReg.test(form.receiverPhone)) return '手机号码格式不规范';
        if (!form.smsCode) return '请输入手机验证码';
        if (!form.alipayName) return '支付宝认证姓名不能为空';
        if (!form.img3) return '支付宝实名认证截图不能为空';
        if (!form.img4) return '芝麻信用截图不能为空';
        return null;
    };

    // ========================

    // 参数: wangwangId, provinceValue2, cityValue2, renZhengValue, provinceValue, cityValue, districtValue, addressValue, phoneNumValue, yzmNumValue, img1, img2, img3, img4
    // ========================
    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            alertError(error);
            return;
        }

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/addbuyno`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    wangwangId: form.wangwangId,
                    provinceValue2: form.wangwangProvince,
                    cityValue2: form.wangwangCity,
                    renZhengValue: form.alipayName,
                    provinceValue: form.addressProvince,
                    cityValue: form.addressCity,
                    districtValue: form.addressDistrict,
                    addressValue: form.addressDetail,
                    phoneNumValue: form.receiverPhone,
                    yzmNumValue: form.smsCode,
                    img1: form.img1,
                    img2: form.img2,
                    img3: form.img3,
                    img4: form.img4,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                alertSuccess(data.msg || '买号提交成功，请等待审核');
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        loadAccounts();
                        setActiveTab('list');
                        // 重置表单
                        setForm({
                            wangwangProvince: '',
                            wangwangCity: '',
                            wangwangId: '',
                            img1: null,
                            img2: null,
                            receiverName: '',
                            addressProvince: '',
                            addressCity: '',
                            addressDistrict: '',
                            addressDetail: '',
                            receiverPhone: '',
                            smsCode: '',
                            alipayName: '',
                            img3: null,
                            img4: null,
                        });
                    }
                }, 3000);
            } else {
                alertError(data.msg || '提交失败');
            }
        } catch (error) {
            alertError('网络错误，请重试');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusInfo = (status: number | string) => {
        if (status === 0 || status === 'PENDING') return { text: '未审核', bg: '#fdf6ec', color: '#e6a23c' };
        if (status === 1 || status === 'APPROVED') return { text: '审核通过', bg: '#f0f9eb', color: '#67c23a' };
        if (status === 2 || status === 'REJECTED') return { text: '已禁用', bg: '#fef0f0', color: '#f56c6c' };
        return { text: '未知', bg: '#f5f5f5', color: '#999' };
    };

    const cellStyle = {
        display: 'flex',
        padding: '12px 15px',
        borderBottom: '1px solid #f0f0f0',
        alignItems: 'center',
        background: '#fff',
    };

    const labelStyle = {
        width: '120px',
        fontSize: '14px',
        color: '#333',
    };

    const inputStyle = {
        flex: 1,
        border: 'none',
        fontSize: '14px',
        outline: 'none',
        textAlign: 'right' as const,
        background: 'transparent',
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 页面头部 */}
            <div style={{
                background: '#fff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#333' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>买号添加</div>
            </div>

            {/* Tab切换 */}
            <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => setActiveTab('list')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'list' ? '#1989fa' : '#666',
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                >
                    买号信息
                    {activeTab === 'list' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '2px', background: '#1989fa' }} />}
                </div>
                <div
                    onClick={() => setActiveTab('add')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'add' ? '#1989fa' : '#666',
                        position: 'relative',
                        cursor: 'pointer'
                    }}
                >
                    添加账号
                    {activeTab === 'add' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '2px', background: '#1989fa' }} />}
                </div>
            </div>

            {/* 买号信息列表 */}
            {activeTab === 'list' && (
                <div style={{ padding: '10px' }}>
                    {accounts.length === 0 ? (
                        <div style={{
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '40px 15px',
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            暂无内容
                        </div>
                    ) : (
                        accounts.map(acc => {
                            const statusInfo = getStatusInfo(acc.status);
                            return (
                                <div key={acc.id} style={{
                                    background: '#fff',
                                    borderRadius: '8px',
                                    marginBottom: '10px',
                                    overflow: 'hidden',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', marginBottom: '8px' }}>
                                            <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>旺旺ID：</span>
                                            <span style={{ color: '#333', fontSize: '13px' }}>{acc.accountName}</span>
                                        </div>
                                        <div style={{ display: 'flex', marginBottom: '8px' }}>
                                            <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>收货人：</span>
                                            <span style={{ color: '#333', fontSize: '13px' }}>{acc.receiverName || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', marginBottom: '8px' }}>
                                            <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>收货地址：</span>
                                            <span style={{ color: '#333', fontSize: '13px', flex: 1 }}>{acc.fullAddress || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', marginBottom: '8px' }}>
                                            <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>手机号码：</span>
                                            <span style={{ color: '#333', fontSize: '13px' }}>{acc.receiverPhone || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', marginBottom: '8px' }}>
                                            <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>买号状态：</span>
                                            <span style={{ color: statusInfo.color, fontSize: '13px' }}>{statusInfo.text}</span>
                                        </div>
                                        {acc.note && (
                                            <div style={{ display: 'flex' }}>
                                                <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>备注：</span>
                                                <span style={{ color: '#f56c6c', fontSize: '13px' }}>{acc.note}</span>
                                            </div>
                                        )}
                                        {acc.rejectReason && (
                                            <div style={{ display: 'flex' }}>
                                                <span style={{ width: '80px', color: '#999', fontSize: '13px' }}>拒绝原因：</span>
                                                <span style={{ color: '#f56c6c', fontSize: '13px' }}>{acc.rejectReason}</span>
                                            </div>
                                        )}
                                    </div>
                                    {/* 底部操作区 */}
                                    <div style={{
                                        background: 'linear-gradient(180deg, #f8f8f8 0%, #fff 100%)',
                                        padding: '10px 15px',
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        borderTop: '1px solid #f0f0f0'
                                    }}>
                                        <button
                                            onClick={() => router.push(`/profile/buyno/edit/${acc.id}`)}
                                            style={{
                                                padding: '6px 16px',
                                                background: '#1989fa',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '15px',
                                                fontSize: '12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            信息修改
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    {/* 提示信息 */}
                    <div style={{
                        background: '#fffbe6',
                        borderRadius: '8px',
                        padding: '12px 15px',
                        marginTop: '10px',
                        fontSize: '12px',
                        color: '#666',
                        lineHeight: '1.8'
                    }}>
                        提示：平台优先审核优质女号，买号提交审核后，平台预计在24小时内完成审核操作，只有审核通过的买号才能接手任务 (任务完成后25天后可以复购)
                    </div>
                </div>
            )}

            {/* 添加账号表单 */}
            {activeTab === 'add' && (
                <div>
                    {/* 旺旺信息 */}
                    <div style={{ margin: '10px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 15px', background: '#f8f8f8', fontSize: '14px', fontWeight: '500', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                            旺旺信息
                        </div>
                        {/* 旺旺常用登陆地 */}
                        <div style={cellStyle} onClick={() => setShowWangwangArea(!showWangwangArea)}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>旺旺常用登陆地：</div>
                            <div style={{ flex: 1, textAlign: 'right', color: form.wangwangProvince ? '#333' : '#999', fontSize: '14px' }}>
                                {form.wangwangProvince ? `${form.wangwangProvince} ${form.wangwangCity}` : '请选择省市'}
                            </div>
                            <div style={{ color: '#ccc', marginLeft: '8px' }}>›</div>
                        </div>
                        {showWangwangArea && (
                            <div style={{ padding: '10px 15px', background: '#f9f9f9', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select
                                        value={form.wangwangProvince}
                                        onChange={e => setForm({ ...form, wangwangProvince: e.target.value, wangwangCity: '' })}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        <option value="">请选择省</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <select
                                        value={form.wangwangCity}
                                        onChange={e => setForm({ ...form, wangwangCity: e.target.value })}
                                        style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        <option value="">请选择市</option>
                                        {(CITIES[form.wangwangProvince] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div style={{ fontSize: '12px', color: '#e6a23c', marginTop: '8px', lineHeight: '1.6' }}>
                                    请选择该旺旺经常登录的城市或地区，一经选择后，所有买号对应的收货地址必须和旺旺登录的常用登录地保持一致，绑定后无法自行修改，请谨慎选择
                                </div>
                            </div>
                        )}
                        {/* 旺旺ID */}
                        <div style={cellStyle}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>旺旺ID:</div>
                            <input
                                type="text"
                                placeholder="请填写旺旺ID"
                                value={form.wangwangId}
                                onChange={e => setForm({ ...form, wangwangId: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ padding: '8px 15px', fontSize: '12px', color: '#e6a23c', background: '#fffbe6' }}>
                            请填写该买号使用的旺旺ID，绑定后无法修改，严禁绑定相似的买号。
                        </div>
                        {/* 旺旺档案截图 */}
                        <div style={{ padding: '12px 15px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: '#333' }}><span style={{ color: '#f56c6c' }}>*</span>旺旺档案截图:</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    {form.img1 ? (
                                        <img src={form.img1} alt="已上传" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', border: '1px dashed #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '24px' }}>+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img1')}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>示例图</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>示例图</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '10px', lineHeight: '1.6' }}>
                                请登录淘宝APP，点击"我的淘宝-官方客服-发送"评价管理"点"评价管理（电脑版）"截图即可，所绑定买号必须和截图上一致。绑定成功后无法自行修改，请谨慎选择。
                            </div>
                        </div>
                        {/* 淘气值截图 */}
                        <div style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: '#333' }}><span style={{ color: '#f56c6c' }}>*</span>淘气值截图:</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    {form.img2 ? (
                                        <img src={form.img2} alt="已上传" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', border: '1px dashed #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '24px' }}>+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img2')}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>示例图</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>示例图</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#333', marginTop: '10px', lineHeight: '1.6' }}>
                                请登录淘宝APP，点击"我的淘宝-会员中心"截图即可，所绑定买号必须和截图上一致。
                            </div>
                        </div>
                    </div>

                    {/* 基本信息 */}
                    <div style={{ margin: '10px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 15px', background: '#f8f8f8', fontSize: '14px', fontWeight: '500', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                            基本信息
                        </div>
                        {/* 收货人姓名 */}
                        <div style={cellStyle}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>收货人姓名:</div>
                            <input
                                type="text"
                                placeholder="请输入收货人姓名"
                                value={form.receiverName}
                                onChange={e => setForm({ ...form, receiverName: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ padding: '8px 15px', fontSize: '12px', color: '#e6a23c', background: '#fffbe6' }}>
                            绑定的买号必须是与支付宝实名认证一致的账号，支付宝认证姓名只允许输入6个字以内的中文
                        </div>
                        {/* 收货人地址 */}
                        <div style={cellStyle} onClick={() => setShowAddressArea(!showAddressArea)}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>收货人地址：</div>
                            <div style={{ flex: 1, textAlign: 'right', color: form.addressProvince ? '#333' : '#999', fontSize: '14px' }}>
                                {form.addressProvince ? `${form.addressProvince} ${form.addressCity} ${form.addressDistrict}` : '请选择省市区'}
                            </div>
                            <div style={{ color: '#ccc', marginLeft: '8px' }}>›</div>
                        </div>
                        {showAddressArea && (
                            <div style={{ padding: '10px 15px', background: '#f9f9f9', borderBottom: '1px solid #f0f0f0' }}>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <select
                                        value={form.addressProvince}
                                        onChange={e => setForm({ ...form, addressProvince: e.target.value, addressCity: '', addressDistrict: '' })}
                                        style={{ flex: 1, minWidth: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        <option value="">请选择省</option>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                    <select
                                        value={form.addressCity}
                                        onChange={e => setForm({ ...form, addressCity: e.target.value, addressDistrict: '' })}
                                        style={{ flex: 1, minWidth: '100px', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
                                    >
                                        <option value="">请选择市</option>
                                        {(CITIES[form.addressProvince] || []).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div style={cellStyle}>
                            <input
                                type="text"
                                placeholder="请输入详细地址（街道门牌号）"
                                value={form.addressDetail}
                                onChange={e => setForm({ ...form, addressDetail: e.target.value })}
                                style={{ ...inputStyle, textAlign: 'left' }}
                            />
                        </div>
                        <div style={{ padding: '8px 15px', fontSize: '12px', color: '#e6a23c', background: '#fffbe6' }}>
                            填写的街道地址必须详细到"门牌号"，否则不予通过
                        </div>
                        {/* 收货人手机号 */}
                        <div style={cellStyle}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>收货人手机号:</div>
                            <input
                                type="text"
                                placeholder="请输入手机号"
                                value={form.receiverPhone}
                                onChange={e => setForm({ ...form, receiverPhone: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ padding: '8px 15px', fontSize: '12px', color: '#e6a23c', background: '#fffbe6' }}>
                            该手机号必须与您支付宝上认证的手机号码一致；否则不予审核通过
                        </div>
                        {/* 手机验证码 */}
                        <div style={{ ...cellStyle, justifyContent: 'space-between' }}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>手机验证码:</div>
                            <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'flex-end' }}>
                                <input
                                    type="text"
                                    placeholder="请输入验证码"
                                    maxLength={6}
                                    value={form.smsCode}
                                    onChange={e => setForm({ ...form, smsCode: e.target.value })}
                                    style={{ width: '100px', padding: '6px 10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', textAlign: 'center' }}
                                />
                                <button
                                    onClick={sendSmsCode}
                                    disabled={yzmDisabled}
                                    style={{
                                        padding: '6px 12px',
                                        background: yzmDisabled ? '#a0cfff' : '#1989fa',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        whiteSpace: 'nowrap',
                                        cursor: yzmDisabled ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {yzmMsg}
                                </button>
                            </div>
                        </div>
                        {/* 支付宝认证姓名 */}
                        <div style={cellStyle}>
                            <div style={labelStyle}><span style={{ color: '#f56c6c' }}>*</span>支付宝认证姓名:</div>
                            <input
                                type="text"
                                placeholder="请输入支付宝认证姓名"
                                value={form.alipayName}
                                onChange={e => setForm({ ...form, alipayName: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div style={{ padding: '8px 15px', fontSize: '12px', color: '#e6a23c', background: '#fffbe6' }}>
                            绑定多个买号必须使用不同身份认证的支付宝账号，支付宝认证姓名只允许输入6个字以内的中文
                        </div>
                    </div>

                    {/* 支付宝信息 */}
                    <div style={{ margin: '10px', background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
                        <div style={{ padding: '12px 15px', background: '#f8f8f8', fontSize: '14px', fontWeight: '500', color: '#333', borderBottom: '1px solid #f0f0f0' }}>
                            支付宝信息
                        </div>
                        {/* 支付宝实名认证 */}
                        <div style={{ padding: '12px 15px', borderBottom: '1px solid #f0f0f0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: '#333' }}><span style={{ color: '#f56c6c' }}>*</span>支付宝实名认证:</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    {form.img3 ? (
                                        <img src={form.img3} alt="已上传" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', border: '1px dashed #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '24px' }}>+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img3')}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>示例图</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>示例图</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#333', marginTop: '10px', lineHeight: '1.6' }}>
                                请登录您的"支付宝"，点击"我的-支付宝昵称"，截取您的支付宝"个人信息"作为审核凭证，截图中的姓名必须和您填写的支付宝姓名保持一致、实名制淘宝会员名必须和您上传的旺旺档案截图一致。
                            </div>
                        </div>
                        {/* 芝麻信用截图 */}
                        <div style={{ padding: '12px 15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: '#333' }}><span style={{ color: '#f56c6c' }}>*</span>芝麻信用截图:</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ position: 'relative' }}>
                                    {form.img4 ? (
                                        <img src={form.img4} alt="已上传" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                    ) : (
                                        <div style={{ width: '80px', height: '80px', border: '1px dashed #ddd', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: '24px' }}>+</div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => handleFileUpload(e, 'img4')}
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    />
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', background: '#f5f5f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999' }}>示例图</div>
                                    <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>示例图</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', color: '#333', marginTop: '10px', lineHeight: '1.6' }}>
                                请登录您的"支付宝"，点击"我的-芝麻信用"，截取您的支付宝"芝麻信用"作为审核凭证，截图中的姓名必须和您的支付宝实名认证姓名一致。
                            </div>
                        </div>
                    </div>

                    {/* 保存按钮 */}
                    <div style={{ padding: '20px 15px', display: 'flex', gap: '15px' }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: submitting ? '#ccc' : '#1989fa',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                cursor: submitting ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {submitting ? '提交中...' : '保存'}
                        </button>
                        <button
                            onClick={() => router.back()}
                            style={{
                                flex: 1,
                                padding: '12px',
                                background: '#f5f5f5',
                                color: '#666',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                        >
                            取消
                        </button>
                    </div>

                    {/* 温馨提示 */}
                    <div style={{ margin: '0 10px 20px', background: '#fff', borderRadius: '8px', padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', color: '#e6a23c' }}>
                            <span style={{ marginRight: '5px' }}>⚠️</span>
                            <span style={{ fontSize: '14px', fontWeight: '500' }}>温馨提示</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.8' }}>
                            <p>1.平台优先审核优质女号，注册时间超过1年、实名认证、淘气值≥400，信誉等级3心以上、信誉大于2钻的买号注册时间要超过3年，好评率大于99%的安全号；</p>
                            <p>2.淘宝|天猫可绑1个买号，买号要求绑定的收货信息（收货人姓名、地址、电话均要求真实有效，能联系上买手本人）；</p>
                            <p>3.平台填写的收货信息，务必和淘宝网下单时收货信息保持一致，否则将封闭您的账号，并没收所有佣金；</p>
                            <p>4.必须确保绑定的所有买号收货地址与登录IP地址保持一致，建议还可以写公司地址；</p>
                            <p>5.当买号周评超过参考值或降权＞1以及其他条件不满足要求时，平台将停止派单，请及时申请更换买号；</p>
                            <p>6.买号提交审核后，平台预计在24小时内完成审核操作，超时未审核请咨询客服。</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
