import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinanceRecord } from './finance-record.entity';
import { FinanceRecordsService } from './finance-records.service';
import { FinanceRecordsController } from './finance-records.controller';

@Module({
    imports: [TypeOrmModule.forFeature([FinanceRecord])],
    controllers: [FinanceRecordsController],
    providers: [FinanceRecordsService],
    exports: [FinanceRecordsService],
})
export class FinanceRecordsModule { }
