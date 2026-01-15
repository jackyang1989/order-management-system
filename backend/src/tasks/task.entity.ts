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

export enum TaskStatus {
  PENDING_PAY = 0, // 待支付
  ACTIVE = 1, // 进行中 (已支付/已发布)
  COMPLETED = 2, // 已完成
  CANCELLED = 3, // 已取消
  AUDIT = 4, // 待审核
  PAUSED = 5, // 已暂停
  REJECTED = 6, // 已拒绝
}

export enum TaskType {
  TAOBAO = 1,
  TMALL = 2,
  JD = 3,
  PDD = 4,
  DOUYIN = 5,
  KUAISHOU = 6,
}

// 平台类型到名称的映射（动态配置）
export const TASK_TYPE_NAMES: Record<number, string> = {
  [TaskType.TAOBAO]: '淘宝',
  [TaskType.TMALL]: '天猫',
  [TaskType.JD]: '京东',
  [TaskType.PDD]: '拼多多',
  [TaskType.DOUYIN]: '抖音',
  [TaskType.KUAISHOU]: '快手',
};

// 获取平台名称
export function getTaskTypeName(taskType: number): string {
  return TASK_TYPE_NAMES[taskType] || '其他';
}

// 任务类型（结算方式）
export enum TaskTerminal {
  BENYONG_HUOFAN = 1, // 本佣货返（买手垫付，本金和佣金货返）
  BENLI_YONGHUO = 2, // 本立佣货（本金立返，佣金货返）
}

// 任务版本
export enum TaskVersion {
  V1 = 1, // 版本1：单商品
  V2 = 2, // 版本2：多商品（使用task_goods表）
}

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // --- 任务基础信息 ---
  @Column({ unique: true })
  taskNumber: string; // 任务编号 TXXXXXXXX

  @Column({ default: TaskType.TAOBAO })
  taskType: number; // 1:淘宝, 2:天猫, 3:京东/飞猪

  @Column({ length: 500, nullable: true, default: '' }) // 商品标题
  title: string;

  @Column({ nullable: true })
  url: string; // 商品链接/口令

  @Column({ nullable: true })
  mainImage: string; // 商品主图

  @Column({ nullable: true })
  shopName: string; // 店铺名称

  @Column({ nullable: true })
  keyword: string; // 搜索关键词

  @Column({ name: 'itemToken', length: 1500, nullable: true })
  itemToken: string; // 淘口令/商品口令

  @Column({ nullable: true })
  platformProductId: string; // 平台商品ID（用于核对，原taobaoId）

  @Column({ nullable: true })
  qrCode: string; // 二维码URL

  @Column({ type: 'int', default: 1 })
  count: number; // 任务单数 (Total needed)

  @Column({ type: 'int', default: 0 })
  claimedCount: number; // 已领取人数

  @Column({ type: 'int', default: TaskStatus.PENDING_PAY })
  status: number;

  @Column({ nullable: true, type: 'text' })
  remark: string; // 商家备注

  @Column({ nullable: true })
  merchantId: string; // 关联商家ID

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant: Merchant;

  // --- 费用明细 (Unit: 元) ---
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  goodsPrice: number; // 单商品价格

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  goodsMoney: number; // 商品本金总额 (goodsPrice * count)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingFee: number; // 运费 (postage)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  margin: number; // 商家保证金

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraReward: number; // 加赏佣金

  // --- 服务费明细 (Unit: 银锭/元) ---
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseServiceFee: number; // 基础服务费 (原 silver_ingot 部分)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundServiceFee: number; // 返款服务费

  // --- 增值服务 ---
  @Column({ default: false })
  isPraise: boolean; // 文字好评

  @Column({ nullable: true })
  praiseType: string;

  @Column({ type: 'text', nullable: true })
  praiseList: string; // JSON string of string[]

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  praiseFee: number;

  @Column({ default: false })
  isImgPraise: boolean; // 图片好评

  @Column({ type: 'text', nullable: true })
  praiseImgList: string; // JSON string of string[][]

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  imgPraiseFee: number;

  @Column({ default: false })
  isVideoPraise: boolean; // 视频好评

  @Column({ type: 'text', nullable: true })
  praiseVideoList: string; // JSON string of string[]

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  videoPraiseFee: number;

  // --- 汇总 ---
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalDeposit: number; // 总押金

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalCommission: number; // 总佣金/银锭

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  userDivided: number; // 买手分成佣金总额（任务全部单数的总分成）

  // --- 任务结算类型 ---
  @Column({ type: 'int', default: TaskTerminal.BENLI_YONGHUO })
  terminal: number; // 结算方式 1本佣货返 2本立佣货

  @Column({ type: 'int', default: TaskVersion.V1 })
  version: number; // 任务版本 1单商品 2多商品

  // --- 统计计数 ---
  @Column({ type: 'int', default: 0 })
  completedCount: number; // 已完成数

  @Column({ type: 'int', default: 0 })
  incompleteCount: number; // 未完成数（取消/失败）

  // --- 时间限制 ---
  @Column({ type: 'int', default: 24 })
  taskTimeLimit: number; // 任务时限（小时）

  @Column({ type: 'int', default: 0 })
  unionInterval: number; // 接单间隔（分钟）

  @Column({ type: 'int', default: 0 })
  cycle: number; // 买手周期（天）

  // --- 定时相关费用 ---
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  timingPayFee: number; // 定时支付费用

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  timingPublishFee: number; // 定时发布费用

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  nextDayFee: number; // 次日返款费用

  // --- 附加费用 ---
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  phoneFee: number; // 电话费

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  goodsMoreFee: number; // 多商品加价

  @Column({
    name: 'add_reward',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  extraCommission: number; // 加赏金额

  // --- 预售相关 ---
  @Column({ default: false })
  isPresale: boolean; // 是否预售任务

  @Column({ name: 'presaleDeposit', type: 'decimal', precision: 10, scale: 2, default: 0 })
  presaleDeposit: number; // 预付款 (Presale Deposit)

  @Column({ name: 'finalPayment', type: 'decimal', precision: 10, scale: 2, default: 0 })
  finalPayment: number; // 尾款

  // --- 商品口令核对 ---
  @Column({ default: false })
  isPasswordEnabled: boolean; // 是否启用口令验证

  @Column({ length: 20, nullable: true })
  checkPassword: string; // 商品口令 (4-10字)

  // --- 审核相关 ---
  @Column({ type: 'timestamp', nullable: true })
  examineTime: Date; // 审核时间

  @Column({ type: 'timestamp', nullable: true })
  payTime: Date; // 支付时间

  @Column({ type: 'timestamp', nullable: true })
  receiptTime: Date; // 最后接单时间

  // --- 包邮/备注 ---
  @Column({ name: 'isFreeShipping', default: true })
  isFreeShipping: boolean; // 是否包邮

  @Column({ type: 'text', nullable: true })
  memo: string; // 内部备注

  // --- 关联店铺 ---
  @Column({ nullable: true })
  shopId: string; // 店铺ID

  // --- 回购任务 (P0 Fix) ---
  @Column({ name: 'is_repay', default: false })
  isRepay: boolean; // 是否回购任务 (只允许曾在该店铺完成过订单的买号接取)

  // --- 定时付款任务 (P0 Fix) ---
  @Column({ name: 'is_timing_pay', default: false })
  isTimingPay: boolean; // 是否定时付款任务

  @Column({ type: 'timestamp', name: 'timing_time', nullable: true })
  timingTime: Date | null; // 定时付款时间

  // --- 隔天任务 (P0 Fix) ---
  @Column({ name: 'is_next_day', default: false })
  isNextDay: boolean; // 是否隔天任务 (次日16:40超时)

  // --- 状态与时间 ---
  @Column({ default: false })
  isTimingPublish: boolean; // 定时发布

  @Column({ type: 'timestamp', nullable: true })
  publishTime: Date; // 发布时间

  @Column({ type: 'text', nullable: true })
  channelImages: string; // 通道图片（JSON数组）

  @Column({ default: false })
  verifySwitch: boolean; // 商品核对开关

  @Column({ type: 'text', nullable: true })
  verifyCode: string; // 商品核对码

  // --- Missing Fields for OrdersService ---

  @Column({ default: false })
  needCompare: boolean; // 货比

  @Column({ nullable: true })
  compareKeyword: string; // 货比关键词

  @Column({ nullable: true })
  backupKeyword: string; // 副关键词/备用关键词

  @Column({ default: false })
  needFavorite: boolean; // 收藏商品

  @Column({ default: false })
  needFollow: boolean; // 关注店铺

  @Column({ default: false })
  needContactCS: boolean; // 联系客服

  @Column({ type: 'text', nullable: true })
  contactCSContent: string; // 联系客服内容

  @Column({ default: false })
  needAddCart: boolean; // 加入购物车

  @Column({ default: false })
  needRandomBrowse: boolean; // 随机浏览店铺其他商品

  @Column({ default: false })
  needBrowseReviews: boolean; // 浏览评价

  @Column({ default: false })
  needBrowseQA: boolean; // 浏览问大家 (仅淘宝、天猫、京东)

  @Column({ type: 'int', default: 3 })
  compareCount: number; // 货比数量（默认3家）

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  weight: number; // 包裹重量 (kg)

  @Column({ default: false })
  fastRefund: boolean; // 快速返款服务

  @Column({ type: 'int', default: 0 })
  orderInterval: number; // 任务接单间隔 (分钟)

  @Column({ type: 'int', default: 15 })
  totalBrowseMinutes: number; // 总浏览时长

  @Column({ type: 'int', default: 3 })
  compareBrowseMinutes: number; // 货比浏览时长

  @Column({ type: 'int', default: 8 })
  mainBrowseMinutes: number; // 主商品浏览时长

  @Column({ type: 'int', default: 2 })
  subBrowseMinutes: number; // 副商品浏览时长

  @Column({ default: true })
  hasSubProduct: boolean; // 是否有副商品（控制副商品浏览时长显示）

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// DTOs
export class CreateTaskDto {
  taskType: number;
  title: string;
  url?: string;
  price?: number;
  count: number;
  shopName?: string;
  shopId?: string;
  keyword?: string;
  mainImage?: string;
  goodsPrice: number;
  itemToken?: string;
  terminal?: number; // 返款方式: 1=本佣货返, 2=本立佣货

  // 多商品列表
  goodsList?: Array<{
    id: string;
    goodsId?: string;
    name: string;
    image: string;
    link: string;
    price: number;
    quantity: number;
    specName?: string;
    specValue?: string;
    keyword?: string;
    goodsSpec?: string; // 详情问答提示
    keywords?: Array<{
      keyword: string;
      useCount?: number;
      advancedSettings?: {
        compareKeyword: string;  // 货比关键词
        backupKeyword?: string;  // 副关键词/备用关键词
      };
    }>;
    // 商品筛选设置 (商品级别，所有关键词共享)
    filterSettings?: {
      discount: string[];    // 折扣服务选项 (多选)
      sort: string;          // 排序方式
      minPrice: number;      // 最低价
      maxPrice: number;      // 最高价
      province: string;      // 发货地
    };
    orderSpecs?: Array<{
      specName: string;
      specValue: string;
      quantity: number;
    }>;
    verifyCode?: string;     // 核对口令
    shopId?: string;
  }>;

  // 增值服务字段
  isPraise?: boolean;
  praiseType?: string;
  praiseFee?: number;
  praiseList?: string[];
  praiseImgList?: string[][];
  praiseVideoList?: string[];

  isImgPraise?: boolean;
  isVideoPraise?: boolean;

  isFreeShipping?: number; // 1=包邮, 2=不包邮

  // Browse Behavior Settings
  needCompare?: boolean;      // 货比
  compareCount?: number;      // 货比数量
  needFavorite?: boolean;     // 收藏商品
  needFollow?: boolean;       // 关注店铺
  needAddCart?: boolean;      // 加入购物车
  needContactCS?: boolean;    // 联系客服
  contactCSContent?: string;  // 联系客服内容
  needRandomBrowse?: boolean; // 随机浏览店铺其他商品

  // 浏览时长设置
  totalBrowseMinutes?: number;
  compareBrowseMinutes?: number;
  mainBrowseMinutes?: number;
  subBrowseMinutes?: number;
  hasSubProduct?: boolean;

  isTimingPublish?: boolean;
  publishTime?: string;

  isTimingPay?: boolean;
  timingPayTime?: string;

  isCycleTime?: boolean;
  cycleTime?: number;

  addReward?: number;

  // P0 Fix: 新任务类型
  isRepay?: boolean; // 回购任务
  isNextDay?: boolean; // 隔天任务

  // P0 Fix: Order Settings
  memo?: string;           // 下单提示/备注
  weight?: number;         // 包裹重量
  fastRefund?: boolean;    // 快速返款服务
  orderInterval?: number;  // 任务接单间隔

  // 口令验证
  isPasswordEnabled?: boolean; // 是否开启口令验证
  checkPassword?: string; // 商品口令 (4-10字)

  // 费用相关
  totalDeposit?: number;
  totalCommission?: number;
  baseServiceFee?: number;
  goodsMoreFee?: number;
  nextDayFee?: number;

  // 批量导入相关字段
  extraCommission?: number; // 额外佣金
  remark?: string; // 备注
}

export class TaskFilterDto {
  status?: number;
  taskType?: number;
  search?: string;
  minCommission?: number;
  maxCommission?: number;
  merchantId?: string; // 'current' 表示当前登录商家
}

export class ClaimTaskDto {
  buynoId: string;
  buynoAccount?: string;
}
