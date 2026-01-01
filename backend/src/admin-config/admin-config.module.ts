import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminConfigService } from './admin-config.service';
import { AdminConfigController } from './admin-config.controller';
import { SystemConfig } from './config.entity';
import { CommissionRate } from './commission-rate.entity';
import { CommissionRateService } from './commission-rate.service';
import { CommissionRateController } from './commission-rate.controller';
import { Platform } from './platform.entity';
import { PlatformService } from './platform.service';
import { PlatformController } from './platform.controller';
import { DeliveryWarehouse } from './delivery-warehouse.entity';
import { DeliveryWarehouseService } from './delivery-warehouse.service';
import { DeliveryWarehouseController } from './delivery-warehouse.controller';
import { VipLevel } from './vip-level.entity';
import { VipLevelService } from './vip-level.service';
import { VipLevelController, VipPublicController } from './vip-level.controller';
import { AdminMenu, AdminRole } from './rbac.entity';
import { RbacService } from './rbac.service';
import { MenuController, RoleController } from './rbac.controller';

@Global()  // 全局模块，便于其他模块注入使用
@Module({
    imports: [
        TypeOrmModule.forFeature([
            SystemConfig,
            CommissionRate,
            Platform,
            DeliveryWarehouse,
            VipLevel,
            AdminMenu,
            AdminRole,
        ]),
    ],
    controllers: [
        AdminConfigController,
        CommissionRateController,
        PlatformController,
        DeliveryWarehouseController,
        VipLevelController,
        VipPublicController,
        MenuController,
        RoleController,
    ],
    providers: [
        AdminConfigService,
        CommissionRateService,
        PlatformService,
        DeliveryWarehouseService,
        VipLevelService,
        RbacService,
    ],
    exports: [
        AdminConfigService,
        CommissionRateService,
        PlatformService,
        DeliveryWarehouseService,
        VipLevelService,
        RbacService,
    ],
})
export class AdminConfigModule { }
