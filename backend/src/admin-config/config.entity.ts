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

  @Column({ nullable: true })
  dependsOn: string; // 依赖条件，格式: "key:value"，当指定key的值等于value时显示

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
    description: 'JSON数组格式，每项包含days(天数)和price(价格)。示例：[{"days":30,"price":45}]',
  },
  {
    key: 'seller_vip_prices',
    value:
      '[{"days":30,"price":450},{"days":90,"price":800},{"days":180,"price":1000},{"days":365,"price":1200}]',
    group: 'vip',
    label: '商家VIP价格档位',
    valueType: 'json',
    description: 'JSON数组格式，每项包含days(天数)和price(价格)。示例：[{"days":30,"price":450}]',
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
    key: 'random_browse_fee',
    value: '0.5',
    group: 'task_fee',
    label: '随机浏览服务费',
    valueType: 'number',
    description: '开启随机浏览店铺其他商品的服务费',
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
    key: 'sms_provider',
    value: 'smsbao',
    group: 'sms',
    label: '短信服务商',
    valueType: 'string',
    options: '[{"value":"smsbao","label":"短信宝"},{"value":"aliyun","label":"阿里云"}]',
    description: '选择使用的短信服务商',
  },
  {
    key: 'sms_enabled',
    value: 'false',
    group: 'sms',
    label: '启用短信验证',
    valueType: 'boolean',
  },
  // 短信宝配置（短信宝专用）
  {
    key: 'smsbao_username',
    value: '',
    group: 'sms',
    label: '短信宝用户名',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'smsbao_password',
    value: '',
    group: 'sms',
    label: '短信宝密码',
    valueType: 'string',
    description: '需要填写MD5加密后的密码',
    dependsOn: 'sms_provider:smsbao',
  },
  // 阿里云短信配置（阿里云专用）
  {
    key: 'aliyun_sms_access_key',
    value: '',
    group: 'sms',
    label: '阿里云AccessKeyId',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_sms_access_secret',
    value: '',
    group: 'sms',
    label: '阿里云AccessKeySecret',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_sms_sign_name',
    value: '',
    group: 'sms',
    label: '阿里云短信签名',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  // 短信宝内容模板（短信宝专用）
  {
    key: 'sms_sign',
    value: '任务系统',
    group: 'sms',
    label: '短信签名',
    valueType: 'string',
    description: '短信宝短信签名（阿里云请配置aliyun_sms_sign_name）',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_login',
    value: '【{sign}】您的登录验证码是{code}，5分钟内有效。',
    group: 'sms',
    label: '登录验证码模板',
    valueType: 'string',
    description: '{sign}=签名, {code}=验证码, {time}=有效时间(分钟)',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_register',
    value: '【{sign}】您的注册验证码是{code}，5分钟内有效。',
    group: 'sms',
    label: '注册验证码模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_change_phone',
    value: '【{sign}】您的手机号变更验证码是{code}，5分钟内有效。',
    group: 'sms',
    label: '换绑手机验证码模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_change_password',
    value: '【{sign}】您的密码重置验证码是{code}，5分钟内有效。',
    group: 'sms',
    label: '重置密码验证码模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_verification',
    value: '【{sign}】您的验证码为{code}，非本人操作忽略！',
    group: 'sms',
    label: '通用验证码模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_next_day_task',
    value: '【{sign}】您有编号为{number}的隔天任务等待您继续完成！',
    group: 'sms',
    label: '隔天任务提醒模板',
    valueType: 'string',
    description: '{number}=任务编号',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_timing_task',
    value: '【{sign}】您有编号为{number}的定时任务等待您继续完成！',
    group: 'sms',
    label: '定时任务提醒模板',
    valueType: 'string',
    description: '{number}=任务编号',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_payment_urge',
    value: '【{sign}】您好！请您在一个小时内对您领取的任务完成并付款，否则将取消你的任务，扣除冻结银锭。',
    group: 'sms',
    label: '催促付款模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  {
    key: 'sms_template_payment_reminder',
    value: '【{sign}】您好！请您在一个小时内对您领取的任务完成付款。',
    group: 'sms',
    label: '付款提醒模板',
    valueType: 'string',
    dependsOn: 'sms_provider:smsbao',
  },
  // 阿里云短信模板ID配置（阿里云专用）
  {
    key: 'aliyun_template_login',
    value: '',
    group: 'sms',
    label: '阿里云登录验证码模板ID',
    valueType: 'string',
    description: '阿里云短信模板Code，如 SMS_123456789',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_register',
    value: '',
    group: 'sms',
    label: '阿里云注册验证码模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_change_phone',
    value: '',
    group: 'sms',
    label: '阿里云换绑手机模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_change_password',
    value: '',
    group: 'sms',
    label: '阿里云重置密码模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_verification',
    value: '',
    group: 'sms',
    label: '阿里云通用验证码模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_next_day_task',
    value: '',
    group: 'sms',
    label: '阿里云隔天任务提醒模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_timing_task',
    value: '',
    group: 'sms',
    label: '阿里云定时任务提醒模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_payment_urge',
    value: '',
    group: 'sms',
    label: '阿里云催促付款模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },
  {
    key: 'aliyun_template_payment_reminder',
    value: '',
    group: 'sms',
    label: '阿里云付款提醒模板ID',
    valueType: 'string',
    dependsOn: 'sms_provider:aliyun',
  },

  // 支付设置
  {
    key: 'require_bank_info',
    value: 'true',
    group: 'payment',
    label: '需要填写银行卡信息',
    valueType: 'boolean',
    description: '关闭后用户/商家添加收款账户时只需上传收款码，无需填写银行卡信息',
  },
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
    sortOrder: 1,
  },
  {
    key: 'site_logo',
    value: '',
    group: 'system',
    label: '网站Logo',
    valueType: 'string',
    sortOrder: 2,
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    group: 'system',
    label: '维护模式',
    valueType: 'boolean',
    sortOrder: 3,
  },
  {
    key: 'maintenance_message',
    value: '系统维护中，请稍后访问',
    group: 'system',
    label: '维护提示信息',
    valueType: 'string',
    sortOrder: 4,
  },
  {
    key: 'order_timeout_hours',
    value: '24',
    group: 'system',
    label: '订单超时时间(小时)',
    valueType: 'number',
    sortOrder: 5,
  },
  {
    key: 'task_claim_interval_hours',
    value: '2',
    group: 'system',
    label: '同用户接单间隔(小时)',
    valueType: 'number',
    sortOrder: 6,
  },
  {
    key: 'auto_confirm_days',
    value: '15',
    group: 'system',
    label: '自动确认收货天数',
    valueType: 'number',
    sortOrder: 7,
  },
  {
    key: 'verify_switch',
    value: 'false',
    group: 'system',
    label: '商品核对码验证开关',
    valueType: 'boolean',
    sortOrder: 8,
  },
  {
    key: 'password_check_enabled',
    value: 'false',
    group: 'system',
    label: '商品口令核对开关',
    valueType: 'boolean',
    sortOrder: 9,
  },
  {
    key: 'first_account_vip_days',
    value: '7',
    group: 'system',
    label: '首个买号审核通过赠送VIP天数',
    valueType: 'number',
    sortOrder: 10,
  },
  {
    key: 'star_thresholds',
    value: '{"2":30,"3":60,"4":90,"5":120}',
    group: 'system',
    label: '买号升星阶梯',
    valueType: 'json',
    description: 'JSON格式: {"2":30,"3":60} 表示30单升2星',
    sortOrder: 998,
  },
  {
    key: 'star_price_limits',
    value: '{"1":100,"2":500,"3":1000,"4":2000,"5":99999}',
    group: 'system',
    label: '星级限价',
    valueType: 'json',
    description: 'JSON格式: {"1":100,...} 表示N星最高可接X元任务',
    sortOrder: 999,
  },
  // 提现相关补充
  {
    key: 'user_withdraw_fee_free',
    value: '2',
    group: 'withdrawal',
    label: '买手提现手续费（固定）',
    valueType: 'number',
    description: '金额低于阈值时收取的固定手续费',
  },
  {
    key: 'user_withdraw_fee_threshold',
    value: '100',
    group: 'withdrawal',
    label: '买手免手续费金额阈值',
    valueType: 'number',
    description: '提现金额超过此值免手续费',
  },
  // 注册开关
  {
    key: 'user_registration_enabled',
    value: 'true',
    group: 'register',
    label: '用户注册开关',
    valueType: 'boolean',
    description: '控制用户端注册功能是否开启',
    sortOrder: 0,
  },
  {
    key: 'merchant_registration_enabled',
    value: 'true',
    group: 'register',
    label: '商家注册开关',
    valueType: 'boolean',
    description: '控制商家端注册功能是否开启',
    sortOrder: 1,
  },
  {
    key: 'merchant_referral_enabled',
    value: 'true',
    group: 'register',
    label: '商家邀请推荐功能开关',
    valueType: 'boolean',
    description: '控制商家邀请推荐功能是否开启',
    sortOrder: 2,
  },
];
