import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Merchant } from './merchant.entity';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { AuthModule } from '../auth/auth.module';
import { FinanceRecordsModule } from '../finance-records/finance-records.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Merchant]),
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'tfkz-order-management-secret-key-2026',
            signOptions: { expiresIn: '7d' },
        }),
        FinanceRecordsModule,
    ],
    providers: [MerchantsService],
    controllers: [MerchantsController],
    exports: [MerchantsService],
})
export class MerchantsModule { }
