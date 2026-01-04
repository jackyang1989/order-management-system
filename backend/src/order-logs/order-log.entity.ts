import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';

// 操作类型
export enum OrderLogAction {
  CREATE = 'create', // 创建订单
  ACCEPT = 'accept', // 接单
  SUBMIT = 'submit', // 提交订单
  SHIP = 'ship', // 发货
  CONFIRM_RECEIPT = 'confirm_receipt', // 确认收货
  COMPLETE = 'complete', // 完成
  CANCEL = 'cancel', // 取消
  REFUND_REQUEST = 'refund_request', // 申请退款
  REFUND_APPROVE = 'refund_approve', // 同意退款
  REFUND_REJECT = 'refund_reject', // 拒绝退款
  REFUND_COMPLETE = 'refund_complete', // 退款完成
  UPDATE_INFO = 'update_info', // 更新信息
  UPLOAD_PROOF = 'upload_proof', // 上传凭证
  ADMIN_OPERATE = 'admin_operate', // 管理员操作
  REMARK = 'remark', // 添加备注
}

// 操作人类型
export enum OrderLogOperatorType {
  SYSTEM = 0, // 系统
  BUYER = 1, // 买手
  MERCHANT = 2, // 商家
  ADMIN = 3, // 管理员
}

@Entity('order_logs')
export class OrderLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  orderId: string; // 订单ID

  @Column({ length: 50, nullable: true })
  orderNo: string; // 订单编号

  @Column({ length: 30 })
  action: OrderLogAction; // 操作类型

  @Column({ type: 'int', default: OrderLogOperatorType.SYSTEM })
  operatorType: OrderLogOperatorType; // 操作人类型

  @Column({ nullable: true })
  operatorId: string; // 操作人ID

  @Column({ length: 50, nullable: true })
  operatorName: string; // 操作人名称

  @Column({ type: 'text', nullable: true })
  content: string; // 操作内容描述

  @Column({ type: 'int', nullable: true })
  oldStatus: number; // 原状态

  @Column({ type: 'int', nullable: true })
  newStatus: number; // 新状态

  @Column({ type: 'jsonb', nullable: true })
  extra: Record<string, any>; // 额外数据

  @Column({ length: 50, nullable: true })
  ip: string; // 操作IP

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class CreateOrderLogDto {
  @IsUUID()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  orderNo?: string;

  @IsEnum(OrderLogAction)
  action: OrderLogAction;

  @IsEnum(OrderLogOperatorType)
  @IsOptional()
  operatorType?: OrderLogOperatorType;

  @IsString()
  @IsOptional()
  operatorId?: string;

  @IsString()
  @IsOptional()
  operatorName?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  oldStatus?: number;

  @IsOptional()
  newStatus?: number;

  @IsOptional()
  extra?: Record<string, any>;

  @IsString()
  @IsOptional()
  ip?: string;
}

export class OrderLogFilterDto {
  @IsEnum(OrderLogAction)
  @IsOptional()
  action?: OrderLogAction;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
