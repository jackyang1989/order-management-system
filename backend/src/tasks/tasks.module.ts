import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrdersModule } from '../orders/orders.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { Task } from './task.entity';
import { TaskGoods, TaskWord, SellerTaskPraise } from './task-goods.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task, TaskGoods, TaskWord, SellerTaskPraise]),
        forwardRef(() => OrdersModule),
        forwardRef(() => MerchantsModule)
    ],
    providers: [TasksService],
    controllers: [TasksController],
    exports: [TasksService]
})
export class TasksModule { }
