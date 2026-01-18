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
  IsNotEmpty,
  IsOptional,
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

  // 平台账号/买号
  @Column({ length: 100, nullable: true, default: '' })
  platformAccount: string;

  // 常用登录地省
  @Column({ length: 100, nullable: true })
  loginProvince?: string;

  // 常用登录地市
  @Column({ length: 100, nullable: true })
  loginCity?: string;

  // 收货地址省
  @Column({ length: 50, nullable: true })
  province?: string;

  // 收货地址市
  @Column({ length: 50, nullable: true })
  city?: string;

  // 收货地址区县
  @Column({ length: 50, nullable: true })
  district?: string;

  // 收货人姓名
  @Column({ length: 100, nullable: true })
  buyerName?: string;

  // 收货人手机
  @Column({ length: 20, nullable: true })
  buyerPhone?: string;

  // 详细地址
  @Column({ type: 'text', nullable: true })
  fullAddress?: string;

  // 实名认证姓名
  @Column({ length: 50, nullable: true })
  realName?: string;

  // 账号主页截图
  @Column({ type: 'text', nullable: true })
  profileImg?: string;

  // 淘气值/信用截图
  @Column({ type: 'text', nullable: true })
  creditImg?: string;

  // 支付宝实名截图
  @Column({ type: 'text', nullable: true })
  payAuthImg?: string;

  // 芝麻信用截图
  @Column({ type: 'text', nullable: true })
  scoreImg?: string;

  // 身份证截图
  @Column({ type: 'text', nullable: true })
  idCardImage?: string;

  // 收货地址备注
  @Column({ type: 'text', nullable: true })
  addressRemark?: string;

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

  // P1: 地址风控 - 月度修改次数限制
  @Column({ type: 'int', default: 0 })
  monthlyAddressModCount: number; // 当月地址修改次数

  @Column({ type: 'date', nullable: true })
  addressModResetDate: Date; // 地址修改计数重置日期

  @Column({ type: 'text', nullable: true })
  pendingAddressChange?: string; // 待审核的地址修改 (JSON)

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
  platformAccount: string; // 买号

  @IsString()
  @IsOptional()
  loginProvince?: string; // 常用登录省份

  @IsString()
  @IsOptional()
  loginCity?: string; // 常用登录城市

  @IsString()
  @IsOptional()
  province?: string; // 收货省份

  @IsString()
  @IsOptional()
  city?: string; // 收货城市

  @IsString()
  @IsOptional()
  district?: string; // 收货区县

  @IsString()
  @IsOptional()
  buyerName?: string; // 收货人姓名

  @IsString()
  @IsOptional()
  buyerPhone?: string; // 收货人手机

  @IsString()
  @IsOptional()
  fullAddress?: string; // 详细地址

  @IsString()
  @IsOptional()
  realName?: string; // 实名认证姓名

  @IsString()
  @IsOptional()
  addressRemark?: string; // 收货地址备注

  @IsString()
  @IsOptional()
  profileImg?: string; // 账号主页截图

  @IsString()
  @IsOptional()
  creditImg?: string; // 淘气值截图

  @IsString()
  @IsOptional()
  payAuthImg?: string; // 支付宝实名截图

  @IsString()
  @IsOptional()
  scoreImg?: string; // 芝麻信用截图

  @IsString()
  @IsOptional()
  idCardImage?: string; // 身份证截图

  @IsString()
  @IsOptional()
  smsCode?: string; // 手机验证码
}

export class UpdateBuyerAccountDto {
  @IsString()
  @IsOptional()
  loginProvince?: string;

  @IsString()
  @IsOptional()
  loginCity?: string;

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
  buyerName?: string;

  @IsString()
  @IsOptional()
  buyerPhone?: string;

  @IsString()
  @IsOptional()
  fullAddress?: string;

  @IsString()
  @IsOptional()
  realName?: string;

  @IsString()
  @IsOptional()
  addressRemark?: string;

  @IsString()
  @IsOptional()
  profileImg?: string;

  @IsString()
  @IsOptional()
  creditImg?: string;

  @IsString()
  @IsOptional()
  payAuthImg?: string;

  @IsString()
  @IsOptional()
  scoreImg?: string;

  @IsString()
  @IsOptional()
  idCardImage?: string;

  @IsString()
  @IsOptional()
  smsCode?: string; // 修改时也需要验证码

  // 管理员可编辑的字段
  @IsString()
  @IsOptional()
  platformAccount?: string;

  @IsOptional()
  star?: number;

  @IsOptional()
  status?: number;

  @IsOptional()
  frozenTime?: Date | string | null;

  @IsString()
  @IsOptional()
  remark?: string;
}
