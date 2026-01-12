import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntryType, DEFAULT_ENTRY_TYPES } from './entry-type.entity';

@Injectable()
export class EntryTypeService implements OnModuleInit {
    constructor(
        @InjectRepository(EntryType)
        private entryTypeRepo: Repository<EntryType>,
    ) { }

    async onModuleInit() {
        await this.initDefaultEntryTypes();
    }

    /**
     * 初始化默认入口类型
     */
    private async initDefaultEntryTypes() {
        for (const entryTypeData of DEFAULT_ENTRY_TYPES) {
            const existing = await this.entryTypeRepo.findOne({ where: { code: entryTypeData.code } });
            if (!existing) {
                await this.entryTypeRepo.save(this.entryTypeRepo.create(entryTypeData));
            }
        }
    }

    /**
     * 获取所有入口类型
     */
    async findAll(activeOnly: boolean = true): Promise<EntryType[]> {
        const query = this.entryTypeRepo.createQueryBuilder('entryType');
        if (activeOnly) {
            query.where('entryType.isActive = :isActive', { isActive: true });
        }
        return query.orderBy('entryType.sortOrder', 'ASC').getMany();
    }

    /**
     * 根据代码获取入口类型
     */
    async findByCode(code: string): Promise<EntryType | null> {
        return this.entryTypeRepo.findOne({ where: { code } });
    }

    /**
     * 根据值获取入口类型
     */
    async findByValue(value: number): Promise<EntryType | null> {
        return this.entryTypeRepo.findOne({ where: { value } });
    }

    /**
     * 创建入口类型
     */
    async create(data: Partial<EntryType>): Promise<EntryType> {
        const entryType = this.entryTypeRepo.create(data);
        return this.entryTypeRepo.save(entryType);
    }

    /**
     * 更新入口类型
     */
    async update(id: string, data: Partial<EntryType>): Promise<EntryType> {
        const entryType = await this.entryTypeRepo.findOne({ where: { id } });
        if (!entryType) {
            throw new NotFoundException('入口类型不存在');
        }
        Object.assign(entryType, data);
        return this.entryTypeRepo.save(entryType);
    }

    /**
     * 删除入口类型（硬删除）
     */
    async delete(id: string): Promise<void> {
        const entryType = await this.entryTypeRepo.findOne({ where: { id } });
        if (!entryType) {
            throw new NotFoundException('入口类型不存在');
        }
        await this.entryTypeRepo.remove(entryType);
    }

    /**
     * 启用/禁用入口类型
     */
    async toggleActive(id: string, isActive: boolean): Promise<EntryType> {
        const entryType = await this.entryTypeRepo.findOne({ where: { id } });
        if (!entryType) {
            throw new NotFoundException('入口类型不存在');
        }
        entryType.isActive = isActive;
        return this.entryTypeRepo.save(entryType);
    }
}
