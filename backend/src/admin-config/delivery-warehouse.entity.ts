import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 发货仓库表 - 快递公司和发货仓库管理
 */
@Entity('delivery_warehouses')
export class DeliveryWarehouse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // 快递公司名称

  @Column({ unique: true })
  code: string; // 快递公司代码

  @Column({ nullable: true })
  logo: string; // 快递公司logo

  @Column({ nullable: true })
  contactPhone: string; // 联系电话

  @Column({ nullable: true })
  website: string; // 官网

  @Column({ type: 'text', nullable: true })
  trackingUrl: string; // 物流查询URL模板，如 https://www.xxx.com/track?no={number}

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 默认快递公司列表
 */
export const DEFAULT_DELIVERIES = [
  { code: 'SF', name: '顺丰速运', sortOrder: 1 },
  { code: 'YTO', name: '圆通速递', sortOrder: 2 },
  { code: 'ZTO', name: '中通快递', sortOrder: 3 },
  { code: 'STO', name: '申通快递', sortOrder: 4 },
  { code: 'YUNDA', name: '韵达速递', sortOrder: 5 },
  { code: 'JD', name: '京东物流', sortOrder: 6 },
  { code: 'EMS', name: 'EMS', sortOrder: 7 },
  { code: 'JTEXPRESS', name: '极兔速递', sortOrder: 8 },
  { code: 'DBWL', name: '德邦快递', sortOrder: 9 },
  { code: 'CAINIAO', name: '菜鸟裹裹', sortOrder: 10 },
  { code: 'OTHER', name: '其他快递', sortOrder: 99 },
];
