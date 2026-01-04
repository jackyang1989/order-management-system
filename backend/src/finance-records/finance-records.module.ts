import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceRecord } from './finance-record.entity';
import { FinanceRecordsService } from './finance-records.service';
import { FinanceRecordsController } from './finance-records.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([FinanceRecord]), AuthModule],
  controllers: [FinanceRecordsController],
  providers: [FinanceRecordsService],
  exports: [FinanceRecordsService],
})
export class FinanceRecordsModule {}
