import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, CreateDeliveryDto } from './delivery.entity';

@Injectable()
export class DeliveriesService {
    constructor(
        @InjectRepository(Delivery)
        private deliveryRepository: Repository<Delivery>,
    ) { }

    async findAll(): Promise<Delivery[]> {
        return this.deliveryRepository.find({
            where: { isActive: true },
            order: { sort: 'ASC', name: 'ASC' }
        });
    }

    async findOne(id: string): Promise<Delivery | null> {
        return this.deliveryRepository.findOne({ where: { id } });
    }

    async create(createDto: CreateDeliveryDto): Promise<Delivery> {
        const delivery = this.deliveryRepository.create(createDto);
        return this.deliveryRepository.save(delivery);
    }

    async update(id: string, updateDto: Partial<CreateDeliveryDto>): Promise<Delivery | null> {
        const delivery = await this.deliveryRepository.findOne({ where: { id } });
        if (!delivery) return null;
        Object.assign(delivery, updateDto);
        return this.deliveryRepository.save(delivery);
    }

    async delete(id: string): Promise<void> {
        await this.deliveryRepository.delete(id);
    }

    async initDefaultDeliveries(): Promise<void> {
        const count = await this.deliveryRepository.count();
        if (count > 0) return;

        const defaultDeliveries = [
            { name: '顺丰速运', code: 'SF', sort: 1 },
            { name: '中通快递', code: 'ZTO', sort: 2 },
            { name: '圆通速递', code: 'YTO', sort: 3 },
            { name: '韵达快递', code: 'YD', sort: 4 },
            { name: '申通快递', code: 'STO', sort: 5 },
            { name: '百世快递', code: 'HTKY', sort: 6 },
            { name: '极兔速递', code: 'JTSD', sort: 7 },
            { name: '邮政快递包裹', code: 'YZPY', sort: 8 },
            { name: 'EMS', code: 'EMS', sort: 9 },
            { name: '德邦快递', code: 'DBL', sort: 10 },
            { name: '京东物流', code: 'JD', sort: 11 },
            { name: '菜鸟速递', code: 'CNSD', sort: 12 },
        ];

        for (const delivery of defaultDeliveries) {
            await this.deliveryRepository.save(this.deliveryRepository.create(delivery));
        }
    }
}
