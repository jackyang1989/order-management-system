/**
 * 原版 MySQL 表到新版 PostgreSQL 表的映射配置
 *
 * 原版表前缀: tfkz_
 * 新版使用 TypeORM 自动生成的表名（下划线命名）
 */

// 表名映射: 原版表名 -> 新版表名
export const TABLE_MAPPING: Record<string, string> = {
  // ========== 用户相关 ==========
  'tfkz_users': 'users',                          // 买手用户表
  'tfkz_seller': 'merchants',                     // 商家表
  'tfkz_admin_user': 'admin_users',               // 管理员表

  // ========== 店铺和商品 ==========
  'tfkz_shop': 'shops',                           // 店铺表
  'tfkz_goods': 'goods',                          // 商品表
  'tfkz_goods_key': 'goods_keys',                 // 商品关键词方案表
  'tfkz_goods_key_world': 'goods_key_words',      // 商品关键词表

  // ========== 任务相关 ==========
  'tfkz_seller_task': 'tasks',                    // 商家发布的任务
  'tfkz_user_task': 'orders',                     // 买手接单(订单)
  'tfkz_task_goods': 'task_goods',                // 任务商品关联
  'tfkz_task_word': 'task_words',                 // 任务关键词
  'tfkz_seller_task_praise': 'seller_task_praises', // 商家任务好评设置

  // ========== 追评任务 ==========
  'tfkz_review_task': 'review_tasks',             // 追评任务
  'tfkz_review_task_praise': 'review_task_praises', // 追评任务好评

  // ========== 买手账号相关 ==========
  'tfkz_user_buyno': 'buyer_accounts',            // 买号(旺旺号)
  'tfkz_user_address': 'user_addresses',          // 用户收货地址
  'tfkz_user_bank': 'bank_cards',                 // 买手银行卡
  'tfkz_seller_bank': 'merchant_bank_cards',      // 商家银行卡

  // ========== 财务相关 ==========
  'tfkz_user_deposit_recharge': 'user_deposit_recharges', // 买手押金充值
  'tfkz_user_reward_recharge': 'user_reward_recharges',   // 买手银锭充值
  'tfkz_seller_deposit_recharge': 'merchant_deposit_recharges', // 商家押金充值
  'tfkz_seller_reward_recharge': 'merchant_reward_recharges',   // 商家银锭充值
  'tfkz_user_cash': 'withdrawals',                // 买手提现
  'tfkz_seller_cash': 'merchant_withdrawals',     // 商家提现
  'tfkz_recharge': 'recharges',                   // 充值记录

  // ========== 配置相关 ==========
  'tfkz_system': 'system_global_configs',         // 系统配置
  'tfkz_commission': 'commission_rates',          // 佣金比例
  'tfkz_bank': 'banks',                           // 银行列表
  'tfkz_delivery': 'deliveries',                  // 快递公司

  // ========== 消息公告 ==========
  'tfkz_message': 'messages',                     // 消息
  'tfkz_notice': 'notices',                       // 公告

  // ========== 其他 ==========
  'tfkz_seller_limit': 'merchant_blacklist',      // 商家黑名单
  'tfkz_vip_record': 'vip_records',               // VIP记录
  'tfkz_user_invited': 'user_invites',            // 邀请记录
  'tfkz_admin_log': 'operation_logs',             // 操作日志
  'tfkz_admin_menu': 'admin_menus',               // 后台菜单
  'tfkz_admin_menu_role': 'admin_menu_roles',     // 菜单角色关联
  'tfkz_admin_role': 'admin_roles',               // 管理员角色
  'tfkz_set_tips': 'system_tips',                 // 前台提示设置
};

// 字段映射: 原版字段名 -> 新版字段名 (通用映射)
export const COMMON_FIELD_MAPPING: Record<string, string> = {
  'create_time': 'createdAt',
  'update_time': 'updatedAt',
  'delete_time': 'deletedAt',
  'user_id': 'userId',
  'seller_id': 'merchantId',  // 商家ID统一改名
  'shop_id': 'shopId',
  'goods_id': 'goodsId',
  'task_id': 'taskId',
  'admin_id': 'adminId',
  'state': 'status',          // 状态字段统一
};

// 每个表的特殊字段映射
export const TABLE_FIELD_MAPPING: Record<string, Record<string, string>> = {
  'tfkz_users': {
    'username': 'username',
    'password': 'password',
    'mobile': 'phone',
    'qq': 'qq',
    'vip': 'isVip',
    'vip_time': 'vipExpireTime',
    'deposit': 'balance',       // 押金/本金
    'reward': 'silver',         // 银锭/礼金
    'frozen_deposit': 'frozenBalance',
    'frozen_reward': 'frozenSilver',
    'invite_code': 'inviteCode',
    'tjuser': 'referrerId',     // 推荐人
    'note': 'remark',
    'state': 'status',
  },

  'tfkz_seller': {
    'seller_name': 'merchantName',
    'login_pwd': 'password',
    'mobile': 'phone',
    'qq': 'qq',
    'vip': 'isVip',
    'vip_time': 'vipExpireTime',
    'balance': 'balance',       // 押金
    'reward': 'silver',         // 银锭
    'frozen_balance': 'frozenBalance',
    'frozen_reward': 'frozenSilver',
    'invite_code': 'inviteCode',
    'tjuser': 'referrerId',
    'note': 'remark',
    'state': 'status',
  },

  'tfkz_shop': {
    'seller_id': 'merchantId',
    'shop_name': 'shopName',
    'shop_type': 'shopType',
    'shop_logo': 'logoUrl',
    'shop_wangwang': 'wangwangId',
    'shop_link': 'shopUrl',
    'seller_name': 'sellerName',
    'seller_phone': 'sellerPhone',
    'seller_address': 'sellerAddress',
    'express_name': 'expressName',
    'express_code': 'expressCode',
    'logistics': 'needLogistics',
    'code': 'warehouseCode',
    'state': 'status',
  },

  'tfkz_goods': {
    'seller_id': 'merchantId',
    'shop_id': 'shopId',
    'goods_name': 'goodsName',
    'goods_link': 'goodsUrl',
    'goods_img': 'goodsImage',
    'goods_price': 'price',
    'goods_num': 'stock',
    'goods_sku': 'skuInfo',
    'state': 'status',
  },

  'tfkz_seller_task': {
    'task_number': 'taskNumber',
    'seller_id': 'merchantId',
    'shop_id': 'shopId',
    'goods_id': 'goodsId',
    'goods_unit_price': 'goodsPrice',
    'goods_num': 'quantity',
    'num': 'totalCount',
    'rest_num': 'remainingCount',
    'principal': 'principal',
    'commission': 'commission',
    'time_interval': 'timeInterval',
    'time_for': 'scheduledTime',
    'task_type': 'taskType',
    'searchkeyword': 'searchKeyword',
    'search_sort': 'searchSort',
    'payword': 'payKeyword',
    'goods_type': 'goodsCategory',
    'talk': 'talkContent',
    'shipping_address': 'shippingAddress',
    'state': 'status',
    'pause_state': 'pauseStatus',
  },

  'tfkz_user_task': {
    'task_number': 'taskNumber',
    'user_id': 'userId',
    'seller_id': 'merchantId',
    'shop_id': 'shopId',
    'seller_task_id': 'taskId',
    'user_buyno_id': 'buyerAccountId',
    'user_buyno_wangwang': 'wangwangId',
    'principal': 'principal',
    'commission': 'commission',
    'user_principal': 'userPrincipal',
    'seller_principal': 'merchantPrincipal',
    'terminal': 'terminal',
    'delivery': 'expressCompany',
    'delivery_num': 'expressNumber',
    'delivery_status': 'deliveryStatus',
    'delivery_state': 'deliveryState',
    'delivery_time': 'deliveryTime',
    'sign_for_time': 'signTime',
    'complete_time': 'completeTime',
    'cancel_time': 'cancelTime',
    'table_order_id': 'taobaoOrderId',
    'consignee': 'consignee',
    'address': 'address',
    'state': 'status',
    'keywordimg': 'keywordImage',
    'chatimg': 'chatImage',
    'order_detail_img': 'orderDetailImage',
    'high_praise_img': 'praiseImage',
  },

  'tfkz_user_buyno': {
    'wwid': 'accountName',
    'wwpro': 'wangwangProvince',
    'wwcity': 'wangwangCity',
    'wwdaimg': 'archiveImage',
    'ipimg': 'ipImage',
    'addressname': 'receiverName',
    'addresspro': 'province',
    'addresscity': 'city',
    'addressarea': 'district',
    'addresstext': 'addressRemark',
    'addressphone': 'receiverPhone',
    'alipayname': 'alipayName',
    'idcardimg': 'idCardImage',
    'alipayimg': 'alipayImage',
    'detail_address': 'fullAddress',
    'star': 'star',
    'frozen_time': 'frozenTime',
    'note': 'rejectReason',
    'state': 'status',
    'uid': 'userId',
    'creat_time': 'createdAt',
  },

  'tfkz_review_task': {
    'task_number': 'taskNumber',
    'seller_id': 'merchantId',
    'shop_id': 'shopId',
    'task_id': 'originalTaskId',
    'order_id': 'orderId',
    'user_id': 'userId',
    'user_wangwang': 'wangwangId',
    'user_money': 'userCommission',
    'seller_money': 'merchantFee',
    'pay_type': 'payType',
    'praise_img': 'praiseImage',
    'examine_time': 'reviewedAt',
    'complete_time': 'completedAt',
    'state': 'status',
  },

  'tfkz_seller_limit': {
    'seller_id': 'sellerId',
    'wangwang': 'accountName',
    'state': 'type',
    'status': 'status',
    'end_time': 'endTime',
    'remarks': 'reason',
  },

  'tfkz_message': {
    'type': 'receiverType',
    'title': 'title',
    'content': 'content',
    'look': 'status',
    'user_id': 'receiverId',
    'state': 'publishStatus',
    'author': 'author',
    'admin_id': 'senderId',
  },

  'tfkz_notice': {
    'title': 'title',
    'content': 'content',
    'state': 'status',
    'admin_id': 'adminId',
    'type': 'targetType',
  },

  'tfkz_system': {
    'user_vip_money': 'buyerVipPrice',
    'seller_vip_money': 'merchantVipPrice',
    'user_service_charge': 'buyerWithdrawFee',
    'seller_service_charge': 'merchantWithdrawFee',
    'seller_task_service': 'merchantTaskFee',
    'user_min_cash': 'buyerMinWithdraw',
    'seller_min_cash': 'merchantMinWithdraw',
    'pay_award': 'rechargeReward',
    'register_give': 'registerGift',
    'buyer_invite': 'buyerInviteReward',
    'seller_invite': 'merchantInviteReward',
    'task_pass': 'taskAutoPass',
    'pass_time': 'taskPassTime',
  },

  'tfkz_commission': {
    'max_goods_price': 'maxGoodsPrice',
    'user_reward': 'buyerReward',
    'seller_reward': 'merchantFee',
  },

  'tfkz_user_bank': {
    'user_id': 'userId',
    'bank_id': 'bankId',
    'bank_user': 'accountName',
    'bank_no': 'cardNumber',
    'mobile': 'phone',
    'province': 'province',
    'city': 'city',
    'branch_name': 'branchName',
    'idcard': 'idCard',
    'idcard_img_a': 'idCardFrontImage',
    'idcard_img_b': 'idCardBackImage',
    'remarks': 'rejectReason',
    'state': 'status',
  },

  'tfkz_seller_bank': {
    'seller_id': 'merchantId',
    'bank_id': 'bankId',
    'bank_user': 'accountName',
    'bank_no': 'cardNumber',
    'mobile': 'phone',
    'province': 'province',
    'city': 'city',
    'branch_name': 'branchName',
    'idcard': 'idCard',
    'idcard_img_a': 'idCardFrontImage',
    'idcard_img_b': 'idCardBackImage',
    'remarks': 'rejectReason',
    'state': 'status',
  },

  'tfkz_vip_record': {
    'uid': 'userId',
    'type': 'userType',
    'vip_time': 'duration',
    'vip_money': 'price',
    'pay_money': 'paidAmount',
    'from_type': 'paymentType',
  },

  'tfkz_recharge': {
    'uid': 'userId',
    'type': 'userType',
    'pay_type': 'paymentMethod',
    'pay_money': 'amount',
    'out_trade_no': 'outTradeNo',
    'trade_no': 'tradeNo',
    'pay_state': 'status',
    'from_type': 'rechargeType',
  },
};

// ID 映射缓存 (原版整数ID -> 新版UUID)
export interface IdMappingCache {
  users: Map<number, string>;
  merchants: Map<number, string>;
  shops: Map<number, string>;
  goods: Map<number, string>;
  tasks: Map<number, string>;
  orders: Map<number, string>;
  buyerAccounts: Map<number, string>;
  bankCards: Map<number, string>;
  merchantBankCards: Map<number, string>;
  banks: Map<number, string>;
  adminUsers: Map<number, string>;
  reviewTasks: Map<number, string>;
}

// 创建空的ID映射缓存
export function createIdMappingCache(): IdMappingCache {
  return {
    users: new Map(),
    merchants: new Map(),
    shops: new Map(),
    goods: new Map(),
    tasks: new Map(),
    orders: new Map(),
    buyerAccounts: new Map(),
    bankCards: new Map(),
    merchantBankCards: new Map(),
    banks: new Map(),
    adminUsers: new Map(),
    reviewTasks: new Map(),
  };
}

// 需要跳过的表（备份表、测试表等）
export const SKIP_TABLES = [
  'tfkz_user_back',       // 买手备份表
  'tfkz_seller_back',     // 商家备份表
  'tfkz_test',            // 测试表
];

// 迁移顺序（按依赖关系排序）
export const MIGRATION_ORDER = [
  // 1. 基础配置表（无外键依赖）
  'tfkz_bank',
  'tfkz_delivery',
  'tfkz_system',
  'tfkz_commission',
  'tfkz_admin_role',
  'tfkz_set_tips',

  // 2. 用户表
  'tfkz_admin_user',
  'tfkz_users',
  'tfkz_seller',

  // 3. 依赖用户的表
  'tfkz_shop',
  'tfkz_user_address',
  'tfkz_user_bank',
  'tfkz_seller_bank',
  'tfkz_user_buyno',
  'tfkz_seller_limit',

  // 4. 依赖店铺的表
  'tfkz_goods',
  'tfkz_goods_key',
  'tfkz_goods_key_world',

  // 5. 任务表
  'tfkz_seller_task',
  'tfkz_task_goods',
  'tfkz_task_word',
  'tfkz_seller_task_praise',

  // 6. 订单表（依赖任务）
  'tfkz_user_task',

  // 7. 追评任务（依赖订单）
  'tfkz_review_task',
  'tfkz_review_task_praise',

  // 8. 财务表
  'tfkz_recharge',
  'tfkz_user_deposit_recharge',
  'tfkz_user_reward_recharge',
  'tfkz_seller_deposit_recharge',
  'tfkz_seller_reward_recharge',
  'tfkz_user_cash',
  'tfkz_seller_cash',
  'tfkz_vip_record',

  // 9. 其他表
  'tfkz_message',
  'tfkz_notice',
  'tfkz_admin_menu',
  'tfkz_admin_menu_role',
  'tfkz_admin_log',
  'tfkz_user_invited',
];
