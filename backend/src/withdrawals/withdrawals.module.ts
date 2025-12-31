import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalsService } from './withdrawals.service';
import { WithdrawalsController } from './withdrawals.controller';
import { Withdrawal } from './withdrawal.entity';
import { BankCardsModule } from '../bank-cards/bank-cards.module';
import { UsersModule } from '../users/users.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Withdrawal]),
        BankCardsModule,
        UsersModule,
        FinanceRecordsModule
    ],
    providers: [WithdrawalsService],
    controllers: [WithdrawalsController],
    exports: [WithdrawalsService]
})
export class WithdrawalsModule { }
