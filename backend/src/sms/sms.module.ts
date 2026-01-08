import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsCode, SmsLog } from './sms.entity';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { AdminConfigModule } from '../admin-config/admin-config.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SmsCode, SmsLog]),
    AdminConfigModule,
  ],
  controllers: [SmsController],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
