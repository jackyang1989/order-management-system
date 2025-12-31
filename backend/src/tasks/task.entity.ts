import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';

export enum TaskStatus {
    PENDING_PAY = 0,    // 待支付
    ACTIVE = 1,         // 进行中 (已支付/已发布)
    COMPLETED = 2,      // 已完成
    CANCELLED = 3,      // 已取消
    AUDIT = 4           // 待审核 (如果有)
}

export enum TaskType {
    TAOBAO = 1,
    TMALL = 2,
    JD = 3,
    PDD = 4
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

    @Column({ length: 500 }) // 商品标题
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

    // --- 状态与时间 ---
    @Column({ default: false })
    isTimingPublish: boolean; // 定时发布

    @Column({ type: 'timestamp', nullable: true })
    publishTime: Date; // 发布时间

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
