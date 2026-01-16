import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  userNo: string; // 用户编号 U10001

  @Column({ unique: true })
  username: string;

  @Column()
  password: string; // hashed

  @Column({ unique: true })
  @Index()
  phone: string;

  @Column({ nullable: true })
  wechat?: string;

  @Column({ default: false })
  vip: boolean;

  @Column({ type: 'timestamp', nullable: true })
  vipExpireAt?: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  balance: number; // 本金余额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  frozenBalance: number; // 冻结本金

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  silver: number; // 银锭余额

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  frozenSilver: number; // 冻结银锭

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  reward: number; // 累计赚取银锭

  @Column({ nullable: true })
  payPassword?: string; // 支付密码 (hashed)

  @Column({ unique: true })
  @Index()
  invitationCode: string; // 自己的邀请码

  @Column({ nullable: true })
  invitedBy?: string; // 邀请人的ID

  @Column({ type: 'int', default: 0 })
  inviteState: number; // 邀请状态 0=未验证 1=已验证

  // ============ 推荐奖励相关 ============
  @Column({ nullable: true })
  referrerId: string; // 推荐人ID

  @Column({ type: 'int', default: 0 })
  referrerType: number; // 推荐人类型 1买手 2商家

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  referralReward: number; // 累计推荐奖励

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  referralRewardToday: number; // 今日推荐奖励

  @Column({ type: 'int', default: 0 })
  referralCount: number; // 推荐人数

  @Column({ type: 'int', default: 0 })
  monthlyTaskCount: number; // 本月完成任务数

  @Column({ type: 'date', nullable: true })
  monthlyTaskCountResetDate: Date; // 月度计数重置日期

  // ============ 实名认证 ============
  @Column({ nullable: true })
  realName: string; // 真实姓名

  @Column({ nullable: true })
  idCard: string; // 身份证号

  @Column({ nullable: true })
  idCardFront: string; // 身份证正面

  @Column({ nullable: true })
  idCardBack: string; // 身份证背面

  @Column({ nullable: true })
  avatar: string; // 用户头像

  @Column({ type: 'int', default: 0 })
  verifyStatus: number; // 实名状态 0未认证 1待审核 2已认证 3已拒绝

  // ============ 账号状态 ============
  @Column({ default: true })
  isActive: boolean; // 是否激活

  @Column({ default: false })
  isBanned: boolean; // 是否封禁

  @Column({ type: 'text', nullable: true })
  banReason: string; // 封禁原因

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date; // 最后登录时间

  @Column({ nullable: true })
  lastLoginIp: string; // 最后登录IP

  // 备注（违规备注）
  @Column({ type: 'text', nullable: true })
  note: string;

  // ============ 推荐活跃熔断相关 ============
  @Column({ type: 'timestamp', nullable: true })
  lastTaskAt: Date; // 最后完成任务时间（用于30天活跃熔断判定）

  // ============ P1-1: VIP过期检查相关 ============
  @Column({ type: 'varchar', length: 10, nullable: true })
  lastVipCheckAt: string; // 最后VIP检查日期 (YYYY-MM-DD)，用于避免每天重复降级

  @Column({ type: 'int', default: 0 })
  experience: number; // 经验值

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  invitationCode: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  // 管理员创建时可指定的额外字段
  @IsOptional()
  vipExpireAt?: string; // VIP到期时间

  @IsOptional()
  @IsNumber()
  balance?: number; // 本金余额

  @IsOptional()
  @IsNumber()
  silver?: number; // 银锭余额

  @IsString()
  @IsOptional()
  note?: string; // 备注
}

export class LoginDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  wechat?: string;

  @IsBoolean()
  @IsOptional()
  vip?: boolean;

  @IsOptional()
  vipExpireAt?: Date;

  @IsOptional()
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsNumber()
  silver?: number;

  @IsOptional()
  @IsNumber()
  mcTaskNum?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  verifyCode: string;
}

export class ChangePayPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPayPassword: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  verifyCode: string;
}
