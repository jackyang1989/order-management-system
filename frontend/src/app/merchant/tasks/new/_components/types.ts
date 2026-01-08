export enum TaskType {
    TAOBAO = 1,
    TMALL = 2,
    JD = 3,
    PDD = 4
}

export interface PraiseContent {
    str?: string; // Text praise content
    img?: string[]; // Image URLs
    video?: string; // Video URL
}

export interface TaskFormData {
    // Step 1: Basic Info
    taskType: number;
    shopId: string;
    shopName: string;
    url: string;
    title: string;
    mainImage: string;
    keyword: string;
    taoWord?: string;
    goodsPrice: number;
    count: number;

    // Step 2: Value Added
    isFreeShipping: number; // 1=包邮, 2=不包邮

    // Praise
    isPraise: boolean;
    praiseType: 'text' | 'image' | 'video' | 'none';
    praiseList: string[]; // Text content per order
    praiseImgList: string[][]; // Images per order (max 5 per order)
    praiseVideoList: string[]; // Video URL per order (for video praise type)

    // Extra Services
    isTimingPublish: boolean;
    publishTime?: string;

    isTimingPay: boolean;
    timingPayTime?: string;

    isCycleTime: boolean;
    cycleTime?: number; // Days

    addReward: number; // Extra money per order

    // Verify Code (口令验证)
    isPasswordEnabled: boolean; // 是否开启口令验证
    checkPassword: string; // 商品口令 (4-10字)

    // Fee Calculation (Computed)
    baseServiceFee: number;
    praiseFee: number;
    timingPublishFee: number;
    timingPayFee: number;
    cycleTimeFee: number;
    addRewardFee: number;

    // New Fee Components (Only core)
    postageMoney: number;
    marginMoney: number;

    totalDeposit: number;
    totalCommission: number;
}

export const InitialTaskData: TaskFormData = {
    taskType: 1,
    shopId: '',
    shopName: '',
    url: '',
    title: '',
    mainImage: '',
    keyword: '',
    goodsPrice: 0,
    count: 1,

    isFreeShipping: 1,

    isPraise: false,
    praiseType: 'none',
    praiseList: [],
    praiseImgList: [],
    praiseVideoList: [],

    isTimingPublish: false,
    isTimingPay: false,
    isCycleTime: false,
    addReward: 0,

    // Verify Code
    isPasswordEnabled: false,
    checkPassword: '',

    // Defaults    // Fees
    baseServiceFee: 0,
    praiseFee: 0,
    timingPublishFee: 0,
    timingPayFee: 0,
    cycleTimeFee: 0,
    addRewardFee: 0,

    postageMoney: 0,
    marginMoney: 0,

    totalDeposit: 0,
    totalCommission: 0
};
