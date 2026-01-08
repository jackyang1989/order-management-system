import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';

// 黑名单类型: 0永久拉黑 1限时拉黑
export enum BlacklistType {
  PERMANENT = 0,
  TEMPORARY = 1,
}

// 黑名单状态: 0待审核 1已通过 2已拒绝
export enum BlacklistStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

@Entity('merchant_blacklist')
export class MerchantBlacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sellerId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'sellerId' })
  seller: Merchant;

  @Column({ length: 100 })
  accountName: string; // 买号

  @Column({ type: 'int', default: BlacklistType.PERMANENT })
  type: BlacklistType; // 类型 0永久 1限时

  @Column({ type: 'int', default: BlacklistStatus.APPROVED })
  status: BlacklistStatus; // 状态（暂不需要审核，直接通过）

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date | null; // 限时拉黑结束时间

  @Column({ type: 'text', nullable: true })
  reason: string; // 拉黑原因

  @Column({ type: 'text', nullable: true })
  adminRemark: string; // 管理员备注

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateBlacklistDto {
  accountName: string;
  type?: BlacklistType;
  endTime?: string; // ISO日期字符串
  reason?: string;
}

export class UpdateBlacklistDto {
  accountName?: string;
  type?: BlacklistType;
  endTime?: string;
  reason?: string;
}

export class BlacklistFilterDto {
  sellerId?: string;
  accountName?: string;
  type?: BlacklistType;
  status?: BlacklistStatus;
  page?: number;
  limit?: number;
}
