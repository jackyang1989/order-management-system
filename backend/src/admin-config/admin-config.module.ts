import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminConfigService } from './admin-config.service';
import { AdminConfigController, AdminConfigPublicController, SystemConfigPublicController } from './admin-config.controller';
import { SystemConfig } from './config.entity';
import { CommissionRate } from './commission-rate.entity';
import { CommissionRateService } from './commission-rate.service';
import { CommissionRateController } from './commission-rate.controller';
import { Platform } from './platform.entity';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { PlatformPublicController } from './platform-public.controller';
import { EntryType } from './entry-type.entity';
import { EntryTypeService } from './entry-type.service';
import { EntryTypeController } from './entry-type.controller';
import { EntryTypePublicController } from './entry-type-public.controller';
import { DeliveryWarehouse } from './delivery-warehouse.entity';
import { DeliveryWarehouseService } from './delivery-warehouse.service';
import { DeliveryWarehouseController } from './delivery-warehouse.controller';
import { VipLevel } from './vip-level.entity';
import { VipLevelService } from './vip-level.service';
import { VipLevelController } from './vip-level.controller';
import { TablePreference } from './table-preferences.entity';
import { TablePreferencesService } from './table-preferences.service';
import { TablePreferencesController } from './table-preferences.controller';
// rbac.entity.ts 已删除 - AdminMenu 和 AdminRole 现在由 admin-users 和 admin-menus 模块管理

@Global()  // 全局模块，便于其他模块注入使用
@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemConfig,
            CommissionRate,
            Platform,
            EntryType,
            DeliveryWarehouse,
            VipLevel,
            TablePreference,
        ]),
    ],
    controllers: [
        AdminConfigController,
        AdminConfigPublicController,
        SystemConfigPublicController,
        CommissionRateController,
        PlatformController,
        PlatformPublicController,
        EntryTypeController,
        EntryTypePublicController,
        DeliveryWarehouseController,
        VipLevelController,
        TablePreferencesController,
        // VipPublicController 已合并到 VipController (vip模块)
    ],
    providers: [
        AdminConfigService,
        CommissionRateService,
        PlatformService,
        EntryTypeService,
        DeliveryWarehouseService,
        VipLevelService,
        TablePreferencesService,
    ],
    exports: [
        AdminConfigService,
        CommissionRateService,
        PlatformService,
        EntryTypeService,
        DeliveryWarehouseService,
        VipLevelService,
        TablePreferencesService,
    ],
})
export class AdminConfigModule { }
