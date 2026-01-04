import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { ReviewTask } from '../review-tasks/review-task.entity';
import { Goods } from '../goods/goods.entity';
import { GoodsKey, KeywordDetail } from '../keywords/keyword.entity';
import { BatchOperationsService } from './batch-operations.service';
import { BatchOperationsController } from './batch-operations.controller';
import { OrderLogsModule } from '../order-logs/order-logs.module';
import { MessagesModule } from '../messages/messages.module';
import { GoodsService } from '../goods/goods.service';
import { KeywordsService } from '../keywords/keywords.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, Task, ReviewTask, Goods, GoodsKey, KeywordDetail]),
        OrderLogsModule,
        MessagesModule,
    ],
    controllers: [BatchOperationsController],
    providers: [BatchOperationsService, GoodsService, KeywordsService],
    exports: [BatchOperationsService]
})
export class BatchOperationsModule { }
