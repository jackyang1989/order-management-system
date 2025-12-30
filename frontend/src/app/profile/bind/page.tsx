'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchBuyerAccounts, addBuyerAccount } from '../../../services/userService';
import { MockBuyerAccount } from '../../../mocks/userMock';

export default function BindAccountPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'list' | 'add'>('list');

    const [accounts, setAccounts] = useState<MockBuyerAccount[]>([]);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        const list = await fetchBuyerAccounts();
        setAccounts(list);
    };

    const [form, setForm] = useState({
        platform: '淘宝',
        account: '',
        receiverArgum: '',
        address: '',
        phone: '',
        screenshots: {
            profile: null,
            taoqizhi: null,
            alipay: null
        }
    });

    const platformConfig: Record<string, { accountLabel: string; screenshots: { label: string; sub: string; key: string }[] }> = {
        '淘宝': {
            accountLabel: '淘宝账号',
            screenshots: [
                { label: '账号截图', sub: '我的淘宝-个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '我的淘宝-评价管理截图', key: 'taoqizhi' },
                { label: '实名截图', sub: '支付宝-实名认证截图', key: 'alipay' }
            ]
        },
        '京东': {
            accountLabel: '京东账号',
            screenshots: [
                { label: '账号截图', sub: '我的京东-个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '我的京东-京享值截图', key: 'taoqizhi' },
                { label: '实名截图', sub: '京东金融-实名认证截图', key: 'alipay' }
            ]
        },
        '拼多多': {
            accountLabel: '拼多多号',
            screenshots: [
                { label: '账号截图', sub: '个人中心截图', key: 'profile' },
                { label: '信誉截图', sub: '个人中心-评价管理', key: 'taoqizhi' },
                { label: '实名截图', sub: '实名认证截图', key: 'alipay' }
            ]
        }
    };

    const currentConfig = platformConfig[form.platform] || platformConfig['淘宝'];

    const handleFileChange = (e: any, field: string) => {
        // Mock file handling
        console.log(`File selected for ${field}`);
    };

    const handleSubmit = async () => {
        if (!form.account || !form.receiverArgum) {
            alert('请完善必填信息');
            return;
        }

        const result = await addBuyerAccount({
            platform: form.platform as any,
            accountName: form.account,
            receiverName: form.receiverArgum,
            receiverPhone: form.phone,
            fullAddress: form.address
        });

        if (result.success) {
            alert(result.message);
            await loadAccounts(); // Refresh list
            setActiveTab('list');
            // Reset form
            setForm({
                platform: '淘宝',
                account: '',
                receiverArgum: '',
                address: '',
                phone: '',
                screenshots: {
                    profile: null,
                    taoqizhi: null,
                    alipay: null
                }
            });
        } else {
            alert(result.message);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* Header */}
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
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>买号管理</div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#fff', marginBottom: '10px', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => setActiveTab('list')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'list' ? '#1989fa' : '#666',
                        position: 'relative'
                    }}
                >
                    买号列表
                    {activeTab === 'list' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#1989fa' }}></div>}
                </div>
                <div
                    onClick={() => setActiveTab('add')}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'add' ? '#1989fa' : '#666',
                        position: 'relative'
                    }}
                >
                    绑定买号
                    {activeTab === 'add' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#1989fa' }}></div>}
                </div>
            </div>

            {/* List View */}
            {activeTab === 'list' && (
                <div style={{ padding: '10px' }}>
                    {accounts.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                            暂无绑定买号，请点击上方“绑定买号”添加
                        </div>
                    ) : (
                        accounts.map(acc => (
                            <div key={acc.id} style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '10px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <span style={{
                                            background: acc.platform === '淘宝' ? '#ff5000' : acc.platform === '京东' ? '#e4393c' : '#e02e24',
                                            color: '#fff',
                                            fontSize: '10px',
                                            padding: '2px 4px',
                                            borderRadius: '2px',
                                            marginRight: '6px'
                                        }}>{acc.platform}</span>
                                        <span style={{ fontWeight: '500', fontSize: '15px', color: '#333' }}>{acc.accountName}</span>
                                    </div>
                                    <span style={{
                                        fontSize: '12px',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        background: (acc.status === 'APPROVED' || acc.status === 1) ? '#f0f9eb' : (acc.status === 'REJECTED' || acc.status === 2) ? '#fef0f0' : '#fdf6ec',
                                        color: (acc.status === 'APPROVED' || acc.status === 1) ? '#67c23a' : (acc.status === 'REJECTED' || acc.status === 2) ? '#f56c6c' : '#e6a23c'
                                    }}>
                                        {(acc.status === 'APPROVED' || acc.status === 1) ? '已审核' : (acc.status === 'REJECTED' || acc.status === 2) ? '审核失败' : '审核中'}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: '#666', lineHeight: '20px' }}>
                                    <div>收货人：{acc.receiverName || '-'}</div>
                                    {acc.rejectReason && <div style={{ color: '#f56c6c' }}>拒绝原因：{acc.rejectReason}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Add View (Form) */}
            {activeTab === 'add' && (
                <div>
                    <div style={{ padding: '10px 15px 5px', fontSize: '12px', color: '#999' }}>基本信息</div>
                    <div style={{ background: '#fff' }}>
                        <div style={{ display: 'flex', padding: '0 15px', height: '50px', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                            <div style={{ width: '90px', fontSize: '14px', color: '#333' }}>平台类型</div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                <select
                                    value={form.platform}
                                    onChange={e => setForm({ ...form, platform: e.target.value })}
                                    style={{
                                        direction: 'rtl',
                                        border: 'none',
                                        background: 'transparent',
                                        fontSize: '14px',
                                        outline: 'none',
                                        appearance: 'none',
                                        color: '#333',
                                        paddingRight: '5px'
                                    }}
                                >
                                    <option value="淘宝">淘宝</option>
                                    <option value="京东">京东</option>
                                    <option value="拼多多">拼多多</option>
                                </select>
                            </div>
                            <div style={{ color: '#ccc', fontSize: '16px' }}>›</div>
                        </div>
                        <div style={{ display: 'flex', padding: '0 15px', height: '50px', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                            <div style={{ width: '90px', fontSize: '14px', color: '#333' }}>{currentConfig.accountLabel}</div>
                            <input
                                type="text"
                                placeholder={`请输入${currentConfig.accountLabel}`}
                                value={form.account}
                                onChange={e => setForm({ ...form, account: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', outline: 'none', textAlign: 'right' }}
                            />
                        </div>
                        <div style={{ display: 'flex', padding: '0 15px', height: '50px', alignItems: 'center' }}>
                            <div style={{ width: '90px', fontSize: '14px', color: '#333' }}>收货人</div>
                            <input
                                type="text"
                                placeholder="请输入收货人姓名"
                                value={form.receiverArgum}
                                onChange={e => setForm({ ...form, receiverArgum: e.target.value })}
                                style={{ flex: 1, border: 'none', fontSize: '14px', outline: 'none', textAlign: 'right' }}
                            />
                        </div>
                    </div>

                    <div style={{ padding: '15px 15px 5px', fontSize: '12px', color: '#999' }}>截图验证</div>
                    <div style={{ background: '#fff' }}>
                        {currentConfig.screenshots.map((item, idx) => (
                            <div key={item.key} style={{ display: 'flex', padding: '12px 15px', borderBottom: idx === currentConfig.screenshots.length - 1 ? 'none' : '1px solid #f5f5f5', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <div style={{ fontSize: '14px', color: '#333' }}>{item.label}</div>
                                    <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>{item.sub}</div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <button style={{
                                        padding: '5px 10px',
                                        background: '#fff',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        color: '#666'
                                    }}>上传图片</button>
                                    <input type="file" style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: '100%',
                                        opacity: 0,
                                        cursor: 'pointer'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '20px 15px' }}>
                        <button
                            onClick={handleSubmit}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(90deg, #1989fa, #409eff)',
                                color: '#fff',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '25px',
                                fontSize: '16px',
                                fontWeight: '500',
                                boxShadow: '0 4px 6px rgba(25, 137, 250, 0.2)'
                            }}
                        >
                            提交审核
                        </button>
                        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '12px', color: '#999' }}>
                            提交后预计 1 个工作日内完成审核
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
