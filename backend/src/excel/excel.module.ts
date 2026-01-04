import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { ExcelService } from './excel.service';
import { ExcelController } from './excel.controller';
import { BatchOperationsModule } from '../batch-operations/batch-operations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Task]), BatchOperationsModule],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {}
