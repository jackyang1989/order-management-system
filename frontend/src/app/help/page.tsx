'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';

// Mock 公告数据
const mockAnnouncements = [
    {
        id: '1',
        title: '关于平台升级维护的通知',
        content: '尊敬的用户，平台将于2024年12月31日凌晨2:00-6:00进行系统升级，届时部分功能可能无法正常使用，给您带来不便敬请谅解。',
        author: '系统管理员',
        createTime: '2024-12-30 10:00:00'
    },
    {
        id: '2',
        title: '新年活动：任务佣金翻倍',
        content: '为庆祝新年到来，2025年1月1日-3日期间完成的任务佣金翻倍发放！机会难得，抓紧时间抢单！',
        author: '运营部',
        createTime: '2024-12-29 18:00:00'
    },
    {
        id: '3',
        title: '防骗温馨提示',
        content: '近期发现有不法分子冒充平台客服进行诈骗，请广大用户提高警惕，平台客服不会主动索要密码或验证码。',
        author: '安全中心',
        createTime: '2024-12-28 09:00:00'
    }
];

// Mock 常见问题数据
const mockFAQs = [
    {
        id: 'faq1',
        title: '如何领取任务？',
        content: '1. 在"任务大厅"页面浏览可用任务\n2. 选择合适的任务，点击进入任务详情\n3. 选择您绑定的买号，点击"立即领取"即可',
        createTime: '2024-12-01 10:00:00'
    },
    {
        id: 'faq2',
        title: '提现多久到账？',
        content: '正常情况下，提现申请将在1-3个工作日内处理完成。银行卡到账时间以各银行为准，一般当日或次日到账。',
        createTime: '2024-12-01 10:00:00'
    },
    {
        id: 'faq3',
        title: '任务审核失败怎么办？',
        content: '任务审核失败通常是因为截图不清晰或操作不规范。请仔细阅读任务要求，重新按规范操作后可再次提交。如有疑问请联系客服。',
        createTime: '2024-12-01 10:00:00'
    },
    {
        id: 'faq4',
        title: '如何绑定买号？',
        content: '1. 进入"个人中心" -> "买号管理"\n2. 点击"绑定买号"标签\n3. 填写平台账号、收货人等信息\n4. 上传对应截图，提交审核\n5. 审核通过后即可使用该买号接单',
        createTime: '2024-12-01 10:00:00'
    },
    {
        id: 'faq5',
        title: '银锭是什么？怎么提现？',
        content: '银锭是平台的佣金结算货币。完成任务后获得的佣金以银锭形式发放。银锭可在"资产管理"中兑换成人民币并提现到您的银行卡。',
        createTime: '2024-12-01 10:00:00'
    },
    {
        id: 'faq6',
        title: '联系客服方式',
        content: '客服QQ：2562498641\n工作时间：周一至周日 9:00-22:00\n您也可以在APP内"帮助中心"页面提交问题反馈。',
        createTime: '2024-12-01 10:00:00'
    }
];

interface Article {
    id: string;
    title: string;
    content: string;
    author?: string;
    createTime: string;
}

export default function HelpCenterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'announcements' | 'faq'>('announcements');
    const [announcements, setAnnouncements] = useState<Article[]>([]);
    const [faqs, setFaqs] = useState<Article[]>([]);
    const [searchText, setSearchText] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 300));
        setAnnouncements(mockAnnouncements);
        setFaqs(mockFAQs);
        setLoading(false);
    };

    const handleArticleClick = (article: Article) => {
        setSelectedArticle(article);
        setShowDetail(true);
    };

    const filteredList = (activeTab === 'announcements' ? announcements : faqs).filter(item =>
        item.title.includes(searchText) || item.content.includes(searchText)
    );

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>加载中...</div>;
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f8f8f8', paddingBottom: '60px' }}>
            {/* 顶部栏 */}
            <div style={{
                background: '#fff',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid #e5e5e5',
                position: 'sticky',
                top: 0,
                zIndex: 10
            }}>
                <div onClick={() => router.back()} style={{ position: 'absolute', left: '15px', fontSize: '20px', cursor: 'pointer', color: '#333' }}>‹</div>
                <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>帮助中心</div>
            </div>

            {/* Tab 切换 */}
            <div style={{ display: 'flex', background: '#fff', marginBottom: '10px', borderBottom: '1px solid #e5e5e5' }}>
                <div
                    onClick={() => { setActiveTab('announcements'); setSearchText(''); }}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'announcements' ? '#1989fa' : '#666',
                        position: 'relative'
                    }}
                >
                    公告通知
                    {activeTab === 'announcements' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#1989fa' }}></div>}
                </div>
                <div
                    onClick={() => { setActiveTab('faq'); setSearchText(''); }}
                    style={{
                        flex: 1,
                        textAlign: 'center',
                        padding: '12px 0',
                        fontSize: '14px',
                        color: activeTab === 'faq' ? '#1989fa' : '#666',
                        position: 'relative'
                    }}
                >
                    常见问题
                    {activeTab === 'faq' && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '30px', height: '2px', background: '#1989fa' }}></div>}
                </div>
            </div>

            {/* 搜索框 */}
            <div style={{ padding: '10px 15px', background: '#fff', marginBottom: '10px' }}>
                <div style={{ display: 'flex', background: '#f5f5f5', borderRadius: '20px', padding: '8px 15px', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px', color: '#999' }}>🔍</span>
                    <input
                        type="text"
                        placeholder="搜索内容..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            fontSize: '14px',
                            outline: 'none'
                        }}
                    />
                </div>
            </div>

            {/* 内容列表 */}
            <div style={{ background: '#fff' }}>
                {filteredList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#999', fontSize: '13px' }}>
                        <div style={{ fontSize: '40px', marginBottom: '10px' }}>📄</div>
                        暂无内容
                    </div>
                ) : (
                    filteredList.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => handleArticleClick(item)}
                            style={{
                                padding: '15px',
                                borderBottom: index < filteredList.length - 1 ? '1px solid #f5f5f5' : 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <div style={{
                                fontSize: '14px',
                                color: '#333',
                                marginBottom: '6px',
                                fontWeight: '500'
                            }}>
                                {activeTab === 'faq' && <span style={{ marginRight: '5px' }}>❓</span>}
                                {item.title}
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: '#bbb'
                            }}>
                                <span style={{ marginRight: '4px' }}>🕐</span>
                                {item.createTime}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 文章详情弹窗 */}
            {showDetail && selectedArticle && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        width: '90%',
                        maxWidth: '400px',
                        maxHeight: '80vh',
                        overflow: 'auto'
                    }}>
                        <div style={{
                            padding: '15px',
                            borderBottom: '1px solid #e5e5e5',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>{activeTab === 'faq' ? '问题详情' : '公告详情'}</div>
                        <div style={{ padding: '20px' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
                                {selectedArticle.title}
                            </h3>
                            <p style={{
                                fontSize: '14px',
                                color: '#666',
                                lineHeight: '1.8',
                                marginBottom: '15px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedArticle.content}
                            </p>
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                {selectedArticle.author && <div style={{ marginBottom: '5px' }}>来源：{selectedArticle.author}</div>}
                                <div>发布时间：{selectedArticle.createTime}</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            borderTop: '1px solid #e5e5e5'
                        }}>
                            <button
                                onClick={() => setShowDetail(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: 'none',
                                    background: '#409eff',
                                    color: '#fff',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
