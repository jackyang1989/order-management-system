'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BASE_URL } from '../../../../apiConfig';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { fetchShops, Shop } from '../../../services/shopService';
import {
    fetchQuestionSchemes,
    fetchQuestionDetails,
    addQuestionDetail,
    updateQuestionDetail,
    deleteQuestionDetail,
    createQuestionScheme,
    QuestionScheme,
    QuestionDetail,
} from '../../../services/questionService';

export default function QuestionsPage() {
    const router = useRouter();

    // 店铺相关状态
    const [shops, setShops] = useState<Shop[]>([]);
    const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
    const [shopsLoading, setShopsLoading] = useState(true);

    // 方案和问题模板状态（一个店铺对应一个默认方案）
    const [currentScheme, setCurrentScheme] = useState<QuestionScheme | null>(null);
    const [questions, setQuestions] = useState<QuestionDetail[]>([]);
    const [loading, setLoading] = useState(false);

    const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
    const [questionForm, setQuestionForm] = useState({
        id: '',
        name: '',
        questions: [''] // 至少一个问题
    });

    // 加载店铺列表
    useEffect(() => {
        loadShops();
    }, []);

    // 店铺变化时加载该店铺的问题模板
    useEffect(() => {
        if (selectedShop) {
            fetchShopQuestions(selectedShop.id);
        } else {
            setCurrentScheme(null);
            setQuestions([]);
        }
    }, [selectedShop]);

    const loadShops = async () => {
        setShopsLoading(true);
        try {
            const shopList = await fetchShops();
            // 只显示审核通过的店铺 (status === 1)
            const approvedShops = shopList.filter(s => s.status === 1);
            setShops(approvedShops);
            // 默认选择第一个店铺
            if (approvedShops.length > 0) {
                setSelectedShop(approvedShops[0]);
            }
        } catch (error) {
            console.error('Failed to load shops:', error);
        } finally {
            setShopsLoading(false);
        }
    };

    // 获取店铺的问题模板（通过查找或创建默认方案）
    const fetchShopQuestions = async (shopId: string) => {
        setLoading(true);
        try {
            // 获取该店铺的方案
            const schemes = await fetchQuestionSchemes(shopId);

            if (schemes && schemes.length > 0) {
                // 使用第一个方案（默认方案）
                const scheme = schemes[0];
                setCurrentScheme(scheme);
                // 加载该方案的问题模板
                loadQuestions(scheme.id);
            } else {
                // 没有方案
                setCurrentScheme(null);
                setQuestions([]);
            }
        } catch (error) {
            console.error('Failed to fetch shop questions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadQuestions = async (schemeId: string) => {
        try {
            const details = await fetchQuestionDetails(schemeId);
            setQuestions(details);
        } catch (error) {
            console.error('Failed to fetch questions:', error);
        }
    };

    // 确保店铺有方案，没有则创建
    const ensureSchemeExists = async (shopId: string, shopName: string): Promise<string | null> => {
        if (currentScheme) return currentScheme.id;

        try {
            const scheme = await createQuestionScheme({
                name: `${shopName}的问题模板`,
                description: '',
                shopId: shopId
            });
            if (scheme) {
                setCurrentScheme(scheme);
                return scheme.id;
            }
            return null;
        } catch (error) {
            console.error('Failed to create scheme:', error);
            return null;
        }
    };

    const handleQuestionSubmit = async () => {
        if (!selectedShop) return alert('请先选择店铺');
        if (!questionForm.name) return alert('请输入问题模板名称');
        if (questionForm.questions.length === 0 || !questionForm.questions[0]) {
            return alert('请至少输入一个问题');
        }

        try {
            // 确保方案存在
            const schemeId = await ensureSchemeExists(selectedShop.id, selectedShop.shopName);
            if (!schemeId) {
                alert('创建方案失败');
                return;
            }

            // 过滤掉空问题
            const validQuestions = questionForm.questions.filter(q => q.trim());

            if (questionForm.id) {
                // 更新
                await updateQuestionDetail(questionForm.id, {
                    name: questionForm.name,
                    questions: validQuestions
                });
            } else {
                // 新增
                await addQuestionDetail(schemeId, {
                    name: questionForm.name,
                    questions: validQuestions
                });
            }

            loadQuestions(schemeId);
            setIsQuestionModalOpen(false);
            setQuestionForm({ id: '', name: '', questions: [''] });
        } catch (error) {
            console.error('Question Op Failed:', error);
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm('确定删除该问题模板吗？')) return;
        try {
            await deleteQuestionDetail(id);
            if (currentScheme) loadQuestions(currentScheme.id);
        } catch (error) {
            console.error('Delete Question Failed:', error);
        }
    };

    // 添加问题输入框
    const addQuestionInput = () => {
        setQuestionForm({
            ...questionForm,
            questions: [...questionForm.questions, '']
        });
    };

    // 删除问题输入框
    const removeQuestionInput = (index: number) => {
        const newQuestions = questionForm.questions.filter((_, i) => i !== index);
        setQuestionForm({
            ...questionForm,
            questions: newQuestions.length > 0 ? newQuestions : ['']
        });
    };

    // 更新问题内容
    const updateQuestionInput = (index: number, value: string) => {
        const newQuestions = [...questionForm.questions];
        newQuestions[index] = value;
        setQuestionForm({
            ...questionForm,
            questions: newQuestions
        });
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6">
            {/* 左侧：店铺列表 */}
            <Card className="flex w-[280px] flex-shrink-0 flex-col rounded-[32px] border-0 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                <div className="mb-6">
                    <h2 className="text-xl font-bold text-slate-900">店铺列表</h2>
                    <p className="mt-1 text-xs text-slate-400">选择店铺管理问题模板</p>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {shopsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 animate-pulse rounded-[16px] bg-slate-50"></div>
                            ))}
                        </div>
                    ) : shops.length === 0 ? (
                        <div className="flex h-32 flex-col items-center justify-center rounded-[20px] bg-slate-50 text-slate-400">
                            <span className="mb-2 text-2xl">🏪</span>
                            <span className="text-sm">暂无店铺</span>
                            <button
                                onClick={() => router.push('/merchant/shops')}
                                className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700"
                            >
                                前往添加
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {shops.map(shop => (
                                <div
                                    key={shop.id}
                                    onClick={() => setSelectedShop(shop)}
                                    className={cn(
                                        'cursor-pointer rounded-[16px] border p-3 transition-all duration-200',
                                        selectedShop?.id === shop.id
                                            ? 'border-transparent bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/20'
                                            : 'border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100'
                                    )}
                                >
                                    <div className="truncate text-sm font-bold">
                                        {shop.shopName}
                                    </div>
                                    <div className={cn(
                                        "mt-0.5 text-xs",
                                        selectedShop?.id === shop.id ? "text-primary-100" : "text-slate-400"
                                    )}>
                                        {shop.platform}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* 右侧：问题模板列表 */}
            <Card className="flex min-w-0 flex-1 flex-col rounded-[32px] border-0 bg-white p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {selectedShop ? (
                    <>
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">{selectedShop.shopName}</h2>
                                <p className="mt-1 text-sm font-medium text-slate-400">
                                    管理该店铺的问题模板配置 · {questions.length} 个模板
                                </p>
                            </div>
                            <Button
                                onClick={() => { setQuestionForm({ id: '', name: '', questions: [''] }); setIsQuestionModalOpen(true); }}
                                className="h-10 rounded-[14px] bg-primary-600 px-5 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/30"
                            >
                                + 添加问题模板
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="h-16 animate-pulse rounded-[16px] bg-slate-50"></div>
                                    ))}
                                </div>
                            ) : questions.length === 0 ? (
                                <div className="flex h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50">
                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl shadow-sm">💬</div>
                                    <p className="mt-4 text-sm font-bold text-slate-400">暂无问题模板配置</p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setQuestionForm({ id: '', name: '', questions: [''] }); setIsQuestionModalOpen(true); }}
                                        className="mt-2 font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        立即添加
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {questions.map(q => (
                                        <div key={q.id} className="rounded-[20px] border border-slate-100 bg-white p-5 transition-shadow hover:shadow-md">
                                            <div className="mb-3 flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-base font-bold text-slate-900">{q.name}</h3>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {q.questions.length} 个连续问题
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setQuestionForm({
                                                                id: q.id,
                                                                name: q.name,
                                                                questions: q.questions
                                                            });
                                                            setIsQuestionModalOpen(true);
                                                        }}
                                                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-slate-200 hover:bg-primary-50 hover:ring-primary-100"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => deleteQuestion(q.id)}
                                                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm ring-1 ring-slate-200 hover:bg-red-50 hover:ring-red-100"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {q.questions.map((question, idx) => (
                                                    <div key={idx} className="flex items-start gap-2 rounded-lg bg-slate-50 p-3">
                                                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600">
                                                            {idx + 1}
                                                        </span>
                                                        <p className="flex-1 text-sm text-slate-700">{question}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-slate-300">
                        <div className="mb-4 text-6xl opacity-50">🏪</div>
                        <p className="font-bold">请从左侧选择一个店铺</p>
                        <p className="mt-2 text-sm">选择店铺后可管理该店铺的问题模板</p>
                    </div>
                )}
            </Card>

            {/* Question Modal */}
            <Modal title={questionForm.id ? '编辑问题模板' : '添加问题模板'} open={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} className="w-[600px] rounded-[32px]">
                <div className="space-y-6">
                    {selectedShop && (
                        <div className="rounded-[16px] bg-primary-50 p-3">
                            <p className="text-sm text-primary-600">
                                <span className="font-bold">所属店铺：</span>{selectedShop.shopName} ({selectedShop.platform})
                            </p>
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">模板名称</label>
                            <Input
                                value={questionForm.name}
                                onChange={e => setQuestionForm({ ...questionForm, name: e.target.value })}
                                placeholder="例如：询问发货时间、询问优惠活动"
                                className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-bold text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase text-slate-400">连续问题</label>
                            <div className="space-y-3">
                                {questionForm.questions.map((question, index) => (
                                    <div key={index} className="flex gap-2">
                                        <div className="flex h-12 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-sm font-bold text-primary-600">
                                            {index + 1}
                                        </div>
                                        <Input
                                            value={question}
                                            onChange={e => updateQuestionInput(index, e.target.value)}
                                            placeholder={`第 ${index + 1} 个问题`}
                                            className="h-12 flex-1 rounded-[16px] border-none bg-slate-50 px-4 font-normal text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                                        />
                                        {questionForm.questions.length > 1 && (
                                            <button
                                                onClick={() => removeQuestionInput(index)}
                                                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                onClick={addQuestionInput}
                                className="mt-3 w-full rounded-[14px] border-2 border-dashed border-slate-200 font-bold text-slate-400 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                            >
                                + 添加下一个问题
                            </Button>
                            <p className="mt-2 text-xs text-slate-400">买手将按顺序依次向客服提问</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                        <Button
                            variant="secondary"
                            onClick={() => setIsQuestionModalOpen(false)}
                            className="h-11 rounded-[14px] border-none bg-slate-100 px-6 font-bold text-slate-600 hover:bg-slate-200"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleQuestionSubmit}
                            className="h-11 rounded-[14px] bg-primary-600 px-6 font-bold text-white hover:bg-primary-700"
                        >
                            确定
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
