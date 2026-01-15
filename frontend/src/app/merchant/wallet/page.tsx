'use client';

import { useState, useEffect } from 'react';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Modal } from '../../../components/ui/modal';
import { fetchSystemConfig, getMerchantMinWithdraw } from '../../../services/systemConfigService';

interface TransactionRecord { id: string; type: string; amount: number; balanceType: 'balance' | 'silver'; memo: string; createdAt: string; }
interface WalletStats { balance: number; frozenBalance: number; silver: number; }
interface BankCard { id: string; bankName: string; cardNumber: string; accountName: string; isDefault: boolean; status: number; }

// 根据金额和类型文本动态判断颜色和图标
const getTypeColor = (amount: number, type: string): string => {
    if (amount > 0) return 'bg-emerald-50 text-emerald-600'; // 收入
    if (type.includes('提现') || type.includes('withdraw')) return 'bg-orange-50 text-orange-600';
    if (type.includes('冻结') || type.includes('freeze')) return 'bg-blue-50 text-blue-600';
    if (type.includes('解冻') || type.includes('unfreeze')) return 'bg-indigo-50 text-indigo-600';
    return 'bg-slate-50 text-slate-600'; // 默认
};
const getTypeIcon = (amount: number, type: string): string => {
    if (amount > 0) return '💰'; // 收入
    if (type.includes('提现') || type.includes('withdraw')) return '💸';
    if (type.includes('冻结') || type.includes('freeze')) return '🔒';
    if (type.includes('解冻') || type.includes('unfreeze')) return '🔓';
    return '📋'; // 默认
};

export default function MerchantWalletPage() {
    const [stats, setStats] = useState<WalletStats>({ balance: 0, frozenBalance: 0, silver: 0 });
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'silver'>('all');
    const [loading, setLoading] = useState(true);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedBankCardId, setSelectedBankCardId] = useState<string>('');
    const [minWithdraw, setMinWithdraw] = useState(100);

    const [exportModal, setExportModal] = useState(false);
    const [exportType, setExportType] = useState<'balance' | 'silver'>('balance');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => { loadStats(); loadTransactions(); loadBankCards(); loadSystemConfigData(); }, []);

    const loadSystemConfigData = async () => {
        const config = await fetchSystemConfig();
        if (config) setMinWithdraw(getMerchantMinWithdraw(config));
    };

    const loadStats = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success) setStats({ balance: json.data.balance || 0, frozenBalance: json.data.frozenBalance || 0, silver: json.data.silver || 0 });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadTransactions = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/finance-records/merchant`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success && json.data) setTransactions(json.data.map((r: any) => ({ id: r.id, type: r.changeType || r.memo || '财务记录', amount: r.amount, balanceType: r.moneyType === 1 ? 'balance' : 'silver', memo: r.memo || '财务记录', createdAt: r.createdAt })));
        } catch (e) { console.error('Failed to load transactions:', e); }
    };

    const loadBankCards = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return;
        try {
            const res = await fetch(`${BASE_URL}/merchant-bank-cards`, { headers: { 'Authorization': `Bearer ${token}` } });
            const json = await res.json();
            if (json.success && json.data) {
                setBankCards(json.data);
                const defaultCard = json.data.find((c: BankCard) => c.isDefault && c.status === 1);
                if (defaultCard) setSelectedBankCardId(defaultCard.id);
                else { const approved = json.data.find((c: BankCard) => c.status === 1); if (approved) setSelectedBankCardId(approved.id); }
            }
        } catch (e) { console.error('Failed to load bank cards:', e); }
    };

    const filteredTransactions = transactions.filter(t => activeTab === 'all' || t.balanceType === activeTab);

    const [rechargeModal, setRechargeModal] = useState(false);
    const [withdrawModal, setWithdrawModal] = useState(false);
    const [silverModal, setSilverModal] = useState(false);
    const [step, setStep] = useState<'input' | 'payment'>('input');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [paymentType, setPaymentType] = useState<'alipay' | 'balance'>('alipay');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const openRecharge = () => { setRechargeModal(true); setStep('input'); setAmount(''); setPaymentType('alipay'); };
    const openSilver = () => { setSilverModal(true); setStep('input'); setAmount(''); setPaymentType('alipay'); };
    const openWithdraw = () => { setWithdrawModal(true); setStep('input'); setAmount(''); };
    const closeModal = () => { setRechargeModal(false); setWithdrawModal(false); setSilverModal(false); setAmount(''); setStep('input'); setIsLoading(false); setQrCodeUrl(''); setOrderNumber(''); };

    const openExport = (type: 'balance' | 'silver') => {
        setExportType(type);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 7);
        setExportStartDate(start.toISOString().split('T')[0]);
        setExportEndDate(end.toISOString().split('T')[0]);
        setExportModal(true);
    };

    const handleExport = async () => {
        if (!exportStartDate || !exportEndDate) { alert('请选择导出时间范围'); return; }
        const start = new Date(exportStartDate);
        const end = new Date(exportEndDate);
        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 31) { alert('最多下载时间区间为31天'); return; }
        if (diffDays < 0) { alert('结束日期不能早于开始日期'); return; }

        const token = localStorage.getItem('merchantToken');
        if (!token) { alert('请先登录'); return; }

        setExporting(true);
        try {
            const url = exportType === 'balance'
                ? `${BASE_URL}/finance-records/merchant/balance/export?startDate=${exportStartDate}&endDate=${exportEndDate}`
                : `${BASE_URL}/finance-records/merchant/silver/export?startDate=${exportStartDate}&endDate=${exportEndDate}`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) { const errorText = await res.text(); throw new Error(errorText || '导出失败'); }

            const blob = await res.blob();
            const filename = exportType === 'balance' ? `押金财务导出表_${exportStartDate}_${exportEndDate}.csv` : `银锭财务导出表_${exportStartDate}_${exportEndDate}.csv`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            setExportModal(false);
            alert('导出成功！');
        } catch (e: any) { alert(e.message || '导出失败'); }
        finally { setExporting(false); }
    };

    const handleRecharge = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/recharge/merchant/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount), rechargeType: 1, paymentMethod: 1 }) });
            const json = await res.json();
            if (json.success) { setOrderNumber(json.data.orderNumber); setQrCodeUrl(json.payUrl || `/pay/alipay?orderNumber=${json.data.orderNumber}&amount=${amount}`); setStep('payment'); }
            else alert(json.message || '创建充值订单失败');
        } catch { alert('网络错误，请重试'); }
        finally { setIsLoading(false); }
    };

    const confirmPayment = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token || !orderNumber) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/recharge/callback/alipay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber, tradeNo: `TRADE_${Date.now()}`, success: true }) });
            const json = await res.json();
            if (json.success) { alert('充值成功！'); closeModal(); loadStats(); loadTransactions(); }
            else alert(json.message || '支付确认失败');
        } catch { alert('网络错误，请重试'); }
        finally { setIsLoading(false); }
    };

    const handleWithdraw = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');
        if (Number(amount) < minWithdraw) return alert(`最低提现金额为${minWithdraw}元`);
        if (Number(amount) > stats.balance) return alert('余额不足');
        const approvedCards = bankCards.filter(c => c.status === 1);
        if (approvedCards.length === 0) return alert('请先添加并等待银行卡审核通过');
        if (!selectedBankCardId) return alert('请选择提现银行卡');
        setIsLoading(true);
        try {
            const res = await fetch(`${BASE_URL}/merchant-withdrawals`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount), bankCardId: selectedBankCardId, type: 1 }) });
            const json = await res.json();
            if (json.success) { alert('提现申请已提交，请等待审核'); closeModal(); loadStats(); loadTransactions(); }
            else alert(json.message || '提现申请失败');
        } catch { alert('网络错误，请重试'); }
        finally { setIsLoading(false); }
    };

    const handleSilverRecharge = async () => {
        const token = localStorage.getItem('merchantToken');
        if (!token) return alert('请先登录');
        if (!amount || Number(amount) <= 0) return alert('请输入有效金额');
        setIsLoading(true);
        try {
            if (paymentType === 'balance') {
                if (Number(amount) > stats.balance) { alert('余额不足'); setIsLoading(false); return; }
                const res = await fetch(`${BASE_URL}/recharge/merchant/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount), rechargeType: 2, paymentMethod: 2 }) });
                const json = await res.json();
                if (json.success) { await fetch(`${BASE_URL}/recharge/callback/alipay`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderNumber: json.data.orderNumber, tradeNo: `BALANCE_${Date.now()}`, success: true }) }); alert('银锭充值成功！'); closeModal(); loadStats(); loadTransactions(); }
                else alert(json.message || '银锭充值失败');
            } else {
                const res = await fetch(`${BASE_URL}/recharge/merchant/create`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ amount: Number(amount), rechargeType: 2, paymentMethod: 1 }) });
                const json = await res.json();
                if (json.success) { setOrderNumber(json.data.orderNumber); setQrCodeUrl(json.payUrl || `/pay/alipay?orderNumber=${json.data.orderNumber}&amount=${amount}`); setStep('payment'); }
                else alert(json.message || '创建充值订单失败');
            }
        } catch { alert('网络错误，请重试'); }
        finally { setIsLoading(false); }
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-black text-slate-900">我的钱包</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Available Balance Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary-600 to-primary-700 p-8 text-white shadow-xl shadow-primary-500/20">
                    <div className="relative z-10">
                        <div className="mb-2 text-sm font-medium text-primary-100">可用余额 (元)</div>
                        <div className="mb-8 text-4xl font-extrabold tracking-tight">¥{Number(stats.balance).toFixed(2)}</div>
                        <div className="flex gap-3">
                            <button onClick={openRecharge} className="h-10 flex-1 rounded-[14px] bg-white/20 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                                充值
                            </button>
                            <button onClick={openWithdraw} className="h-10 flex-1 rounded-[14px] bg-white text-sm font-bold text-primary-600 shadow-md transition-colors hover:bg-primary-50">
                                提现
                            </button>
                        </div>
                    </div>
                    {/* Decorative Gradient Blob */}
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-500/30 blur-3xl"></div>
                </div>

                {/* Frozen Balance Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <div className="relative z-10">
                        <div className="mb-2 text-sm font-bold text-slate-400">冻结余额 (元)</div>
                        <div className="mb-2 text-4xl font-extrabold tracking-tight text-slate-900">¥{Number(stats.frozenBalance).toFixed(2)}</div>
                        <div className="text-sm font-medium text-slate-400">用于发布中的任务押金及进行中任务</div>
                    </div>
                </div>

                {/* Silver Balance Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white shadow-xl shadow-slate-500/20">
                    <div className="relative z-10">
                        <div className="mb-2 text-sm font-medium text-slate-400">银锭余额 (个)</div>
                        <div className="mb-8 text-4xl font-extrabold tracking-tight text-amber-400">{Number(stats.silver).toFixed(2)}</div>
                        <button onClick={openSilver} className="h-10 w-full rounded-[14px] bg-amber-500 text-sm font-bold text-white shadow-lg shadow-amber-500/20 transition-colors hover:bg-amber-600">
                            充值银锭
                        </button>
                    </div>
                    <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-slate-700/50 blur-3xl"></div>
                </div>
            </div>

            {/* Transaction History */}
            <Card className="overflow-hidden rounded-[32px] border-0 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]" noPadding>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 px-8 py-6">
                    <h2 className="text-xl font-black text-slate-900">资金流水</h2>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex gap-2 rounded-[16px] bg-slate-50 p-1">
                            {(['all', 'balance', 'silver'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        'h-8 rounded-[12px] px-4 text-xs font-bold transition-all',
                                        activeTab === tab
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600'
                                    )}
                                >
                                    {tab === 'all' ? '全部' : tab === 'balance' ? '余额' : '银锭'}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-slate-100"></div>
                        <div className="flex gap-2">
                            <button onClick={() => openExport('balance')} className="h-8 rounded-[12px] bg-slate-50 px-4 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50">导出押金</button>
                            <button onClick={() => openExport('silver')} className="h-8 rounded-[12px] bg-slate-50 px-4 text-xs font-bold text-primary-600 transition-colors hover:bg-primary-50">导出银锭</button>
                        </div>
                    </div>
                </div>

                <div className="p-2">
                    {loading ? <div className="flex min-h-[300px] items-center justify-center font-bold text-slate-300">加载中...</div>
                        : filteredTransactions.length === 0 ? (
                            <div className="flex min-h-[300px] flex-col items-center justify-center text-slate-300">
                                <div className="mb-4 text-4xl opacity-50">💸</div>
                                <div className="font-bold">暂无资金记录</div>
                            </div>
                        ) : (
                            <div className="space-y-1 p-2">
                                {filteredTransactions.map((tx) => (
                                    <div key={tx.id} className="group flex items-center justify-between rounded-[20px] p-4 transition-colors hover:bg-slate-50">
                                        <div className="flex items-center gap-5">
                                            <div className={cn('flex h-12 w-12 items-center justify-center rounded-[18px] text-xl', typeColorMap[tx.type])}>
                                                {typeIconMap[tx.type]}
                                            </div>
                                            <div>
                                                <div className="mb-1 font-bold text-slate-900">{tx.memo}</div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                                    <span>{new Date(tx.createdAt).toLocaleString('zh-CN')}</span>
                                                    <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                                                    <span>{tx.balanceType === 'balance' ? '余额' : '银锭'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={cn('text-lg font-black font-mono', tx.amount > 0 ? 'text-emerald-500' : 'text-slate-900')}>
                                            {tx.amount > 0 ? '+' : ''}{tx.balanceType === 'balance' ? '¥' : ''}{tx.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    }
                </div>
            </Card>

            {/* Modals */}
            <Modal title={rechargeModal ? (step === 'payment' ? '扫码支付' : '账户充值') : withdrawModal ? '余额提现' : (step === 'payment' ? '扫码支付' : '充值银锭')} open={rechargeModal || withdrawModal || silverModal} onClose={closeModal} className="rounded-[32px]">
                {step === 'input' ? (
                    <div className="space-y-6">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">{silverModal ? '充值数量' : withdrawModal ? '提现金额' : '充值金额'}</label>
                            <div className="relative">
                                {!silverModal && <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">¥</span>}
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder={silverModal ? '请输入银锭数量' : withdrawModal ? '最低100元' : '请输入金额'}
                                    disabled={isLoading}
                                    className={cn("h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20", !silverModal && "pl-8")}
                                />
                            </div>
                            {withdrawModal && <div className="mt-2 text-xs font-bold text-slate-400">可用余额: ¥{Number(stats.balance).toFixed(2)}</div>}
                        </div>

                        {silverModal && (
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">支付方式</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setPaymentType('alipay')} className={cn('flex-1 rounded-[16px] border-2 px-3 py-3 text-sm font-bold transition-all', paymentType === 'alipay' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200')}>支付宝支付</button>
                                    <button onClick={() => setPaymentType('balance')} className={cn('flex-1 rounded-[16px] border-2 px-3 py-3 text-sm font-bold transition-all', paymentType === 'balance' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200')}>余额支付</button>
                                </div>
                                {paymentType === 'balance' && <div className="mt-2 text-xs font-bold text-slate-400">可用余额: ¥{Number(stats.balance).toFixed(2)}</div>}
                            </div>
                        )}

                        {withdrawModal && (
                            <div>
                                <label className="mb-2 block text-xs font-bold uppercase text-slate-400">提现到银行卡</label>
                                {bankCards.filter(c => c.status === 1).length === 0 ? (
                                    <div className="rounded-[16px] bg-slate-50 p-4 text-center text-sm font-bold text-slate-400">暂无可用银行卡，请先添加银行卡</div>
                                ) : (
                                    <div className="relative">
                                        <Select
                                            value={selectedBankCardId}
                                            onChange={v => setSelectedBankCardId(v)}
                                            options={bankCards.filter(c => c.status === 1).map(card => ({ value: card.id, label: `${card.bankName} - ${card.cardNumber.slice(-4)}${card.accountName ? ` (${card.accountName})` : ''}` }))}
                                            className="h-12 w-full appearance-none rounded-[16px] border-none bg-slate-50 px-4 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20 outline-none"
                                        />
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeModal} disabled={isLoading} className="h-11 rounded-[14px] bg-slate-100 font-bold text-slate-500 hover:bg-slate-200">取消</Button>
                            <Button
                                onClick={() => { if (!amount || Number(amount) <= 0) return alert('请输入有效金额'); if (withdrawModal) handleWithdraw(); else if (rechargeModal) handleRecharge(); else handleSilverRecharge(); }}
                                disabled={isLoading || (withdrawModal && bankCards.filter(c => c.status === 1).length === 0)}
                                className="h-11 rounded-[14px] bg-primary-600 font-bold text-white hover:bg-primary-700"
                            >
                                {isLoading ? '处理中...' : (withdrawModal ? '提交申请' : (silverModal && paymentType === 'balance' ? '确认充值' : '下一步'))}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mb-4 text-sm font-bold text-slate-400">请使用支付宝扫码支付</div>
                        <div className="mx-auto mb-4 flex h-[240px] w-[240px] flex-col items-center justify-center rounded-[24px] bg-slate-50">
                            {/* In a real app, QR Code would be here. For now, using emoji or placeholder if no URL */}
                            {qrCodeUrl && !qrCodeUrl.startsWith('/pay') ? (
                                <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48" />
                            ) : (
                                <>
                                    <div className="mb-2 text-6xl">📱</div>
                                    <div className="font-bold text-slate-300">扫码支付</div>
                                </>
                            )}
                        </div>
                        <div className="mb-2 text-xs font-mono text-slate-400">{orderNumber}</div>
                        <div className="mb-8 text-3xl font-black text-slate-900">¥{parseFloat(amount || '0').toFixed(2)}</div>
                        <div className="flex justify-center gap-3">
                            <Button variant="secondary" onClick={closeModal} disabled={isLoading} className="h-10 rounded-[12px]">取消支付</Button>
                            <Button onClick={confirmPayment} disabled={isLoading} className="h-10 rounded-[12px]">我已支付</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Export Modal */}
            <Modal title={exportType === 'balance' ? '导出押金流水' : '导出银锭流水'} open={exportModal} onClose={() => setExportModal(false)} className="rounded-[32px]">
                <div className="space-y-6">
                    <div className="rounded-[20px] bg-blue-50 p-4 text-center text-sm font-bold text-blue-600">
                        最多支持导出31天的数据
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">开始日期</label>
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">结束日期</label>
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 focus:ring-2 focus:ring-primary-500/20" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setExportModal(false)} disabled={exporting} className="h-11 rounded-[14px]">取消</Button>
                        <Button onClick={handleExport} disabled={exporting} className="h-11 rounded-[14px]">
                            {exporting ? '导出中...' : '确认导出'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
