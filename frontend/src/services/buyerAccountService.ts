import { BASE_URL } from '../../apiConfig';

export type BuyerAccountStatus = 'PENDING' | 'APPROVED' | 'DISABLED' | 'REJECTED';

export interface BuyerAccount {
    id: string;
    platform: '淘宝' | '京东' | '拼多多';
    accountId: string;
    accountName: string;
    status: BuyerAccountStatus;
    isDefault: boolean;
}

// TODO: read from system config
export const MAX_ACCOUNTS_PER_PLATFORM = 3;

const authHeader = () => {
    if (typeof localStorage === 'undefined') return {};
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const mapStatus = (s: number | string): BuyerAccountStatus => {
    if (s === 1 || s === 'APPROVED') return 'APPROVED';
    if (s === 2 || s === 'REJECTED') return 'REJECTED';
    if (s === 3 || s === 'DISABLED' || s === 'DELETED') return 'DISABLED';
    return 'PENDING';
};

const mapOut = (raw: any): BuyerAccount => ({
    id: raw.id,
    platform: raw.platform,
    accountId: raw.accountName,
    accountName: raw.accountName,
    status: mapStatus(raw.status),
    isDefault: Boolean(raw.isDefault),
});

// TODO: switch to real API when backend provides default/status endpoints
const useMock = true;
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

export async function list(): Promise<BuyerAccount[]> {
    if (useMock) {
        // TODO: replace with real API endpoint
        return [...mockStore];
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts?all=1`, {
        headers: { ...authHeader() },
    });
    if (!res.ok) throw new Error('获取买号失败');
    const data = await res.json();
    return (data.data || []).map(mapOut);
}

export async function create(input: { platform: string; accountId: string; accountName?: string }): Promise<void> {
    if (useMock) {
        // TODO: replace with real API endpoint
        const id = `ba_mock_${Date.now()}`;
        const account: BuyerAccount = {
            id,
            platform: input.platform as any,
            accountId: input.accountId,
            accountName: input.accountName || input.accountId,
            status: 'PENDING',
            isDefault: mockStore.length === 0,
        };
        mockStore.push(account);
        return;
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
            platform: input.platform,
            accountName: input.accountId,
        }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '提交失败');
}

export async function setDefault(id: string): Promise<void> {
    if (useMock) {
        // TODO: replace with real API endpoint
        mockStore = mockStore.map(acc => ({ ...acc, isDefault: acc.id === id }));
        return;
    }
    // TODO: replace with real API endpoint `/buyer-accounts/:id/default`
    throw new Error('未提供设默认买号接口');
}

export async function setStatus(id: string, status: BuyerAccountStatus): Promise<void> {
    if (useMock) {
        // TODO: replace with real API endpoint
        mockStore = mockStore.map(acc => acc.id === id ? { ...acc, status } : acc);
        return;
    }
    // TODO: replace with real API endpoint `/buyer-accounts/:id/status`
    throw new Error('未提供启用/禁用买号接口');
}

export async function remove(id: string): Promise<void> {
    if (useMock) {
        // TODO: replace with real API endpoint
        mockStore = mockStore.filter(acc => acc.id !== id);
        return;
    }
    const res = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '删除失败');
}
