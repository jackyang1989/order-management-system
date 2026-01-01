import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeliveryWarehouse, DEFAULT_DELIVERIES } from './delivery-warehouse.entity';

@Injectable()
export class DeliveryWarehouseService implements OnModuleInit {
    constructor(
        @InjectRepository(DeliveryWarehouse)
        private deliveryRepo: Repository<DeliveryWarehouse>,
    ) { }

    async onModuleInit() {
        await this.ensureDefaults();
    }

    /**
     * 确保默认快递公司存在
     */
    private async ensureDefaults(): Promise<void> {
        for (const delivery of DEFAULT_DELIVERIES) {
            const existing = await this.deliveryRepo.findOne({
                where: { code: delivery.code },
            });
            if (!existing) {
                await this.deliveryRepo.save(
                    this.deliveryRepo.create({
                        ...delivery,
                        isActive: true,
                    }),
                );
            }
        }
    }

    /**
     * 获取所有快递公司
     */
    async findAll(includeInactive = false): Promise<DeliveryWarehouse[]> {
        const where = includeInactive ? {} : { isActive: true };
        return this.deliveryRepo.find({
            where,
            order: { sortOrder: 'ASC', name: 'ASC' },
        });
    }

    /**
     * 获取单个快递公司
     */
    async findOne(id: string): Promise<DeliveryWarehouse> {
        const delivery = await this.deliveryRepo.findOne({ where: { id } });
        if (!delivery) {
            throw new NotFoundException(`快递公司 ${id} 不存在`);
        }
        return delivery;
    }

    /**
     * 根据代码获取快递公司
     */
    async findByCode(code: string): Promise<DeliveryWarehouse | null> {
        return this.deliveryRepo.findOne({ where: { code } });
    }

    /**
     * 创建快递公司
     */
    async create(data: Partial<DeliveryWarehouse>): Promise<DeliveryWarehouse> {
        const delivery = this.deliveryRepo.create(data);
        return this.deliveryRepo.save(delivery);
    }

    /**
     * 更新快递公司
     */
    async update(id: string, data: Partial<DeliveryWarehouse>): Promise<DeliveryWarehouse> {
        const delivery = await this.findOne(id);
        Object.assign(delivery, data);
        return this.deliveryRepo.save(delivery);
    }

    /**
     * 删除快递公司
     */
    async remove(id: string): Promise<void> {
        const delivery = await this.findOne(id);
        await this.deliveryRepo.remove(delivery);
    }

    /**
     * 切换激活状态
     */
    async toggleActive(id: string): Promise<DeliveryWarehouse> {
        const delivery = await this.findOne(id);
        delivery.isActive = !delivery.isActive;
        return this.deliveryRepo.save(delivery);
    }

    /**
     * 批量更新排序
     */
    async updateSortOrder(items: { id: string; sortOrder: number }[]): Promise<void> {
        for (const item of items) {
            await this.deliveryRepo.update(item.id, { sortOrder: item.sortOrder });
        }
    }

    /**
     * 生成物流查询URL
     */
    getTrackingUrl(delivery: DeliveryWarehouse, trackingNumber: string): string | null {
        if (!delivery.trackingUrl) {
            return null;
        }
        return delivery.trackingUrl.replace('{number}', trackingNumber);
    }
}
