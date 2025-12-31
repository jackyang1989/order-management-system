import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommissionRate } from './commission-rate.entity';

@Injectable()
export class CommissionRatesService {
    constructor(
        @InjectRepository(CommissionRate)
        private rateRepo: Repository<CommissionRate>,
    ) { }

    findAll(): Promise<CommissionRate[]> {
        return this.rateRepo.find({ order: { maxGoodsPrice: 'ASC' } });
    }

    create(rate: Partial<CommissionRate>): Promise<CommissionRate> {
        const newRate = this.rateRepo.create(rate);
        return this.rateRepo.save(newRate);
    }

    async update(id: number, rate: Partial<CommissionRate>): Promise<CommissionRate | null> {
        await this.rateRepo.update(id, rate);
        return this.rateRepo.findOne({ where: { id } });
    }

    async remove(id: number): Promise<void> {
        await this.rateRepo.delete(id);
    }
}
