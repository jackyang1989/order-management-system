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
import { CommissionRatesModule } from './commission-rates/commission-rates.module';
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
// 第六批新增模块 - 核心业务增强（暂时禁用有编译问题的模块）
// import { SchedulerModule } from './scheduler/scheduler.module';
// import { QueueModule } from './queue/queue.module';
import { BackupModule } from './backup/backup.module';
// import { TaskDraftsModule } from './task-drafts/task-drafts.module'; // 暂时禁用
// import { PresaleModule } from './presale/presale.module';
// import { ReferralModule } from './referral/referral.module';
// import { PraiseTemplatesModule } from './praise-templates/praise-templates.module';
// 第七批新增模块 - 订单侠API集成
import { DingdanxiaModule } from './dingdanxia/dingdanxia.module';
// 第八批新增模块 - 管理后台配置增强
// import { AdminConfigModule } from './admin-config/admin-config.module'; // 暂时禁用
// 第九批新增模块 - 缓存
import { CacheModule } from './cache/cache.module';
// 第十批新增模块 - 操作日志
import { OperationLogsModule } from './operation-logs/operation-logs.module';
// 第十一批新增模块 - 菜单管理
import { AdminMenusModule } from './admin-menus/admin-menus.module';
// 第十二批新增模块 - VIP会员
import { VipModule } from './vip/vip.module';

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
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
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
    CommissionRatesModule,
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
    // SchedulerModule,
    // QueueModule,
    BackupModule,
    // TaskDraftsModule, // 暂时禁用
    // PresaleModule,
    // ReferralModule,
    // PraiseTemplatesModule,
    // 第七批新增模块 - 订单侠API集成
    DingdanxiaModule,
    // 第八批新增模块 - 管理后台配置增强
    // AdminConfigModule, // 暂时禁用
    // 第九批新增模块 - 缓存
    CacheModule,
    // 第十批新增模块 - 操作日志
    OperationLogsModule,
    // 第十一批新增模块 - 菜单管理
    AdminMenusModule,
    // 第十二批新增模块 - VIP会员
    VipModule,
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
