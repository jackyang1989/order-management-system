'use client';

import { TaskFormData } from './types';

interface StepProps {
    data: TaskFormData;
    onChange: (data: Partial<TaskFormData>) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step2ValueAdded({ data, onChange, onPrev, onNext }: StepProps) {

    // Initialize/Resize praise arrays when count changes or type changes
    const ensurePraiseArrays = (count: number) => {
        let newList = [...data.praiseList];
        if (newList.length !== count) {
            newList = Array(count).fill('');
        }
        // TODO: Handle Image lists similarly if we implement image upload
        return newList;
    };

    const handlePraiseChange = (type: 'text' | 'image' | 'video' | 'none') => {
        const resetData: Partial<TaskFormData> = {
            isPraise: type !== 'none',
            praiseType: type,
            praiseList: type === 'text' ? ensurePraiseArrays(data.count) : [],
        };

        let fee = 0;
        switch (type) {
            case 'text': fee = 2.0; break;
            case 'image': fee = 4.0; break;
            case 'video': fee = 10.0; break;
        }
        resetData.praiseFee = fee;
        onChange(resetData);
    };

    const handlePraiseContentChange = (index: number, val: string) => {
        const newList = [...data.praiseList];
        newList[index] = val;
        onChange({ praiseList: newList });
    };

    return (
        <div style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
                第二步：增值服务配置
            </h2>

            {/* Shipping */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>物流设置</h3>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input type="radio" checked={data.isFreeShipping === 1} onChange={() => onChange({ isFreeShipping: 1 })} />
                        <span>商家包邮 (默认)</span>
                    </label>
                </div>
            </div>

            {/* Praise Settings */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>好评设置</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
                    {[
                        { type: 'none', label: '默认好评', desc: '不强制内容', fee: 0 },
                        { type: 'text', label: '文字好评', desc: '指定好评内容', fee: 2 },
                        { type: 'image', label: '图文好评', desc: '指定图片+文字', fee: 4 }, // Mock 4.0
                        { type: 'video', label: '视频好评', desc: '指定视频+文字', fee: 10 },
                    ].map(opt => (
                        <div
                            key={opt.type}
                            onClick={() => handlePraiseChange(opt.type as any)}
                            style={{
                                border: `1px solid ${data.praiseType === opt.type ? '#4f46e5' : '#e5e7eb'}`,
                                borderRadius: '8px',
                                padding: '16px',
                                cursor: 'pointer',
                                background: data.praiseType === opt.type ? '#eef2ff' : '#fff',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ fontWeight: '500' }}>{opt.label}</div>
                                {opt.fee > 0 && <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 'bold' }}>+{opt.fee}元</span>}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{opt.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Text Praise Input Area */}
                {data.praiseType === 'text' && (
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                            请填写 <strong>{data.count}</strong> 条文字好评内容：
                        </div>
                        {data.praiseList.map((txt, idx) => (
                            <div key={idx} style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>
                                <span style={{ fontSize: '13px', color: '#6b7280', paddingTop: '8px', width: '40px', textAlign: 'right' }}>#{idx + 1}</span>
                                <input
                                    type="text"
                                    value={txt}
                                    onChange={e => handlePraiseContentChange(idx, e.target.value)}
                                    placeholder={`第 ${idx + 1} 单的好评内容 (20字以上)`}
                                    style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {data.praiseType === 'image' && (
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', color: '#6b7280', fontSize: '13px' }}>
                        (此处应为图片上传组件，暂以占位符显示。请为 {data.count} 单上传图片)
                    </div>
                )}
            </div>

            {/* Extra Services Grid */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>其它增值服务</h3>

                {/* 1. Timing Publish */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                    <input type="checkbox" checked={data.isTimingPublish} onChange={e => onChange({ isTimingPublish: e.target.checked })} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '14px' }}>定时发布</span>
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>+1.0元/单</span>
                        </div>
                        {data.isTimingPublish && (
                            <input type="datetime-local" value={data.publishTime || ''} onChange={e => onChange({ publishTime: e.target.value })} style={{ border: '1px solid #e5e7eb', padding: '4px', borderRadius: '4px' }} />
                        )}
                    </div>
                </div>

                {/* 2. Add Reward */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                    <input type="checkbox" checked={data.addReward > 0} onChange={e => onChange({ addReward: e.target.checked ? 1 : 0 })} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '14px' }}>额外悬赏</span>
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>增加接单速度</span>
                        </div>
                        {data.addReward > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <input type="number" value={data.addReward} onChange={e => onChange({ addReward: parseFloat(e.target.value) || 0 })} style={{ width: '60px', border: '1px solid #e5e7eb', padding: '4px', borderRadius: '4px' }} />
                                <span style={{ fontSize: '12px' }}>元/单</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Timing Pay */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid #f3f4f6' }}>
                    <input type="checkbox" checked={data.isTimingPay} onChange={e => onChange({ isTimingPay: e.target.checked })} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '14px' }}>定时付款</span>
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>+1.0元/单</span>
                        </div>
                        {data.isTimingPay && (
                            <input type="datetime-local" value={data.timingPayTime || ''} onChange={e => onChange({ timingPayTime: e.target.value })} style={{ border: '1px solid #e5e7eb', padding: '4px', borderRadius: '4px' }} />
                        )}
                    </div>
                </div>

                {/* 4. Cycle Time (Extend) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                    <input type="checkbox" checked={data.isCycleTime} onChange={e => onChange({ isCycleTime: e.target.checked })} />
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <span style={{ fontSize: '14px' }}>延长买号周期</span>
                            <span style={{ fontSize: '12px', color: '#9ca3af', marginLeft: '8px' }}>+1.0元/月</span>
                        </div>
                        {data.isCycleTime && (
                            <select value={data.cycleTime} onChange={e => onChange({ cycleTime: parseInt(e.target.value) })} style={{ border: '1px solid #e5e7eb', borderRadius: '4px' }}>
                                <option value={30}>30天</option>
                                <option value={60}>60天</option>
                                <option value={90}>90天</option>
                            </select>
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Action */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                <button
                    onClick={onPrev}
                    style={{
                        background: '#fff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}
                >
                    上一步
                </button>
                <button
                    onClick={onNext}
                    style={{
                        background: '#4f46e5',
                        color: '#fff',
                        border: 'none',
                        padding: '12px 32px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}
                >
                    下一步
                </button>
            </div>
        </div>
    );
}
