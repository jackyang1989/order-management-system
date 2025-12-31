import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('commission_rates')
export class CommissionRate {
    @PrimaryGeneratedColumn()
    id: number;

    @Column('decimal', { precision: 10, scale: 2 })
    maxGoodsPrice: number;

    @Column('decimal', { precision: 10, scale: 2 })
    merchantReward: number;

    @Column('decimal', { precision: 10, scale: 2 })
    userReward: number;
}
