import { BASE_URL } from '../../apiConfig';

export type BuyerAccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface BuyerAccount {
    id: string;
    platform: '淘宝' | '京东' | '拼多多';
    accountId: string;      // 账号唯一标识
    accountName: string;    // 展示名称，可与 accountId 相同
    status: BuyerAccountStatus;
    isDefault: boolean;
}

// NOTE: 后端当前无默认/启用禁用接口，临时内存模拟 CRUD。
// TODO: replace with real API endpoint when backend adds default/status endpoints.
let mockStore: BuyerAccount[] = [
    {
        id: 'ba_mock_1',
        platform: '淘宝',
        accountId: 'tb_buyer_001',
        accountName: 'tb_buyer_001',
        status: 'APPROVED',
        isDefault: true,
    },
    {
        id: 'ba_mock_2',
        platform: '京东',
        accountId: 'jd_buyer_002',
        accountName: 'jd_buyer_002',
        status: 'PENDING',
        isDefault: false,
    },
];

const useMock = false;

const authHeader = () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchBuyerAccounts(all = true): Promise<BuyerAccount[]> {
    if (useMock) {
        return [...mockStore];
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts${all ? '?all=1' : ''}`, {
        headers: { ...authHeader() },
    });
    if (!res.ok) throw new Error('获取买号失败');
    const data = await res.json();
    // 后端字段 accountName 映射到 accountId/accountName
    return (data.data || []).map((item: any) => ({
        id: item.id,
        platform: item.platform,
        accountId: item.accountName,
        accountName: item.accountName,
        status: item.status === 3 ? 'DISABLED' : item.status === 1 ? 'APPROVED' : item.status === 2 ? 'REJECTED' : 'PENDING',
        isDefault: Boolean(item.isDefault),
    }));
}

export async function createBuyerAccount(payload: {
    platform: BuyerAccount['platform'];
    accountId: string;
    accountName: string;
}): Promise<{ success: boolean; message: string }> {
    if (useMock) {
        const id = `ba_mock_${Date.now()}`;
        mockStore.push({ id, ...payload, status: 'PENDING', isDefault: mockStore.length === 0 });
        return { success: true, message: '提交成功，等待审核' };
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
            platform: payload.platform,
            accountName: payload.accountId,
        }),
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || (res.ok ? '提交成功' : '提交失败') };
}

export async function setDefaultBuyerAccount(id: string): Promise<{ success: boolean; message: string }> {
    if (useMock) {
        mockStore = mockStore.map(acc => ({ ...acc, isDefault: acc.id === id }));
        return { success: true, message: '已设为默认' };
    }
    // TODO: replace with real API endpoint `/buyer-accounts/:id/default`
    return { success: false, message: '未提供默认接口，请后端补充 /buyer-accounts/:id/default' };
}

export async function toggleBuyerAccountStatus(id: string, enable: boolean): Promise<{ success: boolean; message: string }> {
    if (useMock) {
        mockStore = mockStore.map(acc => acc.id === id ? { ...acc, status: enable ? 'APPROVED' : 'DISABLED' } : acc);
        return { success: true, message: enable ? '已启用' : '已禁用' };
    }
    // TODO: replace with real API endpoint `/buyer-accounts/:id/status`
    return { success: false, message: '未提供启用/禁用接口，请后端补充 /buyer-accounts/:id/status' };
}

export async function deleteBuyerAccount(id: string): Promise<{ success: boolean; message: string }> {
    if (useMock) {
        mockStore = mockStore.filter(acc => acc.id !== id);
        return { success: true, message: '已删除' };
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
    });
    const data = await res.json();
    return { success: res.ok, message: data.message || (res.ok ? '删除成功' : '删除失败') };
}
