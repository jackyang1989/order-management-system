import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TasksModule } from './tasks/tasks.module';
import { OrdersModule } from './orders/orders.module';
import { BuyerAccountsModule } from './buyer-accounts/buyer-accounts.module';
import { BankCardsModule } from './bank-cards/bank-cards.module';
import { WithdrawalsModule } from './withdrawals/withdrawals.module';
import { MerchantsModule } from './merchants/merchants.module';
import { ReviewTasksModule } from './review-tasks/review-tasks.module';
import { AdminModule } from './admin/admin.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { ShopsModule } from './shops/shops.module';
// 新增模块
import { GoodsModule } from './goods/goods.module';
import { KeywordsModule } from './keywords/keywords.module';
import { TaskGoodsModule } from './task-goods/task-goods.module';
import { FinanceRecordsModule } from './finance-records/finance-records.module';
import { RechargeModule } from './recharge/recharge.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { NoticesModule } from './notices/notices.module';
// 第二批新增模块
import { MerchantBankCardsModule } from './merchant-bank-cards/merchant-bank-cards.module';
import { MerchantWithdrawalsModule } from './merchant-withdrawals/merchant-withdrawals.module';
import { UserAddressesModule } from './user-addresses/user-addresses.module';
import { BanksModule } from './banks/banks.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { MessagesModule } from './messages/messages.module';
import { UserInvitesModule } from './user-invites/user-invites.module';
import { VipRecordsModule } from './vip-records/vip-records.module';
// 第三批新增模块
import { OrderLogsModule } from './order-logs/order-logs.module';
import { DayCountsModule } from './day-counts/day-counts.module';
import { UserCreditsModule } from './user-credits/user-credits.module';
import { CategoriesModule } from './categories/categories.module';
// 第四批新增模块
import { SmsModule } from './sms/sms.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { SensitiveWordsModule } from './sensitive-words/sensitive-words.module';
// 第五批新增模块 - 批量操作和Excel导入导出
import { BatchOperationsModule } from './batch-operations/batch-operations.module';
import { ExcelModule } from './excel/excel.module';
// 第六批新增模块 - 核心业务增强
import { BackupModule } from './backup/backup.module';
// 第七批新增模块 - 订单侠API集成
import { DingdanxiaModule } from './dingdanxia/dingdanxia.module';
// 第九批新增模块 - 缓存
import { CacheModule } from './cache/cache.module';
// 第十批新增模块 - 操作日志
import { OperationLogsModule } from './operation-logs/operation-logs.module';
// 第十一批新增模块 - 菜单管理
import { AdminMenusModule } from './admin-menus/admin-menus.module';
// 第十二批新增模块 - VIP会员
import { VipModule } from './vip/vip.module';
// 第十三批新增模块 - 商家黑名单
import { MerchantBlacklistModule } from './merchant-blacklist/merchant-blacklist.module';

// ============ 显式实体引入（禁止使用通配符加载）============
// admin-config
import { CommissionRate } from './admin-config/commission-rate.entity';
import { SystemConfig } from './admin-config/config.entity';
import { DeliveryWarehouse } from './admin-config/delivery-warehouse.entity';
import { Platform } from './admin-config/platform.entity';
import { VipLevel } from './admin-config/vip-level.entity';
// admin-menus
import { AdminMenu } from './admin-menus/admin-menu.entity';
// admin-users
import { AdminUser, AdminRole, AdminPermission, AdminOperationLog } from './admin-users/admin-user.entity';
// bank-cards
import { BankCard } from './bank-cards/bank-card.entity';
// banks
import { Bank } from './banks/bank.entity';
// buyer-accounts
import { BuyerAccount } from './buyer-accounts/buyer-account.entity';
// categories
import { Category } from './categories/category.entity';
// day-counts
import { DayCount } from './day-counts/day-count.entity';
// deliveries
import { Delivery } from './deliveries/delivery.entity';
// finance-records
import { FinanceRecord } from './finance-records/finance-record.entity';
// goods
import { Goods } from './goods/goods.entity';
// keywords
import { GoodsKey, KeywordDetail } from './keywords/keyword.entity';
// merchant-bank-cards
import { MerchantBankCard } from './merchant-bank-cards/merchant-bank-card.entity';
// merchant-blacklist
import { MerchantBlacklist } from './merchant-blacklist/merchant-blacklist.entity';
// merchant-withdrawals
import { MerchantWithdrawal } from './merchant-withdrawals/merchant-withdrawal.entity';
// merchants
import { Merchant } from './merchants/merchant.entity';
// messages
import { Message } from './messages/message.entity';
// notices
import { Notice } from './notices/notice.entity';
// operation-logs
import { OperationLog } from './operation-logs/operation-log.entity';
// order-logs
import { OrderLog } from './order-logs/order-log.entity';
// orders
import { Order } from './orders/order.entity';
// payments
import { Payment } from './payments/payment.entity';
// recharge
import { Recharge } from './recharge/recharge.entity';
import { RewardRecharge } from './recharge/reward-recharge.entity';
// review-tasks
import { ReviewTask } from './review-tasks/review-task.entity';
// sensitive-words
import { SensitiveWord } from './sensitive-words/sensitive-word.entity';
// shops
import { Shop } from './shops/shop.entity';
// sms
import { SmsLog } from './sms/sms.entity';
// system-config
import { SystemConfiguration } from './system-config/system-config.entity';
// task-goods
import { TaskGoods, TaskKeyword } from './task-goods/task-goods.entity';
// tasks
import { Task } from './tasks/task.entity';
// uploads
import { Upload } from './uploads/upload.entity';
// user-addresses
import { UserAddress } from './user-addresses/user-address.entity';
// user-credits
import { UserCredit } from './user-credits/user-credit.entity';
// user-invites
import { UserInvite } from './user-invites/user-invite.entity';
// users
import { User } from './users/user.entity';
import { FundRecord } from './users/fund-record.entity';
// vip-records
import { VipRecord, VipLevelConfig, UserVipStatus } from './vip-records/vip-record.entity';
// vip
import { VipPackage, VipPurchase, RechargeOrder } from './vip/vip.entity';
// withdrawals
import { Withdrawal } from './withdrawals/withdrawal.entity';

// 所有实体的显式列表
const ENTITIES = [
  // admin-config
  CommissionRate, SystemConfig, DeliveryWarehouse, Platform, VipLevel,
  // admin-menus
  AdminMenu,
  // admin-users
  AdminUser, AdminRole, AdminPermission, AdminOperationLog,
  // bank-cards
  BankCard,
  // banks
  Bank,
  // buyer-accounts
  BuyerAccount,
  // categories
  Category,
  // day-counts
  DayCount,
  // deliveries
  Delivery,
  // finance-records
  FinanceRecord,
  // goods
  Goods,
  // keywords
  GoodsKey, KeywordDetail,
  // merchant-bank-cards
  MerchantBankCard,
  // merchant-blacklist
  MerchantBlacklist,
  // merchant-withdrawals
  MerchantWithdrawal,
  // merchants
  Merchant,
  // messages
  Message,
  // notices
  Notice,
  // operation-logs
  OperationLog,
  // order-logs
  OrderLog,
  // orders
  Order,
  // payments
  Payment,
  // recharge
  Recharge, RewardRecharge,
  // review-tasks
  ReviewTask,
  // sensitive-words
  SensitiveWord,
  // shops
  Shop,
  // sms
  SmsLog,
  // system-config
  SystemConfiguration,
  // task-goods
  TaskGoods, TaskKeyword,
  // tasks
  Task,
  // uploads
  Upload,
  // user-addresses
  UserAddress,
  // user-credits
  UserCredit,
  // user-invites
  UserInvite,
  // users
  User, FundRecord,
  // vip-records
  VipRecord, VipLevelConfig, UserVipStatus,
  // vip
  VipPackage, VipPurchase, RechargeOrder,
  // withdrawals
  Withdrawal,
];

@Module({
  imports: [
    // 速率限制 - 防止暴力攻击
    ThrottlerModule.forRoot([{
      ttl: 60000,    // 时间窗口 60 秒
      limit: 100,    // 每个 IP 每分钟最多 100 次请求
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'order_management',
      // 【重要】显式实体列表 - 禁止使用通配符以防止重复实体加载导致的列膨胀
      entities: ENTITIES,
      synchronize: false, // 生产环境必须为 false
      logging: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    TasksModule,
    OrdersModule,
    BuyerAccountsModule,
    BankCardsModule,
    WithdrawalsModule,
    MerchantsModule,
    ReviewTasksModule,
    AdminModule,
    SystemConfigModule,
    ShopsModule,
    // 新增模块
    GoodsModule,
    KeywordsModule,
    TaskGoodsModule,
    FinanceRecordsModule,
    RechargeModule,
    AdminUsersModule,
    NoticesModule,
    // 第二批新增模块
    MerchantBankCardsModule,
    MerchantWithdrawalsModule,
    UserAddressesModule,
    BanksModule,
    DeliveriesModule,
    MessagesModule,
    UserInvitesModule,
    VipRecordsModule,
    // 第三批新增模块
    OrderLogsModule,
    DayCountsModule,
    UserCreditsModule,
    CategoriesModule,
    // 第四批新增模块
    SmsModule,
    PaymentsModule,
    UploadsModule,
    SensitiveWordsModule,
    // 第五批新增模块 - 批量操作和Excel导入导出
    BatchOperationsModule,
    ExcelModule,
    // 第六批新增模块 - 核心业务增强
    BackupModule,
    // 第七批新增模块 - 订单侠API集成
    DingdanxiaModule,
    // 第九批新增模块 - 缓存
    CacheModule,
    // 第十批新增模块 - 操作日志
    OperationLogsModule,
    // 第十一批新增模块 - 菜单管理
    AdminMenusModule,
    // 第十二批新增模块 - VIP会员
    VipModule,
    // 第十三批新增模块 - 商家黑名单
    MerchantBlacklistModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // 全局启用速率限制
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
