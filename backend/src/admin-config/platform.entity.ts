import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 平台分类表 - 支持的电商平台
 */
@Entity('platforms')
export class Platform {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // 平台代码：taobao, tmall, jd, pdd, douyin, etc.

  @Column()
  name: string; // 平台名称

  @Column({ nullable: true })
  icon: string; // 平台图标

  @Column({ nullable: true })
  color: string; // 平台主题色

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseFeeRate: number; // 该平台的基础服务费比例

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraFee: number; // 该平台的额外费用

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 是否启用

  @Column({ type: 'boolean', default: true })
  supportsTkl: boolean; // 是否支持淘口令解析

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 默认平台列表
 */
export const DEFAULT_PLATFORMS = [
  {
    code: 'taobao',
    name: '淘宝',
    color: '#FF5722',
    sortOrder: 1,
    supportsTkl: true,
  },
  {
    code: 'tmall',
    name: '天猫',
    color: '#E91E63',
    sortOrder: 2,
    supportsTkl: true,
  },
  {
    code: 'jd',
    name: '京东',
    color: '#E53935',
    sortOrder: 3,
    supportsTkl: false,
  },
  {
    code: 'pdd',
    name: '拼多多',
    color: '#FF6B00',
    sortOrder: 4,
    supportsTkl: false,
  },
  {
    code: 'douyin',
    name: '抖音',
    color: '#000000',
    sortOrder: 5,
    supportsTkl: false,
  },
  {
    code: 'kuaishou',
    name: '快手',
    color: '#FF5000',
    sortOrder: 6,
    supportsTkl: false,
  },
  {
    code: 'xhs',
    name: '小红书',
    color: '#FE2C55',
    sortOrder: 7,
    supportsTkl: false,
  },
  {
    code: 'feizhu',
    name: '飞猪',
    color: '#FF6600',
    sortOrder: 8,
    supportsTkl: true,
  },
];
