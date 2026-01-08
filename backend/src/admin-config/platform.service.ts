import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform, DEFAULT_PLATFORMS } from './platform.entity';

@Injectable()
export class PlatformService implements OnModuleInit {
    constructor(
        @InjectRepository(Platform)
        private platformRepo: Repository<Platform>,
    ) { }

    async onModuleInit() {
        await this.initDefaultPlatforms();
    }

    /**
     * 初始化默认平台
     */
    private async initDefaultPlatforms() {
        for (const platformData of DEFAULT_PLATFORMS) {
            const existing = await this.platformRepo.findOne({ where: { code: platformData.code } });
            if (!existing) {
                await this.platformRepo.save(this.platformRepo.create(platformData));
            }
        }
    }

    /**
     * 获取所有平台
     */
    async findAll(activeOnly: boolean = true): Promise<Platform[]> {
        const query = this.platformRepo.createQueryBuilder('platform');
        if (activeOnly) {
            query.where('platform.isActive = :isActive', { isActive: true });
        }
        return query.orderBy('platform.sortOrder', 'ASC').getMany();
    }

    /**
     * 根据代码获取平台
     */
    async findByCode(code: string): Promise<Platform | null> {
        return this.platformRepo.findOne({ where: { code } });
    }

    /**
     * 创建平台
     */
    async create(data: Partial<Platform>): Promise<Platform> {
        const platform = this.platformRepo.create(data);
        return this.platformRepo.save(platform);
    }

    /**
     * 更新平台
     */
    async update(id: string, data: Partial<Platform>): Promise<Platform> {
        const platform = await this.platformRepo.findOne({ where: { id } });
        if (!platform) {
            throw new NotFoundException('平台不存在');
        }
        Object.assign(platform, data);
        return this.platformRepo.save(platform);
    }

    /**
     * 删除平台（硬删除）
     */
    async delete(id: string): Promise<void> {
        const platform = await this.platformRepo.findOne({ where: { id } });
        if (!platform) {
            throw new NotFoundException('平台不存在');
        }
        await this.platformRepo.remove(platform);
    }

    /**
     * 启用/禁用平台
     */
    async toggleActive(id: string, isActive: boolean): Promise<Platform> {
        const platform = await this.platformRepo.findOne({ where: { id } });
        if (!platform) {
            throw new NotFoundException('平台不存在');
        }
        platform.isActive = isActive;
        return this.platformRepo.save(platform);
    }
}
