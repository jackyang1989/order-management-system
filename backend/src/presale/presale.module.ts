import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PresaleService } from './presale.service';
import { PresaleController } from './presale.controller';
import { Order } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { FinanceRecord } from '../finance-records/finance-record.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, Task, User, FinanceRecord])],
    controllers: [PresaleController],
    providers: [PresaleService],
    exports: [PresaleService],
})
export class PresaleModule { }
