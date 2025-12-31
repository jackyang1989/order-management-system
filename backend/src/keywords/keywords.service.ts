import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    GoodsKey, KeywordDetail,
    CreateGoodsKeyDto, UpdateGoodsKeyDto,
    CreateKeywordDetailDto, UpdateKeywordDetailDto
} from './keyword.entity';

@Injectable()
export class KeywordsService {
    constructor(
        @InjectRepository(GoodsKey)
        private goodsKeyRepository: Repository<GoodsKey>,
        @InjectRepository(KeywordDetail)
        private keywordDetailRepository: Repository<KeywordDetail>,
    ) { }

    // ============ 关键词方案 CRUD ============
    async findAllSchemes(sellerId: string): Promise<GoodsKey[]> {
        return this.goodsKeyRepository.find({
            where: { sellerId },
            relations: ['details'],
            order: { createdAt: 'DESC' }
        });
    }

    async findSchemeById(id: string, sellerId?: string): Promise<GoodsKey | null> {
        const where: any = { id };
        if (sellerId) where.sellerId = sellerId;

        return this.goodsKeyRepository.findOne({
            where,
            relations: ['details']
        });
    }

    async createScheme(sellerId: string, dto: CreateGoodsKeyDto): Promise<GoodsKey> {
        const scheme = this.goodsKeyRepository.create({
            sellerId,
            name: dto.name,
            platform: dto.platform,
        });

        const savedScheme = await this.goodsKeyRepository.save(scheme);

        // 创建关键词详情
        if (dto.details && dto.details.length > 0) {
            const details = dto.details.map(d => this.keywordDetailRepository.create({
                ...d,
                goodsKeyId: savedScheme.id
            }));
            await this.keywordDetailRepository.save(details);
        }

        return this.findSchemeById(savedScheme.id);
    }

    async updateScheme(id: string, sellerId: string, dto: UpdateGoodsKeyDto): Promise<GoodsKey> {
        const scheme = await this.goodsKeyRepository.findOne({
            where: { id, sellerId }
        });

        if (!scheme) {
            throw new NotFoundException('关键词方案不存在');
        }

        Object.assign(scheme, dto);
        await this.goodsKeyRepository.save(scheme);
        return this.findSchemeById(id);
    }

    async deleteScheme(id: string, sellerId: string): Promise<boolean> {
        const scheme = await this.goodsKeyRepository.findOne({
            where: { id, sellerId }
        });

        if (!scheme) {
            throw new NotFoundException('关键词方案不存在');
        }

        // 删除关联的关键词详情
        await this.keywordDetailRepository.delete({ goodsKeyId: id });
        await this.goodsKeyRepository.delete(id);
        return true;
    }

    // ============ 关键词详情 CRUD ============
    async addKeywordDetail(schemeId: string, sellerId: string, dto: CreateKeywordDetailDto): Promise<KeywordDetail> {
        // 验证方案归属
        const scheme = await this.goodsKeyRepository.findOne({
            where: { id: schemeId, sellerId }
        });

        if (!scheme) {
            throw new NotFoundException('关键词方案不存在');
        }

        const detail = this.keywordDetailRepository.create({
            ...dto,
            goodsKeyId: schemeId
        });

        return this.keywordDetailRepository.save(detail);
    }

    async updateKeywordDetail(detailId: string, sellerId: string, dto: UpdateKeywordDetailDto): Promise<KeywordDetail> {
        const detail = await this.keywordDetailRepository.findOne({
            where: { id: detailId },
            relations: ['goodsKey']
        });

        if (!detail || detail.goodsKey.sellerId !== sellerId) {
            throw new NotFoundException('关键词不存在');
        }

        Object.assign(detail, dto);
        return this.keywordDetailRepository.save(detail);
    }

    async deleteKeywordDetail(detailId: string, sellerId: string): Promise<boolean> {
        const detail = await this.keywordDetailRepository.findOne({
            where: { id: detailId },
            relations: ['goodsKey']
        });

        if (!detail || detail.goodsKey.sellerId !== sellerId) {
            throw new NotFoundException('关键词不存在');
        }

        await this.keywordDetailRepository.delete(detailId);
        return true;
    }

    async findDetailsByScheme(schemeId: string): Promise<KeywordDetail[]> {
        return this.keywordDetailRepository.find({
            where: { goodsKeyId: schemeId },
            order: { createdAt: 'ASC' }
        });
    }
}
