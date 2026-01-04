import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GoodsKey,
  KeywordDetail,
  CreateGoodsKeyDto,
  UpdateGoodsKeyDto,
  CreateKeywordDetailDto,
  UpdateKeywordDetailDto,
} from './keyword.entity';

@Injectable()
export class KeywordsService {
  constructor(
    @InjectRepository(GoodsKey)
    private goodsKeyRepository: Repository<GoodsKey>,
    @InjectRepository(KeywordDetail)
    private keywordDetailRepository: Repository<KeywordDetail>,
  ) {}

  // ============ 关键词方案 CRUD ============
  async findAllSchemes(sellerId: string): Promise<GoodsKey[]> {
    return this.goodsKeyRepository.find({
      where: { sellerId },
      relations: ['details'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSchemeById(
    id: string,
    sellerId?: string,
  ): Promise<GoodsKey | null> {
    const where: any = { id };
    if (sellerId) where.sellerId = sellerId;

    return this.goodsKeyRepository.findOne({
      where,
      relations: ['details'],
    });
  }

  async createScheme(
    sellerId: string,
    dto: CreateGoodsKeyDto,
  ): Promise<GoodsKey> {
    const scheme = this.goodsKeyRepository.create({
      sellerId,
      name: dto.name,
      platform: dto.platform,
    });

    const savedScheme = await this.goodsKeyRepository.save(scheme);

    // 创建关键词详情
    if (dto.details && dto.details.length > 0) {
      const details = dto.details.map((d) =>
        this.keywordDetailRepository.create({
          ...d,
          goodsKeyId: savedScheme.id,
        }),
      );
      await this.keywordDetailRepository.save(details);
    }

    return this.findSchemeById(savedScheme.id) as Promise<GoodsKey>;
  }

  async updateScheme(
    id: string,
    sellerId: string,
    dto: UpdateGoodsKeyDto,
  ): Promise<GoodsKey> {
    const scheme = await this.goodsKeyRepository.findOne({
      where: { id, sellerId },
    });

    if (!scheme) {
      throw new NotFoundException('关键词方案不存在');
    }

    Object.assign(scheme, dto);
    await this.goodsKeyRepository.save(scheme);
    return this.findSchemeById(id) as Promise<GoodsKey>;
  }

  async deleteScheme(id: string, sellerId: string): Promise<boolean> {
    const scheme = await this.goodsKeyRepository.findOne({
      where: { id, sellerId },
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
  async addKeywordDetail(
    schemeId: string,
    sellerId: string,
    dto: CreateKeywordDetailDto,
  ): Promise<KeywordDetail> {
    // 验证方案归属
    const scheme = await this.goodsKeyRepository.findOne({
      where: { id: schemeId, sellerId },
    });

    if (!scheme) {
      throw new NotFoundException('关键词方案不存在');
    }

    const detail = this.keywordDetailRepository.create({
      ...dto,
      goodsKeyId: schemeId,
    });

    return this.keywordDetailRepository.save(detail);
  }

  async updateKeywordDetail(
    detailId: string,
    sellerId: string,
    dto: UpdateKeywordDetailDto,
  ): Promise<KeywordDetail> {
    const detail = await this.keywordDetailRepository.findOne({
      where: { id: detailId },
      relations: ['goodsKey'],
    });

    if (!detail || detail.goodsKey.sellerId !== sellerId) {
      throw new NotFoundException('关键词不存在');
    }

    Object.assign(detail, dto);
    return this.keywordDetailRepository.save(detail);
  }

  async deleteKeywordDetail(
    detailId: string,
    sellerId: string,
  ): Promise<boolean> {
    const detail = await this.keywordDetailRepository.findOne({
      where: { id: detailId },
      relations: ['goodsKey'],
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
      order: { createdAt: 'ASC' },
    });
  }

  // ============ 后台管理接口 ============

  /**
   * 后台添加关键词方案 (管理员权限)
 *
   * 业务语义: 后台管理员添加关键词方案
   */
  async adminCreateScheme(
    sellerId: string,
    dto: CreateGoodsKeyDto,
    operatorName: string,
  ): Promise<{ success: boolean; message: string; data?: GoodsKey }> {
    try {
      if (!sellerId) {
        return { success: false, message: '参数错误！' };
      }
      if (!dto.name) {
        return { success: false, message: '请填写方案名称！' };
      }
      if (!dto.details || dto.details.length === 0) {
        return { success: false, message: '请填写关键词' };
      }

      // 过滤空关键词
      const validDetails = dto.details.filter(
        (d) => d.keyword && d.keyword.trim(),
      );
      if (validDetails.length === 0) {
        return { success: false, message: '请填写关键词' };
      }

      const scheme = this.goodsKeyRepository.create({
        sellerId,
        name: dto.name,
        platform: dto.platform,
      });

      const savedScheme = await this.goodsKeyRepository.save(scheme);

      // 创建关键词详情
      const details = validDetails.map((d) =>
        this.keywordDetailRepository.create({
          keyword: d.keyword.trim(),
          terminal: d.terminal,
          discount: d.discount,
          filter: d.filter,
          sort: d.sort,
          maxPrice: d.maxPrice,
          minPrice: d.minPrice,
          province: d.province,
          goodsKeyId: savedScheme.id,
        }),
      );
      await this.keywordDetailRepository.save(details);

      console.log(
        `[AdminLog] 添加关键词方案 - 管理员${operatorName}操作: 方案名称${dto.name}`,
      );

      const result = await this.findSchemeById(savedScheme.id);
      return { success: true, message: '添加方案成功', data: result! };
    } catch (error) {
      return { success: false, message: error.message || '添加失败' };
    }
  }

  /**
   * 后台修改关键词方案 (管理员权限)
 *
   * 业务语义: 后台管理员修改关键词方案（删除旧关键词，添加新关键词）
   */
  async adminUpdateScheme(
    schemeId: string,
    dto: CreateGoodsKeyDto,
    operatorName: string,
  ): Promise<{ success: boolean; message: string; data?: GoodsKey }> {
    try {
      if (!schemeId) {
        return { success: false, message: '参数错误！' };
      }
      if (!dto.name) {
        return { success: false, message: '请填写方案名称！' };
      }

      const scheme = await this.goodsKeyRepository.findOne({
        where: { id: schemeId },
      });
      if (!scheme) {
        return { success: false, message: '方案不存在！' };
      }

      // 过滤空关键词
      const validDetails = (dto.details || []).filter(
        (d) => d.keyword && d.keyword.trim(),
      );
      if (validDetails.length === 0) {
        return { success: false, message: '请填写关键词' };
      }

      // 更新方案名称
      scheme.name = dto.name;
      if (dto.platform) scheme.platform = dto.platform;
      await this.goodsKeyRepository.save(scheme);

      // 删除旧关键词
      await this.keywordDetailRepository.delete({ goodsKeyId: schemeId });

      // 添加新关键词
      const details = validDetails.map((d) =>
        this.keywordDetailRepository.create({
          keyword: d.keyword.trim(),
          terminal: d.terminal,
          discount: d.discount,
          filter: d.filter,
          sort: d.sort,
          maxPrice: d.maxPrice,
          minPrice: d.minPrice,
          province: d.province,
          goodsKeyId: schemeId,
        }),
      );
      await this.keywordDetailRepository.save(details);

      console.log(
        `[AdminLog] 修改关键词方案 - 管理员${operatorName}操作: 方案ID${schemeId}, 名称${dto.name}`,
      );

      const result = await this.findSchemeById(schemeId);
      return { success: true, message: '修改方案成功', data: result! };
    } catch (error) {
      return { success: false, message: error.message || '修改失败' };
    }
  }
}
