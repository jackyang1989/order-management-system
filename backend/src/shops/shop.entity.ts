import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Merchant } from '../merchants/merchant.entity';

export enum ShopStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  DELETED = 3,
}

export enum ShopPlatform {
  TAOBAO = 'TAOBAO',
  TMALL = 'TMALL',
  JD = 'JD',
  PDD = 'PDD',
  DOUYIN = 'DOUYIN',
  OTHER = 'OTHER',
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
    default: ShopPlatform.TAOBAO,
  })
  platform: ShopPlatform;

  @Column()
  shopName: string; // 店铺名称

  @Column()
  accountName: string; // 店铺账号

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
  needLogistics: boolean; // 是否需要物流

  @Column({ length: 50, nullable: true })
  expressCode: string; // 快递站点号

  @Column({
    type: 'enum',
    enum: ShopStatus,
    default: ShopStatus.PENDING,
  })
  status: ShopStatus;

  @Column({ nullable: true })
  auditRemark: string;

  @Column({ nullable: true })
  screenshot: string; // 店铺后台截图URL

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
