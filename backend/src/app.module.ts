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
import { GoodsModule } from './goods/goods.module';
import { KeywordsModule } from './keywords/keywords.module';
import { TaskGoodsModule } from './task-goods/task-goods.module';
import { FinanceRecordsModule } from './finance-records/finance-records.module';
import { RechargeModule } from './recharge/recharge.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { NoticesModule } from './notices/notices.module';
import { MerchantBankCardsModule } from './merchant-bank-cards/merchant-bank-cards.module';
import { MerchantWithdrawalsModule } from './merchant-withdrawals/merchant-withdrawals.module';
import { UserAddressesModule } from './user-addresses/user-addresses.module';
import { BanksModule } from './banks/banks.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { MessagesModule } from './messages/messages.module';
import { UserInvitesModule } from './user-invites/user-invites.module';
// vip-records import removed
import { OrderLogsModule } from './order-logs/order-logs.module';
import { DayCountsModule } from './day-counts/day-counts.module';
import { UserCreditsModule } from './user-credits/user-credits.module';
import { CategoriesModule } from './categories/categories.module';
import { SmsModule } from './sms/sms.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { SensitiveWordsModule } from './sensitive-words/sensitive-words.module';
import { BatchOperationsModule } from './batch-operations/batch-operations.module';
import { ExcelModule } from './excel/excel.module';
import { BackupModule } from './backup/backup.module';
import { DingdanxiaModule } from './dingdanxia/dingdanxia.module';
import { CacheModule } from './cache/cache.module';
import { OperationLogsModule } from './operation-logs/operation-logs.module';
import { AdminMenusModule } from './admin-menus/admin-menus.module';
import { VipModule } from './vip/vip.module';
import { MerchantBlacklistModule } from './merchant-blacklist/merchant-blacklist.module';
import { MobileCompatModule } from './mobile-compat/mobile-compat.module';
import { CaptchaModule } from './captcha/captcha.module';
import { ReviewsModule } from './reviews/reviews.module';
import { InviteModule } from './invite/invite.module';
import { HelpCenterModule } from './help-center/help-center.module';

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
import {
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
} from './admin-users/admin-user.entity';
// bank-cards
import { BankCard } from './bank-cards/bank-card.entity';
// banks
import { Bank } from './banks/bank.entity';
// buyer-accounts
import { BuyerAccount } from './buyer-accounts/buyer-account.entity';
// categories
import { Category } from './categories/category.entity';
// day-counts
import { UserDayCount, PlatformDayStat } from './day-counts/day-count.entity';
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
import { PaymentCallback, PaymentOrder } from './payments/payment.entity';
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
import {
  SystemConfig as SystemConfigEntity,
  SystemGlobalConfig,
} from './system-config/system-config.entity';
// task-goods
import { TaskGoods, TaskKeyword } from './task-goods/task-goods.entity';
// tasks
import { Task } from './tasks/task.entity';
// uploads
import { UploadedFile, FileGroup } from './uploads/upload.entity';
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
// import {
//   VipRecord,
//   VipLevelConfig,
//   UserVipStatus,
// } from './vip-records/vip-record.entity';
// vip
import { VipPackage, VipPurchase, RechargeOrder } from './vip/vip.entity';
// withdrawals
import { Withdrawal } from './withdrawals/withdrawal.entity';
// help-center
import { HelpArticle } from './help-center/help-article.entity';

// 所有实体的显式列表
const ENTITIES = [
  // admin-config
  CommissionRate,
  SystemConfig,
  DeliveryWarehouse,
  Platform,
  VipLevel,
  // admin-menus
  AdminMenu,
  // admin-users
  AdminUser,
  AdminRole,
  AdminPermission,
  AdminOperationLog,
  // bank-cards
  BankCard,
  // banks
  Bank,
  // buyer-accounts
  BuyerAccount,
  // categories
  Category,
  // day-counts
  UserDayCount,
  PlatformDayStat,
  // deliveries
  Delivery,
  // finance-records
  FinanceRecord,
  // goods
  Goods,
  // keywords
  GoodsKey,
  KeywordDetail,
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
  PaymentCallback,
  PaymentOrder,
  // recharge
  Recharge,
  RewardRecharge,
  // review-tasks
  ReviewTask,
  // sensitive-words
  SensitiveWord,
  // shops
  Shop,
  // sms
  SmsLog,
  // system-config
  SystemConfigEntity,
  SystemGlobalConfig,
  // task-goods
  TaskGoods,
  TaskKeyword,
  // tasks
  Task,
  // uploads
  UploadedFile,
  FileGroup,
  // user-addresses
  UserAddress,
  // user-credits
  UserCredit,
  // user-invites
  UserInvite,
  // users
  User,
  FundRecord,
  // vip-records
  // VipRecord,
  // VipLevelConfig,
  // UserVipStatus,
  // vip
  VipPackage,
  VipPurchase,
  RechargeOrder,
  // withdrawals
  Withdrawal,
  // help-center
  HelpArticle,
];

@Module({
  imports: [
    // 速率限制 - 防止暴力攻击
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 时间窗口 60 秒
        limit: 100, // 每个 IP 每分钟最多 100 次请求
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'order_management',
      // 【重要】显式实体列表 - 禁止使用通配符以防止重复实体加载导致的列膨胀
      entities: ENTITIES,
      synchronize: true,
      logging: process.env.NODE_ENV !== 'production',
      // 生产级连接池配置
      extra: {
        max: parseInt(process.env.DB_POOL_MAX || '20'), // 最大连接数
        min: parseInt(process.env.DB_POOL_MIN || '5'),  // 最小连接数
        idleTimeoutMillis: 30000, // 空闲连接超时 30s
        connectionTimeoutMillis: 5000, // 连接超时 5s
      },
      // 生产环境启用 SSL (如果配置了)
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
    GoodsModule,
    KeywordsModule,
    TaskGoodsModule,
    FinanceRecordsModule,
    RechargeModule,
    AdminUsersModule,
    NoticesModule,
    MerchantBankCardsModule,
    MerchantWithdrawalsModule,
    UserAddressesModule,
    BanksModule,
    DeliveriesModule,
    MessagesModule,
    UserInvitesModule,
    OrderLogsModule,
    DayCountsModule,
    UserCreditsModule,
    CategoriesModule,
    SmsModule,
    PaymentsModule,
    UploadsModule,
    SensitiveWordsModule,
    BatchOperationsModule,
    ExcelModule,
    BackupModule,
    DingdanxiaModule,
    CacheModule,
    OperationLogsModule,
    AdminMenusModule,
    VipModule,
    MerchantBlacklistModule,
    MobileCompatModule,
    CaptchaModule,
    ReviewsModule,
    InviteModule,
    HelpCenterModule,
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
