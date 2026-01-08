import { Controller, Get } from '@nestjs/common';
import { PlatformService } from './platform.service';

/**
 * 公开的平台API（无需认证）
 * 用于前端获取启用的平台列表
 */
@Controller('platforms')
export class PlatformPublicController {
    constructor(private readonly platformService: PlatformService) { }

    /**
     * 获取所有启用的平台
     */
    @Get()
    async getActivePlatforms() {
        const platforms = await this.platformService.findAll(true);
        return {
            success: true,
            data: platforms.map(p => ({
                id: p.id,
                code: p.code,
                name: p.name,
                icon: p.icon,
                color: p.color,
                baseFeeRate: p.baseFeeRate,
                supportsTkl: p.supportsTkl,
                sortOrder: p.sortOrder,
            })),
        };
    }
}
