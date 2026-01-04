import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { ReviewTask } from '../review-tasks/review-task.entity';
import { Goods } from '../goods/goods.entity';
import { GoodsKey, KeywordDetail } from '../keywords/keyword.entity';
import { Withdrawal } from '../withdrawals/withdrawal.entity';
import { MerchantWithdrawal } from '../merchant-withdrawals/merchant-withdrawal.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';
import { BatchOperationsService } from './batch-operations.service';
import { BatchOperationsController } from './batch-operations.controller';
import { OrderLogsModule } from '../order-logs/order-logs.module';
import { MessagesModule } from '../messages/messages.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { GoodsService } from '../goods/goods.service';
import { KeywordsService } from '../keywords/keywords.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, Task, ReviewTask, Goods, GoodsKey, KeywordDetail, Withdrawal, MerchantWithdrawal, User, Merchant]),
        OrderLogsModule,
        MessagesModule,
        FinanceRecordsModule,
    ],
    controllers: [BatchOperationsController],
    providers: [BatchOperationsService, GoodsService, KeywordsService],
    exports: [BatchOperationsService]
})
export class BatchOperationsModule { }
