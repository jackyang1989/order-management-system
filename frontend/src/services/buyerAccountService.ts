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

// Overlay store for missing endpoints (setDefault/setStatus)
let overrideMap: Record<string, Partial<BuyerAccount>> = {};
let lastDefaultId: string | null = null;

const applyOverrides = (items: BuyerAccount[]): BuyerAccount[] => {
    return items.map(item => {
        const override = overrideMap[item.id];
        const merged = override ? { ...item, ...override } : item;
        if (lastDefaultId && merged.id === lastDefaultId) {
            return { ...merged, isDefault: true };
        }
        return merged;
    });
};

export async function list(): Promise<BuyerAccount[]> {
    const res = await fetch(`${BASE_URL}/buyer-accounts?all=1`, {
        headers: { ...authHeader() },
    });
    if (!res.ok) throw new Error('获取买号失败');
    const data = await res.json();
    const items: BuyerAccount[] = (data.data || []).map((raw: any) => ({
        id: raw.id,
        platform: raw.platform,
        accountId: raw.accountName,
        accountName: raw.accountName,
        status: mapStatus(raw.status),
        isDefault: Boolean(raw.isDefault),
    }));
    return applyOverrides(items);
}

export async function create(input: { platform: string; accountId: string; accountName?: string }): Promise<void> {
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

export async function remove(id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
        method: 'DELETE',
        headers: { ...authHeader() },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '删除失败');
    // cleanup overrides
    delete overrideMap[id];
    if (lastDefaultId === id) lastDefaultId = null;
}

export async function setDefault(id: string): Promise<void> {
    // TODO: replace with real API endpoint
    lastDefaultId = id;
    overrideMap = Object.fromEntries(Object.entries(overrideMap).map(([k, v]) => [k, { ...v, isDefault: false }]));
    overrideMap[id] = { ...(overrideMap[id] || {}), isDefault: true };
}

export async function setStatus(id: string, status: BuyerAccountStatus): Promise<void> {
    // TODO: replace with real API endpoint
    overrideMap[id] = { ...(overrideMap[id] || {}), status };
}
