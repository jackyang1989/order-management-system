import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';

export enum ShopStatus {
    PENDING = 0,
    APPROVED = 1,
    REJECTED = 2,
    DELETED = 3
}

export enum ShopPlatform {
    TAOBAO = 'TAOBAO',
    TMALL = 'TMALL',
    JD = 'JD',
    PDD = 'PDD',
    DOUYIN = 'DOUYIN',
    OTHER = 'OTHER'
}

@Entity('shops')
export class Shop {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    sellerId: string;

    @ManyToOne(() => Merchant)
    @JoinColumn({ name: 'sellerId' })
    merchant: Merchant;

    @Column({
        type: 'enum',
        enum: ShopPlatform,
        default: ShopPlatform.TAOBAO
    })
    platform: ShopPlatform;

    @Column()
    shopName: string;

    @Column()
    accountName: string; // 旺旺号/账号名

    @Column()
    contactName: string; // 发件人姓名

    @Column()
    mobile: string;

    @Column({ nullable: true })
    province: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    district: string;

    @Column({ nullable: true })
    detailAddress: string;

    @Column({ nullable: true })
    url: string;

    @Column({ default: true })
    needLogistics: boolean;     // 是否需要物流 (对应原版logistics字段)

    @Column({ length: 50, nullable: true })
    expressCode: string;        // 快递站点号 (对应原版code字段)

    @Column({
        type: 'enum',
        enum: ShopStatus,
        default: ShopStatus.PENDING
    })
    status: ShopStatus;

    @Column({ nullable: true })
    auditRemark: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
