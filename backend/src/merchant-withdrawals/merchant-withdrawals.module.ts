import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MerchantWithdrawal } from './merchant-withdrawal.entity';
import { MerchantWithdrawalsService } from './merchant-withdrawals.service';
import { MerchantWithdrawalsController } from './merchant-withdrawals.controller';
import { MerchantBankCardsModule } from '../merchant-bank-cards/merchant-bank-cards.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { Merchant } from '../merchants/merchant.entity';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MerchantWithdrawal, Merchant]),
    MerchantBankCardsModule,
    FinanceRecordsModule,
    SystemConfigModule,
  ],
  controllers: [MerchantWithdrawalsController],
  providers: [MerchantWithdrawalsService],
  exports: [MerchantWithdrawalsService],
})
export class MerchantWithdrawalsModule { }
