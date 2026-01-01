import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig, DEFAULT_CONFIGS, CONFIG_GROUPS } from './config.entity';

@Injectable()
export class AdminConfigService implements OnModuleInit {
    private readonly logger = new Logger(AdminConfigService.name);
    private configCache: Map<string, SystemConfig> = new Map();

    constructor(
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
    ) { }

    /**
     * 模块初始化时，确保默认配置存在
     */
    async onModuleInit() {
        await this.ensureDefaultConfigs();
        await this.refreshCache();
    }

    /**
     * 确保默认配置项存在
     */
    private async ensureDefaultConfigs() {
        for (const config of DEFAULT_CONFIGS) {
            const existing = await this.configRepo.findOne({ where: { key: config.key } });
            if (!existing) {
                await this.configRepo.save(this.configRepo.create(config));
                this.logger.log(`创建默认配置: ${config.key}`);
            }
        }
    }

    /**
     * 刷新配置缓存
     */
    async refreshCache() {
        const configs = await this.configRepo.find();
        this.configCache.clear();
        for (const config of configs) {
            this.configCache.set(config.key, config);
        }
        this.logger.log(`配置缓存已刷新，共 ${configs.length} 项`);
    }

    /**
     * 获取所有配置（按分组）
     */
    async getAllConfigs(): Promise<Record<string, SystemConfig[]>> {
        const configs = await this.configRepo.find({
            where: { isVisible: true },
            order: { group: 'ASC', sortOrder: 'ASC' },
        });

        const grouped: Record<string, SystemConfig[]> = {};
        for (const config of configs) {
            const group = config.group || 'other';
            if (!grouped[group]) {
                grouped[group] = [];
            }
            grouped[group].push(config);
        }

        return grouped;
    }

    /**
     * 获取指定分组的配置
     */
    async getConfigsByGroup(group: string): Promise<SystemConfig[]> {
        return this.configRepo.find({
            where: { group, isVisible: true },
            order: { sortOrder: 'ASC' },
        });
    }

    /**
     * 获取单个配置值（从缓存）
     */
    getValue(key: string): string | null {
        const config = this.configCache.get(key);
        return config?.value || null;
    }

    /**
     * 获取数值配置
     */
    getNumberValue(key: string, defaultValue: number = 0): number {
        const value = this.getValue(key);
        return value ? parseFloat(value) : defaultValue;
    }

    /**
     * 获取布尔配置
     */
    getBooleanValue(key: string, defaultValue: boolean = false): boolean {
        const value = this.getValue(key);
        if (value === null) return defaultValue;
        return value === 'true' || value === '1';
    }

    /**
     * 获取JSON配置
     */
    getJsonValue<T>(key: string, defaultValue: T): T {
        const value = this.getValue(key);
        if (!value) return defaultValue;
        try {
            return JSON.parse(value);
        } catch {
            return defaultValue;
        }
    }

    /**
     * 获取数组配置
     */
    getArrayValue(key: string): string[] {
        const value = this.getValue(key);
        if (!value) return [];
        return value.split(',').map(v => v.trim()).filter(v => v);
    }

    /**
     * 更新单个配置
     */
    async updateConfig(key: string, value: string): Promise<SystemConfig> {
        let config = await this.configRepo.findOne({ where: { key } });
        if (!config) {
            config = this.configRepo.create({ key, value });
        } else {
            config.value = value;
        }
        const saved = await this.configRepo.save(config);
        this.configCache.set(key, saved);
        return saved;
    }

    /**
     * 批量更新配置
     */
    async updateConfigs(updates: { key: string; value: string }[]): Promise<SystemConfig[]> {
        const results: SystemConfig[] = [];
        for (const update of updates) {
            const result = await this.updateConfig(update.key, update.value);
            results.push(result);
        }
        return results;
    }

    /**
     * 创建新配置项
     */
    async createConfig(data: Partial<SystemConfig>): Promise<SystemConfig> {
        const config = this.configRepo.create(data);
        const saved = await this.configRepo.save(config);
        this.configCache.set(saved.key, saved);
        return saved;
    }

    /**
     * 删除配置项
     */
    async deleteConfig(key: string): Promise<void> {
        await this.configRepo.delete({ key });
        this.configCache.delete(key);
    }

    /**
     * 获取分组元数据
     */
    getGroupsMeta() {
        return [
            { key: CONFIG_GROUPS.REGISTER, label: '注册设置', icon: 'user-plus' },
            { key: CONFIG_GROUPS.VIP, label: 'VIP设置', icon: 'crown' },
            { key: CONFIG_GROUPS.WITHDRAWAL, label: '提现设置', icon: 'wallet' },
            { key: CONFIG_GROUPS.TASK_FEE, label: '任务服务费', icon: 'calculator' },
            { key: CONFIG_GROUPS.PRAISE_FEE, label: '好评费用', icon: 'star' },
            { key: CONFIG_GROUPS.COMMISSION, label: '佣金设置', icon: 'percent' },
            { key: CONFIG_GROUPS.SMS, label: '短信设置', icon: 'message' },
            { key: CONFIG_GROUPS.PAYMENT, label: '支付设置', icon: 'credit-card' },
            { key: CONFIG_GROUPS.API, label: '第三方API', icon: 'api' },
            { key: CONFIG_GROUPS.SYSTEM, label: '系统设置', icon: 'settings' },
        ];
    }
}
