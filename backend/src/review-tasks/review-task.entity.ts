import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  Min,
} from 'class-validator';

/**
 * 追评任务状态 (完全对应原版 tfkz_review_task.state)
 *
 * 状态流转:
 * 0(未支付) -> 1(已支付) -> 2(已审核/通知买手) -> 3(已上传) -> 4(已完成)
 *                |            |
 *                v            v
 *              5(已取消)    6(买手拒接) -> 退款给商家
 *                             7(已拒绝)
 */
export enum ReviewTaskStatus {
  UNPAID = 0, // 未支付
  PAID = 1, // 已支付 (等待管理员审核)
  APPROVED = 2, // 已审核 (通知买手去追评)
  UPLOADED = 3, // 已上传 (买手已上传追评截图，等待商家确认)
  COMPLETED = 4, // 已完成 (商家确认完成/管理员返款)
  CANCELLED = 5, // 已取消 (商家取消)
  BUYER_REJECTED = 6, // 买手拒接
  REJECTED = 7, // 已拒绝 (管理员拒绝)
}

/**
 * 追评类型 (对应原版 tfkz_review_task_praise.type)
 */
export enum ReviewPraiseType {
  TEXT = 1, // 文字追评
  IMAGE = 2, // 图片追评
  VIDEO = 3, // 视频追评
}

/**
 * 追评任务表 (对应原版 tfkz_review_task)
 */
@Entity('review_tasks')
export class ReviewTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ============ 关联信息 ============
  @Column()
  @Index()
  merchantId: string; // 商家ID (seller_id)

  @Column()
  @Index()
  userId: string; // 买手ID (user_id)

  @Column({ nullable: true })
  buynoId: string; // 买号ID (buy_id)

  @Column({ nullable: true })
  shopId: string; // 店铺ID (shop_id)

  @Column({ nullable: true })
  taobaoOrderNumber: string; // 淘宝订单号 (taobao_number)

  @Column({ length: 100, unique: true })
  @Index()
  taskNumber: string; // 追评任务编号 (task_number) 格式: ZP+时间戳+随机数

  @Column()
  @Index()
  userTaskId: string; // 原买手任务单ID (user_task_id) - 对应orders.id

  @Column({ nullable: true })
  sellerTaskId: string; // 商家任务ID (task_id) - 对应tasks.id

  // ============ 金额信息 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  payPrice: number; // 买手支付金额/原订单金额 (pay_price)

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  money: number; // 商家支付金额 (money) - 追评总费用

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  userMoney: number; // 用户佣金 (user_money) = money * 0.5

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  yjprice: number; // 支付使用押金 (yjprice)

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ydprice: number; // 支付使用银锭 (ydprice)

  // ============ 状态信息 ============
  @Column({ type: 'int', default: ReviewTaskStatus.UNPAID })
  @Index()
  state: ReviewTaskStatus; // 状态 (state)

  // ============ 追评截图 ============
  @Column({ type: 'text', nullable: true })
  img: string; // 好评截图 (img) - JSON数组或逗号分隔

  // ============ 时间信息 ============
  @Column({ type: 'timestamp', nullable: true })
  uploadTime: Date; // 上传好评图片时间 (upload_time)

  @Column({ type: 'timestamp', nullable: true })
  confirmTime: Date; // 完成时间 (confirm_time)

  @Column({ type: 'timestamp', nullable: true })
  payTime: Date; // 支付时间 (pay_time)

  @Column({ type: 'timestamp', nullable: true })
  examineTime: Date; // 审核时间 (examine_time)

  // ============ 审核信息 ============
  @Column({ type: 'text', nullable: true })
  remarks: string; // 审核备注 (remarks)

  @CreateDateColumn()
  createdAt: Date; // 添加时间 (create_time)

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 追评任务好评内容表 (对应原版 tfkz_review_task_praise)
 * 一个追评任务可以有多个商品的好评要求
 */
@Entity('review_task_praises')
export class ReviewTaskPraise {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  reviewTaskId: string; // 追评任务ID (task_id -> review_tasks.id)

  @Column({ nullable: true })
  goodsId: string; // 商品ID (goods_id)

  @Column({ type: 'int', default: ReviewPraiseType.TEXT })
  type: ReviewPraiseType; // 类型 (type): 1=文字好评, 2=图片好评, 3=视频好评

  @Column({ type: 'text', nullable: true })
  content: string; // 内容 (content): 文字/图片URL/视频URL

  @CreateDateColumn()
  createdAt: Date; // 添加时间 (create_time)
}

// ============ DTOs ============

/**
 * 商家获取可追评任务列表的请求
 */
export class GetReviewableOrdersDto {
  @IsOptional()
  @IsString()
  shopId?: string; // 按店铺筛选

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}

/**
 * 商品追评设置
 */
export class GoodsPraiseSettingDto {
  @IsString()
  goodsId: string;

  @IsOptional()
  @IsBoolean()
  isPraise?: boolean; // 是否文字好评

  @IsOptional()
  @IsString()
  praiseContent?: string; // 文字好评内容

  @IsOptional()
  @IsBoolean()
  isImgPraise?: boolean; // 是否图片好评

  @IsOptional()
  @IsArray()
  praiseImages?: string[]; // 图片好评URL列表

  @IsOptional()
  @IsBoolean()
  isVideoPraise?: boolean; // 是否视频好评

  @IsOptional()
  @IsString()
  praiseVideo?: string; // 视频好评URL
}

/**
 * 创建追评任务请求 (对应原版 addTask)
 */
export class CreateReviewTaskDto {
  @IsString()
  userTaskId: string; // 原买手任务单ID (orders.id)

  @IsArray()
  goods: GoodsPraiseSettingDto[]; // 商品追评设置列表
}

/**
 * 支付追评任务请求 (对应原版 payDo)
 */
export class PayReviewTaskDto {
  @IsString()
  reviewTaskId: string; // 追评任务ID

  @IsOptional()
  @IsBoolean()
  useReward?: boolean; // 是否使用银锭抵扣 (is_reward)
}

/**
 * 买手提交追评截图请求 (对应原版 take_zhuipin)
 */
export class SubmitReviewDto {
  @IsString()
  reviewTaskId: string;

  @IsArray()
  @IsString({ each: true })
  images: string[]; // 追评截图URL列表
}

/**
 * 买手拒绝追评请求 (对应原版 refuse_zhuipin)
 */
export class RejectReviewDto {
  @IsString()
  reviewTaskId: string;

  @IsOptional()
  @IsString()
  reason?: string; // 拒绝原因
}

/**
 * 商家确认追评完成请求 (对应原版 confirm)
 */
export class ConfirmReviewDto {
  @IsString()
  reviewTaskId: string;
}

/**
 * 商家取消追评任务请求 (对应原版 quxiao)
 */
export class CancelReviewDto {
  @IsString()
  reviewTaskId: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

/**
 * 管理员审核追评请求 (对应原版 reviewtaskToExamine)
 */
export class AdminReviewExamineDto {
  @IsString()
  reviewTaskId: string;

  @IsNumber()
  state: number; // 目标状态: 2=通过, 7=拒绝

  @IsOptional()
  @IsString()
  remarks?: string; // 审核备注
}

/**
 * 管理员批量返款请求 (对应原版 reviewTaskReturnPays)
 */
export class AdminBatchRefundDto {
  @IsArray()
  @IsString({ each: true })
  reviewTaskIds: string[];
}

/**
 * 追评任务列表筛选
 */
export class ReviewTaskFilterDto {
  @IsOptional()
  @IsNumber()
  state?: ReviewTaskStatus;

  @IsOptional()
  @IsString()
  taskNumber?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
