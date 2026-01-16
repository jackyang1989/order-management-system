import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SystemConfig,
  UpdateSystemConfigDto,
  SystemConfigResponseDto,
} from './system-config.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
  ) {}

  /**
   * 获取系统配置
   */
  async getConfig(): Promise<SystemConfigResponseDto> {
    const configs = await this.configRepository.find();
    const configMap = new Map<string, string>();

    configs.forEach((config) => {
      configMap.set(config.key, config.value);
    });

    return {
      userRegistrationEnabled: configMap.get('user_registration_enabled') === 'true',
      merchantRegistrationEnabled: configMap.get('merchant_registration_enabled') === 'true',
    };
  }

  /**
   * 更新系统配置
   */
  async updateConfig(dto: UpdateSystemConfigDto): Promise<SystemConfigResponseDto> {
    await this.upsertConfig('user_registration_enabled', String(dto.userRegistrationEnabled), '用户注册开关');
    await this.upsertConfig('merchant_registration_enabled', String(dto.merchantRegistrationEnabled), '商家注册开关');

    return this.getConfig();
  }

  /**
   * 检查用户注册是否开启
   */
  async isUserRegistrationEnabled(): Promise<boolean> {
    const config = await this.configRepository.findOne({
      where: { key: 'user_registration_enabled' },
    });
    return config?.value === 'true';
  }

  /**
   * 检查商家注册是否开启
   */
  async isMerchantRegistrationEnabled(): Promise<boolean> {
    const config = await this.configRepository.findOne({
      where: { key: 'merchant_registration_enabled' },
    });
    return config?.value === 'true';
  }

  /**
   * 插入或更新配置
   */
  private async upsertConfig(key: string, value: string, description: string): Promise<void> {
    const existing = await this.configRepository.findOne({ where: { key } });

    if (existing) {
      existing.value = value;
      existing.description = description;
      await this.configRepository.save(existing);
    } else {
      const config = this.configRepository.create({ key, value, description });
      await this.configRepository.save(config);
    }
  }
}
