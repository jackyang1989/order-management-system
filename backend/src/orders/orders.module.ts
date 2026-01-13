import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TasksModule } from '../tasks/tasks.module';
import { BuyerAccountsModule } from '../buyer-accounts/buyer-accounts.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { DingdanxiaModule } from '../dingdanxia/dingdanxia.module';
import { MerchantBlacklistModule } from '../merchant-blacklist/merchant-blacklist.module';
import { ReferralModule } from '../referral/referral.module';
import { MessagesModule } from '../messages/messages.module';
import { TaskGoodsModule } from '../task-goods/task-goods.module';
import { Order } from './order.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Merchant]),
    forwardRef(() => TasksModule),
    BuyerAccountsModule,
    FinanceRecordsModule,
    DingdanxiaModule,
    MerchantBlacklistModule,
    ReferralModule,
    forwardRef(() => MessagesModule),
    TaskGoodsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
