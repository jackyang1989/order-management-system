import { BASE_URL } from '../../apiConfig';

export type BuyerAccountStatus = 'PENDING' | 'APPROVED' | 'DISABLED' | 'REJECTED';

export interface BuyerAccount {
    id: string;
    platform: '淘宝' | '京东' | '拼多多';
    platformAccount: string;      // 买号
    loginProvince?: string;       // 常用登录省份
    loginCity?: string;           // 常用登录城市
    province?: string;            // 收货省份
    city?: string;                // 收货城市
    district?: string;            // 收货区县
    buyerName?: string;           // 收货人姓名
    buyerPhone?: string;          // 收货人手机
    fullAddress?: string;         // 详细地址
    realName?: string;            // 实名认证姓名
    profileImg?: string;          // 账号主页截图
    creditImg?: string;           // 淘气值截图
    payAuthImg?: string;          // 支付宝实名截图
    scoreImg?: string;            // 芝麻信用截图
    status: BuyerAccountStatus;
    isDefault: boolean;
    star?: number;                // 买号星级
    rejectReason?: string;        // 拒绝原因
}

export interface CreateBuyerAccountInput {
    platform: string;
    platformAccount: string;
    loginProvince?: string;
    loginCity?: string;
    province?: string;
    city?: string;
    district?: string;
    buyerName?: string;
    buyerPhone?: string;
    fullAddress?: string;
    realName?: string;
    profileImg?: string;
    creditImg?: string;
    payAuthImg?: string;
    scoreImg?: string;
    smsCode?: string;
}

export interface UpdateBuyerAccountInput {
    loginProvince?: string;
    loginCity?: string;
    province?: string;
    city?: string;
    district?: string;
    buyerName?: string;
    buyerPhone?: string;
    fullAddress?: string;
    realName?: string;
    profileImg?: string;
    creditImg?: string;
    payAuthImg?: string;
    scoreImg?: string;
    smsCode?: string;
}

// TODO: read from system config
export const MAX_ACCOUNTS_PER_PLATFORM = 3;

const authHeader = (): Record<string, string> => {
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
        platformAccount: raw.platformAccount,
        loginProvince: raw.loginProvince,
        loginCity: raw.loginCity,
        province: raw.province,
        city: raw.city,
        district: raw.district,
        buyerName: raw.buyerName,
        buyerPhone: raw.buyerPhone,
        fullAddress: raw.fullAddress,
        realName: raw.realName,
        profileImg: raw.profileImg,
        creditImg: raw.creditImg,
        payAuthImg: raw.payAuthImg,
        scoreImg: raw.scoreImg,
        status: mapStatus(raw.status),
        isDefault: Boolean(raw.isDefault),
        star: raw.star,
        rejectReason: raw.rejectReason,
    }));
    return applyOverrides(items);
}

export async function getOne(id: string): Promise<BuyerAccount | null> {
    const res = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
        headers: { ...authHeader() },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.data || data;
    return {
        id: raw.id,
        platform: raw.platform,
        platformAccount: raw.platformAccount,
        loginProvince: raw.loginProvince,
        loginCity: raw.loginCity,
        province: raw.province,
        city: raw.city,
        district: raw.district,
        buyerName: raw.buyerName,
        buyerPhone: raw.buyerPhone,
        fullAddress: raw.fullAddress,
        realName: raw.realName,
        profileImg: raw.profileImg,
        creditImg: raw.creditImg,
        payAuthImg: raw.payAuthImg,
        scoreImg: raw.scoreImg,
        status: mapStatus(raw.status),
        isDefault: Boolean(raw.isDefault),
        star: raw.star,
        rejectReason: raw.rejectReason,
    };
}

export async function create(input: CreateBuyerAccountInput): Promise<void> {
    const res = await fetch(`${BASE_URL}/buyer-accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '提交失败');
}

export async function update(id: string, input: UpdateBuyerAccountInput): Promise<void> {
    const res = await fetch(`${BASE_URL}/buyer-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '更新失败');
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

// SMS 验证码
export async function sendSmsCode(phone: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/sms/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ phone, type: 'bind_buyno' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || '发送失败');
}
