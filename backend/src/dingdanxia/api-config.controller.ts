import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SystemConfigService } from '../system-config/system-config.service';
import { DingdanxiaService } from './dingdanxia.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/api-config')
@UseGuards(JwtAuthGuard)
export class ApiConfigController {
    constructor(
        private configService: SystemConfigService,
        private dingdanxiaService: DingdanxiaService,
    ) { }

    /**
     * 获取所有第三方 API 配置
     */
    @Get()
    async getApiConfigs() {
        const dingdanxiaKey = await this.configService.getValue('dingdanxia_api_key');
        const dingdanxiaEnabled = await this.configService.getValue('dingdanxia_enabled');

        return {
            success: true,
            data: {
                dingdanxia: {
                    apiKey: dingdanxiaKey ? this.maskApiKey(dingdanxiaKey) : null,
                    enabled: dingdanxiaEnabled === 'true',
                    hasKey: !!dingdanxiaKey,
                },
            },
        };
    }

    /**
     * 更新订单侠 API 配置
     */
    @Put('dingdanxia')
    async updateDingdanxiaConfig(
        @Body() data: { apiKey?: string; enabled?: boolean },
    ) {
        const updates: { key: string; value: string; group: string }[] = [];

        if (data.apiKey !== undefined) {
            updates.push({
                key: 'dingdanxia_api_key',
                value: data.apiKey,
                group: 'api',
            });
        }

        if (data.enabled !== undefined) {
            updates.push({
                key: 'dingdanxia_enabled',
                value: data.enabled ? 'true' : 'false',
                group: 'api',
            });
        }

        if (updates.length > 0) {
            await this.configService.updateMany(updates);
        }

        return {
            success: true,
            message: '订单侠 API 配置已更新',
        };
    }

    /**
     * 测试订单侠 API 连接
     */
    @Get('dingdanxia/test')
    async testDingdanxiaApi() {
        const isConfigured = await this.dingdanxiaService.isConfigured();
        if (!isConfigured) {
            return {
                success: false,
                message: 'API Key 未配置',
            };
        }

        // 使用一个测试淘口令来验证 API 是否正常工作
        const testTkl = 'https://m.tb.cn/h.test123';
        try {
            const result = await this.dingdanxiaService.parseTkl(testTkl);
            // 即使解析失败，只要 API 响应了就说明配置正确
            return {
                success: true,
                message: 'API 连接正常',
                testResult: result,
            };
        } catch (error) {
            return {
                success: false,
                message: `API 连接失败: ${error.message}`,
            };
        }
    }

    /**
     * 遮蔽 API Key（只显示前4位和后4位）
     */
    private maskApiKey(key: string): string {
        if (!key || key.length <= 8) {
            return '****';
        }
        return key.substring(0, 4) + '****' + key.substring(key.length - 4);
    }
}
