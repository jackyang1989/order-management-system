import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { Withdrawal } from './withdrawal.entity';
import { Merchant } from '../merchants/merchant.entity';
import { BankCardsModule } from '../bank-cards/bank-cards.module';
import { UsersModule } from '../users/users.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { AdminConfigModule } from '../admin-config/admin-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Withdrawal, Merchant]),
    BankCardsModule,
    UsersModule,
    FinanceRecordsModule,
    AdminConfigModule,
  ],
  providers: [WithdrawalsService],
  controllers: [WithdrawalsController],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
