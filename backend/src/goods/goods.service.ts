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

    // ============ 后台管理接口 ============

    /**
     * 后台修改商品 (管理员权限)
     * 对应原版接口: Task::goodsEditDo
     * 业务语义: 后台管理员修改商品信息
     * 前置条件: 无状态限制
     *
     * @param goodsId 商品ID
     * @param dto 更新数据
     * @param operatorName 操作员姓名
     */
    async adminUpdate(
        goodsId: string,
        dto: UpdateGoodsDto & { link?: string },
        operatorName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 参数验证
            if (!goodsId) {
                return { success: false, message: '参数错误' };
            }

            // 2. 查询商品
            const goods = await this.goodsRepository.findOne({
                where: { id: goodsId, state: GoodsStatus.ACTIVE }
            });

            if (!goods) {
                return { success: false, message: '商品不存在' };
            }

            // 3. 如果提供了链接，提取淘宝ID
            if (dto.link) {
                try {
                    const url = new URL(dto.link);
                    const taobaoId = url.searchParams.get('id');
                    if (!taobaoId) {
                        return { success: false, message: '商品链接不正确' };
                    }
                    goods.taobaoId = taobaoId;
                    goods.link = dto.link;
                } catch {
                    return { success: false, message: '商品链接不正确' };
                }
            }

            // 4. 更新其他字段
            if (dto.name !== undefined) goods.name = dto.name;
            if (dto.verifyCode !== undefined) goods.verifyCode = dto.verifyCode;
            if (dto.pcImg !== undefined) goods.pcImg = dto.pcImg;
            if (dto.specName !== undefined) goods.specName = dto.specName;
            if (dto.specValue !== undefined) goods.specValue = dto.specValue;
            if (dto.price !== undefined) goods.price = dto.price;
            if (dto.showPrice !== undefined) goods.showPrice = dto.showPrice;
            if (dto.num !== undefined) goods.num = dto.num;
            if (dto.goodsKeyId !== undefined) goods.goodsKeyId = dto.goodsKeyId;

            await this.goodsRepository.save(goods);

            // 5. 记录日志
            console.log(`[AdminLog] 修改商品 - 管理员${operatorName}操作: 修改商品id为:${goodsId}, 名称为:${goods.name}`);

            return { success: true, message: '修改成功' };

        } catch (error) {
            return { success: false, message: error.message || '修改失败' };
        }
    }
}
