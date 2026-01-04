import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrdersModule } from '../orders/orders.module';
import { MerchantsModule } from '../merchants/merchants.module';
import { Task } from './task.entity';
// TaskGoods 已迁移到 task-goods 模块
import { TaskGoods, TaskKeyword } from '../task-goods/task-goods.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task, TaskGoods, TaskKeyword]),
    forwardRef(() => OrdersModule),
    forwardRef(() => MerchantsModule),
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService],
})
export class TasksModule {}
