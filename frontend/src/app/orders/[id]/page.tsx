'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { fetchOrderDetail, submitOrderStep } from '../../../services/orderService';
import { MockOrder } from '../../../mocks/orderMock';
import { isAuthenticated } from '../../../services/authService';
import api from '../../../services/api';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [order, setOrder] = useState<MockOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0); // 0 = 验证商品
    const [submitting, setSubmitting] = useState(false);
    const [countdown, setCountdown] = useState<string>('');

    // 商品验证相关状态
    const [productLink, setProductLink] = useState('');
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        valid: boolean;
        actualId?: string;
        error?: string;
    } | null>(null);

    // 表单数据
    const [formData, setFormData] = useState({
        compareScreenshot: null as File | null,
        collectScreenshot: null as File | null,
        orderNumber: '',
        paymentAmount: '',
        orderDetailScreenshot: null as File | null
    });

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadOrder();
    }, [id, router]);

    // 倒计时逻辑
    useEffect(() => {
        if (!order?.endingTime) return;

        const updateCountdown = () => {
            const now = new Date().getTime();
            const endTime = new Date(order.endingTime).getTime();
            const diff = endTime - now;

            if (diff <= 0) {
                setCountdown('已超时');
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setCountdown(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        };

        updateCountdown();
        const timer = setInterval(updateCountdown, 1000);
        return () => clearInterval(timer);
    }, [order?.endingTime]);

    const loadOrder = async () => {
        setLoading(true);
        const result = await fetchOrderDetail(id);
        if (result) {
            setOrder(result);
            // 如果商品已验证过，跳到第一步
            // 这里假设首次进入需要先验证商品
        } else {
            alert('订单不存在');
            router.back();
        }
        setLoading(false);
    };

    const handleValidateProduct = async () => {
        if (!productLink.trim()) {
            alert('请输入淘口令或商品链接');
            return;
        }
        if (!order?.taobaoId) {
            alert('订单商品信息缺失，无法验证');
            return;
        }

        setValidating(true);
        setValidationResult(null);

        try {
            const res = await api.post('/dingdanxia/validate', {
                link: productLink,
                expectedTaobaoId: order.taobaoId
            });

            setValidationResult(res.data);

            if (res.data.valid) {
                // 验证通过，进入第一步
                setCurrentStep(1);
            }
        } catch (error: any) {
            setValidationResult({
                valid: false,
                error: error.response?.data?.message || '验证失败，请检查链接是否正确'
            });
        } finally {
            setValidating(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, [field]: e.target.files[0] });
        }
    };

    const handleSubmitStep = async () => {
        if (currentStep === 1 && !formData.compareScreenshot) {
            alert('请上传货比截图');
            return;
        }
        if (currentStep === 2 && !formData.collectScreenshot) {
            alert('请上传收藏截图');
            return;
        }
        if (currentStep === 3) {
            if (!formData.orderNumber) {
                alert('请输入订单编号');
                return;
            }
            if (!formData.paymentAmount) {
                alert('请输入实际付款金额');
                return;
            }
            if (!formData.orderDetailScreenshot) {
                alert('请上传订单详情截图');
                return;
            }
        }

        setSubmitting(true);
        const result = await submitOrderStep(id, currentStep, formData);
        setSubmitting(false);

        if (result.success) {
            alert(`第 ${currentStep} 步提交成功`);
            if (currentStep < 3) {
                setCurrentStep(currentStep + 1);
            } else {
                alert('任务已完成，等待审核！');
                router.push('/orders');
            }
        } else {
            alert(result.message || '提交失败');
        }
    };

    if (loading) return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    if (!order) return null;

    const steps = [
        { step: 0, title: '验证商品', desc: '输入淘口令验证商品正确' },
        { step: 1, title: '货比三家', desc: '搜索关键词，浏览竞品并截图' },
        { step: 2, title: '浏览收藏', desc: '进店浏览主副商品并收藏' },
        { step: 3, title: '提交订单', desc: '核对信息，提交订单号和截图' }
    ];

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e5e5e5'
            }}>
                <div onClick={() => router.back()} style={{ fontSize: '20px', cursor: 'pointer', width: '30px' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>订单详情</div>
                <div style={{ width: '30px' }}></div>
            </div>

            {/* 倒计时显示 */}
            {countdown && (
                <div style={{
                    position: 'sticky',
                    top: 0,
                    background: countdown === '已超时' ? '#f56c6c' : '#409eff',
                    color: 'white',
                    padding: '8px 15px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    zIndex: 100
                }}>
                    ⏱ 剩余时间：{countdown}
                </div>
            )}

            {/* 订单基本信息 */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px', borderBottom: '1px solid #e5e5e5' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                    订单信息
                </div>
                <div style={{ fontSize: '13px', color: '#666', lineHeight: '2' }}>
                    <div>任务单号：{order.taskNumber}</div>
                    <div>店铺名称：{order.shopName}</div>
                    <div>接手买号：<span style={{ color: '#333', fontWeight: 'bold' }}>{order.buyerAccount}</span></div>
                    <div>垫付本金：<span style={{ color: '#409eff' }}>¥{order.principal}</span></div>
                    <div>任务佣金：<span style={{ color: '#07c160' }}>¥{(order.commission + order.userDivided).toFixed(2)}</span></div>
                    <div>状态：<span style={{ color: order.status === 'PENDING' ? '#e6a23c' : '#67c23a' }}>{order.statusLabel}</span></div>
                </div>
            </div>

            {/* 步骤进度 */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                    任务进度
                </div>
                {steps.map((s, idx) => (
                    <div key={s.step} style={{
                        display: 'flex',
                        marginBottom: idx < steps.length - 1 ? '15px' : '0',
                        opacity: s.step > currentStep ? 0.4 : 1
                    }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: s.step < currentStep ? '#67c23a' : (s.step === currentStep ? '#409eff' : '#ddd'),
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}>
                            {s.step < currentStep ? '✓' : s.step}
                        </div>
                        <div style={{ marginLeft: '12px', flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: s.step === currentStep ? 'bold' : 'normal', color: '#333' }}>
                                {s.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                                {s.desc}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 当前步骤操作 Area */}
            <div style={{ background: '#fff', margin: '10px 0', padding: '15px' }}>
                <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '15px', color: '#333' }}>
                    {currentStep === 0 ? '商品验证' : `第 ${currentStep} 步：${steps[currentStep].title}`}
                </div>

                {/* 步骤0: 商品验证 */}
                {currentStep === 0 && (
                    <div>
                        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '4px', marginBottom: '15px', color: '#409eff', fontSize: '13px', lineHeight: '1.6' }}>
                            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>请先验证商品</p>
                            <p>1. 打开淘宝APP找到任务商品</p>
                            <p>2. 点击分享 → 复制链接/淘口令</p>
                            <p>3. 将淘口令粘贴到下方输入框验证</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>淘口令或商品链接：</div>
                            <textarea
                                value={productLink}
                                onChange={(e) => setProductLink(e.target.value)}
                                placeholder="请粘贴淘口令或商品链接，如：₳Abc123xyz₳ 或 https://item.taobao.com/..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    minHeight: '80px',
                                    resize: 'vertical',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        {/* 验证结果显示 */}
                        {validationResult && (
                            <div style={{
                                padding: '12px',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                background: validationResult.valid ? '#f0f9eb' : '#fef0f0',
                                border: `1px solid ${validationResult.valid ? '#c2e7b0' : '#fbc4c4'}`
                            }}>
                                {validationResult.valid ? (
                                    <div style={{ color: '#67c23a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '18px' }}>✓</span>
                                        <span>商品验证通过！请继续完成任务</span>
                                    </div>
                                ) : (
                                    <div style={{ color: '#f56c6c' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '18px' }}>✗</span>
                                            <span style={{ fontWeight: 'bold' }}>商品验证失败</span>
                                        </div>
                                        <div style={{ fontSize: '12px', marginLeft: '26px' }}>
                                            {validationResult.error}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleValidateProduct}
                            disabled={validating || !productLink.trim()}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: validating || !productLink.trim() ? '#a0cfff' : '#409eff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '15px',
                                fontWeight: 'bold',
                                cursor: validating || !productLink.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {validating ? '验证中...' : '验证商品'}
                        </button>

                        <div style={{ marginTop: '15px', padding: '10px', background: '#fffbe6', borderRadius: '4px', border: '1px solid #ffe58f' }}>
                            <div style={{ color: '#d48806', fontSize: '12px', lineHeight: '1.6' }}>
                                <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>温馨提示：</p>
                                <p>• 验证商品是为了确保您找到的是正确的任务商品</p>
                                <p>• 请确保商品ID与任务商品一致再进行下单</p>
                                <p>• 如验证失败，请检查是否复制了正确的商品链接</p>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 1 && (
                    <div>
                        <div style={{ background: '#fdf6ec', padding: '10px', borderRadius: '4px', marginBottom: '15px', color: '#e6a23c', fontSize: '13px', lineHeight: '1.6' }}>
                            <p>1. 打开淘宝APP首页</p>
                            <p>2. 搜索关键词：<span style={{ color: '#f56c6c', fontWeight: 'bold', userSelect: 'none' }}>{order.keyword}</span></p>
                            <p>3. 浏览3-5家同类商品（竞品），每家停留2分钟以上</p>
                        </div>

                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>上传货比截图：</div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'compareScreenshot')}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        {formData.compareScreenshot && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#67c23a' }}>
                                已选择：{formData.compareScreenshot.name}
                            </div>
                        )}
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                            请上传包含搜索词和浏览记录的截图
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.8' }}>
                        <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '4px', marginBottom: '15px', color: '#409eff' }}>
                            <p>1. 根据搜索结果找到目标商品进店</p>
                            <p>2. 浏览主商品8分钟，副商品5分钟</p>
                            <p>3. 收藏主商品和店铺</p>
                            <p>4. 将商品加入购物车（请选择正确规格）</p>
                        </div>

                        <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>上传收藏/加购截图：</div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'collectScreenshot')}
                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        />
                        {formData.collectScreenshot && (
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#67c23a' }}>
                                已选择：{formData.collectScreenshot.name}
                            </div>
                        )}
                    </div>
                )}

                {currentStep === 3 && (
                    <div>
                        <div style={{ background: '#fef0f0', padding: '10px', borderRadius: '4px', marginBottom: '15px', color: '#f56c6c', fontSize: '13px' }}>
                            <p>注意：请务必核对实际付款金额，禁止使用淘客/返利/红包下单！</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>淘宝订单号：</div>
                            <input
                                type="text"
                                value={formData.orderNumber}
                                onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                                placeholder="请输入淘宝订单号"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>实际付款金额：</div>
                            <input
                                type="number"
                                value={formData.paymentAmount}
                                onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
                                placeholder="请输入实际付款金额"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        <div>
                            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>订单详情截图：</div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileChange(e, 'orderDetailScreenshot')}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                            />
                            {formData.orderDetailScreenshot && (
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#67c23a' }}>
                                    已选择：{formData.orderDetailScreenshot.name}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* 底部提交按钮 - 只在步骤1-3显示 */}
            {currentStep > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    maxWidth: '540px',
                    margin: '0 auto',
                    padding: '10px 15px',
                    background: '#fff',
                    borderTop: '1px solid #ddd'
                }}>
                    <button
                        onClick={handleSubmitStep}
                        disabled={submitting}
                        style={{
                            width: '100%',
                            background: submitting ? '#a0cfff' : '#409eff',
                            border: 'none',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '4px',
                            fontSize: '15px',
                            fontWeight: 'bold',
                            cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {submitting ? '提交中...' : (currentStep < 3 ? '完成此步骤' : '确认提交任务')}
                    </button>
                </div>
            )}
        </div>
    );
}
