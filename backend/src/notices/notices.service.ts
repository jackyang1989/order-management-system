import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import {
  Notice,
  NoticeRead,
  NoticeStatus,
  NoticeTarget,
  CreateNoticeDto,
  UpdateNoticeDto,
} from './notice.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    @InjectRepository(NoticeRead)
    private noticeReadRepository: Repository<NoticeRead>,
  ) {}

  // ============ 前台接口 ============

  /**
   * 获取公告列表（用户端）
   */
  async findPublished(
    target: NoticeTarget = NoticeTarget.ALL,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Notice[]; total: number; page: number; limit: number }> {
    const now = new Date();

    const queryBuilder = this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.status = :status', { status: NoticeStatus.PUBLISHED })
      .andWhere('(notice.target = :all OR notice.target = :target)', {
        all: NoticeTarget.ALL,
        target,
      })
      .andWhere('(notice.expiredAt IS NULL OR notice.expiredAt > :now)', {
        now,
      });

    queryBuilder.orderBy('notice.isTop', 'DESC');
    queryBuilder.addOrderBy('notice.sort', 'DESC');
    queryBuilder.addOrderBy('notice.publishedAt', 'DESC');

    queryBuilder.skip((page - 1) * limit);
    queryBuilder.take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total, page, limit };
  }

  /**
   * 获取公告详情
   */
  async findOne(id: string): Promise<Notice | null> {
    return this.noticeRepository.findOne({ where: { id } });
  }

  /**
   * 获取公告详情（用户端，增加浏览次数）
   */
  async findOneForUser(
    id: string,
    userId?: string,
    userType?: number,
  ): Promise<Notice | null> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) return null;

    // 增加浏览次数
    notice.viewCount += 1;
    await this.noticeRepository.save(notice);

    // 记录已读
    if (userId && userType) {
      await this.markAsRead(id, userId, userType);
    }

    return notice;
  }

  /**
   * 获取弹窗公告
   */
  async findPopupNotices(
    target: NoticeTarget = NoticeTarget.ALL,
  ): Promise<Notice[]> {
    const now = new Date();

    return this.noticeRepository.find({
      where: {
        status: NoticeStatus.PUBLISHED,
        isPopup: true,
      },
      order: { sort: 'DESC', publishedAt: 'DESC' },
      take: 5,
    });
  }

  /**
   * 获取未读公告数量
   */
  async getUnreadCount(
    userId: string,
    userType: number,
    target: NoticeTarget,
  ): Promise<number> {
    const now = new Date();

    // 获取已读的公告ID列表
    const readRecords = await this.noticeReadRepository.find({
      where: { userId, userType },
      select: ['noticeId'],
    });
    const readIds = readRecords.map((r) => r.noticeId);

    const queryBuilder = this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.status = :status', { status: NoticeStatus.PUBLISHED })
      .andWhere('(notice.target = :all OR notice.target = :target)', {
        all: NoticeTarget.ALL,
        target,
      })
      .andWhere('(notice.expiredAt IS NULL OR notice.expiredAt > :now)', {
        now,
      });

    if (readIds.length > 0) {
      queryBuilder.andWhere('notice.id NOT IN (:...readIds)', { readIds });
    }

    return queryBuilder.getCount();
  }

  /**
   * 标记为已读
   */
  async markAsRead(
    noticeId: string,
    userId: string,
    userType: number,
  ): Promise<void> {
    const existing = await this.noticeReadRepository.findOne({
      where: { noticeId, userId },
    });

    if (!existing) {
      await this.noticeReadRepository.save(
        this.noticeReadRepository.create({
          noticeId,
          userId,
          userType,
        }),
      );
    }
  }

  /**
   * 标记所有为已读
   */
  async markAllAsRead(
    userId: string,
    userType: number,
    target: NoticeTarget,
  ): Promise<void> {
    const now = new Date();

    const notices = await this.noticeRepository.find({
      where: { status: NoticeStatus.PUBLISHED },
      select: ['id'],
    });

    for (const notice of notices) {
      await this.markAsRead(notice.id, userId, userType);
    }
  }

  // ============ 管理后台接口 ============

  /**
   * 获取所有公告（管理端）
   */
  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: NoticeStatus,
  ): Promise<{ data: Notice[]; total: number; page: number; limit: number }> {
    const where: any = {};
    if (status !== undefined) {
      where.status = status;
    }

    const [data, total] = await this.noticeRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * 创建公告
   */
  async create(
    createDto: CreateNoticeDto,
    adminId?: string,
    adminName?: string,
  ): Promise<Notice> {
    const notice = this.noticeRepository.create({
      ...createDto,
      adminId,
      adminName,
      status: NoticeStatus.DRAFT,
    });

    return this.noticeRepository.save(notice);
  }

  /**
   * 更新公告
   */
  async update(id: string, updateDto: UpdateNoticeDto): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    Object.assign(notice, updateDto);
    return this.noticeRepository.save(notice);
  }

  /**
   * 发布公告
   */
  async publish(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    notice.status = NoticeStatus.PUBLISHED;
    notice.publishedAt = new Date();
    return this.noticeRepository.save(notice);
  }

  /**
   * 撤回公告
   */
  async unpublish(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    notice.status = NoticeStatus.DRAFT;
    return this.noticeRepository.save(notice);
  }

  /**
   * 归档公告
   */
  async archive(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    notice.status = NoticeStatus.ARCHIVED;
    return this.noticeRepository.save(notice);
  }

  /**
   * 删除公告
   */
  async delete(id: string): Promise<void> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    // 删除相关已读记录
    await this.noticeReadRepository.delete({ noticeId: id });
    await this.noticeRepository.remove(notice);
  }

  /**
   * 置顶/取消置顶
   */
  async toggleTop(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('公告不存在');
    }

    notice.isTop = !notice.isTop;
    return this.noticeRepository.save(notice);
  }
}
