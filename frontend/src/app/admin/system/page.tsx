'use client';

import { useState } from 'react';

export default function AdminSystemPage() {
    const [params, setParams] = useState([
        { key: 'platform_name', label: '平台名称', value: '任务平台', type: 'text' },
        { key: 'service_fee_rate', label: '服务费率 (%)', value: '5', type: 'number' },
        { key: 'withdraw_min', label: '最低提现金额', value: '100', type: 'number' },
        { key: 'withdraw_fee', label: '提现手续费率 (%)', value: '1', type: 'number' },
        { key: 'vip_price', label: 'VIP会员价格', value: '199', type: 'number' },
        { key: 'praise_fee', label: '好评服务费', value: '2', type: 'number' },
        { key: 'img_praise_fee', label: '图文好评服务费', value: '5', type: 'number' },
        { key: 'video_praise_fee', label: '视频好评服务费', value: '10', type: 'number' },
        { key: 'cycle_time_fee', label: '延长周期费', value: '1', type: 'number' },
        { key: 'customer_service', label: '客服联系方式', value: 'service@platform.com', type: 'text' },
    ]);

    const handleSave = () => {
        alert('参数保存成功');
    };

    return (
        <div>
            {/* 基础参数 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '16px', fontWeight: '500' }}>基础参数设置</span>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '8px 20px',
                            background: '#1890ff',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        保存设置
                    </button>
                </div>

                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        {params.map((param, idx) => (
                            <div key={param.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#666', fontSize: '14px' }}>{param.label}</label>
                                <input
                                    type={param.type}
                                    value={param.value}
                                    onChange={e => {
                                        const updated = [...params];
                                        updated[idx].value = e.target.value;
                                        setParams(updated);
                                    }}
                                    style={{
                                        padding: '10px 12px',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '4px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 系统信息 */}
            <div style={{
                background: '#fff',
                borderRadius: '8px',
                marginTop: '20px',
                padding: '24px'
            }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '500' }}>系统信息</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
                        <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>系统版本</div>
                        <div style={{ fontWeight: '500' }}>v2.0.0</div>
                    </div>
                    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
                        <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>数据库状态</div>
                        <div style={{ fontWeight: '500', color: '#52c41a' }}>正常运行</div>
                    </div>
                    <div style={{ padding: '16px', background: '#fafafa', borderRadius: '6px' }}>
                        <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>服务器时间</div>
                        <div style={{ fontWeight: '500' }}>{new Date().toLocaleString('zh-CN')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
