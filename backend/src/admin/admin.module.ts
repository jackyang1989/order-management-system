import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';
import { Task } from '../tasks/task.entity';
import { Order } from '../orders/order.entity';
import { Withdrawal } from '../withdrawals/withdrawal.entity';

import { ShopsModule } from '../shops/shops.module';
import { AuthModule } from '../auth/auth.module';
import { BuyerAccountsModule } from '../buyer-accounts/buyer-accounts.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Merchant, Task, Order, Withdrawal]),
    ShopsModule,
    AuthModule,
    BuyerAccountsModule,
    WithdrawalsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule { }
