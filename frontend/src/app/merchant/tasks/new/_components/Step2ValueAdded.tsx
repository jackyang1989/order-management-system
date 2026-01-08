'use client';

import { TaskFormData } from './types';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';

interface StepProps { data: TaskFormData; onChange: (data: Partial<TaskFormData>) => void; onPrev: () => void; onNext: () => void; }

export default function Step2ValueAdded({ data, onChange, onPrev, onNext }: StepProps) {

    const ensurePraiseArrays = (count: number) => { let newList = [...data.praiseList]; if (newList.length !== count) newList = Array(count).fill(''); return newList; };

    const handlePraiseChange = (type: 'text' | 'image' | 'video' | 'none') => {
        const count = data.count || 1;
        const resetData: Partial<TaskFormData> = {
            isPraise: type !== 'none', praiseType: type,
            praiseList: (type === 'text' || type === 'image' || type === 'video') ? Array(count).fill('').map((_, i) => data.praiseList[i] || '') : [],
            praiseImgList: (type === 'image' || type === 'video') ? Array(count).fill([]).map((_, i) => data.praiseImgList?.[i] || []) : [],
            praiseVideoList: type === 'video' ? Array(count).fill('').map((_, i) => data.praiseVideoList?.[i] || '') : [],
        };
        let fee = 0; switch (type) { case 'text': fee = 2.0; break; case 'image': fee = 4.0; break; case 'video': fee = 10.0; break; }
        resetData.praiseFee = fee; onChange(resetData);
    };

    const handlePraiseContentChange = (index: number, val: string) => { const newList = [...data.praiseList]; newList[index] = val; onChange({ praiseList: newList }); };

    const handleImageUpload = async (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const currentImages = data.praiseImgList?.[index] || []; if (currentImages.length >= 5) { alert('每单最多上传5张图片'); return; }
        const token = localStorage.getItem('merchantToken'); const formData = new FormData(); formData.append('file', files[0]);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const json = await res.json();
            if (json.success && json.data?.url) { const newImgList = [...(data.praiseImgList || [])]; if (!newImgList[index]) newImgList[index] = []; newImgList[index] = [...newImgList[index], json.data.url]; onChange({ praiseImgList: newImgList }); }
            else alert('上传失败: ' + (json.message || '未知错误'));
        } catch { alert('上传失败'); }
    };

    const handleRemoveImage = (orderIndex: number, imgIndex: number) => { const newImgList = [...(data.praiseImgList || [])]; if (newImgList[orderIndex]) { newImgList[orderIndex] = newImgList[orderIndex].filter((_, i) => i !== imgIndex); onChange({ praiseImgList: newImgList }); } };

    const handleVideoUpload = async (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        const token = localStorage.getItem('merchantToken'); const formData = new FormData(); formData.append('file', files[0]);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const json = await res.json();
            if (json.success && json.data?.url) { const newVideoList = [...(data.praiseVideoList || [])]; newVideoList[index] = json.data.url; onChange({ praiseVideoList: newVideoList }); }
            else alert('上传失败: ' + (json.message || '未知错误'));
        } catch { alert('上传失败'); }
    };

    const handleRemoveVideo = (index: number) => { const newVideoList = [...(data.praiseVideoList || [])]; newVideoList[index] = ''; onChange({ praiseVideoList: newVideoList }); };

    const praiseOptions = [{ type: 'none', label: '默认好评', desc: '不强制内容', fee: 0 }, { type: 'text', label: '文字好评', desc: '指定好评内容', fee: 2 }, { type: 'image', label: '图文好评', desc: '指定图片+文字', fee: 4 }, { type: 'video', label: '视频好评', desc: '指定视频+文字', fee: 10 }];

    return (
        <div className="p-6">
            <h2 className="mb-6 text-lg font-bold text-slate-800">第二步：增值服务配置</h2>

            {/* Shipping */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-700">物流设置</h3>
                <div className="flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2"><input type="radio" checked={data.isFreeShipping === 1} onChange={() => onChange({ isFreeShipping: 1 })} /><span>商家包邮 (默认)</span></label>
                </div>
            </div>

            {/* Praise Settings */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-700">好评设置</h3>
                <div className="mb-4 grid grid-cols-4 gap-4">
                    {praiseOptions.map(opt => (
                        <div key={opt.type} onClick={() => handlePraiseChange(opt.type as any)} className={cn('cursor-pointer rounded-lg border p-4 transition-all', data.praiseType === opt.type ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white')}>
                            <div className="mb-1 flex items-center justify-between">
                                <div className="font-medium">{opt.label}</div>
                                {opt.fee > 0 && <span className="text-xs font-bold text-red-600">+{opt.fee}元</span>}
                            </div>
                            <div className="text-xs text-slate-500">{opt.desc}</div>
                        </div>
                    ))}
                </div>

                {/* Text Praise */}
                {data.praiseType === 'text' && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-[13px] text-slate-700">请填写 <strong>{data.count}</strong> 条文字好评内容：</div>
                        {data.praiseList.map((txt, idx) => (
                            <div key={idx} className="mb-3 flex gap-3">
                                <span className="w-10 pt-2 text-right text-[13px] text-slate-500">#{idx + 1}</span>
                                <input type="text" value={txt} onChange={e => handlePraiseContentChange(idx, e.target.value)} placeholder={`第 ${idx + 1} 单的好评内容`} className="flex-1 rounded-md border border-slate-300 px-2 py-2 text-[13px]" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Image Praise */}
                {data.praiseType === 'image' && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-[13px] text-slate-700">请为 <strong>{data.count}</strong> 单上传图片并填写好评内容（每单最多5张图片）：</div>
                        {Array.from({ length: data.count || 1 }).map((_, idx) => (
                            <div key={idx} className="mb-4 rounded-md border border-slate-200 bg-white p-3">
                                <div className="mb-2 text-[13px] font-medium text-slate-700">第 {idx + 1} 单</div>
                                <textarea value={data.praiseList[idx] || ''} onChange={e => handlePraiseContentChange(idx, e.target.value)} placeholder={`请输入第 ${idx + 1} 单的好评文字内容`} rows={2} className="mb-2 w-full resize-y rounded-md border border-slate-300 p-2 text-[13px]" />
                                <div className="flex flex-wrap items-center gap-2">
                                    {(data.praiseImgList?.[idx] || []).map((imgUrl, imgIdx) => (
                                        <div key={imgIdx} className="relative h-[60px] w-[60px]">
                                            <img src={imgUrl} alt={`图片${imgIdx + 1}`} className="h-full w-full rounded border border-slate-300 object-cover" />
                                            <button onClick={() => handleRemoveImage(idx, imgIdx)} className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                                        </div>
                                    ))}
                                    {(data.praiseImgList?.[idx]?.length || 0) < 5 && (
                                        <label className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-2xl text-slate-400">+<input type="file" accept="image/*" onChange={e => handleImageUpload(idx, e.target.files)} className="hidden" /></label>
                                    )}
                                    <span className="text-xs text-slate-400">{(data.praiseImgList?.[idx]?.length || 0)}/5张</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Video Praise */}
                {data.praiseType === 'video' && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="mb-3 text-[13px] text-slate-700">请为 <strong>{data.count}</strong> 单上传视频、图片并填写好评内容（每单1个视频 + 最多5张图片）：</div>
                        {Array.from({ length: data.count || 1 }).map((_, idx) => (
                            <div key={idx} className="mb-4 rounded-md border border-slate-200 bg-white p-3">
                                <div className="mb-2 text-[13px] font-medium text-slate-700">第 {idx + 1} 单</div>
                                <textarea value={data.praiseList[idx] || ''} onChange={e => handlePraiseContentChange(idx, e.target.value)} placeholder={`请输入第 ${idx + 1} 单的好评文字内容`} rows={2} className="mb-3 w-full resize-y rounded-md border border-slate-300 p-2 text-[13px]" />
                                {/* Video */}
                                <div className="mb-3">
                                    <div className="mb-1.5 text-xs text-slate-500">视频（必传）：</div>
                                    <div className="flex items-center gap-2">
                                        {data.praiseVideoList?.[idx] ? (
                                            <div className="relative">
                                                <video src={data.praiseVideoList[idx]} className="h-20 w-[120px] rounded border border-slate-300 object-cover" />
                                                <button onClick={() => handleRemoveVideo(idx)} className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                                            </div>
                                        ) : (
                                            <label className="flex h-20 w-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
                                                <span className="text-xl">🎬</span><span>上传视频</span>
                                                <input type="file" accept="video/*" onChange={e => handleVideoUpload(idx, e.target.files)} className="hidden" />
                                            </label>
                                        )}
                                        <span className="text-xs text-slate-400">支持 mp4、mov 格式</span>
                                    </div>
                                </div>
                                {/* Images */}
                                <div>
                                    <div className="mb-1.5 text-xs text-slate-500">图片（选填，最多5张）：</div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {(data.praiseImgList?.[idx] || []).map((imgUrl, imgIdx) => (
                                            <div key={imgIdx} className="relative h-[60px] w-[60px]">
                                                <img src={imgUrl} alt={`图片${imgIdx + 1}`} className="h-full w-full rounded border border-slate-300 object-cover" />
                                                <button onClick={() => handleRemoveImage(idx, imgIdx)} className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-xs text-white">×</button>
                                            </div>
                                        ))}
                                        {(data.praiseImgList?.[idx]?.length || 0) < 5 && (
                                            <label className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded border border-dashed border-slate-300 bg-slate-50 text-2xl text-slate-400">+<input type="file" accept="image/*" onChange={e => handleImageUpload(idx, e.target.files)} className="hidden" /></label>
                                        )}
                                        <span className="text-xs text-slate-400">{(data.praiseImgList?.[idx]?.length || 0)}/5张</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Extra Services */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-slate-700">其它增值服务</h3>
                {/* Verify Code Switch */}
                <div className="flex items-start gap-3 border-b border-slate-100 px-3 py-3">
                    <input type="checkbox" checked={data.isPasswordEnabled} onChange={e => onChange({ isPasswordEnabled: e.target.checked })} className="mt-1" />
                    <div className="flex flex-1 flex-col">
                        <div><span className="text-sm">开启口令验证</span><span className="ml-2 text-xs text-slate-400">买手需在商品详情页找到口令进行核对</span></div>
                        {data.isPasswordEnabled && (
                            <div className="mt-2">
                                <input type="text" value={data.checkPassword || ''} onChange={e => onChange({ checkPassword: e.target.value })} placeholder="请输入4-10个字的核对口令" minLength={4} maxLength={10} className={cn('w-[300px] rounded border px-2 py-1.5 text-sm', data.checkPassword && (data.checkPassword.length < 4 || data.checkPassword.length > 10) ? 'border-red-500' : 'border-slate-200')} />
                                <div className="mt-1 text-xs text-slate-500">口令需为4-10个详情页文字，买手做任务时需在详情页找到并输入完整口令。</div>
                                {data.checkPassword && (data.checkPassword.length < 4 || data.checkPassword.length > 10) && (
                                    <div className="mt-1 text-xs text-red-500">口令需为4-10个字符</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                {/* Timing Publish */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                    <input type="checkbox" checked={data.isTimingPublish} onChange={e => onChange({ isTimingPublish: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">定时发布</span><span className="ml-2 text-xs text-slate-400">+1.0元/单</span></div>
                        {data.isTimingPublish && <input type="datetime-local" value={data.publishTime || ''} onChange={e => onChange({ publishTime: e.target.value })} className="rounded border border-slate-200 px-1 py-1" />}
                    </div>
                </div>
                {/* Add Reward */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                    <input type="checkbox" checked={data.addReward > 0} onChange={e => onChange({ addReward: e.target.checked ? 1 : 0 })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">额外悬赏</span><span className="ml-2 text-xs text-slate-400">增加接单速度</span></div>
                        {data.addReward > 0 && <div className="flex items-center gap-1"><input type="number" value={data.addReward} onChange={e => onChange({ addReward: parseFloat(e.target.value) || 0 })} className="w-[60px] rounded border border-slate-200 px-1 py-1" /><span className="text-xs">元/单</span></div>}
                    </div>
                </div>
                {/* Timing Pay */}
                <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
                    <input type="checkbox" checked={data.isTimingPay} onChange={e => onChange({ isTimingPay: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">定时付款</span><span className="ml-2 text-xs text-slate-400">+1.0元/单</span></div>
                        {data.isTimingPay && <input type="datetime-local" value={data.timingPayTime || ''} onChange={e => onChange({ timingPayTime: e.target.value })} className="rounded border border-slate-200 px-1 py-1" />}
                    </div>
                </div>
                {/* Cycle Time */}
                <div className="flex items-center gap-3 px-3 py-3">
                    <input type="checkbox" checked={data.isCycleTime} onChange={e => onChange({ isCycleTime: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">延长买号周期</span><span className="ml-2 text-xs text-slate-400">+1.0元/月</span></div>
                        {data.isCycleTime && <select value={data.cycleTime} onChange={e => onChange({ cycleTime: parseInt(e.target.value) })} className="rounded border border-slate-200"><option value={30}>30天</option><option value={60}>60天</option><option value={90}>90天</option></select>}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-slate-200 pt-6">
                <Button variant="secondary" onClick={onPrev}>上一步</Button>
                <Button onClick={onNext}>下一步</Button>
            </div>
        </div>
    );
}
