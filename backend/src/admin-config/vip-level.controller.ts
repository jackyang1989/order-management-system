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
import { VipLevelService } from './vip-level.service';
import { VipLevel } from './vip-level.entity';

@Controller('admin/vip-levels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class VipLevelController {
    constructor(private readonly vipService: VipLevelService) { }

    /**
     * 获取所有VIP等级
     */
    @Get()
    async findAll(
        @Query('type') type?: 'buyer' | 'merchant',
        @Query('includeInactive') includeInactive?: string,
    ): Promise<{ success: boolean; data: VipLevel[] }> {
        const data = await this.vipService.findAll(type, includeInactive === 'true');
        return { success: true, data };
    }

    /**
     * 获取单个VIP等级
     */
    @Get(':id')
    async findOne(@Param('id') id: string): Promise<{ success: boolean; data: VipLevel }> {
        const data = await this.vipService.findOne(id);
        return { success: true, data };
    }

    /**
     * 创建VIP等级
     */
    @Post()
    async create(@Body() data: Partial<VipLevel>): Promise<{ success: boolean; data: VipLevel }> {
        const result = await this.vipService.create(data);
        return { success: true, data: result };
    }

    /**
     * 更新VIP等级
     */
    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() data: Partial<VipLevel>,
    ): Promise<{ success: boolean; data: VipLevel }> {
        const result = await this.vipService.update(id, data);
        return { success: true, data: result };
    }

    /**
     * 删除VIP等级
     */
    @Delete(':id')
    async remove(@Param('id') id: string): Promise<{ success: boolean }> {
        await this.vipService.remove(id);
        return { success: true };
    }

    /**
     * 切换激活状态
     */
    @Post(':id/toggle')
    async toggleActive(@Param('id') id: string): Promise<{ success: boolean; data: VipLevel }> {
        const result = await this.vipService.toggleActive(id);
        return { success: true, data: result };
    }

    /**
     * 刷新缓存
     */
    @Post('refresh-cache')
    async refreshCache(): Promise<{ success: boolean; message: string }> {
        await this.vipService.refreshCache();
        return { success: true, message: '缓存已刷新' };
    }
}

/**
 * 公共VIP接口（用户查看VIP信息）
 */
@Controller('vip')
export class VipPublicController {
    constructor(private readonly vipService: VipLevelService) { }

    /**
     * 获取买手VIP等级列表
     */
    @Get('buyer/levels')
    async getBuyerLevels(): Promise<{ success: boolean; data: VipLevel[] }> {
        const data = await this.vipService.findAll('buyer');
        return { success: true, data };
    }

    /**
     * 获取商家VIP等级列表
     */
    @Get('merchant/levels')
    async getMerchantLevels(): Promise<{ success: boolean; data: VipLevel[] }> {
        const data = await this.vipService.findAll('merchant');
        return { success: true, data };
    }

    /**
     * 获取升级价格
     */
    @Get('upgrade-price')
    async getUpgradePrice(
        @Query('type') type: 'buyer' | 'merchant',
        @Query('currentLevel') currentLevel: string,
        @Query('targetLevel') targetLevel: string,
    ): Promise<{ success: boolean; price: number }> {
        const price = await this.vipService.getUpgradePrice(
            type,
            parseInt(currentLevel, 10) || 0,
            parseInt(targetLevel, 10) || 1,
        );
        return { success: true, price };
    }
}
