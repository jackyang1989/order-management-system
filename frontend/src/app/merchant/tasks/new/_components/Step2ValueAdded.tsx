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
        const count = data.count || 1;
        const resetData: Partial<TaskFormData> = {
            isPraise: type !== 'none',
            praiseType: type,
            praiseList: (type === 'text' || type === 'image' || type === 'video')
                ? Array(count).fill('').map((_, i) => data.praiseList[i] || '')
                : [],
            praiseImgList: (type === 'image' || type === 'video')
                ? Array(count).fill([]).map((_, i) => data.praiseImgList?.[i] || [])
                : [],
            praiseVideoList: type === 'video'
                ? Array(count).fill('').map((_, i) => data.praiseVideoList?.[i] || '')
                : [],
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

    const handleImageUpload = async (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;

        // 检查图片数量限制（最多5张）
        const currentImages = data.praiseImgList?.[index] || [];
        if (currentImages.length >= 5) {
            alert('每单最多上传5张图片');
            return;
        }

        const token = localStorage.getItem('merchantToken');
        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const json = await res.json();
            if (json.success && json.data?.url) {
                const newImgList = [...(data.praiseImgList || [])];
                if (!newImgList[index]) newImgList[index] = [];
                newImgList[index] = [...newImgList[index], json.data.url];
                onChange({ praiseImgList: newImgList });
            } else {
                alert('上传失败: ' + (json.message || '未知错误'));
            }
        } catch (e) {
            alert('上传失败');
        }
    };

    const handleRemoveImage = (orderIndex: number, imgIndex: number) => {
        const newImgList = [...(data.praiseImgList || [])];
        if (newImgList[orderIndex]) {
            newImgList[orderIndex] = newImgList[orderIndex].filter((_, i) => i !== imgIndex);
            onChange({ praiseImgList: newImgList });
        }
    };

    const handleVideoUpload = async (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;

        const token = localStorage.getItem('merchantToken');
        const formData = new FormData();
        formData.append('file', files[0]);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const json = await res.json();
            if (json.success && json.data?.url) {
                const newVideoList = [...(data.praiseVideoList || [])];
                newVideoList[index] = json.data.url;
                onChange({ praiseVideoList: newVideoList });
            } else {
                alert('上传失败: ' + (json.message || '未知错误'));
            }
        } catch (e) {
            alert('上传失败');
        }
    };

    const handleRemoveVideo = (index: number) => {
        const newVideoList = [...(data.praiseVideoList || [])];
        newVideoList[index] = '';
        onChange({ praiseVideoList: newVideoList });
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
                                    placeholder={`第 ${idx + 1} 单的好评内容`}
                                    style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }}
                                />
                            </div>
                        ))}
                    </div>
                )}
                {/* Image Praise Input Area */}
                {data.praiseType === 'image' && (
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                            请为 <strong>{data.count}</strong> 单上传图片并填写好评内容（每单最多5张图片）：
                        </div>
                        {Array.from({ length: data.count || 1 }).map((_, idx) => (
                            <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
                                    第 {idx + 1} 单
                                </div>
                                {/* 文字输入 */}
                                <textarea
                                    value={data.praiseList[idx] || ''}
                                    onChange={e => handlePraiseContentChange(idx, e.target.value)}
                                    placeholder={`请输入第 ${idx + 1} 单的好评文字内容`}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', resize: 'vertical' }}
                                />
                                {/* 图片上传 */}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {(data.praiseImgList?.[idx] || []).map((imgUrl, imgIdx) => (
                                        <div key={imgIdx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                            <img src={imgUrl} alt={`图片${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                            <button
                                                onClick={() => handleRemoveImage(idx, imgIdx)}
                                                style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '16px' }}
                                            >×</button>
                                        </div>
                                    ))}
                                    {(data.praiseImgList?.[idx]?.length || 0) < 5 && (
                                        <label style={{ width: '60px', height: '60px', border: '1px dashed #d1d5db', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#9ca3af', fontSize: '24px' }}>
                                            +
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => handleImageUpload(idx, e.target.files)}
                                                style={{ display: 'none' }}
                                            />
                                        </label>
                                    )}
                                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {(data.praiseImgList?.[idx]?.length || 0)}/5张
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Video Praise Input Area */}
                {data.praiseType === 'video' && (
                    <div style={{ background: '#f9fafb', padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '12px' }}>
                            请为 <strong>{data.count}</strong> 单上传视频、图片并填写好评内容（每单1个视频 + 最多5张图片）：
                        </div>
                        {Array.from({ length: data.count || 1 }).map((_, idx) => (
                            <div key={idx} style={{ marginBottom: '16px', padding: '12px', background: '#fff', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
                                    第 {idx + 1} 单
                                </div>
                                {/* 文字输入 */}
                                <textarea
                                    value={data.praiseList[idx] || ''}
                                    onChange={e => handlePraiseContentChange(idx, e.target.value)}
                                    placeholder={`请输入第 ${idx + 1} 单的好评文字内容`}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', marginBottom: '12px', resize: 'vertical' }}
                                />
                                {/* 视频上传 */}
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>视频（必传）：</div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {data.praiseVideoList?.[idx] ? (
                                            <div style={{ position: 'relative' }}>
                                                <video src={data.praiseVideoList[idx]} style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                                <button
                                                    onClick={() => handleRemoveVideo(idx)}
                                                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '16px' }}
                                                >×</button>
                                            </div>
                                        ) : (
                                            <label style={{ width: '120px', height: '80px', border: '1px dashed #d1d5db', borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#9ca3af', fontSize: '12px', gap: '4px' }}>
                                                <span style={{ fontSize: '20px' }}>🎬</span>
                                                <span>上传视频</span>
                                                <input
                                                    type="file"
                                                    accept="video/*"
                                                    onChange={e => handleVideoUpload(idx, e.target.files)}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>支持 mp4、mov 格式</span>
                                    </div>
                                </div>
                                {/* 图片上传 */}
                                <div>
                                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>图片（选填，最多5张）：</div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                        {(data.praiseImgList?.[idx] || []).map((imgUrl, imgIdx) => (
                                            <div key={imgIdx} style={{ position: 'relative', width: '60px', height: '60px' }}>
                                                <img src={imgUrl} alt={`图片${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d1d5db' }} />
                                                <button
                                                    onClick={() => handleRemoveImage(idx, imgIdx)}
                                                    style={{ position: 'absolute', top: '-6px', right: '-6px', width: '18px', height: '18px', borderRadius: '50%', background: '#ff4d4f', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px', lineHeight: '16px' }}
                                                >×</button>
                                            </div>
                                        ))}
                                        {(data.praiseImgList?.[idx]?.length || 0) < 5 && (
                                            <label style={{ width: '60px', height: '60px', border: '1px dashed #d1d5db', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fafafa', color: '#9ca3af', fontSize: '24px' }}>
                                                +
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={e => handleImageUpload(idx, e.target.files)}
                                                    style={{ display: 'none' }}
                                                />
                                            </label>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                                            {(data.praiseImgList?.[idx]?.length || 0)}/5张
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
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
