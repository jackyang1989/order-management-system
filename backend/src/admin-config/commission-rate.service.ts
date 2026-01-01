import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CommissionRate } from './commission-rate.entity';

@Injectable()
export class CommissionRateService {
    constructor(
        @InjectRepository(CommissionRate)
        private rateRepo: Repository<CommissionRate>,
    ) { }

    /**
     * 获取所有佣金比例
     */
    async findAll(platform?: string): Promise<CommissionRate[]> {
        const query = this.rateRepo.createQueryBuilder('rate')
            .where('rate.isActive = :isActive', { isActive: true });

        if (platform) {
            query.andWhere('(rate.platform = :platform OR rate.platform IS NULL)', { platform });
        }

        return query.orderBy('rate.minPrice', 'ASC').getMany();
    }

    /**
     * 根据商品价格获取佣金
     */
    async getCommissionByPrice(price: number, platform?: string): Promise<{
        buyerCommission: number;
        merchantCommission: number;
    }> {
        const query = this.rateRepo.createQueryBuilder('rate')
            .where('rate.isActive = :isActive', { isActive: true })
            .andWhere('rate.minPrice <= :price', { price })
            .andWhere('rate.maxPrice >= :price', { price });

        if (platform) {
            query.andWhere('(rate.platform = :platform OR rate.platform IS NULL)', { platform });
        }

        query.orderBy('rate.platform', 'DESC');  // 优先使用平台特定的比例

        const rate = await query.getOne();

        if (rate) {
            return {
                buyerCommission: Number(rate.buyerCommission),
                merchantCommission: Number(rate.merchantCommission),
            };
        }

        // 默认佣金
        return {
            buyerCommission: 4,
            merchantCommission: 4,
        };
    }

    /**
     * 创建佣金比例
     */
    async create(data: Partial<CommissionRate>): Promise<CommissionRate> {
        const rate = this.rateRepo.create(data);
        return this.rateRepo.save(rate);
    }

    /**
     * 更新佣金比例
     */
    async update(id: string, data: Partial<CommissionRate>): Promise<CommissionRate> {
        const rate = await this.rateRepo.findOne({ where: { id } });
        if (!rate) {
            throw new NotFoundException('佣金比例不存在');
        }
        Object.assign(rate, data);
        return this.rateRepo.save(rate);
    }

    /**
     * 删除佣金比例
     */
    async delete(id: string): Promise<void> {
        await this.rateRepo.delete(id);
    }

    /**
     * 批量更新佣金比例
     */
    async batchUpdate(rates: Partial<CommissionRate>[]): Promise<CommissionRate[]> {
        const results: CommissionRate[] = [];
        for (const rateData of rates) {
            if (rateData.id) {
                const result = await this.update(rateData.id, rateData);
                results.push(result);
            } else {
                const result = await this.create(rateData);
                results.push(result);
            }
        }
        return results;
    }

    /**
     * 初始化默认佣金比例
     */
    async initDefaultRates(): Promise<void> {
        const count = await this.rateRepo.count();
        if (count > 0) return;

        const defaultRates = [
            { minPrice: 0, maxPrice: 200, buyerCommission: 4, merchantCommission: 4 },
            { minPrice: 200.01, maxPrice: 400, buyerCommission: 5, merchantCommission: 5 },
            { minPrice: 400.01, maxPrice: 600, buyerCommission: 6, merchantCommission: 6 },
            { minPrice: 600.01, maxPrice: 800, buyerCommission: 7, merchantCommission: 7 },
            { minPrice: 800.01, maxPrice: 1000, buyerCommission: 8, merchantCommission: 8 },
            { minPrice: 1000.01, maxPrice: 99999, buyerCommission: 10, merchantCommission: 10 },
        ];

        for (const rate of defaultRates) {
            await this.create(rate);
        }
    }
}
