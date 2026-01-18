import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PlatformImageRequirement,
  CreateImageRequirementDto,
  UpdateImageRequirementDto,
} from './platform-image-requirement.entity';

@Injectable()
export class PlatformImageRequirementService {
  constructor(
    @InjectRepository(PlatformImageRequirement)
    private readonly imageRequirementRepository: Repository<PlatformImageRequirement>,
  ) {}

  /**
   * 根据平台获取所有截图配置
   */
  async findByPlatform(platformId: string): Promise<PlatformImageRequirement[]> {
    return this.imageRequirementRepository.find({
      where: { platformId },
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * 根据平台code获取所有截图配置(供前端使用)
   */
  async findByPlatformCode(platformCode: string): Promise<PlatformImageRequirement[]> {
    return this.imageRequirementRepository
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.platform', 'platform')
      .where('platform.code = :platformCode', { platformCode })
      .orderBy('req.sortOrder', 'ASC')
      .getMany();
  }

  /**
   * 创建新的截图配置
   */
  async create(dto: CreateImageRequirementDto): Promise<PlatformImageRequirement> {
    const requirement = this.imageRequirementRepository.create(dto);
    return this.imageRequirementRepository.save(requirement);
  }

  /**
   * 更新截图配置
   */
  async update(id: string, dto: UpdateImageRequirementDto): Promise<PlatformImageRequirement> {
    await this.imageRequirementRepository.update(id, dto);
    return this.imageRequirementRepository.findOne({ where: { id } });
  }

  /**
   * 删除截图配置
   */
  async delete(id: string): Promise<void> {
    await this.imageRequirementRepository.delete(id);
  }

  /**
   * 更新示例图片路径
   */
  async updateExampleImage(id: string, imagePath: string): Promise<PlatformImageRequirement> {
    await this.imageRequirementRepository.update(id, { exampleImagePath: imagePath });
    return this.imageRequirementRepository.findOne({ where: { id } });
  }
}
