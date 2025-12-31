import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ReferralRewardType {
    BUYER_REFERRAL = 1,      // 买手推荐买手
    MERCHANT_REFERRAL = 2,   // 商家推荐商家
    BUYER_ORDER = 3,         // 推荐的买手完成订单奖励
    MERCHANT_TASK = 4,       // 推荐的商家发布任务奖励
    SECONDARY = 5,           // 二级推荐奖励
}

export enum ReferralRewardStatus {
    PENDING = 1,    // 待发放
    PAID = 2,       // 已发放
    CANCELLED = 3,  // 已取消
}

@Entity('referral_rewards')
export class ReferralReward {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    referredUserId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'referredUserId' })
    referredUser: User;

    @Column({ type: 'enum', enum: ReferralRewardType })
    type: ReferralRewardType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount: number;

    @Column({ type: 'enum', enum: ReferralRewardStatus, default: ReferralRewardStatus.PENDING })
    status: ReferralRewardStatus;

    @Column({ nullable: true })
    relatedOrderId: string;

    @Column({ nullable: true })
    relatedTaskId: string;

    @Column({ nullable: true })
    remark: string;

    @Column({ type: 'timestamp', nullable: true })
    paidAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
