'use client';

import { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Button } from '../../../components/ui/button';
import { Card } from '../../../components/ui/card';
import { Modal } from '../../../components/ui/modal';

interface FaqItem { question: string; answer: string; category: string; }

const faqData: FaqItem[] = [
    { category: '账户相关', question: '如何修改登录密码？', answer: '进入「账户设置」页面，在安全设置中点击「修改密码」，输入原密码和新密码即可完成修改。' },
    { category: '账户相关', question: '忘记密码怎么办？', answer: '在登录页面点击「忘记密码」，通过手机号验证后可重置密码。' },
    { category: '账户相关', question: '如何绑定/解绑银行卡？', answer: '进入「银行卡管理」页面，可以添加新的银行卡或删除已绑定的银行卡。' },
    { category: '任务相关', question: '如何发布任务？', answer: '点击「发布新任务」，按照步骤填写商品信息、选择增值服务、确认费用后即可发布。' },
    { category: '任务相关', question: '任务发布后可以修改吗？', answer: '已发布的任务在被接单前可以修改部分信息，接单后无法修改。如需修改请先取消任务。' },
    { category: '任务相关', question: '如何取消任务？', answer: '在「任务管理」中找到需要取消的任务，点击「取消」即可。已被接单的任务取消可能产生手续费。' },
    { category: '任务相关', question: '任务佣金如何计算？', answer: '佣金 = 基础服务费 + 增值服务费（好评、定时等）。具体费用在发布任务时会详细显示。' },
    { category: '订单相关', question: '如何审核订单？', answer: '在「订单审核」页面查看买手提交的订单截图，核实无误后点击「通过」，有问题可「驳回」并说明原因。' },
    { category: '订单相关', question: '审核通过后多久打款？', answer: '审核通过后，系统会在24小时内将本金退还到您的账户余额。' },
    { category: '订单相关', question: '发现虚假订单怎么办？', answer: '请及时驳回订单并说明原因，同时可将该买手加入黑名单。如有疑问请联系客服处理。' },
    { category: '财务相关', question: '如何充值余额？', answer: '进入「财务中心」，点击充值按钮，选择支付方式完成充值即可。' },
    { category: '财务相关', question: '如何提现？', answer: '确保已绑定银行卡，在「财务中心」点击提现，输入金额后提交申请，1-3个工作日到账。' },
    { category: '财务相关', question: '银锭是什么？', answer: '银锭是平台的虚拟货币，用于支付服务费和佣金。1银锭 = 1元人民币，可通过充值获得。' },
    { category: '财务相关', question: '提现有手续费吗？', answer: '普通用户提现收取2%手续费，VIP用户免手续费。' },
    { category: 'VIP相关', question: 'VIP有什么特权？', answer: 'VIP会员享有服务费折扣（最高6折）、优先审核、专属客服、数据报表等特权。' },
    { category: 'VIP相关', question: 'VIP可以退款吗？', answer: 'VIP会员服务一经开通，不支持退款，请谨慎购买。' },
    { category: 'VIP相关', question: '如何升级VIP？', answer: '进入「VIP会员」页面，选择合适的套餐完成支付即可开通。' },
];

const categories = ['全部', '账户相关', '任务相关', '订单相关', '财务相关', 'VIP相关'];

export default function MerchantHelpPage() {
    const [activeCategory, setActiveCategory] = useState('全部');
    const [searchText, setSearchText] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [showContactModal, setShowContactModal] = useState(false);

    const filteredFaqs = faqData.filter(faq => {
        const matchCategory = activeCategory === '全部' || faq.category === activeCategory;
        const matchSearch = !searchText || faq.question.toLowerCase().includes(searchText.toLowerCase()) || faq.answer.toLowerCase().includes(searchText.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-center text-white shadow-lg shadow-blue-500/20">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>

                <div className="relative z-10">
                    <h1 className="mb-3 text-4xl font-black tracking-tight">帮助中心</h1>
                    <p className="mb-8 font-medium text-blue-100">有任何问题？我们随时为您解答</p>
                    <div className="mx-auto max-w-[600px]">
                        <div className="relative">
                            <input
                                type="text"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                placeholder="搜索常见问题..."
                                className="h-14 w-full rounded-full border-none bg-white/10 px-6 pl-14 text-lg font-bold text-white placeholder:text-blue-100/50 shadow-inner backdrop-blur-md focus:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/10"
                            />
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-50">🔍</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-4">
                {[
                    { icon: '📞', title: '联系客服', desc: '在线咨询', action: () => setShowContactModal(true) },
                    { icon: '📋', title: '操作指南', desc: '新手教程', action: () => alert('操作指南功能开发中') },
                    { icon: '📢', title: '公告通知', desc: '最新动态', action: () => alert('公告功能开发中') },
                    { icon: '💬', title: '意见反馈', desc: '提交建议', action: () => alert('反馈功能开发中') },
                ].map((item, idx) => (
                    <div
                        key={idx}
                        onClick={item.action}
                        className="cursor-pointer rounded-[24px] border-0 bg-white p-6 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:shadow-lg"
                    >
                        <div className="mb-3 text-4xl">{item.icon}</div>
                        <div className="mb-1 text-lg font-bold text-slate-900">{item.title}</div>
                        <div className="text-xs font-bold text-slate-400">{item.desc}</div>
                    </div>
                ))}
            </div>

            {/* FAQ Section */}
            <Card className="overflow-hidden rounded-[24px] border-0 bg-white p-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-50 px-6 py-5">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                'rounded-full px-5 py-2.5 text-sm font-bold transition-all',
                                activeCategory === cat
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div>
                    {filteredFaqs.length === 0 ? (
                        <div className="py-20 text-center font-bold text-slate-400">
                            <div className="mb-4 text-5xl opacity-20">🤔</div>
                            <div className="mb-2">未找到相关问题</div>
                            <div className="text-sm font-medium opacity-60">请尝试其他关键词或联系客服</div>
                        </div>
                    ) : (
                        filteredFaqs.map((faq, idx) => (
                            <div key={idx} className={cn(idx < filteredFaqs.length - 1 && 'border-b border-slate-50')}>
                                <div
                                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                                    className={cn(
                                        'flex cursor-pointer items-center justify-between px-6 py-5 transition-colors',
                                        expandedId === idx ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "rounded-[8px] px-2 py-1 text-xs font-black",
                                            activeCategory === '全部' ? 'bg-slate-100 text-slate-500' : 'bg-primary-50 text-primary-600'
                                        )}>
                                            {faq.category}
                                        </span>
                                        <span className="font-bold text-slate-900">{faq.question}</span>
                                    </div>
                                    <div className={cn(
                                        'flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-400 transition-all',
                                        expandedId === idx && 'rotate-180 bg-primary-100 text-primary-600'
                                    )}>
                                        ▼
                                    </div>
                                </div>
                                {expandedId === idx && (
                                    <div className="bg-slate-50/50 px-6 pb-6 pl-[4.5rem] text-sm font-medium leading-relaxed text-slate-600 animate-in slide-in-from-top-2 duration-200">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Contact Modal */}
            <Modal title="联系客服" open={showContactModal} onClose={() => setShowContactModal(false)} className="rounded-[32px]">
                <div className="text-center">
                    <div className="mb-6 text-6xl">👨‍💼</div>
                    <p className="mb-8 font-bold text-slate-400">请通过以下方式联系我们</p>

                    <div className="mb-8 space-y-4">
                        <div className="flex items-center gap-4 rounded-[20px] bg-slate-50 p-4 transition-transform hover:scale-105">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">📱</div>
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase text-slate-400">客服电话</div>
                                <div className="text-lg font-black text-slate-900">400-123-4567</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-[20px] bg-slate-50 p-4 transition-transform hover:scale-105">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">💬</div>
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase text-slate-400">QQ客服</div>
                                <div className="text-lg font-black text-slate-900">12345678</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 rounded-[20px] bg-slate-50 p-4 transition-transform hover:scale-105">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl shadow-sm">📧</div>
                            <div className="text-left">
                                <div className="text-xs font-bold uppercase text-slate-400">邮箱</div>
                                <div className="text-lg font-black text-slate-900">support@example.com</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 rounded-full bg-yellow-50 py-2 text-xs font-bold text-yellow-600">
                        ⏰ 工作时间：周一至周五 9:00-18:00
                    </div>

                    <Button
                        onClick={() => setShowContactModal(false)}
                        className="h-12 w-full rounded-[16px] bg-slate-900 font-bold text-white shadow-none hover:bg-slate-800"
                    >
                        关闭
                    </Button>
                </div>
            </Modal>
        </div>
    );
}
