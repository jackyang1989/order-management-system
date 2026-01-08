import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  HelpArticle,
  ArticleType,
  CreateHelpArticleDto,
  UpdateHelpArticleDto,
} from './help-article.entity';

@Injectable()
export class HelpCenterService {
  constructor(
    @InjectRepository(HelpArticle)
    private articleRepo: Repository<HelpArticle>,
  ) {}

  /**
   * 获取已发布的文章列表（按类型分组）
   */
  async getPublishedArticles(): Promise<{
    announcements: HelpArticle[];
    faqs: HelpArticle[];
    guides: HelpArticle[];
  }> {
    const articles = await this.articleRepo.find({
      where: { isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    return {
      announcements: articles.filter(a => a.type === ArticleType.ANNOUNCEMENT),
      faqs: articles.filter(a => a.type === ArticleType.FAQ),
      guides: articles.filter(a => a.type === ArticleType.GUIDE),
    };
  }

  /**
   * 获取单个文章详情
   */
  async getArticle(id: string): Promise<HelpArticle | null> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (article) {
      // 增加浏览量
      article.viewCount += 1;
      await this.articleRepo.save(article);
    }
    return article;
  }

  /**
   * 搜索文章
   */
  async searchArticles(
    keyword: string,
    type?: ArticleType,
  ): Promise<HelpArticle[]> {
    const query = this.articleRepo
      .createQueryBuilder('a')
      .where('a.isPublished = :published', { published: true })
      .andWhere('(a.title LIKE :keyword OR a.content LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });

    if (type) {
      query.andWhere('a.type = :type', { type });
    }

    return query.orderBy('a.sortOrder', 'ASC').getMany();
  }

  /**
   * 按类型获取文章列表
   */
  async getArticlesByType(
    type: ArticleType,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ list: HelpArticle[]; total: number }> {
    const [list, total] = await this.articleRepo.findAndCount({
      where: { type, isPublished: true },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { list, total };
  }

  // ============ 管理端方法 ============

  /**
   * 获取所有文章（包括未发布）
   */
  async getAllArticles(
    type?: ArticleType,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ list: HelpArticle[]; total: number }> {
    const query = this.articleRepo.createQueryBuilder('a');

    if (type) {
      query.where('a.type = :type', { type });
    }

    const [list, total] = await query
      .orderBy('a.sortOrder', 'ASC')
      .addOrderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { list, total };
  }

  /**
   * 创建文章
   */
  async createArticle(dto: CreateHelpArticleDto): Promise<HelpArticle> {
    const article = this.articleRepo.create({
      title: dto.title,
      content: dto.content,
      type: dto.type || ArticleType.FAQ,
      sortOrder: dto.sortOrder || 0,
      isPublished: dto.isPublished !== false,
    });
    return this.articleRepo.save(article);
  }

  /**
   * 更新文章
   */
  async updateArticle(
    id: string,
    dto: UpdateHelpArticleDto,
  ): Promise<HelpArticle | null> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) return null;

    Object.assign(article, dto);
    return this.articleRepo.save(article);
  }

  /**
   * 删除文章
   */
  async deleteArticle(id: string): Promise<boolean> {
    const result = await this.articleRepo.delete(id);
    return (result.affected || 0) > 0;
  }

  /**
   * 切换发布状态
   */
  async togglePublish(id: string): Promise<HelpArticle | null> {
    const article = await this.articleRepo.findOne({ where: { id } });
    if (!article) return null;

    article.isPublished = !article.isPublished;
    return this.articleRepo.save(article);
  }
}
