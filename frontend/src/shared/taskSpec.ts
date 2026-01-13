/**
 * Task Configuration Specification - Source of Truth
 */

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

export const PlatformLabels: Record<number, string> = {
    [PlatformType.TAOBAO]: '淘宝',
    [PlatformType.TMALL]: '天猫',
    [PlatformType.JD]: '京东',
    [PlatformType.PDD]: '拼多多',
    [PlatformType.DOUYIN]: '抖音',
    [PlatformType.KUAISHOU]: '快手',
    [PlatformType.XHS]: '小红书',
    [PlatformType.XIANYU]: '闲鱼',
    [PlatformType.ALI1688]: '1688',
};

export enum TaskEntryType {
    KEYWORD = 1,      // 关键词搜索
    TAOWORD = 2,      // 淘口令
    QRCODE = 3,       // 二维码
    ZTC = 4,          // 直通车
    CHANNEL = 5,      // 通道
}

export const TaskEntryLabels: Record<number, string> = {
    [TaskEntryType.KEYWORD]: '关键词',
    [TaskEntryType.TAOWORD]: '淘口令',
    [TaskEntryType.QRCODE]: '二维码',
    [TaskEntryType.ZTC]: '直通车',
    [TaskEntryType.CHANNEL]: '通道',
};

export enum TerminalType {
    COMMISSION_RETURN = 1, // 本佣货返
    INSTANT_RETURN = 2,    // 本立佣货
}

export const TerminalLabels: Record<number, string> = {
    [TerminalType.COMMISSION_RETURN]: '本佣货返',
    [TerminalType.INSTANT_RETURN]: '本立佣货',
};

export enum TaskStatus {
    PENDING_PAY = 0,    // 待支付
    ACTIVE = 1,         // 进行中
    COMPLETED = 2,      // 已完成
    CANCELLED = 3,      // 已取消
    WAITING_REVIEW = 4, // 待审核
}

export const TaskStatusLabels: Record<number, string> = {
    [TaskStatus.PENDING_PAY]: '待支付',
    [TaskStatus.ACTIVE]: '进行中',
    [TaskStatus.COMPLETED]: '已完成',
    [TaskStatus.CANCELLED]: '已取消',
    [TaskStatus.WAITING_REVIEW]: '待审核',
};

export const OrderStatusLabels: Record<string, string> = {
    'PENDING': '进行中',
    'SUBMITTED': '待审核',
    'APPROVED': '已通过',
    'REJECTED': '已驳回',
    'COMPLETED': '已完成',
};

export interface TaskFieldSpec {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'enum';
    must_show_in_merchant_detail: boolean;
    must_show_in_admin_detail: boolean;
    must_show_in_user_claim: boolean;
    must_show_in_user_execute: boolean;
}

export const TASK_FIELDS: TaskFieldSpec[] = [
    { key: 'taskType', label: '平台类型', type: 'enum', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: true, must_show_in_user_execute: true },
    { key: 'terminal', label: '结算方式', type: 'enum', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: true, must_show_in_user_execute: true },
    { key: 'isFreeShipping', label: '是否包邮', type: 'boolean', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: true, must_show_in_user_execute: true },
    { key: 'compareCount', label: '货比数量', type: 'number', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: false, must_show_in_user_execute: true },
    { key: 'contactCSContent', label: '联系客服内容', type: 'string', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: false, must_show_in_user_execute: true },
    { key: 'checkPassword', label: '核对口令', type: 'string', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: true, must_show_in_user_execute: true },
    { key: 'weight', label: '包裹重量', type: 'number', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: false, must_show_in_user_execute: false },
    { key: 'fastRefund', label: '快速返款', type: 'boolean', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: false, must_show_in_user_execute: false },
    { key: 'memo', label: '商家备注', type: 'string', must_show_in_merchant_detail: true, must_show_in_admin_detail: true, must_show_in_user_claim: true, must_show_in_user_execute: true },
];
