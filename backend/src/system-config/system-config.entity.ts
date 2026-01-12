import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  PrimaryColumn,
} from 'typeorm';
import { IsNumber, IsOptional, IsString } from 'class-validator';

/**
 * 系统配置表（key-value结构，兼容原有设计）
 */
@Entity('system_config')
export class SystemConfig {
  @PrimaryColumn()
  key: string;

  @Column()
  value: string;

  @Column({ nullable: true })
  group: string;

  @Column({ nullable: true })
  description: string;
}

/**
 * 系统全局配置表
 * 全局单行配置，所有配置项存储在同一条记录中
 */
@Entity('system_global_config')
export class SystemGlobalConfig {
  @PrimaryGeneratedColumn()
  id: number;

  // ============ 注册赠送配置 ============
  @Column({ type: 'int', default: 0 })
  userNum: number; // 注册赠送买手银锭数

  @Column({ type: 'int', default: 0 })
  sellerNum: number; // 注册赠送商家银锭数

  @Column({ type: 'int', default: 0 })
  userVipTime: number; // 注册赠送买手VIP天数

  @Column({ type: 'int', default: 0 })
  sellerVipTime: number; // 注册赠送商家VIP天数

  // ============ VIP价格配置 ============
  @Column({ length: 100, default: '45,80,115,130' })
  userVip: string; // 用户VIP开通金额（逗号分隔多档位）

  @Column({ length: 100, default: '450,800,1000,1200' })
  sellerVip: string; // 商家VIP开通金额（逗号分隔多档位）

  // ============ 提现相关配置 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  userMinMoney: number; // 买手提现本金最低金额

  @Column({ type: 'int', default: 0 })
  sellerMinMoney: number; // 商家提现本金最低金额

  @Column({ type: 'int', default: 0 })
  userMinReward: number; // 买手提现银锭最低数量

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 1 })
  rewardPrice: number; // 银锭兑换单价（1银锭=X元）

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  sellerCashFee: number; // 商家提现押金手续费率

  @Column({ length: 300, default: '' })
  userCashFree: string; // 买手提现押金手续费

  @Column({ length: 300, default: '' })
  userFeeMaxPrice: string; // 买手提现免手续费金额

  // ============ 服务费用配置 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  unionInterval: number; // 接单间隔服务费

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  goodsMoreFee: number; // 多商品费用（每增加一个商品）

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  refundServicePrice: number; // 返款服务费用

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  phoneFee: number; // 本立佣货服务费

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  pcFee: number; // 本佣货返服务费

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  timingPay: number; // 定时付款服务费

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  timingPublish: number; // 定时发布服务费

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  nextDay: number; // 隔天任务服务费

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 5 })
  postage: number; // 邮费/单

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  rePay: number; // 回购任务发布费用

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  ysFee: number; // 预售每单服务费

  // ============ 好评费用配置 ============
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 2 })
  praise: number; // 文字好评费用

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 3 })
  imgPraise: number; // 图片好评费用

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 10 })
  videoPraise: number; // 视频好评费用

  // ============ 佣金分成配置 ============
  @Column({ type: 'decimal', precision: 12, scale: 4, default: 0.6 })
  divided: number; // 买手任务佣金分成比例（如0.6表示60%）

  // ============ 系统账号配置 ============
  @Column({ length: 100, nullable: true })
  msgUsername: string; // 短信账号

  @Column({ length: 100, nullable: true })
  msgPassword: string; // 短信密码

  @Column({ length: 100, nullable: true })
  alipay: string; // 支付宝收款账号

  // ============ 其他配置 ============
  @Column({ type: 'int', default: 0 })
  verifySwitch: number; // 验证开关（0关闭/1开启商品核对码验证）

  @Column({ type: 'text', nullable: true })
  limitMobile: string; // 禁止注册手机号列表（逗号分隔）

  @Column({ type: 'int', default: 10 })
  invitationNum: number; // 邀请解锁阈值（完成多少单才能解锁邀请功能）

  // ============ 第三方 API 配置 ============
  @Column({ length: 128, nullable: true })
  dingdanxiaApiKey: string; // 订单侠API Key

  @Column({ default: false })
  dingdanxiaEnabled: boolean; // 订单侠启用状态

  // ============ P1: 动态业务配置 ============

  // 买号升星阶梯配置 (完成X单升级到N星)
  // JSON格式: {"2":30,"3":60,"4":90,"5":120} 表示30单升2星，60单升3星...
  @Column({ type: 'text', default: '{"2":30,"3":60,"4":90,"5":120}' })
  starThresholds: string;

  // 买号星级限价配置 (N星最高可接X元任务)
  // JSON格式: {"1":100,"2":500,"3":1000,"4":2000,"5":99999}
  @Column({ type: 'text', default: '{"1":100,"2":500,"3":1000,"4":2000,"5":99999}' })
  starPriceLimits: string;

  // 首个买号审核通过赠送VIP天数
  @Column({ type: 'int', default: 7 })
  firstAccountVipDays: number;

  // 商品口令核对全局开关
  @Column({ default: false })
  passwordCheckEnabled: boolean;

  // ============ P1: 邀请奖励配置 ============

  // 每单邀请奖励银锭数
  @Column({ type: 'int', default: 1 })
  inviteRewardAmount: number;

  // 单个被邀请人最大贡献单数（超出不再发放奖励）
  @Column({ type: 'int', default: 10 })
  inviteMaxOrders: number;

  // 活跃判定天数（双方超过此天数未做任务则暂停奖励）
  @Column({ type: 'int', default: 30 })
  inviteExpiryDays: number;

  // ============ 收款账户配置 ============
  // 是否需要填写银行卡信息（关闭后只需上传收款码）
  @Column({ default: true })
  requireBankInfo: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}

// ============ DTOs ============

/**
 * 更新系统配置DTO
 */
export class UpdateSystemGlobalConfigDto {
  // 注册赠送配置
  @IsOptional()
  @IsNumber()
  userNum?: number;

  @IsOptional()
  @IsNumber()
  sellerNum?: number;

  @IsOptional()
  @IsNumber()
  userVipTime?: number;

  @IsOptional()
  @IsNumber()
  sellerVipTime?: number;

  // VIP价格配置
  @IsOptional()
  @IsString()
  userVip?: string;

  @IsOptional()
  @IsString()
  sellerVip?: string;

  // 提现相关配置
  @IsOptional()
  @IsNumber()
  userMinMoney?: number;

  @IsOptional()
  @IsNumber()
  sellerMinMoney?: number;

  @IsOptional()
  @IsNumber()
  userMinReward?: number;

  @IsOptional()
  @IsNumber()
  rewardPrice?: number;

  @IsOptional()
  @IsNumber()
  sellerCashFee?: number;

  // 服务费用配置
  @IsOptional()
  @IsNumber()
  unionInterval?: number;

  @IsOptional()
  @IsNumber()
  goodsMoreFee?: number;

  @IsOptional()
  @IsNumber()
  refundServicePrice?: number;

  @IsOptional()
  @IsNumber()
  phoneFee?: number;

  @IsOptional()
  @IsNumber()
  pcFee?: number;

  @IsOptional()
  @IsNumber()
  timingPay?: number;

  @IsOptional()
  @IsNumber()
  timingPublish?: number;

  @IsOptional()
  @IsNumber()
  nextDay?: number;

  @IsOptional()
  @IsNumber()
  postage?: number;

  // 好评费用配置
  @IsOptional()
  @IsNumber()
  praise?: number;

  @IsOptional()
  @IsNumber()
  imgPraise?: number;

  @IsOptional()
  @IsNumber()
  videoPraise?: number;

  // 佣金分成配置
  @IsOptional()
  @IsNumber()
  divided?: number;

  // 系统账号配置
  @IsOptional()
  @IsString()
  msgUsername?: string;

  @IsOptional()
  @IsString()
  msgPassword?: string;

  @IsOptional()
  @IsString()
  alipay?: string;

  // 其他配置
  @IsOptional()
  @IsNumber()
  verifySwitch?: number;

  @IsOptional()
  @IsString()
  limitMobile?: string;

  @IsOptional()
  @IsNumber()
  invitationNum?: number;

  @IsOptional()
  @IsString()
  dingdanxiaApiKey?: string;

  @IsOptional()
  dingdanxiaEnabled?: boolean;

  // 收款账户配置
  @IsOptional()
  requireBankInfo?: boolean;
}
