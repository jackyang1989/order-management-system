import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FundType {
  PRINCIPAL = 'principal', // 本金
  SILVER = 'silver', // 银锭
}

export enum FundAction {
  IN = 'in', // 收入
  OUT = 'out', // 支出
}

@Entity('fund_records')
export class FundRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: FundType,
    default: FundType.PRINCIPAL,
  })
  @Index()
  type: FundType;

  @Column({
    type: 'enum',
    enum: FundAction,
    default: FundAction.IN,
  })
  @Index()
  action: FundAction;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  balance: number; // 变动后余额

  @Column({ type: 'text' })
  description: string;

  @Column({ nullable: true })
  orderId?: string; // 关联订单ID

  @Column({ nullable: true })
  withdrawalId?: string; // 关联提现ID

  @Column({ nullable: true })
  relatedUserId?: string; // 关联用户ID (如邀请奖励)

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
