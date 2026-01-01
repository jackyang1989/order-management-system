import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * VIP等级表 - 买手和商家VIP配置
 */
@Entity('vip_levels')
export class VipLevel {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;  // VIP名称，如"银牌会员"、"金牌会员"

    @Column({ type: 'int' })
    level: number;  // VIP等级，1-10

    @Column({ type: 'varchar', length: 20, default: 'buyer' })
    type: 'buyer' | 'merchant';  // VIP类型：买手VIP 或 商家VIP

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    price: number;  // 购买价格

    @Column({ type: 'int', default: 30 })
    duration: number;  // 有效期（天）

    @Column({ nullable: true })
    icon: string;  // VIP图标

    @Column({ nullable: true })
    color: string;  // VIP颜色代码

    // ============ 买手VIP权益 ============

    @Column({ type: 'int', default: 0 })
    dailyTaskLimit: number;  // 每日任务数量上限，0表示无限制

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    commissionBonus: number;  // 佣金加成比例（%）

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    withdrawFeeDiscount: number;  // 提现手续费折扣（%）

    @Column({ type: 'int', default: 0 })
    priorityLevel: number;  // 任务优先级

    @Column({ type: 'boolean', default: false })
    canReserveTask: boolean;  // 是否可以预约任务

    @Column({ type: 'boolean', default: false })
    showVipBadge: boolean;  // 是否显示VIP徽章

    // ============ 商家VIP权益 ============

    @Column({ type: 'int', default: 0 })
    publishTaskLimit: number;  // 每日发布任务上限

    @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
    serviceFeeDiscount: number;  // 服务费折扣（%）

    @Column({ type: 'boolean', default: false })
    priorityReview: boolean;  // 优先审核

    @Column({ type: 'boolean', default: false })
    dedicatedSupport: boolean;  // 专属客服

    @Column({ type: 'int', default: 0 })
    freePromotionDays: number;  // 免费推广天数

    // ============ 通用属性 ============

    @Column({ type: 'text', nullable: true })
    description: string;  // VIP说明

    @Column({ type: 'json', nullable: true })
    privileges: string[];  // 权益列表（用于前端展示）

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

/**
 * 默认VIP等级
 */
export const DEFAULT_VIP_LEVELS = [
    // 买手VIP
    {
        name: '普通会员',
        level: 0,
        type: 'buyer' as const,
        price: 0,
        duration: 0,
        dailyTaskLimit: 10,
        commissionBonus: 0,
        sortOrder: 0,
        privileges: ['每日10个任务', '基础佣金'],
    },
    {
        name: '银牌会员',
        level: 1,
        type: 'buyer' as const,
        price: 29.9,
        duration: 30,
        dailyTaskLimit: 30,
        commissionBonus: 5,
        withdrawFeeDiscount: 10,
        showVipBadge: true,
        sortOrder: 1,
        color: '#C0C0C0',
        privileges: ['每日30个任务', '佣金+5%', '提现费-10%', 'VIP徽章'],
    },
    {
        name: '金牌会员',
        level: 2,
        type: 'buyer' as const,
        price: 99,
        duration: 30,
        dailyTaskLimit: 100,
        commissionBonus: 10,
        withdrawFeeDiscount: 20,
        priorityLevel: 1,
        canReserveTask: true,
        showVipBadge: true,
        sortOrder: 2,
        color: '#FFD700',
        privileges: ['每日100个任务', '佣金+10%', '提现费-20%', '任务优先', '预约任务', 'VIP徽章'],
    },
    {
        name: '钻石会员',
        level: 3,
        type: 'buyer' as const,
        price: 299,
        duration: 30,
        dailyTaskLimit: 0,
        commissionBonus: 15,
        withdrawFeeDiscount: 50,
        priorityLevel: 2,
        canReserveTask: true,
        showVipBadge: true,
        sortOrder: 3,
        color: '#00BFFF',
        privileges: ['无限任务', '佣金+15%', '提现费-50%', '最高优先级', '预约任务', 'VIP徽章'],
    },
    // 商家VIP
    {
        name: '普通商家',
        level: 0,
        type: 'merchant' as const,
        price: 0,
        duration: 0,
        publishTaskLimit: 5,
        serviceFeeDiscount: 0,
        sortOrder: 10,
        privileges: ['每日5个任务', '基础服务'],
    },
    {
        name: '银牌商家',
        level: 1,
        type: 'merchant' as const,
        price: 99,
        duration: 30,
        publishTaskLimit: 20,
        serviceFeeDiscount: 5,
        sortOrder: 11,
        color: '#C0C0C0',
        privileges: ['每日20个任务', '服务费-5%'],
    },
    {
        name: '金牌商家',
        level: 2,
        type: 'merchant' as const,
        price: 299,
        duration: 30,
        publishTaskLimit: 100,
        serviceFeeDiscount: 10,
        priorityReview: true,
        sortOrder: 12,
        color: '#FFD700',
        privileges: ['每日100个任务', '服务费-10%', '优先审核'],
    },
    {
        name: '钻石商家',
        level: 3,
        type: 'merchant' as const,
        price: 999,
        duration: 30,
        publishTaskLimit: 0,
        serviceFeeDiscount: 20,
        priorityReview: true,
        dedicatedSupport: true,
        freePromotionDays: 7,
        sortOrder: 13,
        color: '#00BFFF',
        privileges: ['无限任务', '服务费-20%', '优先审核', '专属客服', '7天免费推广'],
    },
];
