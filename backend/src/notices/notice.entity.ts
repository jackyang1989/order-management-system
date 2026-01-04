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
  IsEnum,
  IsNumber,
} from 'class-validator';

export enum NoticeType {
  SYSTEM = 1, // 系统公告
  ACTIVITY = 2, // 活动公告
  UPDATE = 3, // 更新公告
  NOTICE = 4, // 通知公告
}

export enum NoticeTarget {
  ALL = 0, // 所有人
  BUYER = 1, // 买手
  MERCHANT = 2, // 商家
}

export enum NoticeStatus {
  DRAFT = 0, // 草稿
  PUBLISHED = 1, // 已发布
  ARCHIVED = 2, // 已归档
}

@Entity('notices')
export class Notice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', default: NoticeType.SYSTEM })
  type: NoticeType;

  @Column({ type: 'int', default: NoticeTarget.ALL })
  target: NoticeTarget;

  @Column({ type: 'int', default: NoticeStatus.DRAFT })
  @Index()
  status: NoticeStatus;

  @Column({ type: 'int', default: 0 })
  sort: number; // 排序，数值越大越靠前

  @Column({ default: false })
  isTop: boolean; // 是否置顶

  @Column({ default: false })
  isPopup: boolean; // 是否弹窗显示

  @Column({ type: 'text', nullable: true })
  coverImage?: string; // 封面图

  @Column({ nullable: true })
  adminId?: string; // 发布者ID

  @Column({ length: 50, nullable: true })
  adminName?: string; // 发布者名称

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date; // 发布时间

  @Column({ type: 'timestamp', nullable: true })
  expiredAt?: Date; // 过期时间

  @Column({ type: 'int', default: 0 })
  viewCount: number; // 浏览次数

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notice_reads')
export class NoticeRead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  noticeId: string;

  @Column()
  @Index()
  userId: string;

  @Column({ type: 'int', default: 1 })
  userType: number; // 1买手 2商家

  @CreateDateColumn()
  readAt: Date;
}

// DTOs
export class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(NoticeType)
  @IsOptional()
  type?: NoticeType;

  @IsEnum(NoticeTarget)
  @IsOptional()
  target?: NoticeTarget;

  @IsNumber()
  @IsOptional()
  sort?: number;

  @IsOptional()
  isTop?: boolean;

  @IsOptional()
  isPopup?: boolean;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsOptional()
  expiredAt?: Date;
}

export class UpdateNoticeDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(NoticeType)
  @IsOptional()
  type?: NoticeType;

  @IsEnum(NoticeTarget)
  @IsOptional()
  target?: NoticeTarget;

  @IsNumber()
  @IsOptional()
  sort?: number;

  @IsOptional()
  isTop?: boolean;

  @IsOptional()
  isPopup?: boolean;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsOptional()
  expiredAt?: Date;
}
