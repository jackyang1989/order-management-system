'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, NavBar, Card, List, Tag, Tabs, DotLoading, Selector, NoticeBar } from 'antd-mobile';
import { isAuthenticated, getCurrentUser } from '../../../services/authService';
import { fetchBankCards, fetchWithdrawals, createWithdrawal, BankCard, Withdrawal } from '../../../services/userService';
import { BASE_URL } from '../../../../apiConfig';

export default function WithdrawPage() {
    const router = useRouter();
    const [form] = Form.useForm();
    const [confirmForm] = Form.useForm();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<string>('principal');
    const [balance, setBalance] = useState({ principal: 0, silver: 0, frozenSilver: 0 });
    const [records, setRecords] = useState<Withdrawal[]>([]);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [captchaId, setCaptchaId] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [withdrawData, setWithdrawData] = useState<{ amount: number; type: string } | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const feeRate = 0.05;
    const minWithdraw = 10;

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    useEffect(() => {
        if (!isAuthenticated()) { router.push('/login'); return; }
        loadData();
        loadCaptcha();
    }, [router]);

    const loadCaptcha = async () => {
        try {
            const res = await fetch(`${BASE_URL}/captcha/generate`);
            const data = await res.json();
            if (data.captchaId && data.svg) { setCaptchaId(data.captchaId); setCaptchaSvg(data.svg); }
        } catch (e) { console.error('加载验证码失败', e); }
    };

    const loadData = async () => {
        try {
            const user = getCurrentUser();
            if (user) { setBalance({ principal: Number(user.balance) || 0, silver: Number(user.silver) || 0, frozenSilver: Number(user.frozenSilver) || 0 }); }
            const cards = await fetchBankCards();
            setBankCards(cards);
            if (cards.length > 0) { const defaultCard = cards.find(c => c.isDefault) || cards[0]; setSelectedCard(defaultCard.id); }
            const withdrawals = await fetchWithdrawals();
            setRecords(withdrawals);
        } catch (error) { console.error('Load data error:', error); } finally { setLoading(false); }
    };

    const getAvailableBalance = () => activeTab === 'principal' ? balance.principal : (balance.silver - balance.frozenSilver);
    const calculateFee = (amount: number) => activeTab === 'principal' ? 0 : amount * feeRate;
    const calculateActual = (amount: number) => amount - calculateFee(amount);

    const handleWithdrawClick = (values: { amount: string }) => {
        const amount = parseFloat(values.amount);
        if (!amount || amount < minWithdraw) { showMessage('error', `最低提现金额 ${minWithdraw} 元`); return; }
        if (amount > getAvailableBalance()) { showMessage('error', '提现金额超过可用余额'); return; }
        if (!selectedCard) { showMessage('error', '请选择银行卡'); return; }
        setWithdrawData({ amount, type: activeTab });
        setShowConfirm(true);
    };

    const handleConfirmWithdraw = async (values: { captcha: string; payPassword: string }) => {
        if (!values.captcha) { showMessage('error', '请输入验证码'); return; }
        if (!values.payPassword) { showMessage('error', '请输入支付密码'); return; }
        if (!withdrawData) return;

        // Verify captcha
        try {
            const captchaRes = await fetch(`${BASE_URL}/captcha/verify`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ captchaId, code: values.captcha }),
            });
            const captchaData = await captchaRes.json();
            if (!captchaData.valid) { showMessage('error', '验证码错误'); loadCaptcha(); return; }
        } catch (e) { showMessage('error', '验证码校验失败'); loadCaptcha(); return; }

        setSubmitting(true);
        try {
            await createWithdrawal({
                amount: withdrawData.amount,
                bankCardId: selectedCard,
                type: activeTab === 'principal' ? 1 : 2,
            });
            showMessage('success', '提现申请已提交');
            setShowConfirm(false);
            form.resetFields();
            confirmForm.resetFields();
            loadData();
            loadCaptcha();
        } catch (error: any) {
            showMessage('error', error.message || '提现失败');
            loadCaptcha();
        } finally { setSubmitting(false); }
    };

    const getStatusTag = (status: number) => {
        const colors: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'default'> = {
            0: 'warning', 1: 'success', 2: 'danger', 3: 'default',
        };
        const texts: Record<number, string> = { 0: '审核中', 1: '已通过', 2: '已拒绝', 3: '已完成' };
        return <Tag color={colors[status] || 'default'}>{texts[status] || '未知'}</Tag>;
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><DotLoading color="primary" /></div>;

    return (
        <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
            <NavBar onBack={() => router.back()}>提现</NavBar>

            {/* Balance Cards */}
            <div style={{ padding: 16 }}>
                <Card style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: '8px 0' }}>
                        <div>
                            <div style={{ fontSize: 24, fontWeight: 600 }}>¥{balance.principal.toFixed(2)}</div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>本金余额</div>
                        </div>
                        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: 24 }}>
                            <div style={{ fontSize: 24, fontWeight: 600 }}>{balance.silver.toFixed(2)}</div>
                            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>银锭余额</div>
                        </div>
                    </div>
                </Card>
            </div>

            <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ '--title-font-size': '15px' }}>
                <Tabs.Tab title="本金提现" key="principal">
                    <div style={{ padding: 16 }}>
                        <Form form={form} layout="vertical" onFinish={handleWithdrawClick}>
                            <Form.Item name="amount" label={`可提现: ¥${getAvailableBalance().toFixed(2)}`}>
                                <Input placeholder="输入提现金额" type="number" style={{ '--font-size': '20px', '--text-align': 'center' }} />
                            </Form.Item>

                            {bankCards.length > 0 ? (
                                <Form.Item label="选择银行卡">
                                    <Selector
                                        options={bankCards.map(c => ({ label: `${c.bankName} *${c.cardNumber.slice(-4)}`, value: c.id }))}
                                        value={[selectedCard]}
                                        onChange={(v) => setSelectedCard(v[0] as string)}
                                    />
                                </Form.Item>
                            ) : (
                                <NoticeBar content="请先绑定银行卡" color="alert" onClick={() => router.push('/profile/bank')} />
                            )}

                            <Button block color="primary" size="large" type="submit" disabled={bankCards.length === 0} style={{ marginTop: 16, borderRadius: 24 }}>
                                申请提现
                            </Button>
                        </Form>
                    </div>
                </Tabs.Tab>

                <Tabs.Tab title="银锭提现" key="silver">
                    <div style={{ padding: 16 }}>
                        <NoticeBar content={`银锭提现手续费: ${feeRate * 100}%`} color="info" style={{ marginBottom: 16 }} />
                        <Form layout="vertical" onFinish={handleWithdrawClick}>
                            <Form.Item name="amount" label={`可提现银锭: ${(balance.silver - balance.frozenSilver).toFixed(2)}`}>
                                <Input placeholder="输入提现银锭数量" type="number" style={{ '--font-size': '20px', '--text-align': 'center' }} />
                            </Form.Item>

                            {bankCards.length > 0 ? (
                                <Form.Item label="选择银行卡">
                                    <Selector
                                        options={bankCards.map(c => ({ label: `${c.bankName} *${c.cardNumber.slice(-4)}`, value: c.id }))}
                                        value={[selectedCard]}
                                        onChange={(v) => setSelectedCard(v[0] as string)}
                                    />
                                </Form.Item>
                            ) : (
                                <NoticeBar content="请先绑定银行卡" color="alert" onClick={() => router.push('/profile/bank')} />
                            )}

                            <Button block color="primary" size="large" type="submit" disabled={bankCards.length === 0} style={{ marginTop: 16, borderRadius: 24 }}>
                                申请提现
                            </Button>
                        </Form>
                    </div>
                </Tabs.Tab>

                <Tabs.Tab title="提现记录" key="records">
                    <div style={{ padding: 16 }}>
                        <List>
                            {records.length === 0 ? (
                                <List.Item>暂无提现记录</List.Item>
                            ) : records.map(r => (
                                <List.Item
                                    key={r.id}
                                    description={new Date(r.createdAt).toLocaleString('zh-CN')}
                                    extra={getStatusTag(r.status)}
                                >
                                    <div style={{ fontWeight: 500 }}>¥{Number(r.amount).toFixed(2)}</div>
                                </List.Item>
                            ))}
                        </List>
                    </div>
                </Tabs.Tab>
            </Tabs>

            {/* Toast Message */}
            {message && (
                <div style={{
                    position: 'fixed',
                    top: 60,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '12px 24px',
                    borderRadius: 8,
                    background: message.type === 'success' ? '#52c41a' : '#ff4d4f',
                    color: '#fff',
                    fontSize: 14,
                    zIndex: 1000,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}>
                    {message.text}
                </div>
            )}

            {/* Confirm Modal */}
            {showConfirm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 999
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: 12,
                        width: '90%',
                        maxWidth: 360,
                        padding: 20,
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ margin: 0, fontSize: 18 }}>确认提现</h3>
                            <span
                                onClick={() => { setShowConfirm(false); confirmForm.resetFields(); loadCaptcha(); }}
                                style={{ cursor: 'pointer', fontSize: 20, color: '#999' }}
                            >×</span>
                        </div>

                        {withdrawData && (
                            <Form form={confirmForm} onFinish={handleConfirmWithdraw}>
                                <div style={{ marginBottom: 16, textAlign: 'center' }}>
                                    <div style={{ fontSize: 28, fontWeight: 600, color: '#1677ff' }}>¥{calculateActual(withdrawData.amount).toFixed(2)}</div>
                                    {activeTab === 'silver' && <div style={{ fontSize: 12, color: '#999' }}>手续费: ¥{calculateFee(withdrawData.amount).toFixed(2)}</div>}
                                </div>

                                <Form.Item name="captcha" label="图形验证码">
                                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <Input placeholder="验证码" style={{ flex: 1 }} />
                                        <div
                                            onClick={loadCaptcha}
                                            style={{ width: 100, height: 36, background: '#f5f5f5', borderRadius: 4, overflow: 'hidden', cursor: 'pointer' }}
                                            dangerouslySetInnerHTML={{ __html: captchaSvg || '加载中...' }}
                                        />
                                    </div>
                                </Form.Item>

                                <Form.Item name="payPassword" label="支付密码">
                                    <Input placeholder="请输入支付密码" type="password" />
                                </Form.Item>

                                <Button block color="primary" type="submit" loading={submitting}>确认提现</Button>
                            </Form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
