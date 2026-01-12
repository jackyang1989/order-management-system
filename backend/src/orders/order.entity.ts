import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
} from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// 订单状态
export enum OrderStatus {
  PENDING = 'PENDING', // 进行中（接单后执行任务中）
  SUBMITTED = 'SUBMITTED', // 待审核（买手提交等待商家审核）
  APPROVED = 'APPROVED', // 审核通过
  REJECTED = 'REJECTED', // 审核拒绝
  WAITING_DELIVERY = 'WAITING_DELIVERY', // 待发货 (state=3)
  WAITING_RECEIVE = 'WAITING_RECEIVE', // 待收货 (state=4)
  WAITING_REFUND = 'WAITING_REFUND', // 待返款 (state=5)
  WAITING_REVIEW_REFUND = 'WAITING_REVIEW_REFUND', // 待好评返款 (state=6)
  COMPLETED = 'COMPLETED', // 已完成 (state=1)
  CANCELLED = 'CANCELLED', // 已取消 (state=2)
  REFUNDED = 'REFUNDED', // 已退款
  APPEAL_PENDING = 'APPEAL_PENDING', // 申诉处理中 (Legacy 7)
  ADDITIONAL_REVIEW = 'ADDITIONAL_REVIEW', // 商家要求追加评论 (Legacy 9)
}

// 发货状态
export enum DeliveryState {
  NOT_SHIPPED = 0, // 未发货
  SHIPPED = 1, // 已发货
  RECEIVED = 2, // 已签收
}

// 物流需求类型
export enum DeliveryRequirement {
  NEED_LOGISTICS = 0, // 需要物流
  NO_LOGISTICS = 1, // 无需物流（虚拟商品等）
}

// 取消类型
export enum CancelType {
  BUYER_CANCEL = 1, // 买手取消
  SELLER_CANCEL = 2, // 商家取消
  SYSTEM_CANCEL = 3, // 系统取消（超时等）
  ADMIN_CANCEL = 4, // 管理员取消
}

export interface OrderStepData {
  step: number;
  title: string;
  description: string;
  submitted: boolean;
  submittedAt?: Date;
  screenshot?: string;
  inputData?: Record<string, any>;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  taskId: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  buynoId: string;

  @Column()
  buynoAccount: string;

  @Column()
  taskTitle: string;

  @Column({ length: 20 })
  platform: string;

  @Column()
  productName: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  productPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  commission: number;

  // ============ 佣金分成字段 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  userDivided: number; // 买手分成佣金（从商家服务费中扣取分给买手的部分）

  // ============ 资金相关字段 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  userPrincipal: number; // 买手垫付本金

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  sellerPrincipal: number; // 商家返款本金

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  prepayAmount: number; // 预付金额（是否垫付场景）

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  finalAmount: number; // 尾款金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  refundAmount: number; // 实际返款金额

  @Column({ default: false })
  isAdvancePay: boolean; // 是否垫付任务

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  silverPrepay: number; // 银锭押金（接单时冻结，完成后返还）

  // ============ 发货相关字段 ============
  @Column({ type: 'int', default: 0 })
  deliveryState: number; // 发货状态 0未发货 1已发货 2已签收

  @Column({ nullable: true })
  delivery: string; // 快递公司

  @Column({ nullable: true })
  deliveryNum: string; // 快递单号

  @Column({ nullable: true })
  deliveryTime: Date; // 发货时间

  @Column({ nullable: true })
  platformOrderNumber: string; // 平台订单号（原taobaoOrderNumber）

  @Column({ type: 'int', default: DeliveryRequirement.NEED_LOGISTICS })
  deliveryRequirement: number; // 物流需求 0需要 1不需要

  // ============ 凭证截图 ============
  @Column({ type: 'text', nullable: true })
  keywordImg: string; // 关键词搜索截图

  @Column({ nullable: true })
  keyword: string; // 搜索关键词

  @Column({ type: 'text', nullable: true })
  chatImg: string; // 聊天截图（联系客服）

  @Column({ type: 'text', nullable: true })
  orderDetailImg: string; // 订单详情截图

  @Column({ type: 'text', nullable: true })
  highPraiseImg: string; // 好评截图

  @Column({ type: 'text', nullable: true })
  receiveImg: string; // 收货截图

  // ============ 预售相关 ============
  @Column({ default: false })
  isPresale: boolean; // 是否预售任务

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  yfPrice: number; // 预付款金额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  wkPrice: number; // 尾款金额

  @Column({ default: false })
  okYf: boolean; // 预付款已付

  @Column({ default: false })
  okWk: boolean; // 尾款已付

  // ============ 好评相关 ============
  @Column({ type: 'text', nullable: true })
  praiseContent: string; // 好评内容

  @Column({ type: 'jsonb', nullable: true })
  praiseImages: string[]; // 好评图片

  @Column({ type: 'text', nullable: true })
  praiseVideo: string; // 好评视频

  @Column({ type: 'timestamp', nullable: true })
  highPraiseTime: Date; // 好评时间

  // ============ 取消相关 ============
  @Column({ type: 'int', nullable: true })
  cancelType: CancelType; // 取消类型

  @Column({ type: 'text', nullable: true })
  cancelRemarks: string; // 取消原因

  @Column({ type: 'timestamp', nullable: true })
  cancelTime: Date; // 取消时间

  // ============ 保证金/差额 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  margin: number; // 保证金

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  marginDiff: number; // 保证金差额（需商家补差）

  // ============ 平台返款 ============
  @Column({ type: 'timestamp', nullable: true })
  platformRefundTime: Date; // 平台返款时间

  // ============ 收货地址 ============
  @Column({ nullable: true })
  addressName: string; // 收货人

  @Column({ nullable: true })
  addressPhone: string; // 收货电话

  @Column({ type: 'text', nullable: true })
  address: string; // 收货地址

  // ============ 审核相关 ============
  @Column({ type: 'text', nullable: true })
  remark: string; // 备注

  @Column({ type: 'text', nullable: true })
  rejectReason: string; // 驳回原因

  @Column({ nullable: true })
  refundTime: Date; // 返款时间

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  returnAmount: number; // 实际返款金额

  @Column({ default: 1 })
  currentStep: number;

  @Column()
  totalSteps: number;

  @Column({ type: 'jsonb', default: '[]' })
  stepData: OrderStepData[];

  @Column({ type: 'varchar', length: 20, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'timestamp', nullable: true })
  endingTime?: Date; // 订单超时时间

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  // ============ 追评相关 ============
  @Column({ default: false })
  isZp: boolean; // 是否已追评 (is_zp): 0=未追评, 1=已追评

  // ============ 升级版本 ============
  @Column({ type: 'int', default: 2 })
  isShengji: number; // 升级版本等级 (is_shengji): 1=旧版, 2=新版
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @IsString()
  @IsNotEmpty()
  buynoId: string;

  @IsString()
  @IsNotEmpty()
  buynoAccount: string;
}

export class SubmitStepDto {
  @IsNumber()
  step: number;

  @IsString()
  @IsOptional()
  screenshot?: string;

  @IsOptional()
  inputData?: Record<string, any>;
}

export class OrderFilterDto {
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @IsString()
  @IsOptional()
  platform?: string;
}
