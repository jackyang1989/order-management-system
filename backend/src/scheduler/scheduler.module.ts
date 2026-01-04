import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { Order } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { FinanceRecord } from '../finance-records/finance-record.entity';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Order, Task, FinanceRecord, Merchant, User]),
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
