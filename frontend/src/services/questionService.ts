import { BASE_URL } from '../../apiConfig';

export interface QuestionDetail {
    id: string;
    question: string;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface QuestionScheme {
    id: string;
    name: string;
    description?: string;
    shopId?: string; // 关联的店铺ID
    details: QuestionDetail[];
    createdAt: string;
}

/**
 * 获取当前商户的所有问题模板方案
 * @param shopId 可选，按店铺ID筛选
 */
export const fetchQuestionSchemes = async (shopId?: string): Promise<QuestionScheme[]> => {
    try {
        const token = localStorage.getItem('merchantToken');
        let url = `${BASE_URL}/questions/schemes`;
        if (shopId) {
            url += `?shopId=${encodeURIComponent(shopId)}`;
        }
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch question schemes:', error);
        return [];
    }
};

/**
 * 获取指定方案的详情（包含问题模板列表）
 */
export const fetchSchemeDetails = async (schemeId: string): Promise<QuestionScheme | null> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/schemes/${schemeId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch scheme details:', error);
        return null;
    }
};

/**
 * 创建问题模板方案
 */
export const createQuestionScheme = async (data: {
    name: string;
    description?: string;
    shopId?: string;
}): Promise<QuestionScheme | null> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/schemes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to create question scheme:', error);
        return null;
    }
};

/**
 * 获取方案的问题模板列表
 */
export const fetchQuestionDetails = async (schemeId: string): Promise<QuestionDetail[]> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/schemes/${schemeId}/details`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
            return json.data;
        }
        return [];
    } catch (error) {
        console.error('Failed to fetch question details:', error);
        return [];
    }
};

/**
 * 添加问题模板
 */
export const addQuestionDetail = async (
    schemeId: string,
    data: { question: string }
): Promise<QuestionDetail | null> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/schemes/${schemeId}/details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to add question detail:', error);
        return null;
    }
};

/**
 * 更新问题模板
 */
export const updateQuestionDetail = async (
    detailId: string,
    data: { question?: string }
): Promise<QuestionDetail | null> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/details/${detailId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        const json = await res.json();
        if (json.success && json.data) {
            return json.data;
        }
        return null;
    } catch (error) {
        console.error('Failed to update question detail:', error);
        return null;
    }
};

/**
 * 删除问题模板
 */
export const deleteQuestionDetail = async (detailId: string): Promise<boolean> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/details/${detailId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        return json.success;
    } catch (error) {
        console.error('Failed to delete question detail:', error);
        return false;
    }
};

/**
 * 批量更新问题排序
 */
export const updateQuestionsOrder = async (
    schemeId: string,
    orders: { id: string; sortOrder: number }[]
): Promise<boolean> => {
    try {
        const token = localStorage.getItem('merchantToken');
        const res = await fetch(`${BASE_URL}/questions/schemes/${schemeId}/reorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ orders })
        });
        const json = await res.json();
        return json.success;
    } catch (error) {
        console.error('Failed to update questions order:', error);
        return false;
    }
};
