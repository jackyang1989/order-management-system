import api from './api';

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

// 平台数据接口
export interface PlatformData {
    id: string;
    code: string;
    name: string;
    icon: string;
    color: string;
    baseFeeRate: number;
    supportsTkl: boolean;
    sortOrder: number;
}

// 缓存系统配置
let cachedConfig: SystemGlobalConfig | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存平台列表
let cachedPlatforms: PlatformData[] | null = null;
let platformsCacheTimestamp = 0;

export async function fetchSystemConfig(): Promise<SystemGlobalConfig | null> {
    const now = Date.now();
    if (cachedConfig && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedConfig;
    }

    try {
        // 使用公开API，无需登录即可获取配置
        const response = await api.get<SystemGlobalConfig>('/system-config/public');
        cachedConfig = response.data;
        cacheTimestamp = now;
        return response.data;
    } catch (error) {
        console.error('获取系统配置失败:', error);
        return cachedConfig; // 返回缓存的配置（如果有）
    }
}

/**
 * 从后端获取启用的平台列表
 */
export async function fetchEnabledPlatforms(): Promise<PlatformData[]> {
    const now = Date.now();
    if (cachedPlatforms && (now - platformsCacheTimestamp) < CACHE_DURATION) {
        return cachedPlatforms;
    }

    try {
        const response = await api.get<{ data: PlatformData[] }>('/platforms');
        cachedPlatforms = response.data?.data || [];
        platformsCacheTimestamp = now;
        return cachedPlatforms;
    } catch (error) {
        console.error('获取平台列表失败:', error);
        return cachedPlatforms || []; // 返回缓存的平台列表（如果有）
    }
}

export function clearConfigCache(): void {
    cachedConfig = null;
    cacheTimestamp = 0;
    cachedPlatforms = null;
    platformsCacheTimestamp = 0;
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

// 获取商家最低提现金额
export function getMerchantMinWithdraw(config: SystemGlobalConfig | null): number {
    if (!config) return 100; // 默认100元
    return Number(config.sellerMinMoney) || 100;
}

// 获取用户最低提现金额
export function getUserMinWithdraw(config: SystemGlobalConfig | null): number {
    if (!config) return 10; // 默认10元
    return Number(config.userMinMoney) || 10;
}

// 获取商家提现手续费率
export function getMerchantWithdrawFeeRate(config: SystemGlobalConfig | null): number {
    if (!config) return 0; // 默认0
    return Number(config.sellerCashFee) || 0;
}

// 获取银锭兑换比例（1银锭=多少元）
export function getSilverToRmbRate(config: SystemGlobalConfig | null): number {
    if (!config) return 1; // 默认1:1
    return Number(config.rewardPrice) || 1;
}

// 获取邀请解锁门槛（完成多少单才能邀请）
export function getInviteUnlockThreshold(config: SystemGlobalConfig | null): number {
    if (!config) return 10; // 默认10单
    return Number(config.invitationNum) || 10;
}

// 获取每单邀请奖励金额（银锭）
export function getInviteRewardAmount(config: SystemGlobalConfig | null): number {
    if (!config) return 1; // 默认1银锭
    return Number(config.inviteRewardAmount) || 1;
}

// 获取启用的任务平台类型ID列表 (数字类型，对应 TaskType 枚举)
const PLATFORM_CODE_TO_TASK_TYPE: Record<string, number> = {
    'taobao': 1,  // TaskType.TAOBAO
    'tmall': 2,   // TaskType.TMALL
    'jd': 3,      // TaskType.JD
    'pdd': 4,     // TaskType.PDD
    'douyin': 5,  // TaskType.DOUYIN
    'kuaishou': 6,
    'xhs': 7,
    'xianyu': 8,
    '1688': 9,
};

export function getEnabledTaskTypesFromPlatforms(platforms: PlatformData[]): number[] {
    return platforms
        .map(platform => PLATFORM_CODE_TO_TASK_TYPE[platform.code])
        .filter((t): t is number => t !== undefined);
}

// 获取所有增值服务费用
export interface ServiceFees {
    timingPublish: number;      // 定时发布
    timingPay: number;          // 定时付款
    nextDay: number;            // 隔天任务
    randomBrowse: number;       // 随机浏览店铺其他商品
    fastRefundRate: number;     // 快速返款服务费率
    phoneFee: number;           // 手机端加成
    refundService: number;      // 降天任务服务费
}

export function getServiceFees(config: SystemGlobalConfig | null): ServiceFees {
    if (!config) {
        return {
            timingPublish: 1,
            timingPay: 1,
            nextDay: 0.5,
            randomBrowse: 0.5,
            fastRefundRate: 0.006,
            phoneFee: 0.3,
            refundService: 0.5,
        };
    }
    return {
        timingPublish: Number(config.timingPublish) || 1,
        timingPay: Number(config.timingPay) || 1,
        nextDay: Number(config.nextDay) || 0.5,
        randomBrowse: Number(config.goodsMoreFee) || 0.5,
        fastRefundRate: Number(config.refundServicePrice) || 0.006,
        phoneFee: Number(config.phoneFee) || 0.3,
        refundService: Number(config.ysFee) || 0.5,
    };
}
