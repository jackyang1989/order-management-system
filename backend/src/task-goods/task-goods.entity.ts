import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Task } from '../tasks/task.entity';
import { Goods } from '../goods/goods.entity';

// 任务商品关联表 - 支持一个任务关联多个商品（升级任务）
@Entity('task_goods')
export class TaskGoods {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ nullable: true })
  goodsId: string; // 关联商品ID（可选，新版任务可能不关联已有商品）

  @ManyToOne(() => Goods)
  @JoinColumn({ name: 'goodsId' })
  goods: Goods;

  // 商品信息快照（发布任务时记录，避免商品修改影响任务）
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  pcImg: string; // 商品主图

  @Column({ type: 'text', nullable: true })
  link: string; // 商品链接

  @Column({ length: 100, nullable: true })
  specName: string; // 规格名

  @Column({ length: 100, nullable: true })
  specValue: string; // 规格值

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  price: number; // 单价

  @Column({ default: 1 })
  num: number; // 数量

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalPrice: number; // 小计 = price * num

  @Column({ type: 'text', nullable: true })
  orderSpecs: string; // JSON array of { specName, specValue, quantity }

  @Column({ type: 'text', nullable: true })
  verifyCode: string; // 核对口令

  @CreateDateColumn()
  createdAt: Date;
}

// 任务关键词表 - 记录任务使用的关键词
@Entity('task_keywords')
export class TaskKeyword {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ nullable: true })
  taskGoodsId: string; // 关联任务商品

  @Column({ length: 100 })
  keyword: string;

  @Column({ type: 'int', default: 1 })
  terminal: number; // 1电脑端 2手机端

  @Column({ type: 'text', nullable: true })
  discount: string; // 折扣服务

  @Column({ length: 225, nullable: true })
  filter: string; // 筛选分类

  @Column({ length: 100, nullable: true })
  sort: string; // 排序方式

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  maxPrice: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  minPrice: number;

  @Column({ length: 50, nullable: true })
  province: string; // 发货地

  @CreateDateColumn()
  createdAt: Date;
}

// DTOs
export class CreateTaskGoodsDto {
  goodsId?: string;
  name: string;
  pcImg?: string;
  link?: string;
  specName?: string;
  specValue?: string;
  price: number;
  num?: number;
  orderSpecs?: Array<{ specName: string; specValue: string; quantity: number }>;
  verifyCode?: string;
}

export class CreateTaskKeywordDto {
  taskGoodsId?: string;
  keyword: string;
  terminal?: number;
  discount?: string;
  filter?: string;
  sort?: string;
  maxPrice?: number;
  minPrice?: number;
  province?: string;
}
