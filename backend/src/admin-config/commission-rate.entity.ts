import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

/**
 * 佣金比例表 - 按商品价格区间设置不同的佣金
 */
@Entity('commission_rates')
export class CommissionRate {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    minPrice: number;  // 最低价格

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    maxPrice: number;  // 最高价格

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    buyerCommission: number;  // 买手佣金

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    merchantCommission: number;  // 商家佣金（平台收取）

    @Column({ nullable: true })
    platform: string;  // 适用平台，null表示所有平台

    @Column({ type: 'boolean', default: true })
    isActive: boolean;

    @Column({ type: 'int', default: 0 })
    sortOrder: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
