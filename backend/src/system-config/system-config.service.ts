import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemConfig } from './system-config.entity';

@Injectable()
export class SystemConfigService {
    constructor(
        @InjectRepository(SystemConfig)
        private configRepo: Repository<SystemConfig>,
    ) { }

    async findAll(group?: string): Promise<SystemConfig[]> {
        if (group) {
            return this.configRepo.find({ where: { group } });
        }
        return this.configRepo.find();
    }

    async update(key: string, value: string): Promise<SystemConfig> {
        let config = await this.configRepo.findOne({ where: { key } });
        if (!config) {
            config = this.configRepo.create({ key, value });
        } else {
            config.value = value;
        }
        return this.configRepo.save(config);
    }

    async updateMany(configs: { key: string; value: string; group?: string }[]): Promise<SystemConfig[]> {
        const results: SystemConfig[] = [];
        for (const c of configs) {
            let config = await this.configRepo.findOne({ where: { key: c.key } });
            if (!config) {
                config = this.configRepo.create({ key: c.key, value: c.value, group: c.group });
            } else {
                config.value = c.value;
                if (c.group) config.group = c.group;
            }
            results.push(await this.configRepo.save(config));
        }
        return results;
    }

    /**
     * 获取单个配置值
     */
    async getValue(key: string): Promise<string | null> {
        const config = await this.configRepo.findOne({ where: { key } });
        return config?.value || null;
    }

    /**
     * 获取配置值，如果不存在则返回默认值
     */
    async getValueOrDefault(key: string, defaultValue: string): Promise<string> {
        const value = await this.getValue(key);
        return value ?? defaultValue;
    }

    /**
     * 获取数值类型配置
     */
    async getNumberValue(key: string, defaultValue: number): Promise<number> {
        const value = await this.getValue(key);
        return value ? parseFloat(value) : defaultValue;
    }

    /**
     * 获取布尔类型配置
     */
    async getBooleanValue(key: string, defaultValue: boolean): Promise<boolean> {
        const value = await this.getValue(key);
        if (value === null) return defaultValue;
        return value === 'true' || value === '1';
    }
}
