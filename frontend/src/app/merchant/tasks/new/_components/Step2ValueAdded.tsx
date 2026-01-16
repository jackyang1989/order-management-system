'use client';

import { useState, useEffect } from 'react';
import { TaskFormData, OrderPraiseConfig } from './types';
import { cn } from '../../../../../lib/utils';
import { Button } from '../../../../../components/ui/button';
import { fetchSystemConfig, getPraiseFees } from '../../../../../services/systemConfigService';

interface StepProps { data: TaskFormData; onChange: (data: Partial<TaskFormData>) => void; onPrev: () => void; onNext: () => void; }

export default function Step2ValueAdded({ data, onChange, onPrev, onNext }: StepProps) {
    const [praiseFees, setPraiseFees] = useState({ text: 2, image: 4, video: 10 });
    const [randomBrowseFee, setRandomBrowseFee] = useState(0.5);

    useEffect(() => {
        loadSystemConfig();
    }, []);

    useEffect(() => {
        // 当任务单数变化时，初始化或调整orderPraiseConfigs数组
        const count = data.count || 1;
        if (data.orderPraiseConfigs.length !== count) {
            const newConfigs: OrderPraiseConfig[] = Array(count).fill(null).map((_, i) =>
                data.orderPraiseConfigs[i] || { type: 'none', text: '', images: [], video: '' }
            );
            onChange({ orderPraiseConfigs: newConfigs });
        }

        // 当任务单数变化时，初始化或调整contactCSConfig
        if (data.contactCSConfig && data.contactCSConfig.enabled) {
            const currentCount = data.contactCSConfig.count;
            const currentQuestions = data.contactCSConfig.questions || [];

            // 如果配置的数量与当前questions数组长度不匹配，需要调整
            if (currentQuestions.length !== currentCount) {
                const newQuestions = Array(currentCount).fill(null).map((_, i) =>
                    currentQuestions[i] || { id: `cs-${Date.now()}-${i}`, questions: [''] }
                );
                onChange({
                    contactCSConfig: {
                        ...data.contactCSConfig,
                        questions: newQuestions
                    }
                });
            }
        }
    }, [data.count]);

    const loadSystemConfig = async () => {
        const config = await fetchSystemConfig();
        setPraiseFees(getPraiseFees(config));
        // 获取随机浏览服务费
        if (config) {
            const fee = (config as any).random_browse_fee ?? (config as any).randomBrowseFee ?? 0.5;
            setRandomBrowseFee(Number(fee) || 0.5);
        }
    };

    // 新版：处理单个订单的好评类型变化
    const handleOrderPraiseTypeChange = (orderIndex: number, type: 'none' | 'text' | 'image' | 'video') => {
        const newConfigs = [...data.orderPraiseConfigs];
        newConfigs[orderIndex] = {
            type,
            text: newConfigs[orderIndex]?.text || '',
            images: newConfigs[orderIndex]?.images || [],
            video: newConfigs[orderIndex]?.video || '',
        };
        onChange({ orderPraiseConfigs: newConfigs });
    };

    // 处理单个订单的好评文字内容变化
    const handleOrderPraiseTextChange = (orderIndex: number, text: string) => {
        const newConfigs = [...data.orderPraiseConfigs];
        newConfigs[orderIndex] = { ...newConfigs[orderIndex], text };
        onChange({ orderPraiseConfigs: newConfigs });
    };

    // 联系客服配置相关处理函数
    const handleContactCSEnabledChange = (enabled: boolean) => {
        if (enabled) {
            // 启用时，初始化配置，默认数量等于任务总数
            const count = data.count || 1;
            const questions = Array(count).fill(null).map((_, i) => ({
                id: `cs-${Date.now()}-${i}`,
                questions: [''] // 每单默认一个空问题
            }));
            onChange({
                contactCSConfig: {
                    enabled: true,
                    count: count,
                    questions: questions
                }
            });
        } else {
            // 禁用时，清空配置
            onChange({ contactCSConfig: undefined });
        }
    };

    const handleContactCSCountChange = (count: number) => {
        if (!data.contactCSConfig) return;

        const newCount = Math.max(1, Math.min(count, data.count || 1));
        const currentQuestions = data.contactCSConfig.questions || [];

        // 调整questions数组长度
        const newQuestions = Array(newCount).fill(null).map((_, i) =>
            currentQuestions[i] || { id: `cs-${Date.now()}-${i}`, questions: [''] }
        );

        onChange({
            contactCSConfig: {
                ...data.contactCSConfig,
                count: newCount,
                questions: newQuestions
            }
        });
    };

    const handleContactCSQuestionChange = (orderIndex: number, questionIndex: number, value: string) => {
        if (!data.contactCSConfig) return;

        const newQuestions = [...data.contactCSConfig.questions];
        const orderQuestions = [...(newQuestions[orderIndex]?.questions || [''])];
        orderQuestions[questionIndex] = value;

        newQuestions[orderIndex] = {
            ...newQuestions[orderIndex],
            questions: orderQuestions
        };

        onChange({
            contactCSConfig: {
                ...data.contactCSConfig,
                questions: newQuestions
            }
        });
    };

    const handleAddContactCSQuestion = (orderIndex: number) => {
        if (!data.contactCSConfig) return;

        const newQuestions = [...data.contactCSConfig.questions];
        const orderQuestions = [...(newQuestions[orderIndex]?.questions || [''])];
        orderQuestions.push(''); // 添加新的空问题

        newQuestions[orderIndex] = {
            ...newQuestions[orderIndex],
            questions: orderQuestions
        };

        onChange({
            contactCSConfig: {
                ...data.contactCSConfig,
                questions: newQuestions
            }
        });
    };

    const handleRemoveContactCSQuestion = (orderIndex: number, questionIndex: number) => {
        if (!data.contactCSConfig) return;

        const newQuestions = [...data.contactCSConfig.questions];
        const orderQuestions = [...(newQuestions[orderIndex]?.questions || [''])];

        // 至少保留一个问题输入框
        if (orderQuestions.length > 1) {
            orderQuestions.splice(questionIndex, 1);

            newQuestions[orderIndex] = {
                ...newQuestions[orderIndex],
                questions: orderQuestions
            };

            onChange({
                contactCSConfig: {
                    ...data.contactCSConfig,
                    questions: newQuestions
                }
            });
        }
    };

    const praiseOptions = [{ type: 'none', label: '五星好评', desc: '不写评语', fee: 0 }, { type: 'text', label: '文字评价', desc: '指定文字评价内容', fee: praiseFees.text }, { type: 'image', label: '图文评价', desc: '指定图文评价内容', fee: praiseFees.image }, { type: 'video', label: '视频图文评价', desc: '指定视频图文评价内容', fee: praiseFees.video }];

    return (
        <div className="p-6">
            <h2 className="mb-6 text-lg font-bold text-[#3b4559]">第二步：增值服务配置</h2>

            {/* Shipping */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">物流设置</h3>
                <div className="rounded-md border border-[#e5e7eb] bg-white p-4">
                    {/* 包邮设置 */}
                    <div className="mb-4 flex gap-6">
                        <label className="flex cursor-pointer items-center gap-2">
                            <input type="radio" checked={data.isFreeShipping === 1} onChange={() => onChange({ isFreeShipping: 1 })} />
                            <span>商家包邮 (默认)</span>
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                            <input type="radio" checked={data.isFreeShipping === 2} onChange={() => onChange({ isFreeShipping: 2 })} />
                            <span>不包邮 <span className="text-xs text-[#9ca3af]">(每单额外支出10元作为运费押金)</span></span>
                        </label>
                    </div>
                    {/* 包裹重量 */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-[#374151]">包裹重量:</span>
                        <input
                            type="number"
                            value={data.weight || 0}
                            onChange={e => onChange({ weight: parseFloat(e.target.value) || 0 })}
                            className="w-24 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm"
                            min="0"
                            max="30"
                            step="0.01"
                        />
                        <span className="text-sm text-[#6b7280]">kg (0-30kg)</span>
                        <span className="text-xs text-[#9ca3af]">用于计算物流费用</span>
                    </div>
                </div>
            </div>

            {/* Order Memo/Notes */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">下单提示</h3>
                <div className="rounded-md border border-[#e5e7eb] bg-white p-4">
                    <textarea
                        value={data.memo || ''}
                        onChange={e => onChange({ memo: e.target.value.slice(0, 100) })}
                        placeholder="买手接任务时可看见该提示，如：商品在第*页*行、聊天时不要问发货地和哪家快递等"
                        rows={3}
                        maxLength={100}
                        className="w-full resize-y rounded-md border border-[#d1d5db] p-3 text-sm"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs text-[#9ca3af]">
                        <span>提示内容自由填写，非必填</span>
                        <span>{(data.memo || '').length}/100</span>
                    </div>
                </div>
            </div>

            {/* Browse Behavior Settings */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">浏览行为设置</h3>
                <div className="rounded-md border border-[#e5e7eb] bg-white">
                    {/* Compare */}
                    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                        <input type="checkbox" checked={data.needCompare} onChange={e => onChange({ needCompare: e.target.checked })} />
                        <div className="flex flex-1 items-center justify-between">
                            <div><span className="text-sm">货比</span><span className="ml-2 text-xs text-[#9ca3af]">买手需先浏览其他商品再下单</span></div>
                            {data.needCompare && (
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-[#6b7280]">货比数量</span>
                                    <select value={data.compareCount || 3} onChange={e => onChange({ compareCount: parseInt(e.target.value) })} className="rounded border border-[#e5e7eb] px-2 py-1 text-sm">
                                        <option value={2}>2家</option>
                                        <option value={3}>3家</option>
                                        <option value={5}>5家</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Favorite */}
                    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                        <input type="checkbox" checked={data.needFavorite} onChange={e => onChange({ needFavorite: e.target.checked })} />
                        <div><span className="text-sm">收藏商品</span><span className="ml-2 text-xs text-[#9ca3af]">买手需收藏商品</span></div>
                    </div>
                    {/* Follow Shop */}
                    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                        <input type="checkbox" checked={data.needFollow} onChange={e => onChange({ needFollow: e.target.checked })} />
                        <div><span className="text-sm">关注店铺</span><span className="ml-2 text-xs text-[#9ca3af]">买手需关注店铺</span></div>
                    </div>
                    {/* Add to Cart */}
                    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                        <input type="checkbox" checked={data.needAddCart} onChange={e => onChange({ needAddCart: e.target.checked })} />
                        <div><span className="text-sm">加入购物车</span><span className="ml-2 text-xs text-[#9ca3af]">买手需先加入购物车再下单</span></div>
                    </div>
                    {/* Browse Reviews */}
                    <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-4 py-3">
                        <input type="checkbox" checked={data.needBrowseReviews} onChange={e => onChange({ needBrowseReviews: e.target.checked })} />
                        <div><span className="text-sm">浏览评价</span><span className="ml-2 text-xs text-[#9ca3af]">买手需浏览商品评价</span></div>
                    </div>
                    {/* Browse Q&A - Only for Taobao, Tmall, JD */}
                    {(data.taskType === 1 || data.taskType === 2 || data.taskType === 3) && (
                        <div className="flex items-center gap-3 px-4 py-3">
                            <input type="checkbox" checked={data.needBrowseQA} onChange={e => onChange({ needBrowseQA: e.target.checked })} />
                            <div><span className="text-sm">浏览问大家</span><span className="ml-2 text-xs text-[#9ca3af]">买手需浏览"问大家"板块</span></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Browse Time Settings */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">浏览时长设置</h3>
                <div className="rounded-md border border-[#e5e7eb] bg-white p-4">
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm text-[#374151]">总浏览时长</label>
                            <div className="flex items-center gap-1">
                                <input type="number" value={data.totalBrowseMinutes || 15} onChange={e => onChange({ totalBrowseMinutes: parseInt(e.target.value) || 15 })} min={5} max={60} className="w-20 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm" />
                                <span className="text-sm text-[#6b7280]">分钟</span>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm text-[#374151]">货比浏览时长</label>
                            <div className="flex items-center gap-1">
                                <input type="number" value={data.compareBrowseMinutes || 3} onChange={e => onChange({ compareBrowseMinutes: parseInt(e.target.value) || 3 })} min={1} max={10} className="w-20 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm" />
                                <span className="text-sm text-[#6b7280]">分钟</span>
                            </div>
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm text-[#374151]">主商品浏览时长</label>
                            <div className="flex items-center gap-1">
                                <input type="number" value={data.mainBrowseMinutes || 8} onChange={e => onChange({ mainBrowseMinutes: parseInt(e.target.value) || 8 })} min={3} max={30} className="w-20 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm" />
                                <span className="text-sm text-[#6b7280]">分钟</span>
                            </div>
                        </div>
                        <div>
                            <div className="mb-1.5 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="hasSubProduct"
                                    checked={data.hasSubProduct !== false}
                                    onChange={e => onChange({ hasSubProduct: e.target.checked })}
                                    className="h-4 w-4"
                                />
                                <label htmlFor="hasSubProduct" className="text-sm text-[#374151] cursor-pointer">副商品浏览时长</label>
                            </div>
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={data.subBrowseMinutes || 2}
                                    onChange={e => onChange({ subBrowseMinutes: parseInt(e.target.value) || 2 })}
                                    min={1}
                                    max={10}
                                    disabled={data.hasSubProduct === false}
                                    className={`w-20 rounded border border-[#e5e7eb] px-2 py-1.5 text-sm ${data.hasSubProduct === false ? 'bg-gray-100 text-gray-400' : ''}`}
                                />
                                <span className="text-sm text-[#6b7280]">分钟</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-3 text-xs text-[#9ca3af]">设置买手浏览商品的最低时长要求，增加浏览真实性。不勾选副商品则该任务无副商品浏览要求。</p>
                </div>
            </div>

            {/* Praise Settings - 新版：每单独立配置 */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">好评设置</h3>
                <div className="mb-3 text-[13px] text-[#6b7280]">为每单独立配置好评类型，可以混合使用不同类型的好评</div>

                {/* 每单的好评配置 */}
                <div className="space-y-4">
                    {Array.from({ length: data.count || 1 }).map((_, orderIdx) => {
                        const config = data.orderPraiseConfigs[orderIdx] || { type: 'none', text: '', images: [], video: '' };
                        return (
                            <div key={orderIdx} className="rounded-md border border-[#e5e7eb] bg-white p-4">
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="text-[14px] font-semibold text-[#374151]">第 {orderIdx + 1} 单</div>
                                    <div className="text-xs text-[#6b7280]">选择好评类型</div>
                                </div>

                                {/* 好评类型选择 */}
                                <div className="mb-3 grid grid-cols-4 gap-2">
                                    {praiseOptions.map(opt => (
                                        <div
                                            key={opt.type}
                                            onClick={() => handleOrderPraiseTypeChange(orderIdx, opt.type as any)}
                                            className={cn(
                                                'cursor-pointer rounded-md border p-3 transition-all text-center',
                                                config.type === opt.type ? 'border-primary-500 bg-primary-50' : 'border-[#e5e7eb] bg-white hover:border-primary-300'
                                            )}
                                        >
                                            <div className="text-[13px] font-medium">{opt.label}</div>
                                            {opt.fee > 0 ? (
                                                <div className="mt-1 text-xs font-bold text-danger-500">+{opt.fee}元</div>
                                            ) : (
                                                <div className="mt-1 text-xs text-[#9ca3af]">{opt.desc}</div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* 文字好评内容 */}
                                {config.type === 'text' && (
                                    <div className="mt-3">
                                        <label className="mb-1.5 block text-[13px] text-[#374151]">好评文字内容：</label>
                                        <input
                                            type="text"
                                            value={config.text || ''}
                                            onChange={e => handleOrderPraiseTextChange(orderIdx, e.target.value)}
                                            placeholder="请输入好评文字内容"
                                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[13px]"
                                        />
                                    </div>
                                )}

                                {/* 图文好评内容 */}
                                {config.type === 'image' && (
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <label className="mb-1.5 block text-[13px] text-[#374151]">好评文字内容：</label>
                                            <textarea
                                                value={config.text || ''}
                                                onChange={e => handleOrderPraiseTextChange(orderIdx, e.target.value)}
                                                placeholder="请输入好评文字内容"
                                                rows={2}
                                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[13px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-[13px] text-[#374151]">好评图片（最多5张）：</label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {(config.images || []).map((imgUrl, imgIdx) => (
                                                    <div key={imgIdx} className="relative h-[60px] w-[60px]">
                                                        <img src={imgUrl} alt={`图片${imgIdx + 1}`} className="h-full w-full rounded border border-[#d1d5db] object-cover" />
                                                        <button
                                                            onClick={() => {
                                                                const newConfigs = [...data.orderPraiseConfigs];
                                                                newConfigs[orderIdx] = {
                                                                    ...newConfigs[orderIdx],
                                                                    images: (newConfigs[orderIdx].images || []).filter((_, i) => i !== imgIdx)
                                                                };
                                                                onChange({ orderPraiseConfigs: newConfigs });
                                                            }}
                                                            className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-danger-400 text-xs text-white"
                                                        >×</button>
                                                    </div>
                                                ))}
                                                {(config.images?.length || 0) < 5 && (
                                                    <label className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] text-2xl text-[#9ca3af]">
                                                        +
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                if (!e.target.files || e.target.files.length === 0) return;
                                                                const token = localStorage.getItem('merchantToken');
                                                                const formData = new FormData();
                                                                formData.append('file', e.target.files[0]);
                                                                try {
                                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                                        body: formData
                                                                    });
                                                                    const json = await res.json();
                                                                    if (json.success && json.data?.url) {
                                                                        const newConfigs = [...data.orderPraiseConfigs];
                                                                        newConfigs[orderIdx] = {
                                                                            ...newConfigs[orderIdx],
                                                                            images: [...(newConfigs[orderIdx].images || []), json.data.url]
                                                                        };
                                                                        onChange({ orderPraiseConfigs: newConfigs });
                                                                    } else {
                                                                        alert('上传失败: ' + (json.message || '未知错误'));
                                                                    }
                                                                } catch {
                                                                    alert('上传失败');
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                                <span className="text-xs text-[#9ca3af]">{(config.images?.length || 0)}/5张</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 视频好评内容 */}
                                {config.type === 'video' && (
                                    <div className="mt-3 space-y-3">
                                        <div>
                                            <label className="mb-1.5 block text-[13px] text-[#374151]">好评文字内容：</label>
                                            <textarea
                                                value={config.text || ''}
                                                onChange={e => handleOrderPraiseTextChange(orderIdx, e.target.value)}
                                                placeholder="请输入好评文字内容"
                                                rows={2}
                                                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[13px]"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-[13px] text-[#374151]">好评视频（必传）：</label>
                                            <div className="flex items-center gap-2">
                                                {config.video ? (
                                                    <div className="relative">
                                                        <video src={config.video} className="h-20 w-[120px] rounded border border-[#d1d5db] object-cover" />
                                                        <button
                                                            onClick={() => {
                                                                const newConfigs = [...data.orderPraiseConfigs];
                                                                newConfigs[orderIdx] = { ...newConfigs[orderIdx], video: '' };
                                                                onChange({ orderPraiseConfigs: newConfigs });
                                                            }}
                                                            className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-danger-400 text-xs text-white"
                                                        >×</button>
                                                    </div>
                                                ) : (
                                                    <label className="flex h-20 w-[120px] cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] text-xs text-[#9ca3af]">
                                                        <span className="text-xl">🎬</span><span>上传视频</span>
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={async (e) => {
                                                                if (!e.target.files || e.target.files.length === 0) return;
                                                                const token = localStorage.getItem('merchantToken');
                                                                const formData = new FormData();
                                                                formData.append('file', e.target.files[0]);
                                                                try {
                                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                                        body: formData
                                                                    });
                                                                    const json = await res.json();
                                                                    if (json.success && json.data?.url) {
                                                                        const newConfigs = [...data.orderPraiseConfigs];
                                                                        newConfigs[orderIdx] = { ...newConfigs[orderIdx], video: json.data.url };
                                                                        onChange({ orderPraiseConfigs: newConfigs });
                                                                    } else {
                                                                        alert('上传失败: ' + (json.message || '未知错误'));
                                                                    }
                                                                } catch {
                                                                    alert('上传失败');
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                                <span className="text-xs text-[#9ca3af]">支持 mp4、mov 格式</span>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="mb-1.5 block text-[13px] text-[#374151]">好评图片（选填，最多5张）：</label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {(config.images || []).map((imgUrl, imgIdx) => (
                                                    <div key={imgIdx} className="relative h-[60px] w-[60px]">
                                                        <img src={imgUrl} alt={`图片${imgIdx + 1}`} className="h-full w-full rounded border border-[#d1d5db] object-cover" />
                                                        <button
                                                            onClick={() => {
                                                                const newConfigs = [...data.orderPraiseConfigs];
                                                                newConfigs[orderIdx] = {
                                                                    ...newConfigs[orderIdx],
                                                                    images: (newConfigs[orderIdx].images || []).filter((_, i) => i !== imgIdx)
                                                                };
                                                                onChange({ orderPraiseConfigs: newConfigs });
                                                            }}
                                                            className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-danger-400 text-xs text-white"
                                                        >×</button>
                                                    </div>
                                                ))}
                                                {(config.images?.length || 0) < 5 && (
                                                    <label className="flex h-[60px] w-[60px] cursor-pointer items-center justify-center rounded border border-dashed border-[#d1d5db] bg-[#f9fafb] text-2xl text-[#9ca3af]">
                                                        +
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={async (e) => {
                                                                if (!e.target.files || e.target.files.length === 0) return;
                                                                const token = localStorage.getItem('merchantToken');
                                                                const formData = new FormData();
                                                                formData.append('file', e.target.files[0]);
                                                                try {
                                                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6006'}/upload`, {
                                                                        method: 'POST',
                                                                        headers: { 'Authorization': `Bearer ${token}` },
                                                                        body: formData
                                                                    });
                                                                    const json = await res.json();
                                                                    if (json.success && json.data?.url) {
                                                                        const newConfigs = [...data.orderPraiseConfigs];
                                                                        newConfigs[orderIdx] = {
                                                                            ...newConfigs[orderIdx],
                                                                            images: [...(newConfigs[orderIdx].images || []), json.data.url]
                                                                        };
                                                                        onChange({ orderPraiseConfigs: newConfigs });
                                                                    } else {
                                                                        alert('上传失败: ' + (json.message || '未知错误'));
                                                                    }
                                                                } catch {
                                                                    alert('上传失败');
                                                                }
                                                            }}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}
                                                <span className="text-xs text-[#9ca3af]">{(config.images?.length || 0)}/5张</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Contact Customer Service Settings */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">联系客服设置</h3>
                <div className="mb-3 text-[13px] text-[#6b7280]">设置买手需要联系客服的订单及每单需要咨询的问题</div>

                {/* 启用开关 */}
                <div className="mb-4 rounded-md border border-[#e5e7eb] bg-white p-4">
                    <label className="flex cursor-pointer items-center gap-3">
                        <input
                            type="checkbox"
                            checked={data.contactCSConfig?.enabled || false}
                            onChange={e => handleContactCSEnabledChange(e.target.checked)}
                            className="h-4 w-4"
                        />
                        <div>
                            <span className="text-sm font-medium">启用联系客服</span>
                            <span className="ml-2 text-xs text-[#9ca3af]">买手需要联系客服咨询问题</span>
                        </div>
                    </label>
                </div>

                {/* 联系客服配置详情 */}
                {data.contactCSConfig?.enabled && (
                    <div className="space-y-4">
                        {/* 数量设置 */}
                        <div className="rounded-md border border-[#e5e7eb] bg-white p-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-[#374151]">需要联系客服的订单数量:</span>
                                <input
                                    type="number"
                                    value={data.contactCSConfig.count}
                                    onChange={e => handleContactCSCountChange(parseInt(e.target.value) || 1)}
                                    className="w-24 rounded border border-[#e5e7eb] px-3 py-1.5 text-sm"
                                    min="1"
                                    max={data.count || 1}
                                />
                                <span className="text-sm text-[#6b7280]">单 (最多 {data.count || 1} 单)</span>
                            </div>
                        </div>

                        {/* 每单的问题配置 */}
                        <div className="space-y-4">
                            {data.contactCSConfig.questions.map((orderConfig, orderIdx) => (
                                <div key={orderConfig.id} className="rounded-md border border-[#e5e7eb] bg-white p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="text-[14px] font-semibold text-[#374151]">第 {orderIdx + 1} 单</div>
                                        <div className="text-xs text-[#6b7280]">设置需要咨询的问题</div>
                                    </div>

                                    {/* 问题列表 */}
                                    <div className="space-y-2">
                                        {orderConfig.questions.map((question, qIdx) => (
                                            <div key={qIdx} className="flex items-center gap-2">
                                                <span className="text-xs text-[#6b7280] w-16">问题 {qIdx + 1}:</span>
                                                <input
                                                    type="text"
                                                    value={question}
                                                    onChange={e => handleContactCSQuestionChange(orderIdx, qIdx, e.target.value)}
                                                    placeholder="请输入需要咨询客服的问题"
                                                    className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[13px]"
                                                />
                                                {/* 删除按钮 - 只有多个问题时才显示 */}
                                                {orderConfig.questions.length > 1 && (
                                                    <button
                                                        onClick={() => handleRemoveContactCSQuestion(orderIdx, qIdx)}
                                                        className="flex h-8 w-8 items-center justify-center rounded border border-[#e5e7eb] text-danger-500 hover:bg-danger-50"
                                                        title="删除问题"
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                                {/* 添加按钮 - 只在最后一个问题显示 */}
                                                {qIdx === orderConfig.questions.length - 1 && (
                                                    <button
                                                        onClick={() => handleAddContactCSQuestion(orderIdx)}
                                                        className="flex h-8 w-8 items-center justify-center rounded border border-[#e5e7eb] bg-primary-50 text-primary-600 hover:bg-primary-100"
                                                        title="添加问题"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-2 text-xs text-[#9ca3af]">
                                        买手将按顺序向客服提问这些问题
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Extra Services */}
            <div className="mb-8">
                <h3 className="mb-4 text-[15px] font-semibold text-[#374151]">其它增值服务</h3>
                {/* Verify Code Switch */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isPasswordEnabled} onChange={e => onChange({ isPasswordEnabled: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">开启口令验证</span><span className="ml-2 text-xs text-[#9ca3af]">买手需在商品详情页找到口令进行核对</span></div>
                    </div>
                </div>
                {/* Timing Publish */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isTimingPublish} onChange={e => onChange({ isTimingPublish: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">定时发布</span><span className="ml-2 text-xs text-[#9ca3af]">+1.0元/单</span></div>
                        {data.isTimingPublish && <input type="datetime-local" value={data.publishTime || ''} onChange={e => onChange({ publishTime: e.target.value })} className="rounded border border-[#e5e7eb] px-1 py-1" />}
                    </div>
                </div>
                {/* Add Reward */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.addReward > 0} onChange={e => onChange({ addReward: e.target.checked ? 1 : 0 })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">额外悬赏</span><span className="ml-2 text-xs text-[#9ca3af]">增加接单速度</span></div>
                        {data.addReward > 0 && <div className="flex items-center gap-1"><input type="number" value={data.addReward} onChange={e => onChange({ addReward: parseFloat(e.target.value) || 0 })} className="w-[60px] rounded border border-[#e5e7eb] px-1 py-1" /><span className="text-xs">元/单</span></div>}
                    </div>
                </div>
                {/* Timing Pay */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isTimingPay} onChange={e => onChange({ isTimingPay: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">定时付款</span><span className="ml-2 text-xs text-[#9ca3af]">+1.0元/单</span></div>
                        {data.isTimingPay && <input type="datetime-local" value={data.timingPayTime || ''} onChange={e => onChange({ timingPayTime: e.target.value })} className="rounded border border-[#e5e7eb] px-1 py-1" />}
                    </div>
                </div>
                {/* Cycle Time */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isCycleTime} onChange={e => onChange({ isCycleTime: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">延长买号周期</span><span className="ml-2 text-xs text-[#9ca3af]">+1.0元/月</span></div>
                        {data.isCycleTime && <select value={data.cycleTime} onChange={e => onChange({ cycleTime: parseInt(e.target.value) })} className="rounded border border-[#e5e7eb]"><option value={30}>30天</option><option value={60}>60天</option><option value={90}>90天</option></select>}
                    </div>
                </div>
                {/* 回购任务 */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isRepay} onChange={e => onChange({ isRepay: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">回购任务</span><span className="ml-2 text-xs text-[#9ca3af]">只允许曾在该店铺完成过订单的买号接取</span></div>
                    </div>
                </div>
                {/* 隔天任务 */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.isNextDay} onChange={e => onChange({ isNextDay: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">隔天任务</span><span className="ml-2 text-xs text-[#9ca3af]">+0.5元/单，买手需隔天完成付款</span></div>
                    </div>
                </div>
                {/* 随机浏览店铺其他商品 */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.needRandomBrowse} onChange={e => onChange({ needRandomBrowse: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">随机浏览店铺其他商品</span><span className="ml-2 text-xs text-[#9ca3af]">+{randomBrowseFee}元/单，买手需随机浏览店铺其他2个商品各2分钟</span></div>
                    </div>
                </div>
                {/* Fast Refund Service */}
                <div className="flex items-center gap-3 border-b border-[#f3f4f6] px-3 py-3">
                    <input type="checkbox" checked={data.fastRefund} onChange={e => onChange({ fastRefund: e.target.checked })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div>
                            <span className="text-sm">快速返款服务</span>
                            <span className="ml-2 text-xs text-[#9ca3af]">服务费0.6%</span>
                            <span className="ml-2 cursor-help text-xs text-primary-500" title="开启后，买手确认收货后系统自动快速返款，无需等待平台结算周期">?</span>
                        </div>
                    </div>
                </div>
                {/* Order Interval */}
                <div className="flex items-center gap-3 px-3 py-3">
                    <input type="checkbox" checked={(data.orderInterval || 0) > 0} onChange={e => onChange({ orderInterval: e.target.checked ? 5 : 0 })} />
                    <div className="flex flex-1 items-center justify-between">
                        <div><span className="text-sm">任务接单间隔</span><span className="ml-2 text-xs text-[#9ca3af]">控制买手接单的时间间隔</span></div>
                        {(data.orderInterval || 0) > 0 && (
                            <div className="flex items-center gap-1">
                                <input
                                    type="number"
                                    value={data.orderInterval}
                                    onChange={e => onChange({ orderInterval: parseInt(e.target.value) || 0 })}
                                    className="w-16 rounded border border-[#e5e7eb] px-1 py-1 text-center"
                                    min="1"
                                    max="60"
                                />
                                <span className="text-xs">分钟</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between border-t border-[#e5e7eb] pt-6">
                <Button variant="secondary" onClick={onPrev}>上一步</Button>
                <Button onClick={onNext}>下一步</Button>
            </div>
        </div>
    );
}
