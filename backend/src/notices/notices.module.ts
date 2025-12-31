import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice, NoticeRead } from './notice.entity';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Notice, NoticeRead])],
    controllers: [NoticesController],
    providers: [NoticesService],
    exports: [NoticesService]
})
export class NoticesModule { }
