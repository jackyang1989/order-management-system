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
  IsNumber,
  IsEnum,
  IsUUID,
  Min,
} from 'class-validator';

// 邀请状态
export enum InviteStatus {
  PENDING = 0, // 待激活（被邀请人未完成注册/首充）
  ACTIVATED = 1, // 已激活（被邀请人完成条件）
  REWARDED = 2, // 已发放奖励
  EXPIRED = 3, // 已过期
}

// 邀请类型
export enum InviteType {
  BUYER = 1, // 邀请买手
  MERCHANT = 2, // 邀请商家
}

@Entity('user_invites')
export class UserInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  inviterId: string; // 邀请人ID

  @Column({ type: 'int', default: InviteType.BUYER })
  inviterType: InviteType; // 邀请人类型

  @Column({ nullable: true })
  @Index()
  inviteeId: string; // 被邀请人ID（注册后填入）

  @Column({ length: 50, nullable: true })
  inviteePhone: string; // 被邀请人手机号

  @Column({ length: 50, nullable: true })
  inviteeName: string; // 被邀请人昵称

  @Column({ length: 20 })
  @Index()
  inviteCode: string; // 邀请码

  @Column({ type: 'int', default: InviteStatus.PENDING })
  status: InviteStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  rewardAmount: number; // 奖励金额

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  inviteeRewardAmount: number; // 被邀请人奖励金额

  @Column({ type: 'timestamp', nullable: true })
  activatedAt: Date; // 激活时间

  @Column({ type: 'timestamp', nullable: true })
  rewardedAt: Date; // 发放奖励时间

  @Column({ type: 'text', nullable: true })
  remark: string; // 备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 邀请码表
@Entity('invite_codes')
export class InviteCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string; // 用户ID

  @Column({ type: 'int' })
  userType: InviteType; // 用户类型

  @Column({ length: 20, unique: true })
  code: string; // 邀请码

  @Column({ default: 0 })
  usedCount: number; // 使用次数

  @Column({ default: true })
  isActive: boolean; // 是否有效

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// 邀请奖励配置
@Entity('invite_reward_configs')
export class InviteRewardConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' })
  inviteType: InviteType; // 邀请类型

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  inviterReward: number; // 邀请人奖励

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  inviteeReward: number; // 被邀请人奖励

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minRechargeAmount: number; // 最低充值金额才能获得奖励

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateInviteCodeDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsEnum(InviteType)
  userType: InviteType;
}

export class RegisterWithInviteDto {
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}

export class InviteFilterDto {
  @IsEnum(InviteStatus)
  @IsOptional()
  status?: InviteStatus;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}

export class UpdateRewardConfigDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  inviterReward?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  inviteeReward?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minRechargeAmount?: number;
}
