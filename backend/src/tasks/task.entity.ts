import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';

export enum TaskStatus {
    PENDING_PAY = 0,    // 待支付
    ACTIVE = 1,         // 进行中 (已支付/已发布)
    COMPLETED = 2,      // 已完成
    CANCELLED = 3,      // 已取消
    AUDIT = 4,          // 待审核
    PAUSED = 5,         // 已暂停
    REJECTED = 6,       // 已拒绝 (对应原版 status=4)
}

export enum TaskType {
    TAOBAO = 1,
    TMALL = 2,
    JD = 3,
    PDD = 4,
    DOUYIN = 5,
    KUAISHOU = 6,
}

// 任务类型（结算方式）
export enum TaskTerminal {
    BENYONG_HUOFAN = 1,   // 本佣货返（买手垫付，商家返本金+佣金）
    BENLI_YONGHUO = 2,    // 本立佣货（商家预付本金，买手收货后返）
}

// 任务版本
export enum TaskVersion {
    V1 = 1,   // 版本1：单商品
    V2 = 2,   // 版本2：多商品（使用task_goods表）
}

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // --- 任务基础信息 ---
    @Column({ unique: true })
    taskNumber: string; // 任务编号 TXXXXXXXX

    @Column({ default: TaskType.TAOBAO })
    taskType: number; // 1:淘宝, 2:天猫, 3:京东/飞猪

    @Column({ length: 500, nullable: true, default: '' }) // 商品标题
    title: string;

    @Column({ nullable: true })
    url: string;      // 商品链接/口令

    @Column({ nullable: true })
    mainImage: string; // 商品主图

    @Column({ nullable: true })
    shopName: string; // 店铺名称

    @Column({ nullable: true })
    keyword: string;  // 搜索关键词

    @Column({ nullable: true })
    taoWord: string; // 淘口令

    @Column({ nullable: true })
    taobaoId: string; // 淘宝商品ID（用于核对）

    @Column({ nullable: true })
    qrCode: string; // 二维码URL

    @Column({ type: 'int', default: 1 })
    count: number;    // 任务单数 (Total needed)

    @Column({ type: 'int', default: 0 })
    claimedCount: number; // 已领取人数

    @Column({ type: 'int', default: TaskStatus.PENDING_PAY })
    status: number;

    @Column({ nullable: true, type: 'text' })
    remark: string;   // 商家备注

    @Column({ nullable: true })
    merchantId: string;   // 关联商家ID

    @ManyToOne(() => Merchant)
    @JoinColumn({ name: 'merchantId' })
    merchant: Merchant;

    // --- 费用明细 (Unit: 元) ---
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    goodsPrice: number; // 单商品价格

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    goodsMoney: number; // 商品本金总额 (goodsPrice * count)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    shippingFee: number; // 运费 (postage)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    margin: number; // 商家保证金

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    extraReward: number; // 加赏佣金

    // --- 服务费明细 (Unit: 银锭/元) ---
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    baseServiceFee: number; // 基础服务费 (原 silver_ingot 部分)

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    refundServiceFee: number; // 返款服务费

    // --- 增值服务 ---
    @Column({ default: false })
    isPraise: boolean; // 文字好评

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    praiseFee: number;

    @Column({ default: false })
    isImgPraise: boolean; // 图片好评

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    imgPraiseFee: number;

    @Column({ default: false })
    isVideoPraise: boolean; // 视频好评

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    videoPraiseFee: number;

    // --- 汇总 ---
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalDeposit: number; // 总押金

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalCommission: number; // 总佣金/银锭

    // --- 任务结算类型 ---
    @Column({ type: 'int', default: TaskTerminal.BENYONG_HUOFAN })
    terminal: number; // 结算方式 1本佣货返 2本立佣货

    @Column({ type: 'int', default: TaskVersion.V1 })
    version: number; // 任务版本 1单商品 2多商品

    // --- 统计计数 ---
    @Column({ type: 'int', default: 0 })
    completedCount: number; // 已完成数

    @Column({ type: 'int', default: 0 })
    incompleteCount: number; // 未完成数（取消/失败）

    // --- 时间限制 ---
    @Column({ type: 'int', default: 24 })
    taskTimeLimit: number; // 任务时限（小时）

    @Column({ type: 'int', default: 0 })
    unionInterval: number; // 接单间隔（分钟）

    @Column({ type: 'int', default: 0 })
    cycle: number; // 买手周期（天）

    // --- 定时相关费用 ---
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    timingPayFee: number; // 定时支付费用

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    timingPublishFee: number; // 定时发布费用

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    nextDayFee: number; // 次日返款费用

    // --- 附加费用 ---
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    phoneFee: number; // 电话费

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    goodsMoreFee: number; // 多商品加价

    @Column({ name: 'add_reward', type: 'decimal', precision: 10, scale: 2, default: 0 })
    extraCommission: number; // 加赏金额

    // --- 预售相关 ---
    @Column({ default: false })
    isPresale: boolean; // 是否预售任务

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    yfPrice: number; // 预付款

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    wkPrice: number; // 尾款

    // --- 审核相关 ---
    @Column({ type: 'timestamp', nullable: true })
    examineTime: Date; // 审核时间

    @Column({ type: 'timestamp', nullable: true })
    payTime: Date; // 支付时间

    @Column({ type: 'timestamp', nullable: true })
    receiptTime: Date; // 最后接单时间

    // --- 包邮/备注 ---
    @Column({ name: 'is_free_shiping', default: true })
    isFreeShipping: boolean; // 是否包邮

    @Column({ type: 'text', nullable: true })
    memo: string; // 内部备注

    // --- 关联店铺 ---
    @Column({ nullable: true })
    shopId: string; // 店铺ID

    // --- 状态与时间 ---
    @Column({ default: false })
    isTimingPublish: boolean; // 定时发布

    @Column({ type: 'timestamp', nullable: true })
    publishTime: Date; // 发布时间

    @Column({ type: 'timestamp', nullable: true })
    publishTime: Date; // 发布时间

    @Column({ type: 'text', nullable: true })
    channelImages: string; // 通道图片（JSON数组，对应原版 channel_img）

    @Column({ default: false })
    verifySwitch: boolean; // 商品核对开关

    @Column({ type: 'text', nullable: true })
    verifyCode: string; // 商品核对码



    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

// DTOs
export class CreateTaskDto {
    taskType: number;
    title: string;
    url: string;
    price?: number;
    count: number;
    shopName: string;
    keyword?: string;
    mainImage?: string;
    goodsPrice: number;
    taoWord?: string;

    // 增值服务字段
    isPraise?: boolean;
    praiseType?: string;
    praiseFee?: number;
    praiseList?: string[];

    isImgPraise?: boolean;
    isVideoPraise?: boolean;

    isFreeShipping?: number; // 1=包邮, 2=不包邮

    isTimingPublish?: boolean;
    publishTime?: string;

    isTimingPay?: boolean;
    timingPayTime?: string;

    isCycleTime?: boolean;
    cycleTime?: number;

    addReward?: number;
}


export class TaskFilterDto {
    status?: number;
    taskType?: number;
    search?: string;
    minCommission?: number;
    maxCommission?: number;
}

export class ClaimTaskDto {
    buynoId: string;
    buynoAccount?: string;
}
