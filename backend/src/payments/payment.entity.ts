import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber } from 'class-validator';

// 支付渠道
export enum PaymentChannel {
    ALIPAY = 'alipay',         // 支付宝
    WECHAT = 'wechat',         // 微信支付
    UNION_PAY = 'unionpay',    // 银联
    BANK_TRANSFER = 'bank',    // 银行转账
    MANUAL = 'manual',         // 人工充值
}

// 支付类型
export enum PaymentType {
    RECHARGE = 'recharge',       // 充值
    WITHDRAW = 'withdraw',       // 提现
    ORDER_PAY = 'order_pay',     // 订单支付
    VIP_PAY = 'vip_pay',         // VIP购买
    REFUND = 'refund',           // 退款
}

// 回调状态
export enum CallbackStatus {
    PENDING = 0,      // 待处理
    SUCCESS = 1,      // 处理成功
    FAILED = 2,       // 处理失败
    DUPLICATE = 3,    // 重复回调
}

// 支付回调日志
@Entity('payment_callbacks')
export class PaymentCallback {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    @Index()
    outTradeNo: string;  // 商户订单号

    @Column({ length: 100, nullable: true })
    @Index()
    tradeNo: string;  // 第三方交易号

    @Column({ length: 20 })
    channel: PaymentChannel;  // 支付渠道

    @Column({ length: 20 })
    type: PaymentType;  // 支付类型

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;  // 金额

    @Column({ type: 'int', default: CallbackStatus.PENDING })
    status: CallbackStatus;  // 处理状态

    @Column({ type: 'jsonb', nullable: true })
    rawData: Record<string, any>;  // 原始回调数据

    @Column({ type: 'text', nullable: true })
    signature: string;  // 签名

    @Column({ default: false })
    signatureValid: boolean;  // 签名是否有效

    @Column({ type: 'text', nullable: true })
    errorMsg: string;  // 错误信息

    @Column({ nullable: true })
    relatedId: string;  // 关联业务ID（充值单、提现单等）

    @Column({ length: 50, nullable: true })
    ip: string;  // 回调IP

    @Column({ type: 'timestamp', nullable: true })
    processedAt: Date;  // 处理时间

    @CreateDateColumn()
    createdAt: Date;
}

// 支付订单
@Entity('payment_orders')
export class PaymentOrder {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100, unique: true })
    @Index()
    orderNo: string;  // 订单号

    @Column()
    @Index()
    userId: string;  // 用户ID

    @Column({ length: 20 })
    userType: string;  // 用户类型 buyer/merchant

    @Column({ length: 20 })
    channel: PaymentChannel;  // 支付渠道

    @Column({ length: 20 })
    type: PaymentType;  // 支付类型

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    amount: number;  // 金额

    @Column({ type: 'int', default: 0 })
    status: number;  // 0待支付 1已支付 2已取消 3已退款

    @Column({ length: 100, nullable: true })
    tradeNo: string;  // 第三方交易号

    @Column({ type: 'text', nullable: true })
    payUrl: string;  // 支付链接

    @Column({ type: 'text', nullable: true })
    qrCode: string;  // 二维码

    @Column({ nullable: true })
    relatedId: string;  // 关联业务ID

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;  // 支付时间

    @Column({ type: 'timestamp' })
    expireAt: Date;  // 过期时间

    @Column({ type: 'text', nullable: true })
    remark: string;

    @CreateDateColumn()
    createdAt: Date;
}

// DTOs
export class CreatePaymentOrderDto {
    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    @IsNotEmpty()
    userType: string;

    @IsEnum(PaymentChannel)
    channel: PaymentChannel;

    @IsEnum(PaymentType)
    type: PaymentType;

    @IsNumber()
    amount: number;

    @IsString()
    @IsOptional()
    relatedId?: string;

    @IsString()
    @IsOptional()
    remark?: string;
}

export class PaymentCallbackFilterDto {
    @IsEnum(PaymentChannel)
    @IsOptional()
    channel?: PaymentChannel;

    @IsEnum(CallbackStatus)
    @IsOptional()
    status?: CallbackStatus;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}
