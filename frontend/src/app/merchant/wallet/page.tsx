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

interface TransactionRecord { id: string; type: 'deposit' | 'withdraw' | 'freeze' | 'unfreeze' | 'deduct'; amount: number; balanceType: 'balance' | 'silver'; memo: string; createdAt: string; }
interface WalletStats { balance: number; frozenBalance: number; silver: number; }
interface BankCard { id: string; bankName: string; cardNumber: string; accountName: string; isDefault: boolean; status: number; }

const typeColorMap: Record<string, string> = { deposit: 'bg-[#f9fafb] border border-[#e5e7eb]', withdraw: 'bg-[#f9fafb] border border-[#e5e7eb]', freeze: 'bg-[#f9fafb] border border-[#e5e7eb]', unfreeze: 'bg-[#f9fafb] border border-[#e5e7eb]', deduct: 'bg-[#f9fafb] border border-[#e5e7eb]' };
const typeIconMap: Record<string, string> = { deposit: '💰', withdraw: '💸', freeze: '🔒', unfreeze: '🔓', deduct: '📤' };

export default function MerchantWalletPage() {
    const [stats, setStats] = useState<WalletStats>({ balance: 0, frozenBalance: 0, silver: 0 });
    const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'silver'>('all');
    const [loading, setLoading] = useState(true);
    const [bankCards, setBankCards] = useState<BankCard[]>([]);
    const [selectedBankCardId, setSelectedBankCardId] = useState<string>('');
    const [minWithdraw, setMinWithdraw] = useState(100); // 动态最低提现金额

    // 导出相关状态
    const [exportModal, setExportModal] = useState(false);
    const [exportType, setExportType] = useState<'balance' | 'silver'>('balance');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exporting, setExporting] = useState(false);

    useEffect(() => { loadStats(); loadTransactions(); loadBankCards(); loadSystemConfigData(); }, []);

    const loadSystemConfigData = async () => {
        const config = await fetchSystemConfig();
        if (config) {
            setMinWithdraw(getMerchantMinWithdraw(config));
        }
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
            if (json.success && json.data) setTransactions(json.data.map((r: any) => ({ id: r.id, type: r.amount > 0 ? 'deposit' : (r.type === 3 ? 'withdraw' : 'deduct'), amount: r.amount, balanceType: r.moneyType === 1 ? 'balance' : 'silver', memo: r.memo || '财务记录', createdAt: r.createdAt })));
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

    // 导出功能
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
        <div className="space-y-6">
            {/* Balance Cards */}
            <div className="grid grid-cols-3 gap-5">
                <div className="rounded-md border border-[#e5e7eb] bg-white p-6">
                    <div className="mb-2 text-sm text-[#6b7280]">可用余额</div>
                    <div className="mb-4 text-3xl font-bold text-primary-600">¥{Number(stats.balance).toFixed(2)}</div>
                    <div className="flex gap-3">
                        <button onClick={openRecharge} className="h-9 flex-1 rounded-md border border-[#e5e7eb] bg-white text-sm font-medium text-primary-500 hover:bg-[#eff6ff]">充值</button>
                        <button onClick={openWithdraw} className="h-9 flex-1 rounded-md border border-primary-500 bg-white text-sm font-medium text-primary-500 hover:bg-[#eff6ff]">提现</button>
                    </div>
                </div>

                <Card className="bg-white" noPadding>
                    <div className="px-6 py-5">
                        <div className="mb-2 text-sm text-[#6b7280]">冻结金额</div>
                        <div className="mb-2 text-3xl font-bold text-warning-500">¥{Number(stats.frozenBalance).toFixed(2)}</div>
                        <div className="text-xs text-[#9ca3af]">用于发布中的任务押金</div>
                    </div>
                </Card>

                <div className="rounded-md border border-[#e5e7eb] bg-white p-6">
                    <div className="mb-2 text-sm text-[#6b7280]">银锭余额</div>
                    <div className="mb-4 text-3xl font-bold text-primary-600">{Number(stats.silver).toFixed(2)}</div>
                    <button onClick={openSilver} className="h-9 w-full rounded-md border border-[#e5e7eb] bg-white text-sm font-medium text-primary-500 hover:bg-[#eff6ff]">充值银锭</button>
                </div>
            </div>

            {/* Transaction History */}
            <Card className="overflow-hidden bg-white" noPadding>
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5e7eb] px-6 py-4">
                    <h2 className="text-lg font-semibold">资金流水</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {(['all', 'balance', 'silver'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)} className={cn('h-9 rounded-md border px-3.5 text-sm', activeTab === tab ? 'border-primary-500 bg-primary-500 text-white' : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#f9fafb]')}>{tab === 'all' ? '全部' : tab === 'balance' ? '余额' : '银锭'}</button>
                        ))}
                        <div className="ml-2 flex gap-2">
                            <button onClick={() => openExport('balance')} className="h-9 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm text-primary-500 hover:bg-[#eff6ff]">导出押金</button>
                            <button onClick={() => openExport('silver')} className="h-9 rounded-md border border-[#e5e7eb] bg-white px-3 text-sm text-primary-500 hover:bg-[#eff6ff]">导出银锭</button>
                        </div>
                    </div>
                </div>

                {loading ? <div className="flex min-h-[200px] items-center justify-center text-[#6b7280]">加载中...</div>
                    : filteredTransactions.length === 0 ? <div className="flex min-h-[200px] items-center justify-center text-[#6b7280]">暂无记录</div>
                        : <div>{filteredTransactions.map((tx, idx) => (
                            <div key={tx.id} className={cn('flex items-center justify-between px-6 py-4', idx < filteredTransactions.length - 1 && 'border-b border-[#e5e7eb]')}>
                                <div className="flex items-center gap-4">
                                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-md text-lg', typeColorMap[tx.type])}>{typeIconMap[tx.type]}</div>
                                    <div><div className="mb-0.5 text-sm font-medium text-[#3b4559]">{tx.memo}</div><div className="text-xs text-[#9ca3af]">{new Date(tx.createdAt).toLocaleString('zh-CN')} · {tx.balanceType === 'balance' ? '余额' : '银锭'}</div></div>
                                </div>
                                <div className={cn('text-base font-semibold', tx.amount > 0 ? 'text-success-600' : 'text-danger-400')}>{tx.amount > 0 ? '+' : ''}{tx.balanceType === 'balance' ? '¥' : ''}{tx.amount.toFixed(2)}</div>
                            </div>
                        ))}</div>
                }
            </Card>

            {/* Recharge/Withdraw/Silver Modal */}
            <Modal title={rechargeModal ? (step === 'payment' ? '扫码支付' : '账户充值') : withdrawModal ? '余额提现' : (step === 'payment' ? '扫码支付' : '充值银锭')} open={rechargeModal || withdrawModal || silverModal} onClose={closeModal}>
                {step === 'input' ? (
                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm text-[#6b7280]">{silverModal ? '充值数量' : withdrawModal ? '提现金额' : '充值金额'}</label>
                            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={silverModal ? '请输入银锭数量' : withdrawModal ? '最低100元' : '请输入金额'} disabled={isLoading} />
                            {withdrawModal && <div className="mt-1 text-xs text-[#9ca3af]">可用余额: ¥{Number(stats.balance).toFixed(2)}</div>}
                        </div>

                        {silverModal && (
                            <div>
                                <label className="mb-2 block text-sm text-[#6b7280]">支付方式</label>
                                <div className="flex gap-3">
                                    <button onClick={() => setPaymentType('alipay')} className={cn('flex-1 rounded-md border px-3 py-2 text-sm', paymentType === 'alipay' ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb] bg-white')}>支付宝支付</button>
                                    <button onClick={() => setPaymentType('balance')} className={cn('flex-1 rounded-md border px-3 py-2 text-sm', paymentType === 'balance' ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb] bg-white')}>余额支付</button>
                                </div>
                                {paymentType === 'balance' && <div className="mt-1 text-xs text-[#9ca3af]">可用余额: ¥{Number(stats.balance).toFixed(2)}</div>}
                            </div>
                        )}

                        {withdrawModal && (
                            <div>
                                <label className="mb-2 block text-sm text-[#6b7280]">提现到银行卡</label>
                                {bankCards.filter(c => c.status === 1).length === 0 ? (
                                    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-sm text-[#6b7280]">暂无可用银行卡，请先添加银行卡并等待审核通过</div>
                                ) : (
                                    <Select value={selectedBankCardId} onChange={v => setSelectedBankCardId(v)} options={bankCards.filter(c => c.status === 1).map(card => ({ value: card.id, label: `${card.bankName} - ${card.cardNumber.slice(-4)}${card.accountName ? ` (${card.accountName})` : ''}` }))} />
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="secondary" onClick={closeModal} disabled={isLoading}>取消</Button>
                            <Button onClick={() => { if (!amount || Number(amount) <= 0) return alert('请输入有效金额'); if (withdrawModal) handleWithdraw(); else if (rechargeModal) handleRecharge(); else handleSilverRecharge(); }} disabled={isLoading || (withdrawModal && bankCards.filter(c => c.status === 1).length === 0)} className={cn((isLoading || (withdrawModal && bankCards.filter(c => c.status === 1).length === 0)) && 'cursor-not-allowed opacity-70')}>
                                {isLoading ? '处理中...' : (withdrawModal ? '提交申请' : (silverModal && paymentType === 'balance' ? '确认充值' : '下一步'))}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="mb-4 text-sm text-[#6b7280]">请使用支付宝扫码支付</div>
                        <div className="mx-auto mb-3 flex h-[200px] w-[200px] flex-col items-center justify-center rounded-md border border-[#e5e7eb] bg-[#f9fafb]">
                            <div className="mb-2 text-5xl">📱</div>
                            <div className="text-xs text-[#9ca3af]">扫码支付</div>
                        </div>
                        <div className="mb-2 text-xs text-[#6b7280]">订单号: {orderNumber}</div>
                        <div className="mb-6 text-2xl font-bold text-primary-600">¥{parseFloat(amount || '0').toFixed(2)}</div>
                        <div className="flex justify-center gap-3">
                            <Button variant="secondary" onClick={closeModal} disabled={isLoading}>取消支付</Button>
                            <Button onClick={confirmPayment} disabled={isLoading}>{isLoading ? '确认中...' : '我已支付'}</Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Export Modal */}
            <Modal title={exportType === 'balance' ? '导出押金流水' : '导出银锭流水'} open={exportModal} onClose={() => setExportModal(false)}>
                <div className="space-y-5">
                    <div className="rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-3 text-sm text-[#6b7280]">
                        最多支持导出31天的数据
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#6b7280]">开始日期</label>
                        <Input type="date" value={exportStartDate} onChange={e => setExportStartDate(e.target.value)} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm text-[#6b7280]">结束日期</label>
                        <Input type="date" value={exportEndDate} onChange={e => setExportEndDate(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setExportModal(false)} disabled={exporting}>取消</Button>
                        <Button onClick={handleExport} disabled={exporting} className={exporting ? 'cursor-not-allowed opacity-70' : ''}>
                            {exporting ? '导出中...' : '确认导出'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
