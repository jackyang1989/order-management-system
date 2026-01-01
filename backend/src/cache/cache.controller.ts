import { Controller, Get, Post, Delete, Param, UseGuards, Body } from '@nestjs/common';
import { CacheService } from './cache.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('admin/cache')
@UseGuards(JwtAuthGuard)
export class CacheController {
    constructor(private readonly cacheService: CacheService) {}

    /**
     * 获取缓存统计信息
     */
    @Get('stats')
    getStats() {
        const stats = this.cacheService.stats();

        // 按前缀分组统计
        const groups: Record<string, { count: number; keys: string[] }> = {};

        for (const key of stats.keys) {
            const prefix = key.split(':')[0] || 'other';
            if (!groups[prefix]) {
                groups[prefix] = { count: 0, keys: [] };
            }
            groups[prefix].count++;
            groups[prefix].keys.push(key);
        }

        return {
            success: true,
            data: {
                totalSize: stats.size,
                groups,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
            },
        };
    }

    /**
     * 获取所有缓存键列表
     */
    @Get('keys')
    getKeys() {
        const stats = this.cacheService.stats();
        return {
            success: true,
            data: stats.keys,
        };
    }

    /**
     * 按前缀清除缓存
     */
    @Delete('prefix/:prefix')
    clearByPrefix(@Param('prefix') prefix: string) {
        const count = this.cacheService.deleteByPrefix(prefix);
        return {
            success: true,
            message: `已清除 ${count} 个缓存`,
            data: { deletedCount: count },
        };
    }

    /**
     * 清除指定缓存键
     */
    @Delete('key/:key')
    clearByKey(@Param('key') key: string) {
        const result = this.cacheService.delete(key);
        return {
            success: true,
            message: result ? '缓存已清除' : '缓存不存在',
            data: { deleted: result },
        };
    }

    /**
     * 清空所有缓存
     */
    @Post('clear-all')
    clearAll() {
        const stats = this.cacheService.stats();
        const count = stats.size;
        this.cacheService.clear();
        return {
            success: true,
            message: `已清空 ${count} 个缓存`,
            data: { deletedCount: count },
        };
    }

    /**
     * 清除用户缓存
     */
    @Delete('users')
    clearUserCache() {
        const count = this.cacheService.deleteByPrefix('user:');
        return {
            success: true,
            message: `已清除 ${count} 个用户缓存`,
            data: { deletedCount: count },
        };
    }

    /**
     * 清除配置缓存
     */
    @Delete('configs')
    clearConfigCache() {
        this.cacheService.invalidateConfigs();
        return {
            success: true,
            message: '配置缓存已清除',
        };
    }

    /**
     * 清除平台缓存
     */
    @Delete('platforms')
    clearPlatformCache() {
        this.cacheService.invalidatePlatforms();
        return {
            success: true,
            message: '平台缓存已清除',
        };
    }

    /**
     * 清除佣金费率缓存
     */
    @Delete('commission-rates')
    clearCommissionRateCache() {
        this.cacheService.invalidateCommissionRates();
        return {
            success: true,
            message: '佣金费率缓存已清除',
        };
    }

    /**
     * 获取系统状态
     */
    @Get('system-status')
    getSystemStatus() {
        const stats = this.cacheService.stats();
        const memoryUsage = process.memoryUsage();

        return {
            success: true,
            data: {
                cache: {
                    size: stats.size,
                    status: 'running',
                },
                memory: {
                    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
                    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                    rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                },
                process: {
                    uptime: Math.round(process.uptime()) + ' 秒',
                    pid: process.pid,
                    nodeVersion: process.version,
                },
            },
        };
    }
}
