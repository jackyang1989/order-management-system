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
            { key: 'profileImg', label: '淘宝档案截图', example: '/examples/taobao-profile.jpg', required: true },
            { key: 'creditImg', label: '淘气值截图', example: '/examples/taoqi-score.jpg', required: true },
            { key: 'payAuthImg', label: '支付宝认证截图', example: '/examples/alipay-auth.jpg', required: true },
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
