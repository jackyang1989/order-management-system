import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DingdanxiaService } from './dingdanxia.service';
import { DingdanxiaController } from './dingdanxia.controller';
import { ApiConfigController } from './api-config.controller';
import { SystemConfig } from '../system-config/system-config.entity';
import { SystemConfigModule } from '../system-config/system-config.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemConfig]), SystemConfigModule],
  controllers: [DingdanxiaController, ApiConfigController],
  providers: [DingdanxiaService],
  exports: [DingdanxiaService],
})
export class DingdanxiaModule {}
