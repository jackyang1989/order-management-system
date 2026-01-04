import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';

export enum BuyerAccountStatus {
  PENDING = 0, // 待审核
  APPROVED = 1, // 已通过
  REJECTED = 2, // 已拒绝
  DELETED = 3, // 已删除
}

export enum BuyerAccountPlatform {
  TAOBAO = '淘宝',
  JD = '京东',
  PDD = '拼多多',
}

@Entity('buyer_accounts')
export class BuyerAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 所属用户

  @Column({ type: 'varchar', length: 20, default: BuyerAccountPlatform.TAOBAO })
  platform: BuyerAccountPlatform;

  @Column({ length: 100 })
  accountName: string; // 淘宝账号/旺旺ID

  @Column({ length: 50, nullable: true })
  province?: string; // 地址省份

  @Column({ length: 50, nullable: true })
  city?: string; // 地址城市

  @Column({ length: 50, nullable: true })
  district?: string; // 地址区县

  @Column({ length: 100, nullable: true })
  receiverName?: string; // 收货人姓名

  @Column({ length: 20, nullable: true })
  receiverPhone?: string; // 收货人手机

  @Column({ type: 'text', nullable: true })
  fullAddress?: string; // 完整地址

  @Column({ length: 50, nullable: true })
  alipayName?: string; // 支付宝认证姓名

  @Column({ type: 'text', nullable: true })
  idCardImage?: string; // 身份证正面截图

  @Column({ type: 'text', nullable: true })
  alipayImage?: string; // 支付宝认证截图

  @Column({ type: 'text', nullable: true })
  archiveImage?: string; // 旺旺档案截图

  @Column({ type: 'text', nullable: true })
  ipImage?: string; // IP地址截图/淘气值截图

  @Column({ type: 'text', nullable: true })
  zhimaImage?: string; // 芝麻信用截图

  // 旺旺地址 (用于验证IP一致性)
  @Column({ length: 100, nullable: true })
  wangwangProvince?: string; // 旺旺地址省

  @Column({ length: 100, nullable: true })
  wangwangCity?: string; // 旺旺地址市

  // 收货地址备注
  @Column({ type: 'text', nullable: true })
  addressRemark?: string; // 收货地址信息备注

  @Column({ default: 1 })
  star: number; // 星级 (1-5)

  @Column({ type: 'timestamp', nullable: true })
  frozenTime?: Date; // 冻结时间

  @Column({ type: 'int', default: 0 })
  monthlyTaskCount: number; // 当月已完成任务数

  @Column({ type: 'int', default: 0 })
  totalTaskCount: number; // 累计完成任务数（用于星级升级）

  @Column({ type: 'date', nullable: true })
  monthlyCountResetDate: Date; // 月度计数重置日期

  @Column({ type: 'int', default: BuyerAccountStatus.PENDING })
  status: BuyerAccountStatus;

  @Column({ type: 'text', nullable: true })
  rejectReason?: string; // 拒绝原因

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateBuyerAccountDto {
  @IsEnum(BuyerAccountPlatform)
  @IsOptional()
  platform?: BuyerAccountPlatform;

  @IsString()
  @IsNotEmpty()
  accountName: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  receiverPhone?: string;

  @IsString()
  @IsOptional()
  fullAddress?: string;

  @IsString()
  @IsOptional()
  alipayName?: string;

  @IsString()
  @IsOptional()
  wangwangProvince?: string; // 旺旺地址省

  @IsString()
  @IsOptional()
  wangwangCity?: string; // 旺旺地址市

  @IsString()
  @IsOptional()
  addressRemark?: string; // 收货地址备注

  @IsString()
  @IsOptional()
  idCardImage?: string; // 身份证截图

  @IsString()
  @IsOptional()
  alipayImage?: string; // 支付宝认证截图

  @IsString()
  @IsOptional()
  archiveImage?: string; // 旺旺档案截图

  @IsString()
  @IsOptional()
  ipImage?: string; // 淘气值截图

  @IsString()
  @IsOptional()
  zhimaImage?: string; // 芝麻信用截图

  @IsString()
  @IsOptional()
  smsCode?: string; // 手机验证码
}

export class UpdateBuyerAccountDto {
  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  district?: string;

  @IsString()
  @IsOptional()
  receiverName?: string;

  @IsString()
  @IsOptional()
  receiverPhone?: string;

  @IsString()
  @IsOptional()
  fullAddress?: string;

  @IsString()
  @IsOptional()
  alipayName?: string;

  @IsString()
  @IsOptional()
  wangwangProvince?: string;

  @IsString()
  @IsOptional()
  wangwangCity?: string;

  @IsString()
  @IsOptional()
  addressRemark?: string;

  @IsString()
  @IsOptional()
  idCardImage?: string;

  @IsString()
  @IsOptional()
  alipayImage?: string;

  @IsString()
  @IsOptional()
  archiveImage?: string;

  @IsString()
  @IsOptional()
  ipImage?: string;

  @IsString()
  @IsOptional()
  zhimaImage?: string;

  @IsString()
  @IsOptional()
  smsCode?: string; // 修改时也需要验证码
}
