'use client';

import { useState, useEffect } from 'react';
import { TaskFormData } from './types';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Card } from '../../../../../components/ui/card';
import { fetchSystemConfig, getPraiseFees } from '../../../../../services/systemConfigService';

interface StepProps {
    data: TaskFormData;
    onChange: (data: Partial<TaskFormData>) => void;
    onPrev: () => void;
    onNext: () => void;
}

export default function Step2ValueAdded({ data, onChange, onPrev, onNext }: StepProps) {
    const [praiseFees, setPraiseFees] = useState({ text: 2, image: 4, video: 10 });

    useEffect(() => {
        loadSystemConfig();
    }, []);

    const loadSystemConfig = async () => {
        const config = await fetchSystemConfig();
        setPraiseFees(getPraiseFees(config));
    };

    const handlePraiseChange = (type: 'text' | 'image' | 'video' | 'none') => {
        const count = data.count || 1;
        const resetData: Partial<TaskFormData> = {
            isPraise: type !== 'none',
            praiseType: type,
            praiseList: (type === 'text' || type === 'image' || type === 'video') ? Array(count).fill('').map((_, i) => data.praiseList?.[i] || '') : [],
            praiseImgList: (type === 'image' || type === 'video') ? Array(count).fill([]).map((_, i) => data.praiseImgList?.[i] || []) : [],
            praiseVideoList: type === 'video' ? Array(count).fill('').map((_, i) => data.praiseVideoList?.[i] || '') : [],
        };
        let fee = 0;
        switch (type) {
            case 'text': fee = praiseFees.text; break;
            case 'image': fee = praiseFees.image; break;
            case 'video': fee = praiseFees.video; break;
        }
        resetData.praiseFee = fee;
        onChange(resetData);
    };

    const handlePraiseContentChange = (index: number, val: string) => {
        const newList = [...(data.praiseList || [])];
        newList[index] = val;
        onChange({ praiseList: newList });
    };

    const handleImageUpload = async (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const currentImages = data.praiseImgList?.[index] || [];
        if (currentImages.length >= 5) { alert('每单最多上传5张图片'); return; }

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
        } catch { alert('上传失败'); }
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
        } catch { alert('上传失败'); }
    };

    const handleRemoveVideo = (index: number) => {
        const newVideoList = [...(data.praiseVideoList || [])];
        newVideoList[index] = '';
        onChange({ praiseVideoList: newVideoList });
    };

    const praiseOptions = [
        { type: 'none', label: '默认好评', icon: '👍', desc: '不强制内容', fee: 0 },
        { type: 'text', label: '文字好评', icon: '📝', desc: '指定好评内容', fee: praiseFees.text },
        { type: 'image', label: '图文好评', icon: '🖼️', desc: '指定图片+文字', fee: praiseFees.image },
        { type: 'video', label: '视频好评', icon: '🎬', desc: '指定视频+文字', fee: praiseFees.video }
    ];

    const CheckboxItem = ({ checked, onChange, label, subLabel, children }: { checked: boolean; onChange: (checked: boolean) => void; label: string; subLabel?: string; children?: React.ReactNode }) => (
        <div className={cn(
            "group relative overflow-hidden rounded-[20px] border-2 p-4 transition-all duration-300 hover:shadow-md",
            checked ? "border-primary-500 bg-primary-50/50" : "border-slate-100 bg-white hover:border-primary-200"
        )}>
            <div className="flex items-start gap-4">
                <div onClick={() => onChange(!checked)} className={cn(
                    "flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors",
                    checked ? "border-primary-500 bg-primary-500 text-white" : "border-slate-300 bg-white group-hover:border-primary-400"
                )}>
                    {checked && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div className="flex-1">
                    <div className="flex items-center justify-between" onClick={() => onChange(!checked)}>
                        <div>
                            <span className="font-bold text-slate-900">{label}</span>
                            {subLabel && <span className="ml-2 text-sm text-slate-500">{subLabel}</span>}
                        </div>
                    </div>
                    {children && <div className="mt-3">{children}</div>}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 p-1">
            <h2 className="text-2xl font-black text-slate-900">第二步：增值服务配置</h2>

            {/* Praise Settings */}
            <Card className="rounded-[32px] border-0 bg-white p-8 shadow-xl shadow-slate-200/50" noPadding>
                <div className="p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-yellow-100 text-2xl">🌟</div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">好评设置</h3>
                            <p className="text-sm text-slate-500">提升商品口碑和转化率</p>
                        </div>
                    </div>

                    <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {praiseOptions.map(opt => (
                            <div
                                key={opt.type}
                                onClick={() => handlePraiseChange(opt.type as any)}
                                className={cn(
                                    'cursor-pointer rounded-[20px] border-2 p-5 text-center transition-all duration-300 hover:shadow-lg',
                                    data.praiseType === opt.type
                                        ? 'border-primary-500 bg-primary-50 ring-4 ring-primary-500/10'
                                        : 'border-slate-100 bg-white hover:border-primary-200'
                                )}
                            >
                                <div className="mb-2 text-3xl">{opt.icon}</div>
                                <div className="mb-1 font-bold text-slate-900">{opt.label}</div>
                                <div className="text-xs text-slate-500">{opt.desc}</div>
                                {opt.fee > 0 && <div className="mt-2 rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-500">+{opt.fee}元/单</div>}
                            </div>
                        ))}
                    </div>

                    {/* Dynamic Praise Content Inputs */}
                    {(data.praiseType === 'text' || data.praiseType === 'image' || data.praiseType === 'video') && (
                        <div className="space-y-6 rounded-[24px] bg-slate-50 p-6">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                <span>请为</span>
                                <span className="rounded-md bg-white px-2 py-0.5 font-black text-slate-900 shadow-sm">{data.count}</span>
                                <span>单任务设置好评内容</span>
                            </div>

                            {Array.from({ length: data.count || 1 }).map((_, idx) => (
                                <div key={idx} className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="mb-4 flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{idx + 1}</span>
                                        <span className="text-sm font-bold text-slate-900">第 {idx + 1} 单任务内容</span>
                                    </div>

                                    <textarea
                                        value={data.praiseList?.[idx] || ''}
                                        onChange={e => handlePraiseContentChange(idx, e.target.value)}
                                        placeholder="请输入好评文字内容（必填）"
                                        rows={3}
                                        className="mb-4 w-full resize-y rounded-[16px] border border-slate-200 bg-slate-50 p-4 text-sm font-medium outline-none focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10"
                                    />

                                    {/* Video Upload */}
                                    {data.praiseType === 'video' && (
                                        <div className="mb-4">
                                            <div className="mb-2 text-xs font-bold text-slate-500">评价视频 (必传)</div>
                                            <div className="flex items-center gap-3">
                                                {data.praiseVideoList?.[idx] ? (
                                                    <div className="group relative overflow-hidden rounded-[16px]">
                                                        <video src={data.praiseVideoList[idx]} className="h-24 w-32 border border-slate-100 object-cover bg-black" />
                                                        <button onClick={() => handleRemoveVideo(idx)} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500">×</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary-400 hover:bg-primary-50">
                                                        <span className="text-2xl">🎬</span>
                                                        <span className="text-xs font-bold text-slate-400">上传视频</span>
                                                        <input type="file" accept="video/*" onChange={e => handleVideoUpload(idx, e.target.files)} className="hidden" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Image Upload */}
                                    {(data.praiseType === 'image' || data.praiseType === 'video') && (
                                        <div>
                                            <div className="mb-2 text-xs font-bold text-slate-500">评价图片 (最多5张)</div>
                                            <div className="flex flex-wrap items-center gap-3">
                                                {(data.praiseImgList?.[idx] || []).map((imgUrl, imgIdx) => (
                                                    <div key={imgIdx} className="group relative overflow-hidden rounded-[16px]">
                                                        <img src={imgUrl} alt={`图片${imgIdx + 1}`} className="h-20 w-20 border border-slate-100 object-cover" />
                                                        <button onClick={() => handleRemoveImage(idx, imgIdx)} className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-500">×</button>
                                                    </div>
                                                ))}
                                                {(data.praiseImgList?.[idx]?.length || 0) < 5 && (
                                                    <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-[16px] border-2 border-dashed border-slate-200 bg-slate-50 transition-colors hover:border-primary-400 hover:bg-primary-50">
                                                        <span className="text-2xl text-slate-300">+</span>
                                                        <input type="file" accept="image/*" onChange={e => handleImageUpload(idx, e.target.files)} className="hidden" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Logistics & Browse Behavior - 2 Column Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
                {/* Logistics */}
                <Card className="rounded-[32px] border-0 bg-white shadow-xl shadow-slate-200/50" noPadding>
                    <div className="p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-blue-100 text-2xl">🚚</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">物流设置</h3>
                                <p className="text-sm text-slate-500">配置包裹重量和运费方式</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div
                                    onClick={() => onChange({ isFreeShipping: 1 })}
                                    className={cn("flex-1 cursor-pointer rounded-[16px] border-2 p-4 text-center transition-all", data.isFreeShipping === 1 ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-100 hover:border-primary-200")}
                                >
                                    <div className="font-bold">商家包邮</div>
                                    <div className="text-xs opacity-60">默认</div>
                                </div>
                                <div
                                    onClick={() => onChange({ isFreeShipping: 2 })}
                                    className={cn("flex-1 cursor-pointer rounded-[16px] border-2 p-4 text-center transition-all", data.isFreeShipping === 2 ? "border-primary-500 bg-primary-50 text-primary-700" : "border-slate-100 hover:border-primary-200")}
                                >
                                    <div className="font-bold">不包邮</div>
                                    <div className="text-xs opacity-60">需付押金</div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-[20px] bg-slate-50 p-4">
                                <span className="font-bold text-slate-700">包裹重量 (kg)</span>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={data.weight || 0}
                                        onChange={e => onChange({ weight: parseFloat(e.target.value) || 0 })}
                                        className="h-10 w-24 rounded-[12px] bg-white text-center font-bold"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Browse Time */}
                <Card className="rounded-[32px] border-0 bg-white shadow-xl shadow-slate-200/50" noPadding>
                    <div className="p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-purple-100 text-2xl">⏱️</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">浏览时长</h3>
                                <p className="text-sm text-slate-500">控制买手在页面的停留时间</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: '总时长', key: 'totalBrowseMinutes' as const, min: 5, def: 15 },
                                { label: '主商品', key: 'mainBrowseMinutes' as const, min: 3, def: 8 },
                                { label: '副商品', key: 'subBrowseMinutes' as const, min: 1, def: 2 },
                            ].map(item => (
                                <div key={item.key} className="flex flex-col items-center justify-center rounded-[20px] bg-slate-50 p-4">
                                    <span className="mb-2 text-xs font-bold text-slate-500">{item.label}</span>
                                    <div className="relative w-full">
                                        <Input
                                            type="number"
                                            value={data[item.key] || item.def}
                                            onChange={e => onChange({ [item.key]: parseInt(e.target.value) || item.def })}
                                            className="h-10 w-full rounded-[12px] bg-white text-center font-black text-slate-900 shadow-sm"
                                            min={item.min}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">分</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Other Services Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Browse Behaviors */}
                <div className="col-span-full mb-2">
                    <h3 className="text-lg font-bold text-slate-900">浏览行为 & 增值服务</h3>
                </div>

                <CheckboxItem checked={data.needCompare || false} onChange={v => onChange({ needCompare: v })} label="货比三家" subLabel="需浏览竞品">
                    {data.needCompare && (
                        <div className="rounded-[12px] bg-white p-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-600">货比数量:</span>
                                <select
                                    value={data.compareCount || 3}
                                    onChange={e => onChange({ compareCount: parseInt(e.target.value) })}
                                    className="rounded border border-slate-200 px-2 py-1 text-sm font-bold text-primary-600 outline-none"
                                >
                                    <option value={2}>2家</option>
                                    <option value={3}>3家</option>
                                    <option value={5}>5家</option>
                                </select>
                            </div>
                        </div>
                    )}
                </CheckboxItem>

                <CheckboxItem checked={data.needFavorite || false} onChange={v => onChange({ needFavorite: v })} label="收藏商品" subLabel="提高商品人气" />
                <CheckboxItem checked={data.needFollow || false} onChange={v => onChange({ needFollow: v })} label="关注店铺" subLabel="增加店铺粉丝" />
                <CheckboxItem checked={data.needAddCart || false} onChange={v => onChange({ needAddCart: v })} label="加入购物车" subLabel="增加加购权重" />

                <CheckboxItem checked={data.needContactCS || false} onChange={v => onChange({ needContactCS: v })} label="假聊任务" subLabel="需联系客服">
                    {data.needContactCS && (
                        <textarea
                            value={data.contactCSContent || ''}
                            onChange={e => onChange({ contactCSContent: e.target.value })}
                            placeholder="请输入指定聊天内容..."
                            rows={2}
                            onClick={e => e.stopPropagation()}
                            className="w-full rounded-[12px] border border-slate-200 bg-white p-2 text-sm outline-none focus:border-primary-500"
                        />
                    )}
                </CheckboxItem>

                <CheckboxItem checked={data.isPasswordEnabled || false} onChange={v => onChange({ isPasswordEnabled: v })} label="核对口令" subLabel="详情页找口令">
                    {data.isPasswordEnabled && (
                        <Input
                            value={data.checkPassword || ''}
                            onChange={e => onChange({ checkPassword: e.target.value })}
                            placeholder="输入4-10字口令"
                            onClick={e => e.stopPropagation()}
                            className="h-9 rounded-[12px] bg-white text-sm"
                        />
                    )}
                </CheckboxItem>

                <CheckboxItem checked={data.isTimingPublish || false} onChange={v => onChange({ isTimingPublish: v })} label="定时发布" subLabel="+1.0元/单">
                    {data.isTimingPublish && <input type="datetime-local" value={data.publishTime || ''} onChange={e => onChange({ publishTime: e.target.value })} onClick={e => e.stopPropagation()} className="w-full rounded-[12px] border border-slate-200 px-2 py-1 text-xs" />}
                </CheckboxItem>

                <CheckboxItem checked={data.addReward > 0} onChange={v => onChange({ addReward: v ? 1 : 0 })} label="额外悬赏" subLabel="加速接单">
                    {data.addReward > 0 && (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <Input type="number" value={data.addReward} onChange={e => onChange({ addReward: parseFloat(e.target.value) || 0 })} className="h-8 w-20 bg-white" />
                            <span className="text-xs font-bold text-slate-500">元/单</span>
                        </div>
                    )}
                </CheckboxItem>

                <CheckboxItem checked={data.isTimingPay || false} onChange={v => onChange({ isTimingPay: v })} label="定时付款" subLabel="+1.0元/单">
                    {data.isTimingPay && <input type="datetime-local" value={data.timingPayTime || ''} onChange={e => onChange({ timingPayTime: e.target.value })} onClick={e => e.stopPropagation()} className="w-full rounded-[12px] border border-slate-200 px-2 py-1 text-xs" />}
                </CheckboxItem>

                <CheckboxItem checked={data.isCycleTime || false} onChange={v => onChange({ isCycleTime: v })} label="延长周期" subLabel="+1.0元/单">
                    {data.isCycleTime && (
                        <select onClick={e => e.stopPropagation()} value={data.cycleTime || 30} onChange={e => onChange({ cycleTime: parseInt(e.target.value) })} className="w-full rounded-[12px] border border-slate-200 bg-white px-2 py-1 text-sm">
                            <option value={30}>30天</option>
                            <option value={60}>60天</option>
                            <option value={90}>90天</option>
                        </select>
                    )}
                </CheckboxItem>

                <CheckboxItem checked={data.isRepay || false} onChange={v => onChange({ isRepay: v })} label="回购任务" subLabel="老客复购" />
                <CheckboxItem checked={data.isNextDay || false} onChange={v => onChange({ isNextDay: v })} label="隔天任务" subLabel="+0.5元/单" />
                <CheckboxItem checked={data.fastRefund || false} onChange={v => onChange({ fastRefund: v })} label="快速返款" subLabel="费率0.6%" />
            </div>

            {/* Note */}
            <Card className="rounded-[32px] border-0 bg-slate-900 p-8 text-white shadow-xl shadow-slate-900/10" noPadding>
                <div className="p-8">
                    <h3 className="mb-4 text-lg font-bold text-white">下单提示 (Memo)</h3>
                    <textarea
                        value={data.memo || ''}
                        onChange={e => onChange({ memo: e.target.value.slice(0, 100) })}
                        placeholder="给买手的特别提示，如：不要催发货..."
                        rows={2}
                        className="w-full rounded-[20px] bg-white/10 p-4 text-white placeholder:text-slate-400 focus:bg-white/20 focus:outline-none"
                    />
                    <div className="mt-2 text-right text-xs text-slate-400">{(data.memo || '').length}/100</div>
                </div>
            </Card>

            {/* Sticky Footer */}
            <div className="sticky bottom-6 z-10 flex justify-between">
                <Button
                    variant="outline"
                    onClick={onPrev}
                    className="h-14 rounded-[20px] border-2 border-slate-200 bg-white px-10 text-lg font-bold text-slate-600 shadow-xl hover:bg-slate-50 hover:text-slate-900"
                >
                    上一步
                </Button>
                <Button
                    onClick={onNext}
                    className="h-14 rounded-[20px] bg-primary-600 px-10 text-lg font-bold text-white shadow-xl shadow-primary-500/30 transition-all hover:scale-105 hover:bg-primary-700 active:scale-95"
                >
                    下一步
                </Button>
            </div>
        </div>
    );
}
