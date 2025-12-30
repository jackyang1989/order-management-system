import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { OrdersModule } from '../orders/orders.module';
import { Task } from './task.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Task]),
        forwardRef(() => OrdersModule)
    ],
    providers: [TasksService],
    controllers: [TasksController],
    exports: [TasksService]
})
export class TasksModule { }
