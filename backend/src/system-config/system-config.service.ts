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

    // Helper to get typed config
    // async getConfigValue(key: string): Promise<string | null> { ... }
}
