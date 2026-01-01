import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recharge } from './recharge.entity';
import { RechargeService } from './recharge.service';
import { RechargeController } from './recharge.controller';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';
import { AuthModule } from '../auth/auth.module';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Recharge, User, Merchant]),
        FinanceRecordsModule,
        AuthModule,
    ],
    controllers: [RechargeController],
    providers: [RechargeService],
    exports: [RechargeService],
})
export class RechargeModule { }
