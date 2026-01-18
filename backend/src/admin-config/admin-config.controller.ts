import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminConfigService } from './admin-config.service';
import { SystemConfig } from './config.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PlatformImageRequirementService } from './platform-image-requirement.service';
import { CreateImageRequirementDto, UpdateImageRequirementDto } from './platform-image-requirement.entity';
import { PlatformService } from './platform.service';

@Controller('admin/config')
@UseGuards(JwtAuthGuard)
export class AdminConfigController {
    constructor(
        private readonly configService: AdminConfigService,
        private readonly imageRequirementService: PlatformImageRequirementService,
        private readonly platformService: PlatformService,
    ) { }

    /**
     * 获取所有配置（按分组）
     */
    @Get()
    async getAllConfigs() {
        const configs = await this.configService.getAllConfigs();
        const groups = this.configService.getGroupsMeta();
        return {
            success: true,
            data: { configs, groups },
        };
    }

    /**
     * 获取指定分组的配置
     */
    @Get('group/:group')
    async getConfigsByGroup(@Param('group') group: string) {
        const configs = await this.configService.getConfigsByGroup(group);
        return {
            success: true,
            data: configs,
        };
    }

    /**
     * 获取分组列表
     */
    @Get('groups')
    async getGroups() {
        return {
            success: true,
            data: this.configService.getGroupsMeta(),
        };
    }

    /**
     * 批量更新配置
     */
    @Put()
    async updateConfigs(
        @Body('configs') configs: { key: string; value: string }[],
    ) {
        const updated = await this.configService.updateConfigs(configs);
        return {
            success: true,
            message: '配置已更新',
            data: updated,
        };
    }

    /**
     * 更新单个配置
     */
    @Put(':key')
    async updateConfig(
        @Param('key') key: string,
        @Body('value') value: string,
    ) {
        const updated = await this.configService.updateConfig(key, value);
        return {
            success: true,
            message: '配置已更新',
            data: updated,
        };
    }

    /**
     * 创建新配置项
     */
    @Post()
    async createConfig(
        @Body() data: Partial<SystemConfig>,
    ) {
        const config = await this.configService.createConfig(data);
        return {
            success: true,
            message: '配置项已创建',
            data: config,
        };
    }

    /**
     * 删除配置项
     */
    @Delete(':key')
    async deleteConfig(@Param('key') key: string) {
        await this.configService.deleteConfig(key);
        return {
            success: true,
            message: '配置项已删除',
        };
    }

    /**
     * 刷新配置缓存
     */
    @Post('refresh-cache')
    async refreshCache() {
        await this.configService.refreshCache();
        return {
            success: true,
            message: '配置缓存已刷新',
        };
    }

    /**
     * 同步默认配置元数据（包括sortOrder）
     */
    @Post('sync-metadata')
    async syncMetadata() {
        await this.configService.ensureDefaultConfigs();
        await this.configService.refreshCache();
        return {
            success: true,
            message: '配置元数据已同步',
        };
    }

    /**
     * 批量更新配置排序
     */
    @Post('update-sort-order')
    async updateSortOrder(
        @Body('orders') orders: { key: string; sortOrder: number }[],
    ) {
        await this.configService.updateSortOrders(orders);
        return {
            success: true,
            message: '排序已更新',
        };
    }
}

/**
 * 公开配置接口（无需登录）
 */
@Controller('admin-config/public')
export class AdminConfigPublicController {
    constructor(private readonly configService: AdminConfigService) { }

    /**
     * 获取注册开关状态（公开接口）
     */
    @Get('register-status')
    async getRegisterStatus() {
        const userEnabled = this.configService.getBooleanValue('user_registration_enabled', true);
        const merchantEnabled = this.configService.getBooleanValue('merchant_registration_enabled', true);

        return {
            success: true,
            data: {
                userRegistrationEnabled: userEnabled,
                merchantRegistrationEnabled: merchantEnabled,
            },
        };
    }
}

/**
 * 系统配置公开接口（无需登录）- 用于前端获取配置
 */
@Controller('system-config/public')
export class SystemConfigPublicController {
    constructor(private readonly configService: AdminConfigService) { }

    /**
     * 获取系统配置（公开接口）
     */
    @Get()
    async getSystemConfig() {
        // 获取所有配置
        const configs = await this.configService.getAllConfigsFlat();

        // 转换为前端期望的格式
        const data = {
            // 注册赠送配置
            userNum: parseFloat(configs['user_register_reward'] || '0'),
            sellerNum: parseFloat(configs['seller_register_reward'] || '0'),
            userVipTime: parseFloat(configs['user_register_vip_days'] || '0'),
            sellerVipTime: parseFloat(configs['seller_register_vip_days'] || '0'),
            // VIP价格配置
            userVip: configs['user_vip_prices'] || '[]',
            sellerVip: configs['seller_vip_prices'] || '[]',
            // 提现相关配置
            userMinMoney: parseFloat(configs['user_min_withdraw'] || '100'),
            sellerMinMoney: parseFloat(configs['seller_min_withdraw'] || '100'),
            userMinReward: parseFloat(configs['user_min_silver_withdraw'] || '100'),
            rewardPrice: parseFloat(configs['silver_to_rmb_rate'] || '1'),
            sellerCashFee: parseFloat(configs['seller_withdraw_fee_rate'] || '0'),
            userCashFree: configs['user_withdraw_fee_rate'] || '0',
            userFeeMaxPrice: configs['user_max_withdraw'] || '50000',
            // 服务费用配置
            unionInterval: parseFloat(configs['union_interval_fee'] || '0.5'),
            goodsMoreFee: parseFloat(configs['goods_more_fee'] || '1'),
            refundServicePrice: parseFloat(configs['refund_service_rate'] || '0.01'),
            timingPay: parseFloat(configs['timing_pay_fee'] || '0.3'),
            timingPublish: parseFloat(configs['timing_publish_fee'] || '0.5'),
            nextDay: parseFloat(configs['next_day_fee'] || '0.5'),
            postage: parseFloat(configs['default_postage'] || '0'),
            rePay: parseFloat(configs['cycle_fee'] || '0.2'),
            randomBrowseFee: parseFloat(configs['random_browse_fee'] || '0.5'),
            addRewardFee: parseFloat(configs['add_reward_fee'] || '0'),
            // 好评费用配置
            praise: parseFloat(configs['text_praise_fee'] || '1'),
            imgPraise: parseFloat(configs['image_praise_fee'] || '2'),
            videoPraise: parseFloat(configs['video_praise_fee'] || '5'),
            // 佣金分成配置
            divided: parseFloat(configs['buyer_commission_rate'] || '1'),
            // 其他配置
            verifySwitch: configs['verify_switch'] === 'true' ? 1 : 0,
            invitationNum: parseFloat(configs['invite_unlock_threshold'] || '10'),
            // 动态业务配置
            starThresholds: configs['star_thresholds'] || '{}',
            starPriceLimits: configs['star_price_limits'] || '{}',
            firstAccountVipDays: parseFloat(configs['first_account_vip_days'] || '7'),
            passwordCheckEnabled: configs['password_check_enabled'] === 'true',
            // 邀请奖励配置
            inviteRewardAmount: parseFloat(configs['referral_reward_per_order'] || '1'),
            inviteMaxOrders: parseFloat(configs['referral_max_count'] || '5'),
            inviteExpiryDays: parseFloat(configs['referral_active_days'] || '30'),
        };

        return {
            success: true,
            data,
        };
    }

    // ==================== 平台截图配置管理 ====================

    /**
     * 获取所有平台及其截图配置
     */
    @Get('platforms/image-requirements')
    async getAllPlatformsWithRequirements() {
        const platforms = await this.platformService.findAll();
        const result = [];

        for (const platform of platforms) {
            const requirements = await this.imageRequirementService.findByPlatform(platform.id);
            result.push({
                platformId: platform.id,
                platformCode: platform.code,
                platformName: platform.name,
                requirements,
            });
        }

        return {
            success: true,
            data: result,
        };
    }

    /**
     * 获取指定平台的截图配置
     */
    @Get('platforms/:platformId/image-requirements')
    async getPlatformImageRequirements(@Param('platformId') platformId: string) {
        const requirements = await this.imageRequirementService.findByPlatform(platformId);
        return {
            success: true,
            data: requirements,
        };
    }

    /**
     * 创建截图配置
     */
    @Post('platforms/:platformId/image-requirements')
    async createImageRequirement(
        @Param('platformId') platformId: string,
        @Body() dto: CreateImageRequirementDto,
    ) {
        dto.platformId = platformId; // 确保platformId正确
        const requirement = await this.imageRequirementService.create(dto);
        return {
            success: true,
            data: requirement,
        };
    }

    /**
     * 更新截图配置
     */
    @Put('image-requirements/:id')
    async updateImageRequirement(
        @Param('id') id: string,
        @Body() dto: UpdateImageRequirementDto,
    ) {
        const requirement = await this.imageRequirementService.update(id, dto);
        return {
            success: true,
            data: requirement,
        };
    }

    /**
     * 删除截图配置
     */
    @Delete('image-requirements/:id')
    async deleteImageRequirement(@Param('id') id: string) {
        await this.imageRequirementService.delete(id);
        return {
            success: true,
            message: '删除成功',
        };
    }
}
