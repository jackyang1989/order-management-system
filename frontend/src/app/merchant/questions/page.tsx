'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    updateQuestionsOrder,
    QuestionScheme,
    QuestionDetail,
} from '../../../services/questionService';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// 可排序的问题项组件
function SortableQuestionItem({
    question,
    onEdit,
    onDelete
}: {
    question: QuestionDetail;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "rounded-[16px] border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md",
                isDragging && "opacity-50 shadow-lg"
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                    {/* 拖拽手柄 */}
                    <button
                        {...attributes}
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing mt-1 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="拖动排序"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="6" cy="4" r="1" fill="currentColor"/>
                            <circle cx="10" cy="4" r="1" fill="currentColor"/>
                            <circle cx="6" cy="8" r="1" fill="currentColor"/>
                            <circle cx="10" cy="8" r="1" fill="currentColor"/>
                            <circle cx="6" cy="12" r="1" fill="currentColor"/>
                            <circle cx="10" cy="12" r="1" fill="currentColor"/>
                        </svg>
                    </button>
                    <p className="flex-1 text-sm text-slate-700">{question.question}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={onEdit}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-primary-600 shadow-sm ring-1 ring-slate-200 hover:bg-primary-50 hover:ring-primary-100"
                    >
                        编辑
                    </button>
                    <button
                        onClick={onDelete}
                        className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-500 shadow-sm ring-1 ring-slate-200 hover:bg-red-50 hover:ring-red-100"
                    >
                        删除
                    </button>
                </div>
            </div>
        </div>
    );
}

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
        question: ''
    });

    // 拖拽传感器配置
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 处理拖拽结束
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id || !currentScheme) {
            return;
        }

        const oldIndex = questions.findIndex((q) => q.id === active.id);
        const newIndex = questions.findIndex((q) => q.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return;

        // 更新本地状态
        const newQuestions = arrayMove(questions, oldIndex, newIndex);
        setQuestions(newQuestions);

        // 更新服务器排序
        const orders = newQuestions.map((q, index) => ({
            id: q.id,
            sortOrder: index,
        }));

        try {
            await updateQuestionsOrder(currentScheme.id, orders);
        } catch (error) {
            console.error('Failed to update order:', error);
            // 如果失败，恢复原来的顺序
            setQuestions(questions);
        }
    };

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
        if (!questionForm.question.trim()) {
            return alert('请输入问题内容');
        }

        try {
            // 确保方案存在
            const schemeId = await ensureSchemeExists(selectedShop.id, selectedShop.shopName);
            if (!schemeId) {
                alert('创建方案失败');
                return;
            }

            if (questionForm.id) {
                // 更新
                await updateQuestionDetail(questionForm.id, {
                    question: questionForm.question
                });
            } else {
                // 新增
                await addQuestionDetail(schemeId, {
                    question: questionForm.question
                });
            }

            loadQuestions(schemeId);
            setIsQuestionModalOpen(false);
            setQuestionForm({ id: '', question: '' });
        } catch (error) {
            console.error('Question Op Failed:', error);
        }
    };

    const deleteQuestion = async (id: string) => {
        if (!confirm('确定删除该问题吗？')) return;
        try {
            await deleteQuestionDetail(id);
            if (currentScheme) loadQuestions(currentScheme.id);
        } catch (error) {
            console.error('Delete Question Failed:', error);
        }
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
                                    管理该店铺的问题模板 · {questions.length} 个问题
                                </p>
                            </div>
                            <Button
                                onClick={() => { setQuestionForm({ id: '', question: '' }); setIsQuestionModalOpen(true); }}
                                className="h-10 rounded-[14px] bg-primary-600 px-5 font-bold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/30"
                            >
                                + 添加问题
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
                                    <p className="mt-4 text-sm font-bold text-slate-400">暂无问题模板</p>
                                    <Button
                                        variant="ghost"
                                        onClick={() => { setQuestionForm({ id: '', question: '' }); setIsQuestionModalOpen(true); }}
                                        className="mt-2 font-bold text-primary-600 hover:text-primary-700"
                                    >
                                        立即添加
                                    </Button>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={questions.map(q => q.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {questions.map(q => (
                                                <SortableQuestionItem
                                                    key={q.id}
                                                    question={q}
                                                    onEdit={() => {
                                                        setQuestionForm({
                                                            id: q.id,
                                                            question: q.question
                                                        });
                                                        setIsQuestionModalOpen(true);
                                                    }}
                                                    onDelete={() => deleteQuestion(q.id)}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
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
            <Modal title={questionForm.id ? '编辑问题' : '添加问题'} open={isQuestionModalOpen} onClose={() => setIsQuestionModalOpen(false)} className="w-[500px] rounded-[32px]">
                <div className="space-y-6">
                    {selectedShop && (
                        <div className="rounded-[16px] bg-primary-50 p-3">
                            <p className="text-sm text-primary-600">
                                <span className="font-bold">所属店铺：</span>{selectedShop.shopName} ({selectedShop.platform})
                            </p>
                        </div>
                    )}
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase text-slate-400">问题内容</label>
                        <Input
                            value={questionForm.question}
                            onChange={e => setQuestionForm({ ...questionForm, question: e.target.value })}
                            placeholder="例如：请问发货时间、询问优惠活动"
                            className="h-12 rounded-[16px] border-none bg-slate-50 px-4 font-normal text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-primary-500/20"
                        />
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
