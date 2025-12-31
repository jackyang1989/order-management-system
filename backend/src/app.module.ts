import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: process.env.DB_USERNAME || '',
      password: process.env.DB_PASSWORD || '',
      database: 'order_management',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
