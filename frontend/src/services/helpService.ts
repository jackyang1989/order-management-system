import { BASE_URL } from '../../apiConfig';

// ========== 帮助中心类型定义 ==========

export type ArticleType = 'announcement' | 'faq' | 'guide' | 'policy';

export interface HelpArticle {
    id: string;
    title: string;
    content: string; // Markdown 格式
    type: ArticleType;
    sortOrder: number;
    isPublished: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
}

// ========== 帮助中心服务 ==========

// 获取所有公开文章
export const fetchHelpArticles = async (): Promise<HelpArticle[]> => {
    try {
        const response = await fetch(`${BASE_URL}/help`);
        if (!response.ok) throw new Error('Failed to fetch help articles');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch help articles error:', error);
        return [];
    }
};

// 获取公告列表
export const fetchAnnouncements = async (): Promise<HelpArticle[]> => {
    try {
        const response = await fetch(`${BASE_URL}/help/announcements`);
        if (!response.ok) throw new Error('Failed to fetch announcements');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch announcements error:', error);
        return [];
    }
};

// 获取常见问题列表
export const fetchFaqs = async (): Promise<HelpArticle[]> => {
    try {
        const response = await fetch(`${BASE_URL}/help/faqs`);
        if (!response.ok) throw new Error('Failed to fetch FAQs');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Fetch FAQs error:', error);
        return [];
    }
};

// 搜索文章
export const searchHelpArticles = async (keyword: string): Promise<HelpArticle[]> => {
    try {
        const response = await fetch(`${BASE_URL}/help/search?keyword=${encodeURIComponent(keyword)}`);
        if (!response.ok) throw new Error('Failed to search help articles');
        const res = await response.json();
        return res.data || [];
    } catch (error) {
        console.error('Search help articles error:', error);
        return [];
    }
};

// 获取文章详情（会增加浏览量）
export const fetchHelpArticleById = async (id: string): Promise<HelpArticle | null> => {
    try {
        const response = await fetch(`${BASE_URL}/help/${id}`);
        if (!response.ok) throw new Error('Failed to fetch help article');
        const res = await response.json();
        return res.data || null;
    } catch (error) {
        console.error('Fetch help article error:', error);
        return null;
    }
};
