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
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Merchant } from '../merchants/merchant.entity';
import { Shop } from '../shops/shop.entity';

export enum GoodsStatus {
  ACTIVE = 1,
  DELETED = 2,
}

@Entity('goods')
export class Goods {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  sellerId: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'sellerId' })
  seller: Merchant;

  @Column()
  @Index()
  shopId: string;

  @ManyToOne(() => Shop)
  @JoinColumn({ name: 'shopId' })
  shop: Shop;

  @Column({ length: 200 })
  name: string; // 商品名称

  @Column({ type: 'text', nullable: true })
  link: string; // 商品链接

  @Column({ nullable: true })
  platformProductId: string; // 平台商品ID（原taobaoId）

  @Column({ length: 20, nullable: true })
  verifyCode: string; // 核对口令

  @Column({ type: 'text', nullable: true })
  pcImg: string; // PC主图 (JSON数组)

  @Column({ length: 200, nullable: true })
  specName: string; // 规格名

  @Column({ length: 100, nullable: true })
  specValue: string; // 规格值

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number; // 单价

  @Column({ default: 1 })
  num: number; // 数量

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  showPrice: number; // 展示价格

  @Column({ nullable: true })
  goodsKeyId: string; // 关键词方案ID

  @Column({ type: 'int', default: GoodsStatus.ACTIVE })
  state: GoodsStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

