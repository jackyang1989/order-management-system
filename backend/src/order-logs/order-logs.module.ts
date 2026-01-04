import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderLog } from './order-log.entity';
import { OrderLogsService } from './order-logs.service';
import { OrderLogsController } from './order-logs.controller';

@Module({
  imports: [TypeOrmModule.forFeature([OrderLog])],
  controllers: [OrderLogsController],
  providers: [OrderLogsService],
  exports: [OrderLogsService],
})
export class OrderLogsModule {}
