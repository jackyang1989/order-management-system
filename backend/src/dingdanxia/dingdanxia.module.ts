import { Module } from '@nestjs/common';
import { DingdanxiaService } from './dingdanxia.service';
import { DingdanxiaController } from './dingdanxia.controller';
import { ApiConfigController } from './api-config.controller';
import { AdminConfigModule } from '../admin-config/admin-config.module';

@Module({
  imports: [AdminConfigModule],
  controllers: [DingdanxiaController, ApiConfigController],
  providers: [DingdanxiaService],
  exports: [DingdanxiaService],
})
export class DingdanxiaModule {}
