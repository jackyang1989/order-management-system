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
            <div className="overflow-hidden rounded-lg bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <span className="text-base font-medium">基础参数设置</span>
                    <button
                        onClick={handleSave}
                        className="cursor-pointer rounded bg-blue-500 px-5 py-2 text-white hover:bg-blue-600"
                    >
                        保存设置
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                        {params.map((param, idx) => (
                            <div key={param.key} className="flex flex-col gap-2">
                                <label className="text-sm text-slate-500">{param.label}</label>
                                <input
                                    type={param.type}
                                    value={param.value}
                                    onChange={e => {
                                        const updated = [...params];
                                        updated[idx].value = e.target.value;
                                        setParams(updated);
                                    }}
                                    className="rounded border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 系统信息 */}
            <div className="mt-5 rounded-lg bg-white p-6">
                <h3 className="mb-4 text-base font-medium">系统信息</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-md bg-slate-50 p-4">
                        <div className="mb-1 text-xs text-slate-500">系统版本</div>
                        <div className="font-medium">v2.0.0</div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-4">
                        <div className="mb-1 text-xs text-slate-500">数据库状态</div>
                        <div className="font-medium text-green-500">正常运行</div>
                    </div>
                    <div className="rounded-md bg-slate-50 p-4">
                        <div className="mb-1 text-xs text-slate-500">服务器时间</div>
                        <div className="font-medium">{new Date().toLocaleString('zh-CN')}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
