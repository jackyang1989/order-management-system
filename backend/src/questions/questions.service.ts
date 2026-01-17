import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  QuestionScheme,
  QuestionDetail,
  CreateQuestionSchemeDto,
  UpdateQuestionSchemeDto,
  CreateQuestionDetailDto,
  UpdateQuestionDetailDto,
} from './question.entity';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(QuestionScheme)
    private questionSchemeRepository: Repository<QuestionScheme>,
    @InjectRepository(QuestionDetail)
    private questionDetailRepository: Repository<QuestionDetail>,
  ) {}

  // ============ 问题模板方案 CRUD ============
  async findAllSchemes(sellerId: string, shopId?: string): Promise<QuestionScheme[]> {
    const where: any = { sellerId };
    if (shopId) {
      where.shopId = shopId;
    }
    return this.questionSchemeRepository.find({
      where,
      relations: ['details'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSchemeById(
    id: string,
    sellerId?: string,
  ): Promise<QuestionScheme | null> {
    const where: any = { id };
    if (sellerId) where.sellerId = sellerId;

    return this.questionSchemeRepository.findOne({
      where,
      relations: ['details'],
    });
  }

  async createScheme(
    sellerId: string,
    dto: CreateQuestionSchemeDto,
  ): Promise<QuestionScheme> {
    const scheme = this.questionSchemeRepository.create({
      sellerId,
      shopId: dto.shopId,
      name: dto.name,
      description: dto.description,
    });

    const savedScheme = await this.questionSchemeRepository.save(scheme);
    return this.findSchemeById(savedScheme.id) as Promise<QuestionScheme>;
  }

  async updateScheme(
    id: string,
    sellerId: string,
    dto: UpdateQuestionSchemeDto,
  ): Promise<QuestionScheme> {
    const scheme = await this.questionSchemeRepository.findOne({
      where: { id, sellerId },
    });

    if (!scheme) {
      throw new NotFoundException('问题模板方案不存在');
    }

    Object.assign(scheme, dto);
    if (dto.description !== undefined) {
      scheme.description = dto.description;
    }
    if (dto.shopId !== undefined) {
      scheme.shopId = dto.shopId;
    }
    await this.questionSchemeRepository.save(scheme);
    return this.findSchemeById(id) as Promise<QuestionScheme>;
  }

  async deleteScheme(id: string, sellerId: string): Promise<boolean> {
    const scheme = await this.questionSchemeRepository.findOne({
      where: { id, sellerId },
    });

    if (!scheme) {
      throw new NotFoundException('问题模板方案不存在');
    }

    await this.questionSchemeRepository.remove(scheme);
    return true;
  }

  // ============ 问题模板详情 CRUD ============
  async findDetailsByScheme(schemeId: string): Promise<QuestionDetail[]> {
    return this.questionDetailRepository.find({
      where: { questionSchemeId: schemeId },
      order: { createdAt: 'ASC' },
    });
  }

  async addQuestionDetail(
    schemeId: string,
    sellerId: string,
    dto: CreateQuestionDetailDto,
  ): Promise<QuestionDetail> {
    // 验证方案是否存在且属于该商家
    const scheme = await this.questionSchemeRepository.findOne({
      where: { id: schemeId, sellerId },
    });

    if (!scheme) {
      throw new NotFoundException('问题模板方案不存在');
    }

    const detail = this.questionDetailRepository.create({
      questionSchemeId: schemeId,
      question: dto.question,
    });

    return this.questionDetailRepository.save(detail);
  }

  async updateQuestionDetail(
    detailId: string,
    sellerId: string,
    dto: UpdateQuestionDetailDto,
  ): Promise<QuestionDetail> {
    const detail = await this.questionDetailRepository.findOne({
      where: { id: detailId },
      relations: ['questionScheme'],
    });

    if (!detail || detail.questionScheme.sellerId !== sellerId) {
      throw new NotFoundException('问题模板不存在');
    }

    Object.assign(detail, dto);
    return this.questionDetailRepository.save(detail);
  }

  async deleteQuestionDetail(detailId: string, sellerId: string): Promise<boolean> {
    const detail = await this.questionDetailRepository.findOne({
      where: { id: detailId },
      relations: ['questionScheme'],
    });

    if (!detail || detail.questionScheme.sellerId !== sellerId) {
      throw new NotFoundException('问题模板不存在');
    }

    await this.questionDetailRepository.remove(detail);
    return true;
  }
}
