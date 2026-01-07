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

  // ============ P1: 动态配置获取方法 ============

  /**
   * 获取买号升星阶梯配置
   * @returns Record<star, requiredTasks> e.g. {2:30, 3:60, 4:90, 5:120}
   */
  async getStarThresholds(): Promise<Record<number, number>> {
    const config = await this.getGlobalConfig();
    try {
      return JSON.parse(config.starThresholds || '{"2":30,"3":60,"4":90,"5":120}');
    } catch {
      return { 2: 30, 3: 60, 4: 90, 5: 120 };
    }
  }

  /**
   * 获取买号星级限价配置
   * @returns Record<star, maxPrice> e.g. {1:100, 2:500, 3:1000, 4:2000, 5:99999}
   */
  async getStarPriceLimits(): Promise<Record<number, number>> {
    const config = await this.getGlobalConfig();
    try {
      return JSON.parse(config.starPriceLimits || '{"1":100,"2":500,"3":1000,"4":2000,"5":99999}');
    } catch {
      return { 1: 100, 2: 500, 3: 1000, 4: 2000, 5: 99999 };
    }
  }

  /**
   * 获取首个买号审核通过赠送VIP天数
   */
  async getFirstAccountVipDays(): Promise<number> {
    const config = await this.getGlobalConfig();
    return config.firstAccountVipDays || 7;
  }
}
