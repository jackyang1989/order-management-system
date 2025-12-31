import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goods, GoodsStatus, CreateGoodsDto, UpdateGoodsDto, GoodsFilterDto } from './goods.entity';

@Injectable()
export class GoodsService {
    constructor(
        @InjectRepository(Goods)
        private goodsRepository: Repository<Goods>,
    ) { }

    async findAll(sellerId: string, filter?: GoodsFilterDto): Promise<{
        data: Goods[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.goodsRepository.createQueryBuilder('goods')
            .leftJoinAndSelect('goods.shop', 'shop')
            .where('goods.sellerId = :sellerId', { sellerId })
            .andWhere('goods.state = :state', { state: GoodsStatus.ACTIVE });

        if (filter?.shopId) {
            queryBuilder.andWhere('goods.shopId = :shopId', { shopId: filter.shopId });
        }

        if (filter?.search) {
            queryBuilder.andWhere('goods.name LIKE :search', { search: `%${filter.search}%` });
        }

        if (filter?.minPrice !== undefined && filter?.maxPrice !== undefined) {
            queryBuilder.andWhere('goods.showPrice BETWEEN :minPrice AND :maxPrice', {
                minPrice: filter.minPrice,
                maxPrice: filter.maxPrice
            });
        } else if (filter?.minPrice !== undefined) {
            queryBuilder.andWhere('goods.showPrice >= :minPrice', { minPrice: filter.minPrice });
        } else if (filter?.maxPrice !== undefined) {
            queryBuilder.andWhere('goods.showPrice <= :maxPrice', { maxPrice: filter.maxPrice });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('goods.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findOne(id: string, sellerId?: string): Promise<Goods | null> {
        const where: any = { id, state: GoodsStatus.ACTIVE };
        if (sellerId) {
            where.sellerId = sellerId;
        }
        return this.goodsRepository.findOne({
            where,
            relations: ['shop']
        });
    }

    async findByShop(shopId: string): Promise<Goods[]> {
        return this.goodsRepository.find({
            where: { shopId, state: GoodsStatus.ACTIVE },
            order: { createdAt: 'DESC' }
        });
    }

    async create(sellerId: string, dto: CreateGoodsDto): Promise<Goods> {
        const goods = this.goodsRepository.create({
            sellerId,
            shopId: dto.shopId,
            name: dto.name,
            link: dto.link,
            taobaoId: dto.taobaoId,
            verifyCode: dto.verifyCode,
            pcImg: dto.pcImg,
            specName: dto.specName,
            specValue: dto.specValue,
            price: dto.price,
            num: dto.num || 1,
            showPrice: dto.showPrice || dto.price,
            goodsKeyId: dto.goodsKeyId,
            state: GoodsStatus.ACTIVE,
        });

        return this.goodsRepository.save(goods);
    }

    async update(id: string, sellerId: string, dto: UpdateGoodsDto): Promise<Goods> {
        const goods = await this.goodsRepository.findOne({
            where: { id, sellerId, state: GoodsStatus.ACTIVE }
        });

        if (!goods) {
            throw new NotFoundException('商品不存在');
        }

        Object.assign(goods, dto);
        return this.goodsRepository.save(goods);
    }

    async delete(id: string, sellerId: string): Promise<boolean> {
        const goods = await this.goodsRepository.findOne({
            where: { id, sellerId, state: GoodsStatus.ACTIVE }
        });

        if (!goods) {
            throw new NotFoundException('商品不存在');
        }

        goods.state = GoodsStatus.DELETED;
        await this.goodsRepository.save(goods);
        return true;
    }

    // 批量获取商品
    async findByIds(ids: string[]): Promise<Goods[]> {
        if (ids.length === 0) return [];
        return this.goodsRepository.findByIds(ids);
    }
}
