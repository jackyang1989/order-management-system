import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { DeliveryWarehouseService } from './delivery-warehouse.service';
import { DeliveryWarehouse } from './delivery-warehouse.entity';

@Controller('admin/deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class DeliveryWarehouseController {
    constructor(private readonly deliveryService: DeliveryWarehouseService) { }

    /**
     * 获取所有快递公司
     */
    @Get()
    async findAll(
        @Query('includeInactive') includeInactive?: string,
    ): Promise<DeliveryWarehouse[]> {
        return this.deliveryService.findAll(includeInactive === 'true');
    }

    /**
     * 获取单个快递公司
     */
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<DeliveryWarehouse> {
        return this.deliveryService.findOne(id);
    }

    /**
     * 创建快递公司
     */
    @Post()
    async create(@Body() data: Partial<DeliveryWarehouse>): Promise<DeliveryWarehouse> {
        return this.deliveryService.create(data);
    }

    /**
     * 更新快递公司
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: Partial<DeliveryWarehouse>,
    ): Promise<DeliveryWarehouse> {
        return this.deliveryService.update(id, data);
    }

    /**
     * 删除快递公司
     */
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ success: boolean }> {
        await this.deliveryService.remove(id);
        return { success: true };
    }

    /**
     * 切换激活状态
     */
    @Post(':id/toggle')
    async toggleActive(@Param('id') id: string): Promise<DeliveryWarehouse> {
        return this.deliveryService.toggleActive(id);
    }

    /**
     * 批量更新排序
     */
    @Put('batch/sort')
    async updateSortOrder(
        @Body() items: { id: string; sortOrder: number }[],
    ): Promise<{ success: boolean }> {
        await this.deliveryService.updateSortOrder(items);
        return { success: true };
    }
}
