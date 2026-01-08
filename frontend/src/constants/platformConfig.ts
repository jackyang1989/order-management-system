/**
 * 全平台动态配置 - 消除淘宝硬编码
 * The Source of Truth for all platform-specific configurations
 */

export interface PlatformImageConfig {
    key: string;
    label: string;
    example: string;
    required: boolean;
}

export interface PlatformConfig {
    id: string;
    name: string;
    accountLabel: string;
    accountPlaceholder: string;
    hasLoginLocation: boolean;      // 是否需要常用登录地
    hasAddress: boolean;             // 是否需要收货地址
    hasRealName: boolean;            // 是否需要实名认证姓名
    hasSmsVerification: boolean;     // 是否需要短信验证
    tips: string[];                  // 温馨提示
    requiredImages: PlatformImageConfig[];
}

export const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
    // ============ 已支持平台 ============
    taobao: {
        id: 'taobao',
        name: '淘宝',
        accountLabel: '淘宝账号',
        accountPlaceholder: '请输入您的淘宝账号',
        hasLoginLocation: true,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '淘宝账号必须与常用登录地一致，否则审核不通过',
            '收货地址需真实有效，用于商家发货',
            '所有截图需清晰完整，模糊或不完整将被拒绝',
            '审核通过后方可使用该买号接单'
        ],
        requiredImages: [
            { key: 'profileImg', label: '账号主页截图', example: '/examples/taobao-profile.jpg', required: true },
            { key: 'creditImg', label: '淘气值截图', example: '/examples/taoqi-score.jpg', required: true },
            { key: 'payAuthImg', label: '支付宝实名截图', example: '/examples/alipay-auth.jpg', required: true },
            { key: 'scoreImg', label: '芝麻信用截图', example: '/examples/zhima-credit.jpg', required: true }
        ]
    },

    pdd: {
        id: 'pdd',
        name: '拼多多',
        accountLabel: '拼多多账号',
        accountPlaceholder: '请输入拼多多账号或绑定手机号',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '拼多多账号即登录手机号',
            '需绑定真实收货地址',
            '截图需显示完整的账号信息'
        ],
        requiredImages: [
            { key: 'profileImg', label: '拼多多主页截图', example: '/examples/pdd-profile.jpg', required: true },
            { key: 'payAuthImg', label: '实名认证截图', example: '/examples/pdd-auth.jpg', required: true }
        ]
    },

    jd: {
        id: 'jd',
        name: '京东',
        accountLabel: '京东账号',
        accountPlaceholder: '请输入京东账号或手机号',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '京东账号需完成实名认证',
            '收货地址需真实有效',
            '京东Plus会员优先'
        ],
        requiredImages: [
            { key: 'profileImg', label: '京东个人中心截图', example: '/examples/jd-profile.jpg', required: true },
            { key: 'payAuthImg', label: '实名认证截图', example: '/examples/jd-auth.jpg', required: true }
        ]
    },

    // ============ 预留平台 ============
    xianyu: {
        id: 'xianyu',
        name: '闲鱼',
        accountLabel: '闲鱼编号',
        accountPlaceholder: '请输入闲鱼用户ID',
        hasLoginLocation: false,
        hasAddress: false,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '闲鱼账号需完成芝麻认证',
            '账号需绑定支付宝'
        ],
        requiredImages: [
            { key: 'profileImg', label: '闲鱼主页截图', example: '/examples/xianyu-profile.jpg', required: true }
        ]
    },

    douyin: {
        id: 'douyin',
        name: '抖音',
        accountLabel: '抖音号',
        accountPlaceholder: '请输入抖音号',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '抖音号需实名认证',
            '账号粉丝数影响任务匹配'
        ],
        requiredImages: [
            { key: 'profileImg', label: '抖音个人主页截图', example: '/examples/douyin-profile.jpg', required: true }
        ]
    },

    kuaishou: {
        id: 'kuaishou',
        name: '快手',
        accountLabel: '快手ID',
        accountPlaceholder: '请输入快手ID',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '快手号需实名认证',
            '账号需绑定手机号'
        ],
        requiredImages: [
            { key: 'profileImg', label: '快手个人主页截图', example: '/examples/kuaishou-profile.jpg', required: true }
        ]
    },

    ali1688: {
        id: 'ali1688',
        name: '1688',
        accountLabel: '1688账号',
        accountPlaceholder: '请输入1688账号',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '1688账号需企业认证或个人认证',
            '收货地址需真实有效'
        ],
        requiredImages: [
            { key: 'profileImg', label: '1688账号主页截图', example: '/examples/1688-profile.jpg', required: true },
            { key: 'payAuthImg', label: '认证截图', example: '/examples/1688-auth.jpg', required: true }
        ]
    },

    xiaohongshu: {
        id: 'xiaohongshu',
        name: '小红书',
        accountLabel: '小红书号',
        accountPlaceholder: '请输入小红书号',
        hasLoginLocation: false,
        hasAddress: true,
        hasRealName: true,
        hasSmsVerification: true,
        tips: [
            '小红书号需实名认证',
            '账号需绑定手机号'
        ],
        requiredImages: [
            { key: 'profileImg', label: '小红书个人主页截图', example: '/examples/xhs-profile.jpg', required: true }
        ]
    },
};

// 获取平台列表 (用于下拉选择)
export function getPlatformList(): { id: string; name: string }[] {
    return Object.values(PLATFORM_CONFIG).map(p => ({ id: p.id, name: p.name }));
}

// 获取平台配置
export function getPlatformConfig(platformId: string): PlatformConfig | null {
    return PLATFORM_CONFIG[platformId] || null;
}

// 平台ID到中文名映射 (兼容旧代码)
export const PLATFORM_NAME_MAP: Record<string, string> = {
    taobao: '淘宝',
    '淘宝': 'taobao',
    pdd: '拼多多',
    '拼多多': 'pdd',
    jd: '京东',
    '京东': 'jd',
    xianyu: '闲鱼',
    '闲鱼': 'xianyu',
    douyin: '抖音',
    '抖音': 'douyin',
    kuaishou: '快手',
    '快手': 'kuaishou',
    ali1688: '1688',
    '1688': 'ali1688',
    xiaohongshu: '小红书',
    '小红书': 'xiaohongshu',
};

// ============ 全局提示配置 ============
export const VIP_TIPS = [
    'VIP权益开通后立即生效',
    '已开通VIP续费时间将自动叠加',
    '虚拟商品一经开通不支持退款'
];

export const ORDER_RECEIVE_TIPS = [
    '请复制以上指定文字好评内容进行5星好评，若有照片好评内容需长按每张照片保存到相册再到评价页面上传买家秀，若有视频好评内容先点击下载视频保存到相册后再到评价页面上传视频，评价提交后将评价页面截图上传。',
    '无指定评价内容时需全5星并自由发挥15字以上与商品相关的评语。',
    '未按指定文字、照片、视频好评将扣除本次任务的银锭(佣金)。',
    '评价环节若胡乱评价、复制店内他人评价、评价与商品不符、中差评、低星评分等恶劣评价行为，买号将永久拉黑。'
];

// ============ 任务平台类型配置（与后端 TaskType 枚举对应）============
export enum TaskType {
    TAOBAO = 1,
    TMALL = 2,
    JD = 3,
    PDD = 4,
    DOUYIN = 5,
    KUAISHOU = 6,
}

// 平台类型到名称的映射
export const TASK_TYPE_NAMES: Record<number, string> = {
    [TaskType.TAOBAO]: '淘宝',
    [TaskType.TMALL]: '天猫',
    [TaskType.JD]: '京东',
    [TaskType.PDD]: '拼多多',
    [TaskType.DOUYIN]: '抖音',
    [TaskType.KUAISHOU]: '快手',
};

// 获取平台名称
export function getTaskTypeName(taskType: number): string {
    return TASK_TYPE_NAMES[taskType] || '其他';
}

// 任务平台列表（用于发布任务等场景）
export interface TaskPlatformOption {
    id: number;
    name: string;
    icon: string;
    platformCode: string; // 对应店铺platform字段
}

export const TASK_PLATFORMS: TaskPlatformOption[] = [
    { id: TaskType.TAOBAO, name: '淘宝', icon: '🟠', platformCode: 'TAOBAO' },
    { id: TaskType.TMALL, name: '天猫', icon: '🔴', platformCode: 'TMALL' },
    { id: TaskType.JD, name: '京东', icon: '🔴', platformCode: 'JD' },
    { id: TaskType.PDD, name: '拼多多', icon: '🟢', platformCode: 'PDD' },
    { id: TaskType.DOUYIN, name: '抖音', icon: '📱', platformCode: 'DOUYIN' },
    { id: TaskType.KUAISHOU, name: '快手', icon: '📱', platformCode: 'KUAISHOU' },
];

// 根据任务类型获取店铺平台代码
export function getShopPlatformCode(taskType: number): string {
    const platform = TASK_PLATFORMS.find(p => p.id === taskType);
    return platform?.platformCode || 'OTHER';
}
