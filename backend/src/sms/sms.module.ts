import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SmsCode, SmsLog } from './sms.entity';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SmsCode, SmsLog])],
    controllers: [SmsController],
    providers: [SmsService],
    exports: [SmsService]
})
export class SmsModule { }
