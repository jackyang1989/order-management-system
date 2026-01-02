import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfig, SystemGlobalConfig } from './system-config.entity';
import { SystemConfigService } from './system-config.service';
import { SystemConfigController } from './system-config.controller';

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfig, SystemGlobalConfig])],
    providers: [SystemConfigService],
    controllers: [SystemConfigController],
    exports: [SystemConfigService],
})
export class SystemConfigModule { }
