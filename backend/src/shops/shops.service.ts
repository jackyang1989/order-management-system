import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop, ShopStatus } from './shop.entity';

@Injectable()
export class ShopsService {
  constructor(
    @InjectRepository(Shop)
    private shopsRepository: Repository<Shop>,
  ) {}

  async findAll(query: {
    status?: ShopStatus;
    sellerId?: string;
    merchantId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ list: Shop[]; total: number }> {
    const { status, sellerId, merchantId, page = 1, limit = 10 } = query;
    // 支持 merchantId 参数（前端使用）和 sellerId 参数（兼容旧代码）
    const filterSellerId = merchantId || sellerId;
    const qb = this.shopsRepository
      .createQueryBuilder('shop')
      .leftJoinAndSelect('shop.merchant', 'merchant')
      .orderBy('shop.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status !== undefined) {
      qb.andWhere('shop.status = :status', { status });
    }
    if (filterSellerId) {
      qb.andWhere('shop.sellerId = :sellerId', { sellerId: filterSellerId });
    }

    const [list, total] = await qb.getManyAndCount();
    return { list, total };
  }

  async review(id: string, status: ShopStatus, remark?: string): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({ where: { id } });
    if (!shop) throw new BadRequestException('店铺不存在');

    shop.status = status;
    if (remark) shop.auditRemark = remark;
    return this.shopsRepository.save(shop);
  }

  async findAllByMerchant(sellerId: string): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: { sellerId, status: ShopStatus.APPROVED }, // Usually show active ones, maybe separate admin list
      order: { createdAt: 'DESC' },
    });
  }

  async getMyShops(sellerId: string): Promise<Shop[]> {
    return this.shopsRepository.find({
      where: { sellerId },
      order: { createdAt: 'DESC' },
    });
  }

  async create(sellerId: string, data: Partial<Shop>): Promise<Shop> {
    // Limit check
    const count = await this.shopsRepository.count({
      where: { sellerId, status: ShopStatus.APPROVED }, // Count active ones? Or all? Original said 'neq 3' (deleted)
    });
    if (count >= 8) {
      throw new BadRequestException('店铺数量已达上限(8个)');
    }

    // Uniqueness check
    if (data.accountName) {
      const exists = await this.shopsRepository.findOne({
        where: { accountName: data.accountName }, // Globally unique?
      });
      if (exists && exists.sellerId !== sellerId) {
        // Allow same user re-bind? Or strict unique?
        throw new BadRequestException('该店铺账号已被其他店铺绑定');
      }
    }

    const shop = this.shopsRepository.create({
      ...data,
      sellerId,
      status: ShopStatus.PENDING, // Default pending
    });
    return this.shopsRepository.save(shop);
  }

  async update(
    id: string,
    sellerId: string,
    data: Partial<Shop>,
  ): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({
      where: { id, sellerId },
    });
    if (!shop) throw new BadRequestException('店铺不存在');

    // If changing accountName, check unique
    if (data.accountName && data.accountName !== shop.accountName) {
      const exists = await this.shopsRepository.findOne({
        where: { accountName: data.accountName },
      });
      if (exists) throw new BadRequestException('该店铺账号已被使用');
    }

    Object.assign(shop, data);
    shop.status = ShopStatus.PENDING; // Verify again after edit? Original logic implies it.
    return this.shopsRepository.save(shop);
  }

  async delete(id: string, sellerId: string): Promise<void> {
    const shop = await this.shopsRepository.findOne({
      where: { id, sellerId },
    });
    if (shop) {
      // Soft delete or status change
      shop.status = ShopStatus.DELETED;
      await this.shopsRepository.save(shop);
    }
  }

  /**
   * 管理员更新店铺信息（无sellerId限制）
   */
  async adminUpdate(id: string, data: Partial<Shop>): Promise<Shop> {
    const shop = await this.shopsRepository.findOne({ where: { id } });
    if (!shop) throw new BadRequestException('店铺不存在');

    // If changing accountName, check unique
    if (data.accountName && data.accountName !== shop.accountName) {
      const exists = await this.shopsRepository.findOne({
        where: { accountName: data.accountName },
      });
      if (exists && exists.id !== id) {
        throw new BadRequestException('该店铺账号已被使用');
      }
    }

    Object.assign(shop, data);
    return this.shopsRepository.save(shop);
  }
}
