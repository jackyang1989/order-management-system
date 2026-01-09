import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BannerPosition {
  HOME = 'home',
  BUYER = 'buyer',
  MERCHANT = 'merchant',
}

export enum BannerStatus {
  DISABLED = 0,
  ENABLED = 1,
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, comment: '标题' })
  title: string;

  @Column({ length: 500, comment: '图片URL' })
  imageUrl: string;

  @Column({ length: 500, nullable: true, comment: '跳转链接' })
  linkUrl: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: BannerPosition.HOME,
    comment: '显示位置',
  })
  position: BannerPosition;

  @Column({ type: 'int', default: 0, comment: '排序，数字越小越靠前' })
  sort: number;

  @Column({ type: 'int', default: BannerStatus.ENABLED, comment: '状态' })
  status: BannerStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

export class CreateBannerDto {
  title: string;
  imageUrl: string;
  linkUrl?: string;
  position?: BannerPosition;
  sort?: number;
  status?: BannerStatus;
}

export class UpdateBannerDto {
  title?: string;
  imageUrl?: string;
  linkUrl?: string;
  position?: BannerPosition;
  sort?: number;
  status?: BannerStatus;
}
