import { BASE_URL } from '../../apiConfig';
import { mockPosts } from '../mocks/postMock';

// 后期如何平滑处理（上线方案）：
// 只需将 USE_MOCK 改为 false 即可切换到真实 API
const USE_MOCK = true;

// 定义 Service 接口：所有数据获取逻辑必须封装为函数
export const fetchPostDetail = async (id: string) => {
    if (USE_MOCK) {
        console.log(`[Service] Fetching mock detail for id: ${id}`);
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockPosts.find(p => p.id === id));
    }

    // 真实 API 调用
    try {
        const response = await fetch(`${BASE_URL}/posts/${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};

export const fetchPosts = async () => {
    if (USE_MOCK) {
        console.log('[Service] Fetching mock posts');
        await new Promise(resolve => setTimeout(resolve, 500));
        return Promise.resolve(mockPosts);
    }

    try {
        const response = await fetch(`${BASE_URL}/posts`);
        return response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
};
