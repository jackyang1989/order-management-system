import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';
import { Task } from '../tasks/task.entity';
import { TaskGoods, TaskKeyword } from '../task-goods/task-goods.entity';
import { Order } from '../orders/order.entity';
import { Withdrawal } from '../withdrawals/withdrawal.entity';
import { FinanceRecord } from '../finance-records/finance-record.entity';

import { ShopsModule } from '../shops/shops.module';
import { AuthModule } from '../auth/auth.module';
import { BuyerAccountsModule } from '../buyer-accounts/buyer-accounts.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { UsersModule } from '../users/users.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Merchant, Task, TaskGoods, TaskKeyword, Order, Withdrawal, FinanceRecord]),
    ShopsModule,
    AuthModule,
    BuyerAccountsModule,
    WithdrawalsModule,
    MerchantsModule,
    UsersModule,
    forwardRef(() => TasksModule),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule { }
