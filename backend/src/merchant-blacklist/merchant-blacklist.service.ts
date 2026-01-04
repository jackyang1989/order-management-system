import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import {
  MerchantBlacklist,
  BlacklistType,
  BlacklistStatus,
  CreateBlacklistDto,
  UpdateBlacklistDto,
  BlacklistFilterDto,
} from './merchant-blacklist.entity';

@Injectable()
export class MerchantBlacklistService {
  constructor(
    @InjectRepository(MerchantBlacklist)
    private blacklistRepository: Repository<MerchantBlacklist>,
  ) {}

  // 获取商家的黑名单列表
  async findAll(
    sellerId: string,
    filter?: BlacklistFilterDto,
  ): Promise<{
    data: MerchantBlacklist[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter?.page || 1;
    const limit = filter?.limit || 20;

    const queryBuilder = this.blacklistRepository
      .createQueryBuilder('bl')
      .where('bl.sellerId = :sellerId', { sellerId });

    if (filter?.accountName) {
      queryBuilder.andWhere('bl.accountName LIKE :accountName', {
        accountName: `%${filter.accountName}%`,
      });
    }

    if (filter?.type !== undefined) {
      queryBuilder.andWhere('bl.type = :type', { type: filter.type });
    }

    if (filter?.status !== undefined) {
      queryBuilder.andWhere('bl.status = :status', { status: filter.status });
    }

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('bl.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  // 创建黑名单记录
  async create(
    sellerId: string,
    dto: CreateBlacklistDto,
  ): Promise<MerchantBlacklist> {
    // 检查是否已存在
    const existing = await this.blacklistRepository.findOne({
      where: {
        sellerId,
        accountName: dto.accountName,
        status: BlacklistStatus.APPROVED,
      },
    });

    if (existing) {
      throw new BadRequestException('该账号已在黑名单中');
    }

    const blacklist = this.blacklistRepository.create({
      sellerId,
      accountName: dto.accountName,
      type: dto.type ?? BlacklistType.PERMANENT,
      status: BlacklistStatus.APPROVED, // 直接通过，不需要审核
      endTime: dto.endTime ? new Date(dto.endTime) : null,
      reason: dto.reason,
    });

    return this.blacklistRepository.save(blacklist);
  }

  // 更新黑名单记录
  async update(
    id: string,
    sellerId: string,
    dto: UpdateBlacklistDto,
  ): Promise<MerchantBlacklist> {
    const blacklist = await this.blacklistRepository.findOne({
      where: { id, sellerId },
    });

    if (!blacklist) {
      throw new NotFoundException('黑名单记录不存在');
    }

    if (dto.accountName) blacklist.accountName = dto.accountName;
    if (dto.type !== undefined) blacklist.type = dto.type;
    if (dto.endTime !== undefined) {
      blacklist.endTime = dto.endTime ? new Date(dto.endTime) : null;
    }
    if (dto.reason !== undefined) blacklist.reason = dto.reason;

    return this.blacklistRepository.save(blacklist);
  }

  // 删除黑名单记录
  async delete(id: string, sellerId: string): Promise<void> {
    const blacklist = await this.blacklistRepository.findOne({
      where: { id, sellerId },
    });

    if (!blacklist) {
      throw new NotFoundException('黑名单记录不存在');
    }

    await this.blacklistRepository.remove(blacklist);
  }

  // 检查账号是否在商家黑名单中
  async isBlacklisted(sellerId: string, accountName: string): Promise<boolean> {
    const now = new Date();

    // 查找有效的黑名单记录
    const blacklist = await this.blacklistRepository.findOne({
      where: [
        // 永久拉黑
        {
          sellerId,
          accountName,
          status: BlacklistStatus.APPROVED,
          type: BlacklistType.PERMANENT,
        },
        // 限时拉黑且未过期
        {
          sellerId,
          accountName,
          status: BlacklistStatus.APPROVED,
          type: BlacklistType.TEMPORARY,
          endTime: MoreThan(now),
        },
      ],
    });

    return !!blacklist;
  }

  // 获取商家黑名单账号列表（用于任务接单校验）
  async getBlacklistedAccounts(sellerId: string): Promise<string[]> {
    const now = new Date();

    const blacklists = await this.blacklistRepository.find({
      where: [
        {
          sellerId,
          status: BlacklistStatus.APPROVED,
          type: BlacklistType.PERMANENT,
        },
      ],
      select: ['accountName'],
    });

    // 查询限时拉黑且未过期的
    const tempBlacklists = await this.blacklistRepository
      .createQueryBuilder('bl')
      .where('bl.sellerId = :sellerId', { sellerId })
      .andWhere('bl.status = :status', { status: BlacklistStatus.APPROVED })
      .andWhere('bl.type = :type', { type: BlacklistType.TEMPORARY })
      .andWhere('bl.endTime > :now', { now })
      .select(['bl.accountName'])
      .getMany();

    const accounts = new Set<string>();
    blacklists.forEach((b) => accounts.add(b.accountName));
    tempBlacklists.forEach((b) => accounts.add(b.accountName));

    return Array.from(accounts);
  }
}
