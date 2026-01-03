'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';

// ===================== 类型定义 =====================
interface WithdrawalAccount {
    id: number;
    kaiHuName: string;      // 开户名
    phoneNum: string;       // 手机号
    shenFenZhengNum: string; // 银行卡号（脱敏）
    zhangHao: string;       // 银行名
    zhuangTai: string;      // 状态文字
    remarks: string;        // 备注
    state: number;          // 0: 待审核, 1: 审核完成, 2: 审核不通过
}

interface FormData {
    name: string;           // 开户名
    yinHangName: string;    // 银行名称
    kaiHuName: string;      // 支行名称
    yinHangKaHao: string;   // 银行卡号
    shenFenZhengNum: string; // 身份证号码
    phoneNum: string;       // 手机号码
}

// ===================== 主组件 =====================
export default function WithdrawalAccountPage() {
    const router = useRouter();

    // ===================== 状态 =====================
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [dialogShow, setDialogShow] = useState(false);
    const [tableData, setTableData] = useState<WithdrawalAccount[]>([]);
    const [hasAccount, setHasAccount] = useState(false); // 是否已绑定账户
    const [kaihumingstate, setKaihumingstate] = useState('0'); // 开户名状态
    const [areaShow, setAreaShow] = useState(false);

    // 银行列表
    const [yinHangList] = useState([
        '中国工商银行', '中国农业银行', '中国银行', '中国建设银行',
        '交通银行', '招商银行', '浦发银行', '中信银行',
        '民生银行', '兴业银行', '平安银行', '光大银行'
    ]);

    // 表单数据
    const [form, setForm] = useState<FormData>({
        name: '',
        yinHangName: '',
        kaiHuName: '',
        yinHangKaHao: '',
        shenFenZhengNum: '',
        phoneNum: '',
    });

    // 地区
    const [province, setProvince] = useState('请选择省');
    const [city, setCity] = useState('请选择市');

    // 图片上传
    const [localFile, setLocalFile] = useState<{ file: File; content: string } | null>(null);   // 微信收款码
    const [localFile2, setLocalFile2] = useState<{ file: File; content: string } | null>(null); // 支付宝收款码

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

    // 正则表达式
    const phoneReg = /^1[3-9]\d{9}$/;
    const idcardReg = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    const bankreg = /^(\d{16}|\d{17}|\d{18}|\d{19})$/;

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

    // 状态颜色
    const filterColor = (state: number): string => {
        if (state === 0) return 'orange';
        if (state === 1) return 'blue';
        if (state === 2) return 'red';
        return '#333';
    };

    // 状态文字
    const filterType = (state: number): string => {
        if (state === 0) return '待审核';
        if (state === 1) return '审核完成';
        if (state === 2) return '审核不通过';
        return '';
    };

    // ===================== API 调用 =====================
    // 获取提现账户数据
    const getData = useCallback(async () => {
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/withdrawal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            const res = await response.json();

            if (res.code === 1) {
                const data = res.data;
                if (data.withdeawl) {
                    setHasAccount(true);
                    setKaihumingstate(data.withdeawl.state || '0');

                    // 银行卡号脱敏
                    let bankNo = data.withdeawl.bank_no || '';
                    if (bankNo.length > 8) {
                        bankNo = bankNo.replace(/^(\d{4})\d+(\d{4})$/, '$1 **** **** $2');
                    }

                    setTableData([{
                        id: data.withdeawl.id,
                        kaiHuName: data.withdeawl.bank_user || '',
                        phoneNum: data.withdeawl.mobile || '',
                        shenFenZhengNum: bankNo,
                        zhangHao: data.choose_bank?.name || '',
                        zhuangTai: filterType(data.withdeawl.state),
                        remarks: data.withdeawl.remarks || '',
                        state: data.withdeawl.state || 0,
                    }]);

                    // 填充表单数据
                    setForm({
                        name: data.withdeawl.bank_user || '',
                        yinHangName: data.choose_bank?.name || '',
                        kaiHuName: data.withdeawl.branch_name || '',
                        yinHangKaHao: data.withdeawl.bank_no || '',
                        shenFenZhengNum: data.withdeawl.idcard || '',
                        phoneNum: data.withdeawl.mobile || '',
                    });
                    setProvince(data.withdeawl.province || '请选择省');
                    setCity(data.withdeawl.city || '请选择市');
                }

                // 更新银行列表
                if (data.bank && Array.isArray(data.bank)) {
                    // 使用后端返回的银行列表
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
    }, [getToken, alertError]);

    // 表单验证
    const validateForm = (): boolean => {
        if (!form.name) { alertError('请输入姓名'); return false; }
        if (!form.yinHangName) { alertError('请输入银行名称'); return false; }
        if (province === '请选择省') { alertError('请选择开户行城市'); return false; }
        if (!form.kaiHuName) { alertError('请输入支行名称'); return false; }
        if (!form.yinHangKaHao) { alertError('请输入银行卡号'); return false; }
        if (!bankreg.test(form.yinHangKaHao)) { alertError('银行卡号码格式不规范,请检查后重新输入'); return false; }
        if (!form.shenFenZhengNum) { alertError('请输入身份证号码'); return false; }
        if (!idcardReg.test(form.shenFenZhengNum)) { alertError('身份证号码格式不规范,请检查后重新输入'); return false; }
        if (!form.phoneNum) { alertError('请输入银行预留手机号码'); return false; }
        if (!phoneReg.test(form.phoneNum)) { alertError('手机号码格式不规范,请检查后重新输入'); return false; }
        if (!localFile) { alertError('请上传微信收款码'); return false; }
        if (!localFile2) { alertError('请上传支付宝收款码'); return false; }
        return true;
    };

    // 绑定银行卡（新增）
    const bindActive = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/add_bank_card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: form.name,
                    province: province,
                    city: city,
                    bank_no: form.yinHangKaHao,
                    branch_name: form.kaiHuName,
                    bank_id: form.yinHangName,
                    idcard: form.shenFenZhengNum,
                    mobile: form.phoneNum,
                    idcard_img_a: localFile?.content,
                    idcard_img_b: localFile2?.content,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogShow(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        getData(); // 刷新数据
                    }
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 修改银行卡
    const queDingBtnActive = async () => {
        if (!validateForm()) return;

        setSubmitting(true);
        try {
            const token = getToken();
            const response = await fetch(`${BASE_URL}/mobile/my/edit_bank_card`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({
                    name: form.name,
                    province: province,
                    city: city,
                    bank_no: form.yinHangKaHao,
                    branch_name: form.kaiHuName,
                    bank_id: form.yinHangName,
                    idcard: form.shenFenZhengNum,
                    mobile: form.phoneNum,
                    idcard_img_a: localFile?.content,
                    idcard_img_b: localFile2?.content,
                }),
            });
            const data = await response.json();

            if (data.code === 1) {
                setDialogShow(false);
                alertSuccess(data.msg);
                setTimeout(() => {
                    if (data.url) {
                        router.push(data.url);
                    } else {
                        getData(); // 刷新数据
                    }
                }, 3000);
            } else {
                alertError(data.msg);
            }
        } catch (error) {
            alertError('提交失败');
        } finally {
            setSubmitting(false);
        }
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
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>账号提现</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 标题 */}
            <div style={{ background: '#fff', padding: '12px 15px', marginBottom: '10px' }}>
                <span style={{ color: '#409eff', fontWeight: 'bold' }}>提现账户管理</span>
            </div>

            {/* 内容区域 */}
            <div style={{ padding: '0 10px' }}>
                {!hasAccount ? (
                    // 暂未绑定银行卡
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        padding: '40px 20px',
                        textAlign: 'center',
                    }}>
                        <div style={{ marginBottom: '20px' }}>
                            <img
                                src="/static/mobile/img/yinhangka.png"
                                alt="银行卡"
                                style={{ width: '80px', height: '80px', opacity: 0.5 }}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                        <p style={{ color: '#999', marginBottom: '20px' }}>暂未绑定银行卡和收款码</p>
                        <button
                            onClick={() => setDialogShow(true)}
                            style={{
                                padding: '10px 20px',
                                background: '#409eff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '14px',
                                cursor: 'pointer',
                            }}
                        >
                            + 绑定银行卡和收款码
                        </button>
                    </div>
                ) : (
                    // 已绑定银行卡
                    tableData.map((item, index) => (
                        <div key={index} style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{ padding: '15px' }}>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>开户名：</span><span>{item.kaiHuName}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>预留手机号码：</span><span>{item.phoneNum}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>银行卡号：</span><span>{item.shenFenZhengNum}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>银行：</span><span>{item.zhangHao}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>状态：</span>
                                        <span style={{ color: filterColor(item.state) }}>{filterType(item.state)}</span>
                                    </div>
                                    {item.remarks && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>备注：</span><span>{item.remarks}</span>
                                        </div>
                                    )}
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
                                    onClick={() => setDialogShow(true)}
                                    disabled={item.state === 0}
                                    style={{
                                        padding: '6px 15px',
                                        background: item.state === 0 ? '#ccc' : '#e6a23c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        cursor: item.state === 0 ? 'not-allowed' : 'pointer',
                                    }}
                                >
                                    信息修改
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 绑定银行卡弹框 */}
            {dialogShow && (
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
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        padding: '20px',
                    }}>
                        <h3 style={{ fontSize: '16px', textAlign: 'center', marginBottom: '20px' }}>
                            绑定银行卡和收款码
                        </h3>

                        {/* 开户名 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>开户名：</span>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                disabled={kaihumingstate === '1'}
                                placeholder="请输入姓名"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                        </div>

                        {/* 银行 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>银行：</span>
                            <select
                                value={form.yinHangName}
                                onChange={(e) => setForm({ ...form, yinHangName: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            >
                                <option value="">请选择</option>
                                {yinHangList.map((bank, index) => (
                                    <option key={index} value={bank}>{bank}</option>
                                ))}
                            </select>
                        </div>

                        {/* 开户行城市 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>开户行城市：</span>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <input
                                    type="text"
                                    value={province}
                                    onChange={(e) => setProvince(e.target.value)}
                                    placeholder="请输入省"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="请输入市"
                                    style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                                />
                            </div>
                        </div>

                        {/* 支行名称 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>开户行支行名称：</span>
                            <input
                                type="text"
                                value={form.kaiHuName}
                                onChange={(e) => setForm({ ...form, kaiHuName: e.target.value })}
                                placeholder="请输入内容"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                        </div>

                        {/* 银行卡号 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>银行卡号：</span>
                            <input
                                type="text"
                                value={form.yinHangKaHao}
                                onChange={(e) => setForm({ ...form, yinHangKaHao: e.target.value })}
                                placeholder="请输入银行卡号"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                        </div>

                        {/* 身份证号码 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>身份证号码：</span>
                            <input
                                type="text"
                                value={form.shenFenZhengNum}
                                onChange={(e) => setForm({ ...form, shenFenZhengNum: e.target.value })}
                                placeholder="请输入身份证号码"
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                        </div>

                        {/* 手机号码 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>手机号码：</span>
                            <input
                                type="text"
                                value={form.phoneNum}
                                onChange={(e) => setForm({ ...form, phoneNum: e.target.value })}
                                placeholder="请输入手机号码"
                                maxLength={11}
                                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                        </div>

                        {/* 微信收款码 */}
                        <div style={{ marginBottom: '15px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>微信收款码：</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, setLocalFile)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                            {localFile && (
                                <img
                                    src={localFile.content}
                                    alt="微信收款码"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }}
                                />
                            )}
                        </div>

                        {/* 支付宝收款码 */}
                        <div style={{ marginBottom: '20px' }}>
                            <span style={{ fontSize: '13px', color: '#666' }}>支付宝收款码：</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, setLocalFile2)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '5px' }}
                            />
                            {localFile2 && (
                                <img
                                    src={localFile2.content}
                                    alt="支付宝收款码"
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '10px', borderRadius: '4px' }}
                                />
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setDialogShow(false)}
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
                                onClick={hasAccount ? queDingBtnActive : bindActive}
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
