import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Merchant } from './merchant.entity';
import { MerchantsService } from './merchants.service';
import { MerchantsController } from './merchants.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Merchant]),
        JwtModule.register({
            secret: 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
    ],
    providers: [MerchantsService],
    controllers: [MerchantsController],
    exports: [MerchantsService],
})
export class MerchantsModule { }
