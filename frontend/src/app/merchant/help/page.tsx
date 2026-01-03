'use client';

import { useState } from 'react';

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

const faqData: FaqItem[] = [
    // 账户相关
    { category: '账户相关', question: '如何修改登录密码？', answer: '进入「账户设置」页面，在安全设置中点击「修改密码」，输入原密码和新密码即可完成修改。' },
    { category: '账户相关', question: '忘记密码怎么办？', answer: '在登录页面点击「忘记密码」，通过手机号验证后可重置密码。' },
    { category: '账户相关', question: '如何绑定/解绑银行卡？', answer: '进入「银行卡管理」页面，可以添加新的银行卡或删除已绑定的银行卡。' },

    // 任务相关
    { category: '任务相关', question: '如何发布任务？', answer: '点击「发布新任务」，按照步骤填写商品信息、选择增值服务、确认费用后即可发布。' },
    { category: '任务相关', question: '任务发布后可以修改吗？', answer: '已发布的任务在被接单前可以修改部分信息，接单后无法修改。如需修改请先取消任务。' },
    { category: '任务相关', question: '如何取消任务？', answer: '在「任务管理」中找到需要取消的任务，点击「取消」即可。已被接单的任务取消可能产生手续费。' },
    { category: '任务相关', question: '任务佣金如何计算？', answer: '佣金 = 基础服务费 + 增值服务费（好评、定时等）。具体费用在发布任务时会详细显示。' },

    // 订单相关
    { category: '订单相关', question: '如何审核订单？', answer: '在「订单审核」页面查看买手提交的订单截图，核实无误后点击「通过」，有问题可「驳回」并说明原因。' },
    { category: '订单相关', question: '审核通过后多久打款？', answer: '审核通过后，系统会在24小时内将本金退还到您的账户余额。' },
    { category: '订单相关', question: '发现虚假订单怎么办？', answer: '请及时驳回订单并说明原因，同时可将该买手加入黑名单。如有疑问请联系客服处理。' },

    // 财务相关
    { category: '财务相关', question: '如何充值余额？', answer: '进入「财务中心」，点击充值按钮，选择支付方式完成充值即可。' },
    { category: '财务相关', question: '如何提现？', answer: '确保已绑定银行卡，在「财务中心」点击提现，输入金额后提交申请，1-3个工作日到账。' },
    { category: '财务相关', question: '银锭是什么？', answer: '银锭是平台的虚拟货币，用于支付服务费和佣金。1银锭 = 1元人民币，可通过充值获得。' },
    { category: '财务相关', question: '提现有手续费吗？', answer: '普通用户提现收取2%手续费，VIP用户免手续费。' },

    // VIP相关
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
        const matchSearch = !searchText ||
            faq.question.toLowerCase().includes(searchText.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchText.toLowerCase());
        return matchCategory && matchSearch;
    });

    return (
        <div>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderRadius: '16px',
                padding: '32px',
                color: '#fff',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                    帮助中心
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '24px' }}>
                    有任何问题？我们随时为您解答
                </div>
                <div style={{ maxWidth: '500px', margin: '0 auto' }}>
                    <input
                        type="text"
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="搜索问题..."
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            borderRadius: '999px',
                            border: 'none',
                            fontSize: '15px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { icon: '📞', title: '联系客服', desc: '在线咨询', action: () => setShowContactModal(true) },
                    { icon: '📋', title: '操作指南', desc: '新手教程', action: () => alert('操作指南功能开发中') },
                    { icon: '📢', title: '公告通知', desc: '最新动态', action: () => alert('公告功能开发中') },
                    { icon: '💬', title: '意见反馈', desc: '提交建议', action: () => alert('反馈功能开发中') },
                ].map((item, idx) => (
                    <div
                        key={idx}
                        onClick={item.action}
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '20px',
                            textAlign: 'center',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>{item.icon}</div>
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.desc}</div>
                    </div>
                ))}
            </div>

            {/* FAQ Section */}
            <div style={{
                background: '#fff',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                {/* Category Tabs */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '999px',
                                border: 'none',
                                background: activeCategory === cat ? '#4f46e5' : '#f3f4f6',
                                color: activeCategory === cat ? '#fff' : '#374151',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: activeCategory === cat ? '500' : '400'
                            }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* FAQ List */}
                <div>
                    {filteredFaqs.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                            <div>未找到相关问题</div>
                            <div style={{ fontSize: '14px', marginTop: '8px' }}>请尝试其他关键词或联系客服</div>
                        </div>
                    ) : (
                        filteredFaqs.map((faq, idx) => (
                            <div
                                key={idx}
                                style={{
                                    borderBottom: idx < filteredFaqs.length - 1 ? '1px solid #f3f4f6' : 'none'
                                }}
                            >
                                <div
                                    onClick={() => setExpandedId(expandedId === idx ? null : idx)}
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: expandedId === idx ? '#f9fafb' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{
                                            padding: '2px 8px',
                                            background: '#e0e7ff',
                                            color: '#4f46e5',
                                            borderRadius: '4px',
                                            fontSize: '12px'
                                        }}>
                                            {faq.category}
                                        </span>
                                        <span style={{ fontWeight: '500' }}>{faq.question}</span>
                                    </div>
                                    <span style={{
                                        transform: expandedId === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s',
                                        color: '#6b7280'
                                    }}>
                                        ▼
                                    </span>
                                </div>
                                {expandedId === idx && (
                                    <div style={{
                                        padding: '0 20px 16px 20px',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        background: '#f9fafb'
                                    }}>
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Contact Modal */}
            {showContactModal && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '32px',
                        width: '400px',
                        maxWidth: '90%',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👨‍💼</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>联系客服</h3>
                        <p style={{ color: '#6b7280', marginBottom: '24px' }}>请通过以下方式联系我们</p>

                        <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                background: '#f3f4f6',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>📱</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>客服电话</div>
                                    <div style={{ fontWeight: '500' }}>400-123-4567</div>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                background: '#f3f4f6',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>💬</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>QQ客服</div>
                                    <div style={{ fontWeight: '500' }}>12345678</div>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px 16px',
                                background: '#f3f4f6',
                                borderRadius: '8px'
                            }}>
                                <span style={{ fontSize: '20px' }}>📧</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>邮箱</div>
                                    <div style={{ fontWeight: '500' }}>support@example.com</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
                            工作时间：周一至周五 9:00-18:00
                        </div>

                        <button
                            onClick={() => setShowContactModal(false)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            关闭
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
