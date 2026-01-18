import { Controller, Get, Param } from '@nestjs/common';
import { PlatformService } from './platform.service';
import { PlatformImageRequirementService } from './platform-image-requirement.service';

/**
 * 公开的平台API（无需认证）
 * 用于前端获取启用的平台列表和截图配置
 */
@Controller('platforms')
export class PlatformPublicController {
    constructor(
        private readonly platformService: PlatformService,
        private readonly imageRequirementService: PlatformImageRequirementService,
    ) { }

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

    /**
     * 获取平台的截图配置
     * 供买号绑定页面动态获取需要上传的截图
     */
    @Get(':platformCode/image-requirements')
    async getImageRequirements(@Param('platformCode') platformCode: string) {
        const requirements = await this.imageRequirementService.findByPlatformCode(platformCode);
        return {
            success: true,
            data: requirements.map(req => ({
                key: req.key,
                label: req.label,
                example: req.exampleImagePath,
                pathHint: req.pathHint,
                required: req.required,
                sortOrder: req.sortOrder,
            })),
        };
    }
}
