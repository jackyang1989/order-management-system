import { apiClient } from './apiClient';

export interface SystemGlobalConfig {
    id: number;
    // 注册赠送配置
    userNum: number;
    sellerNum: number;
    userVipTime: number;
    sellerVipTime: number;
    // VIP价格配置
    userVip: string;
    sellerVip: string;
    // 提现相关配置
    userMinMoney: number;
    sellerMinMoney: number;
    userMinReward: number;
    rewardPrice: number;
    sellerCashFee: number;
    userCashFree: string;
    userFeeMaxPrice: string;
    // 服务费用配置
    unionInterval: number;
    goodsMoreFee: number;
    refundServicePrice: number;
    phoneFee: number;
    pcFee: number;
    timingPay: number;
    timingPublish: number;
    nextDay: number;
    postage: number;
    rePay: number;
    ysFee: number;
    // 好评费用配置
    praise: number;
    imgPraise: number;
    videoPraise: number;
    // 佣金分成配置
    divided: number;
    // 其他配置
    verifySwitch: number;
    invitationNum: number;
    // 动态业务配置
    starThresholds: string;
    starPriceLimits: string;
    firstAccountVipDays: number;
    passwordCheckEnabled: boolean;
    // 邀请奖励配置
    inviteRewardAmount: number;
    inviteMaxOrders: number;
    inviteExpiryDays: number;
    updatedAt: string;
}

// 缓存系统配置
let cachedConfig: SystemGlobalConfig | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

export async function fetchSystemConfig(): Promise<SystemGlobalConfig | null> {
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedConfig;
    }

    try {
        const response = await apiClient.get<SystemGlobalConfig>('/system-config/global');
        cachedConfig = response.data;
        cacheTimestamp = now;
        return response.data;
    } catch (error) {
        console.error('获取系统配置失败:', error);
        return cachedConfig; // 返回缓存的配置（如果有）
    }
}

export function clearConfigCache(): void {
    cachedConfig = null;
    cacheTimestamp = 0;
}

// 解析好评费用
export function getPraiseFees(config: SystemGlobalConfig | null): { text: number; image: number; video: number } {
    if (!config) {
        return { text: 2, image: 4, video: 10 }; // 默认值
    }
    return {
        text: Number(config.praise) || 2,
        image: Number(config.imgPraise) || 4,
        video: Number(config.videoPraise) || 10,
    };
}

// 解析提现手续费
export function getWithdrawFeeRate(config: SystemGlobalConfig | null): number {
    if (!config) return 0.05; // 默认5%
    // userCashFree 可能是百分比字符串或小数
    const feeStr = config.userCashFree;
    if (!feeStr) return 0.05;
    const fee = parseFloat(feeStr);
    return isNaN(fee) ? 0.05 : (fee > 1 ? fee / 100 : fee);
}

// 解析VIP套餐价格
export function parseVipPrices(priceString: string): number[] {
    if (!priceString) return [];
    return priceString.split(',').map(p => parseFloat(p.trim())).filter(p => !isNaN(p));
}

// 解析星级阈值
export function parseStarThresholds(thresholdsJson: string): Record<number, number> {
    try {
        return JSON.parse(thresholdsJson);
    } catch {
        return { 2: 30, 3: 60, 4: 90, 5: 120 }; // 默认值
    }
}

// 解析星级限价
export function parseStarPriceLimits(limitsJson: string): Record<number, number> {
    try {
        return JSON.parse(limitsJson);
    } catch {
        return { 1: 100, 2: 500, 3: 1000, 4: 2000, 5: 99999 }; // 默认值
    }
}
