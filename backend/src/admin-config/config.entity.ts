import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 系统配置表 - 支持分组和多种数据类型
 */
@Entity('system_configs')
export class SystemConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ nullable: true })
  group: string;

  @Column({ nullable: true })
  label: string; // 配置项中文名称

  @Column({ nullable: true })
  description: string; // 配置项说明

  @Column({ default: 'string' })
  valueType: string; // string, number, boolean, json, array

  @Column({ nullable: true })
  options: string; // 选项列表(JSON)，用于下拉选择

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ type: 'boolean', default: true })
  isEditable: boolean; // 是否可编辑

  @Column({ type: 'boolean', default: true })
  isVisible: boolean; // 是否在后台显示

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

/**
 * 配置分组定义
 */
export const CONFIG_GROUPS = {
  REGISTER: 'register', // 注册设置
  VIP: 'vip', // VIP设置
  WITHDRAWAL: 'withdrawal', // 提现设置
  TASK_FEE: 'task_fee', // 任务服务费
  PRAISE_FEE: 'praise_fee', // 好评费用
  COMMISSION: 'commission', // 佣金设置
  SMS: 'sms', // 短信设置
  PAYMENT: 'payment', // 支付设置
  API: 'api', // 第三方API
  SYSTEM: 'system', // 系统设置
};

/**
 * 默认配置项
 */
export const DEFAULT_CONFIGS = [
  // 注册设置
  {
    key: 'user_register_reward',
    value: '0',
    group: 'register',
    label: '买手注册赠送银锭',
    valueType: 'number',
  },
  {
    key: 'seller_register_reward',
    value: '0',
    group: 'register',
    label: '商家注册赠送银锭',
    valueType: 'number',
  },
  {
    key: 'user_register_vip_days',
    value: '0',
    group: 'register',
    label: '买手注册赠送VIP天数',
    valueType: 'number',
  },
  {
    key: 'seller_register_vip_days',
    value: '0',
    group: 'register',
    label: '商家注册赠送VIP天数',
    valueType: 'number',
  },
  {
    key: 'limit_mobile',
    value: '',
    group: 'register',
    label: '限制注册手机号',
    valueType: 'array',
    description: '禁止注册的手机号，逗号分隔',
  },

  // VIP设置
  {
    key: 'user_vip_prices',
    value:
      '[{"days":30,"price":45},{"days":90,"price":80},{"days":180,"price":115},{"days":365,"price":130}]',
    group: 'vip',
    label: '买手VIP价格档位',
    valueType: 'json',
  },
  {
    key: 'seller_vip_prices',
    value:
      '[{"days":30,"price":450},{"days":90,"price":800},{"days":180,"price":1000},{"days":365,"price":1200}]',
    group: 'vip',
    label: '商家VIP价格档位',
    valueType: 'json',
  },

  // 提现设置
  {
    key: 'user_min_withdraw',
    value: '100',
    group: 'withdrawal',
    label: '买手最低提现金额',
    valueType: 'number',
  },
  {
    key: 'seller_min_withdraw',
    value: '100',
    group: 'withdrawal',
    label: '商家最低提现金额',
    valueType: 'number',
  },
  {
    key: 'user_max_withdraw',
    value: '50000',
    group: 'withdrawal',
    label: '买手单次最大提现金额',
    valueType: 'number',
  },
  {
    key: 'seller_max_withdraw',
    value: '100000',
    group: 'withdrawal',
    label: '商家单次最大提现金额',
    valueType: 'number',
  },
  {
    key: 'user_withdraw_fee_rate',
    value: '0',
    group: 'withdrawal',
    label: '买手提现手续费比例',
    valueType: 'number',
    description: '0-1之间的小数',
  },
  {
    key: 'seller_withdraw_fee_rate',
    value: '0',
    group: 'withdrawal',
    label: '商家提现手续费比例',
    valueType: 'number',
  },
  {
    key: 'user_min_silver_withdraw',
    value: '100',
    group: 'withdrawal',
    label: '买手最低提现银锭数',
    valueType: 'number',
  },
  {
    key: 'silver_to_rmb_rate',
    value: '1',
    group: 'withdrawal',
    label: '银锭兑换人民币比例',
    valueType: 'number',
    description: '1银锭=多少人民币',
  },

  // 任务服务费
  {
    key: 'base_fee_rate',
    value: '0.1',
    group: 'task_fee',
    label: '基础服务费比例',
    valueType: 'number',
  },
  {
    key: 'benli_fee_rate',
    value: '0.15',
    group: 'task_fee',
    label: '本立佣货服务费比例',
    valueType: 'number',
  },
  {
    key: 'union_interval_fee',
    value: '0.5',
    group: 'task_fee',
    label: '接单间隔服务费',
    valueType: 'number',
  },
  {
    key: 'goods_more_fee',
    value: '1',
    group: 'task_fee',
    label: '多商品附加费',
    valueType: 'number',
  },
  {
    key: 'phone_fee',
    value: '0.3',
    group: 'task_fee',
    label: '手机端加成服务费',
    valueType: 'number',
  },
  {
    key: 'pc_fee',
    value: '0.2',
    group: 'task_fee',
    label: 'PC端加成服务费',
    valueType: 'number',
  },
  {
    key: 'timing_publish_fee',
    value: '0.5',
    group: 'task_fee',
    label: '定时发布服务费',
    valueType: 'number',
  },
  {
    key: 'timing_pay_fee',
    value: '0.3',
    group: 'task_fee',
    label: '定时付款服务费',
    valueType: 'number',
  },
  {
    key: 'next_day_fee',
    value: '0.5',
    group: 'task_fee',
    label: '隔天任务服务费',
    valueType: 'number',
  },
  {
    key: 'cycle_fee',
    value: '0.2',
    group: 'task_fee',
    label: '循环时间费',
    valueType: 'number',
  },
  {
    key: 'presale_fee',
    value: '1',
    group: 'task_fee',
    label: '预售每单服务费',
    valueType: 'number',
  },
  {
    key: 'refund_service_rate',
    value: '0.01',
    group: 'task_fee',
    label: '返款服务费比例',
    valueType: 'number',
  },
  {
    key: 'default_postage',
    value: '0',
    group: 'task_fee',
    label: '默认邮费/单',
    valueType: 'number',
  },

  // 好评费用
  {
    key: 'text_praise_fee',
    value: '1',
    group: 'praise_fee',
    label: '文字好评费用',
    valueType: 'number',
  },
  {
    key: 'image_praise_fee',
    value: '2',
    group: 'praise_fee',
    label: '图片好评费用',
    valueType: 'number',
  },
  {
    key: 'video_praise_fee',
    value: '5',
    group: 'praise_fee',
    label: '视频好评费用',
    valueType: 'number',
  },

  // 佣金设置
  {
    key: 'buyer_commission_rate',
    value: '1',
    group: 'commission',
    label: '买手佣金分成比例',
    valueType: 'number',
  },
  {
    key: 'order_referral_rate',
    value: '0.01',
    group: 'commission',
    label: '订单推荐奖励比例',
    valueType: 'number',
  },
  {
    key: 'task_referral_rate',
    value: '0.005',
    group: 'commission',
    label: '任务推荐奖励比例',
    valueType: 'number',
  },
  {
    key: 'secondary_referral_rate',
    value: '0.005',
    group: 'commission',
    label: '二级推荐奖励比例',
    valueType: 'number',
  },
  {
    key: 'buyer_referral_reward',
    value: '5',
    group: 'commission',
    label: '推荐买手注册奖励',
    valueType: 'number',
  },
  {
    key: 'merchant_referral_reward',
    value: '10',
    group: 'commission',
    label: '推荐商家注册奖励',
    valueType: 'number',
  },
  // 推荐奖励熔断配置
  {
    key: 'referral_reward_per_order',
    value: '1',
    group: 'commission',
    label: '推荐人每单奖励金额',
    valueType: 'number',
    description: '被推荐人完成任务时，推荐人获得的奖励（银锭）',
  },
  {
    key: 'referral_max_count',
    value: '5',
    group: 'commission',
    label: '单个被推荐人每日奖励上限次数',
    valueType: 'number',
    description: '同一被推荐人每天最多给推荐人发放的奖励次数',
  },
  {
    key: 'referral_max_amount',
    value: '5',
    group: 'commission',
    label: '单个被推荐人每日奖励上限金额',
    valueType: 'number',
    description: '同一被推荐人每天最多给推荐人发放的奖励金额（银锭）',
  },
  {
    key: 'referral_active_days',
    value: '30',
    group: 'commission',
    label: '推荐关系活跃期限（天）',
    valueType: 'number',
    description: '双方任一方超过此天数未完成任务则熔断推荐关系',
  },
  {
    key: 'referral_lifetime_max_amount',
    value: '1000',
    group: 'commission',
    label: '单个被推荐人终身奖励上限',
    valueType: 'number',
    description: '同一被推荐人终身最多给推荐人发放的奖励总额（银锭）',
  },

  // 短信设置
  {
    key: 'sms_username',
    value: '',
    group: 'sms',
    label: '短信账号',
    valueType: 'string',
  },
  {
    key: 'sms_password',
    value: '',
    group: 'sms',
    label: '短信密码',
    valueType: 'string',
  },
  {
    key: 'sms_sign',
    value: '',
    group: 'sms',
    label: '短信签名',
    valueType: 'string',
  },
  {
    key: 'sms_enabled',
    value: 'false',
    group: 'sms',
    label: '启用短信验证',
    valueType: 'boolean',
  },

  // 支付设置
  {
    key: 'alipay_account',
    value: '',
    group: 'payment',
    label: '支付宝收款账号',
    valueType: 'string',
  },
  {
    key: 'alipay_name',
    value: '',
    group: 'payment',
    label: '支付宝收款人姓名',
    valueType: 'string',
  },
  {
    key: 'wechat_pay_enabled',
    value: 'false',
    group: 'payment',
    label: '启用微信支付',
    valueType: 'boolean',
  },
  {
    key: 'alipay_enabled',
    value: 'true',
    group: 'payment',
    label: '启用支付宝支付',
    valueType: 'boolean',
  },

  // 第三方API
  {
    key: 'dingdanxia_api_key',
    value: '',
    group: 'api',
    label: '订单侠API Key',
    valueType: 'string',
  },
  {
    key: 'dingdanxia_enabled',
    value: 'false',
    group: 'api',
    label: '启用订单侠API',
    valueType: 'boolean',
  },

  // 邀请设置
  {
    key: 'merchant_invite_enabled',
    value: 'false',
    group: 'commission',
    label: '启用商家邀请功能',
    valueType: 'boolean',
    description: '是否允许用户邀请商家入驻',
  },
  {
    key: 'invite_unlock_threshold',
    value: '10',
    group: 'commission',
    label: '邀请解锁门槛（完成任务数）',
    valueType: 'number',
    description: '用户完成多少单任务后可解锁邀请功能',
  },

  // 系统设置
  {
    key: 'site_name',
    value: '任务管理系统',
    group: 'system',
    label: '网站名称',
    valueType: 'string',
  },
  {
    key: 'site_logo',
    value: '',
    group: 'system',
    label: '网站Logo',
    valueType: 'string',
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    group: 'system',
    label: '维护模式',
    valueType: 'boolean',
  },
  {
    key: 'maintenance_message',
    value: '系统维护中，请稍后访问',
    group: 'system',
    label: '维护提示信息',
    valueType: 'string',
  },
  {
    key: 'order_timeout_hours',
    value: '24',
    group: 'system',
    label: '订单超时时间(小时)',
    valueType: 'number',
  },
  {
    key: 'task_claim_interval_hours',
    value: '2',
    group: 'system',
    label: '同用户接单间隔(小时)',
    valueType: 'number',
  },
  {
    key: 'auto_confirm_days',
    value: '15',
    group: 'system',
    label: '自动确认收货天数',
    valueType: 'number',
  },
];
