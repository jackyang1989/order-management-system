import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemGlobalConfig, UpdateSystemGlobalConfigDto } from './system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemGlobalConfig)
    private configRepo: Repository<SystemGlobalConfig>,
  ) { }

  async getGlobalConfig(): Promise<SystemGlobalConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepo.create({ id: 1 });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateGlobalConfig(
    dto: UpdateSystemGlobalConfigDto,
  ): Promise<SystemGlobalConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepo.create({ id: 1, ...dto });
    } else {
      this.configRepo.merge(config, dto);
    }
    return this.configRepo.save(config);
  }
}
