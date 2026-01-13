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

// 关键词高级设置
export interface KeywordAdvancedSettings {
    compareKeyword?: string;  // 货比关键词 (可选，不填则用搜索关键词)
    backupKeyword?: string;   // 备用关键词 (找不到商品时使用)
}

// 商品筛选设置 (商品级别，所有关键词共享)
export interface GoodsFilterSettings {
    discount: string[];       // 折扣服务选项 (多选)
    sort: string;             // 排序方式
    minPrice: number;         // 最低价
    maxPrice: number;         // 最高价
    province: string;         // 发货地
}

// 关键词配置
export interface KeywordConfig {
    keyword: string;                  // 搜索关键词
    useCount?: number;                // 使用次数
    advancedSettings?: KeywordAdvancedSettings;
    filterSettings?: GoodsFilterSettings;  // 关键词筛选设置
}

// 下单规格配置
export interface OrderSpecConfig {
    specName: string;     // 规格名称（如：颜色、尺码）
    specValue: string;    // 规格值（如：红色、XL）
    quantity: number;     // 购买数量
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
    specName?: string;    // 规格名 (兼容旧版)
    specValue?: string;   // 规格值 (兼容旧版)
    keyword?: string;     // 搜索关键词 (兼容旧版单关键词)
    keywords?: KeywordConfig[];  // 多关键词配置 (新版，最多5个)
    goodsSpec?: string;   // 详情问答提示 (兼容旧版)
    orderSpecs?: OrderSpecConfig[];  // 下单规格配置 (最多5个)
    verifyCode?: string;  // 核对口令 (最多10字，必须是商品详情页有的文字)
    shopId?: string;      // 所属店铺ID
    filterSettings?: GoodsFilterSettings;  // 商品筛选设置 (商品级别)
}

export interface TaskFormData {
    // Step 1: Basic Info
    taskType: number;        // 平台类型 (PlatformType)
    taskEntryType: number;   // 任务入口类型 (TaskEntryType): 1=关键词, 2=淘口令, 3=二维码, 4=直通车, 5=通道
    terminal: number;        // 返款方式: 1=本佣货返, 2=本立佣货
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

    // Browse Behavior Settings
    needCompare: boolean;       // 货比 (compare with other products)
    compareCount: number;       // 货比数量
    needFavorite: boolean;      // 收藏商品
    needFollow: boolean;        // 关注店铺
    needAddCart: boolean;       // 加入购物车
    needContactCS: boolean;     // 联系客服
    contactCSContent: string;   // 联系客服内容

    // 浏览时长设置
    totalBrowseMinutes: number;  // 总浏览时长(分钟)
    compareBrowseMinutes: number; // 货比浏览时长
    mainBrowseMinutes: number;   // 主商品浏览时长
    subBrowseMinutes: number;    // 副商品浏览时长
    hasSubProduct: boolean;      // 是否有副商品

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

    // Step 2: Order Settings
    memo: string;            // 下单提示/备注 (最多100字)
    weight: number;          // 包裹重量 (0-30kg)
    fastRefund: boolean;     // 快速返款服务 (0.6%费率)
    orderInterval: number;   // 任务接单间隔 (分钟)

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
    terminal: 2,       // 默认本立佣货
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

    // Browse Behavior Settings
    needCompare: false,
    compareCount: 3,
    needFavorite: false,
    needFollow: false,
    needAddCart: false,
    needContactCS: false,
    contactCSContent: '',

    // 浏览时长设置
    totalBrowseMinutes: 15,
    compareBrowseMinutes: 3,
    mainBrowseMinutes: 8,
    subBrowseMinutes: 2,
    hasSubProduct: true,

    isTimingPublish: false,
    isTimingPay: false,
    isCycleTime: false,
    addReward: 0,

    // 特殊任务类型
    isRepay: false,
    isNextDay: false,

    // Order Settings
    memo: '',
    weight: 0,
    fastRefund: false,
    orderInterval: 0,

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
