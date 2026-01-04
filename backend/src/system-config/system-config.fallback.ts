/**
 * 系统配置兜底值
 * 当数据库配置未读取到时，使用此默认值
 * 后续 DB 配置直接覆盖，不改代码
 */
export const SYSTEM_CONFIG_FALLBACK = {
  // 注册赠送VIP天数
  REGISTER_VIP_DAYS: 365,

  // 注册赠送银锭数量
  REGISTER_SILVER: 1,

  // 接单扣除银锭数量（押金）
  TASK_SILVER_COST: 1,

  // 月度任务上限
  MONTH_TASK_LIMIT: 220,

  // 买号星级金额限制（单位：元）
  // 星级 -> 最大可接任务商品价格
  BUYNO_STAR_LIMITS: {
    1: 100, // 1星：100元以下
    2: 500, // 2星：500元以下
    3: 1000, // 3星：1000元以下
    4: 2000, // 4星：2000元以下
    // 5星：无限制
  } as Record<number, number>,

  // 提现手续费配置
  WITHDRAW_FEE: {
    // 本金提现：小于等于此金额收1元手续费，超出免费
    PRINCIPAL_THRESHOLD: 100,
    PRINCIPAL_FEE: 1,

    // 银锭提现：按比例收取（例如 0.05 = 5%）
    SILVER_RATE: 0.05,
  },

  // 接单间隔时间（分钟）
  TASK_INTERVAL_MINUTES: 5,

  // 新用户免费VIP时长配置key
  CONFIG_KEYS: {
    USER_VIP_TIME: 'user_vip_time',
    REWARD_PRICE: 'reward_price',
    USER_FEE_MAX_PRICE: 'user_fee_max_price',
    LIMIT_MOBILE: 'limit_mobile',
  },
};
