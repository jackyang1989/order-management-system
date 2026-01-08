'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../../services/authService';
import {
    HelpArticle,
    fetchAnnouncements,
    fetchFaqs,
    searchHelpArticles,
    fetchHelpArticleById
} from '../../services/helpService';

export default function HelpCenterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'announcements' | 'faq'>('announcements');
    const [announcements, setAnnouncements] = useState<HelpArticle[]>([]);
    const [faqs, setFaqs] = useState<HelpArticle[]>([]);
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState<HelpArticle[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [announcementsData, faqsData] = await Promise.all([
                fetchAnnouncements(),
                fetchFaqs()
            ]);
            setAnnouncements(announcementsData);
            setFaqs(faqsData);
        } catch (error) {
            console.error('Failed to load help data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback(async (keyword: string) => {
        if (!keyword.trim()) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const results = await searchHelpArticles(keyword);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setSearching(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchText);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText, handleSearch]);

    const handleArticleClick = async (article: HelpArticle) => {
        setLoadingDetail(true);
        setShowDetail(true);
        try {
            const fullArticle = await fetchHelpArticleById(article.id);
            setSelectedArticle(fullArticle || article);
        } catch (error) {
            setSelectedArticle(article);
        } finally {
            setLoadingDetail(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayList = searchResults !== null
        ? searchResults
        : (activeTab === 'announcements' ? announcements : faqs);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">加载中...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* 顶部栏 */}
            <div className="bg-white h-11 flex items-center justify-center border-b border-gray-200 sticky top-0 z-10">
                <div
                    onClick={() => router.back()}
                    className="absolute left-4 text-xl cursor-pointer text-gray-700"
                >
                    ‹
                </div>
                <div className="text-base font-medium text-gray-800">帮助中心</div>
            </div>

            {/* Tab 切换 */}
            <div className="flex bg-white mb-2 border-b border-gray-200">
                <div
                    onClick={() => { setActiveTab('announcements'); setSearchText(''); setSearchResults(null); }}
                    className={`flex-1 text-center py-3 text-sm cursor-pointer relative ${
                        activeTab === 'announcements' ? 'text-blue-500' : 'text-gray-600'
                    }`}
                >
                    公告通知
                    {activeTab === 'announcements' && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500" />
                    )}
                </div>
                <div
                    onClick={() => { setActiveTab('faq'); setSearchText(''); setSearchResults(null); }}
                    className={`flex-1 text-center py-3 text-sm cursor-pointer relative ${
                        activeTab === 'faq' ? 'text-blue-500' : 'text-gray-600'
                    }`}
                >
                    常见问题
                    {activeTab === 'faq' && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-500" />
                    )}
                </div>
            </div>

            {/* 搜索框 */}
            <div className="px-4 py-2.5 bg-white mb-2">
                <div className="flex bg-gray-100 rounded-full px-4 py-2 items-center">
                    <span className="mr-2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="搜索内容..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        className="flex-1 border-none bg-transparent text-sm outline-none"
                    />
                    {searching && <span className="text-gray-400 text-xs">搜索中...</span>}
                </div>
            </div>

            {/* 内容列表 */}
            <div className="bg-white">
                {displayList.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        <div className="text-4xl mb-2">📄</div>
                        {searchResults !== null ? '未找到相关内容' : '暂无内容'}
                    </div>
                ) : (
                    displayList.map((item, index) => (
                        <div
                            key={item.id}
                            onClick={() => handleArticleClick(item)}
                            className={`px-4 py-3.5 cursor-pointer hover:bg-gray-50 ${
                                index < displayList.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                        >
                            <div className="text-sm text-gray-800 mb-1.5 font-medium">
                                {item.type === 'faq' && <span className="mr-1">❓</span>}
                                {item.type === 'announcement' && <span className="mr-1">📢</span>}
                                {item.title}
                            </div>
                            <div className="flex items-center text-xs text-gray-400">
                                <span className="mr-1">🕐</span>
                                {formatDate(item.createdAt)}
                                {item.viewCount > 0 && (
                                    <span className="ml-3">👁 {item.viewCount}</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 文章详情弹窗 */}
            {showDetail && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setShowDetail(false)}
                >
                    <div
                        className="bg-white rounded-lg w-11/12 max-w-md max-h-[80vh] overflow-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-4 py-3 border-b border-gray-200 text-base font-bold text-center">
                            {activeTab === 'faq' ? '问题详情' : '公告详情'}
                        </div>
                        {loadingDetail ? (
                            <div className="p-8 text-center text-gray-400">加载中...</div>
                        ) : selectedArticle ? (
                            <div className="p-5">
                                <h3 className="text-base font-medium mb-4 text-gray-800">
                                    {selectedArticle.title}
                                </h3>
                                <div
                                    className="text-sm text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap"
                                    dangerouslySetInnerHTML={{
                                        __html: selectedArticle.content
                                            .replace(/\n/g, '<br/>')
                                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                                    }}
                                />
                                <div className="text-xs text-gray-400 space-y-1">
                                    <div>发布时间：{formatDate(selectedArticle.createdAt)}</div>
                                    {selectedArticle.viewCount > 0 && (
                                        <div>浏览量：{selectedArticle.viewCount}</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400">内容加载失败</div>
                        )}
                        <div className="flex border-t border-gray-200">
                            <button
                                onClick={() => setShowDetail(false)}
                                className="flex-1 py-3 border-none bg-blue-500 text-white text-sm cursor-pointer rounded-b-lg hover:bg-blue-600"
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
