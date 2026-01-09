import { Module } from '@nestjs/common';
import { MobileCompatController } from './mobile-compat.controller';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { TasksModule } from '../tasks/tasks.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { BuyerAccountsModule } from '../buyer-accounts/buyer-accounts.module';
import { BankCardsModule } from '../bank-cards/bank-cards.module';
import { SmsModule } from '../sms/sms.module';
import { AuthModule } from '../auth/auth.module';
import { DingdanxiaModule } from '../dingdanxia/dingdanxia.module';

/**
 * Mobile 兼容层模块
 *
 * 将原版 ThinkPHP /mobile/* 路由代理到新的 NestJS 服务
 * 这是一个临时兼容层，用于在前端迁移完成前保持系统可用
 */
@Module({
  imports: [
    UsersModule,
    OrdersModule,
    TasksModule,
    WithdrawalsModule,
    FinanceRecordsModule,
    BuyerAccountsModule,
    BankCardsModule,
    SmsModule,
    AuthModule,
    DingdanxiaModule,
  ],
  controllers: [MobileCompatController],
})
export class MobileCompatModule {}
