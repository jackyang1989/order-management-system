import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 任务入口类型表 - 支持的任务入口方式
 */
@Entity('entry_types')
export class EntryType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // 入口类型代码：keyword, taoword, qrcode, ztc, channel

  @Column()
  name: string; // 入口类型名称

  @Column({ nullable: true })
  icon: string; // 图标

  @Column({ nullable: true })
  color: string; // 主题色

  @Column({ type: 'int' })
  value: number; // 对应 TaskEntryType 枚举值

  @Column({ type: 'boolean', default: true })
  isActive: boolean; // 是否启用

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
 * 默认入口类型列表
 */
export const DEFAULT_ENTRY_TYPES = [
  {
    code: 'keyword',
    name: '关键词',
    icon: '🔍',
    color: '#1890ff',
    value: 1,
    sortOrder: 1,
    isActive: true,
    description: '通过关键词搜索找到商品',
  },
  {
    code: 'taoword',
    name: '淘口令',
    icon: '📋',
    color: '#ff5722',
    value: 2,
    sortOrder: 2,
    isActive: true,
    description: '通过淘口令直接打开商品',
  },
  {
    code: 'qrcode',
    name: '二维码',
    icon: '📱',
    color: '#722ed1',
    value: 3,
    sortOrder: 3,
    isActive: true,
    description: '通过扫描二维码打开商品',
  },
  {
    code: 'ztc',
    name: '直通车',
    icon: '🚗',
    color: '#52c41a',
    value: 4,
    sortOrder: 4,
    isActive: true,
    description: '通过直通车广告入口',
  },
  {
    code: 'channel',
    name: '通道',
    icon: '🔗',
    color: '#faad14',
    value: 5,
    sortOrder: 5,
    isActive: true,
    description: '通过特定通道链接',
  },
];
