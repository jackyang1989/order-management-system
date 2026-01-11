// 平台类型
export enum PlatformType {
    TAOBAO = 1,
    TMALL = 2,
    JD = 3,
    PDD = 4,
    DOUYIN = 5,
    KUAISHOU = 6,
    XHS = 7,
    XIANYU = 8,
    ALI1688 = 9,
}

// 任务搜索入口类型（旧版兼容）
export enum TaskEntryType {
    KEYWORD = 1,      // 关键词搜索
    TAOWORD = 2,      // 淘口令
    QRCODE = 3,       // 二维码
    ZTC = 4,          // 直通车
    CHANNEL = 5,      // 通道
}

// 向后兼容
export const TaskType = PlatformType;

export interface PraiseContent {
    str?: string; // Text praise content
    img?: string[]; // Image URLs
    video?: string; // Video URL
}

// 商品项接口 - 支持多商品
export interface GoodsItem {
    id: string;           // 临时ID用于前端管理
    goodsId?: string;     // 关联商品库中的商品ID（可选）
    name: string;         // 商品名称
    image: string;        // 商品图片
    link: string;         // 商品链接
    price: number;        // 单价
    quantity: number;     // 数量
    specName?: string;    // 规格名
    specValue?: string;   // 规格值
    keyword?: string;     // 搜索关键词
}

export interface TaskFormData {
    // Step 1: Basic Info
    taskType: number;        // 平台类型 (PlatformType)
    taskEntryType: number;   // 任务入口类型 (TaskEntryType): 1=关键词, 2=淘口令, 3=二维码, 4=直通车, 5=通道
    shopId: string;
    shopName: string;

    // 多商品列表 (新版)
    goodsList: GoodsItem[];

    // 单商品字段 (兼容旧版)
    url: string;
    title: string;
    mainImage: string;
    keyword: string;
    taoWord?: string;        // 淘口令内容
    qrCodeImage?: string;    // 二维码图片URL
    ztcKeyword?: string;     // 直通车关键词
    channelUrl?: string;     // 通道链接
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

    // 浏览行为设置
    needHuobi: boolean;      // 货比
    huobiCount: number;      // 货比数量
    needShoucang: boolean;   // 收藏
    needGuanzhu: boolean;    // 关注店铺
    needJiagou: boolean;     // 加购
    needJialiao: boolean;    // 假聊
    jialiaoContent: string;  // 假聊内容

    // 浏览时长设置
    totalBrowseMinutes: number;  // 总浏览时长(分钟)
    mainBrowseMinutes: number;   // 主商品浏览时长
    subBrowseMinutes: number;    // 副商品浏览时长

    // Extra Services
    isTimingPublish: boolean;
    publishTime?: string;

    isTimingPay: boolean;
    timingPayTime?: string;

    isCycleTime: boolean;
    cycleTime?: number; // Days

    addReward: number; // Extra money per order

    // 特殊任务类型
    isRepay: boolean;        // 回购任务
    isNextDay: boolean;      // 隔天任务

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
    goodsMoreFee: number;   // 多商品费用
    nextDayFee: number;     // 隔天任务费用

    // New Fee Components (Only core)
    postageMoney: number;
    marginMoney: number;

    totalDeposit: number;
    totalCommission: number;
}

export const InitialTaskData: TaskFormData = {
    taskType: 1,
    taskEntryType: 1,  // 默认关键词搜索
    shopId: '',
    shopName: '',

    // 多商品
    goodsList: [],

    // 兼容旧版
    url: '',
    title: '',
    mainImage: '',
    keyword: '',
    taoWord: '',
    qrCodeImage: '',
    ztcKeyword: '',
    channelUrl: '',
    goodsPrice: 0,
    count: 1,

    isFreeShipping: 1,

    isPraise: false,
    praiseType: 'none',
    praiseList: [],
    praiseImgList: [],
    praiseVideoList: [],

    // 浏览行为设置
    needHuobi: false,
    huobiCount: 3,
    needShoucang: false,
    needGuanzhu: false,
    needJiagou: false,
    needJialiao: false,
    jialiaoContent: '',

    // 浏览时长设置
    totalBrowseMinutes: 15,
    mainBrowseMinutes: 8,
    subBrowseMinutes: 2,

    isTimingPublish: false,
    isTimingPay: false,
    isCycleTime: false,
    addReward: 0,

    // 特殊任务类型
    isRepay: false,
    isNextDay: false,

    // Verify Code
    isPasswordEnabled: false,
    checkPassword: '',

    // Fees
    baseServiceFee: 0,
    praiseFee: 0,
    timingPublishFee: 0,
    timingPayFee: 0,
    cycleTimeFee: 0,
    addRewardFee: 0,
    goodsMoreFee: 0,
    nextDayFee: 0,

    postageMoney: 0,
    marginMoney: 0,

    totalDeposit: 0,
    totalCommission: 0
};
