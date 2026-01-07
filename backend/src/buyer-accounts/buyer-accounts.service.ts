import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import {
  BuyerAccount,
  BuyerAccountStatus,
  BuyerAccountPlatform,
  CreateBuyerAccountDto,
  UpdateBuyerAccountDto,
} from './buyer-account.entity';
import { UsersService } from '../users/users.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class BuyerAccountsService {
  constructor(
    @InjectRepository(BuyerAccount)
    private buyerAccountsRepository: Repository<BuyerAccount>,
    private usersService: UsersService,
    private systemConfigService: SystemConfigService,
  ) { }

  async findAllByUser(
    userId: string,
    includeAll: boolean = false,
  ): Promise<BuyerAccount[]> {
    const where: any = { userId };
    if (!includeAll) {
      // 默认不包含已删除的
      where.status = BuyerAccountStatus.APPROVED;
    }
    return this.buyerAccountsRepository.find({
      where: includeAll
        ? [
          { userId, status: BuyerAccountStatus.PENDING },
          { userId, status: BuyerAccountStatus.APPROVED },
          { userId, status: BuyerAccountStatus.REJECTED },
        ]
        : where,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BuyerAccount | null> {
    return this.buyerAccountsRepository.findOne({
      where: { id, userId },
    });
  }

  async create(
    userId: string,
    createDto: CreateBuyerAccountDto,
  ): Promise<BuyerAccount> {
    // 检查 同一用户 + 同一平台 + 同一账号 唯一性
    // 允许: 同一账号在不同平台绑定
    // 禁止: 同一用户在同一平台重复绑定同一账号
    const existing = await this.buyerAccountsRepository.findOne({
      where: {
        userId,
        platform: createDto.platform || BuyerAccountPlatform.TAOBAO,
        platformAccount: createDto.platformAccount,
        status: Not(BuyerAccountStatus.DELETED),
      },
    });
    if (existing) {
      throw new BadRequestException('该平台下此账号已绑定');
    }

    const buyerAccount = this.buyerAccountsRepository.create({
      userId,
      platform: createDto.platform || BuyerAccountPlatform.TAOBAO,
      platformAccount: createDto.platformAccount,
      province: createDto.province,
      city: createDto.city,
      district: createDto.district,
      buyerName: createDto.buyerName,
      buyerPhone: createDto.buyerPhone,
      fullAddress: createDto.fullAddress,
      realName: createDto.realName,
      // 常用登陆地
      loginProvince: createDto.loginProvince,
      loginCity: createDto.loginCity,
      // 收货地址备注
      addressRemark: createDto.addressRemark,
      // 图片字段
      idCardImage: createDto.idCardImage,
      payAuthImg: createDto.payAuthImg,
      profileImg: createDto.profileImg,
      creditImg: createDto.creditImg,
      scoreImg: createDto.scoreImg,
      status: BuyerAccountStatus.PENDING, // 改为待审核，需管理员审核
      star: 1, // 初始1星
    });

    return this.buyerAccountsRepository.save(buyerAccount);
  }

  async update(
    id: string,
    userId: string,
    updateDto: UpdateBuyerAccountDto,
  ): Promise<BuyerAccount> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('买号不存在');
    }

    Object.assign(account, updateDto);
    return this.buyerAccountsRepository.save(account);
  }

  async delete(id: string, userId: string): Promise<void> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('买号不存在');
    }

    // 软删除
    account.status = BuyerAccountStatus.DELETED;
    await this.buyerAccountsRepository.save(account);
  }

  async getCount(userId: string): Promise<number> {
    return this.buyerAccountsRepository.count({
      where: { userId, status: BuyerAccountStatus.APPROVED },
    });
  }

  // ============ 星级限价和月度限额逻辑 ============

  /**
   * 星级对应的最高商品价格限制
   * 1星: 100元, 2星: 500元, 3星: 1000元, 4星: 1500元, 5星: 2000元
   */
  static readonly STAR_PRICE_LIMITS: Record<number, number> = {
    1: 100,
    2: 500,
    3: 1000,
    4: 2000,
    5: 99999,
  };

  /**
   * 每月最大任务数限制
   */
  static readonly MONTHLY_TASK_LIMIT = 220;

  /**
   * 检查买号是否可以接取指定价格的任务
   * @param buyerAccountId 买号ID
   * @param userId 用户ID
   * @param productPrice 商品价格
   * @returns 验证结果
   */
  async validateTaskEligibility(
    buyerAccountId: string,
    userId: string,
    productPrice: number,
  ): Promise<{ eligible: boolean; reason?: string }> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id: buyerAccountId, userId },
    });

    if (!account) {
      return { eligible: false, reason: '买号不存在' };
    }

    // P0-3: 验证买号所属权
    if (account.userId !== userId) {
      return { eligible: false, reason: '买号不属于当前用户' };
    }

    if (account.status !== BuyerAccountStatus.APPROVED) {
      return { eligible: false, reason: '买号状态异常，无法接单' };
    }

    // P0-3: 检查冻结时间（旧版逻辑: Task.php Line 269-273）
    if (account.frozenTime) {
      const now = new Date();
      if (new Date(account.frozenTime) > now) {
        const frozenDate = new Date(account.frozenTime);
        return {
          eligible: false,
          reason: `买号已被冻结，解冻时间: ${frozenDate.toLocaleString('zh-CN')}`,
        };
      }
    }

    // P1: 从动态配置读取星级限价
    const starPriceLimits = await this.systemConfigService.getStarPriceLimits();
    const priceLimit = starPriceLimits[account.star] || 100;
    if (productPrice > priceLimit) {
      return {
        eligible: false,
        reason: `当前买号星级(${account.star}星)最高可接${priceLimit}元任务，该任务商品价格${productPrice}元超出限制`,
      };
    }

    // 检查并重置月度计数
    await this.checkAndResetMonthlyCount(account);

    // 检查月度限额
    if (account.monthlyTaskCount >= BuyerAccountsService.MONTHLY_TASK_LIMIT) {
      return {
        eligible: false,
        reason: `当前买号本月已完成${account.monthlyTaskCount}个任务，已达到月度上限${BuyerAccountsService.MONTHLY_TASK_LIMIT}个`,
      };
    }

    return { eligible: true };
  }

  /**
   * 检查并重置月度计数（如果跨月了）
   */
  private async checkAndResetMonthlyCount(
    account: BuyerAccount,
  ): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    if (account.monthlyCountResetDate) {
      const resetDate = new Date(account.monthlyCountResetDate);
      const resetMonth = `${resetDate.getFullYear()}-${resetDate.getMonth() + 1}`;

      if (currentMonth !== resetMonth) {
        // 跨月了，重置计数
        account.monthlyTaskCount = 0;
        account.monthlyCountResetDate = now;
        await this.buyerAccountsRepository.save(account);
      }
    } else {
      // 首次设置重置日期
      account.monthlyCountResetDate = now;
      await this.buyerAccountsRepository.save(account);
    }
  }

  /**
   * 增加买号的月度任务计数，并检查是否需要自动升级星级
   * P1: 升星阶梯从动态配置读取
   */
  async incrementMonthlyTaskCount(buyerAccountId: string): Promise<void> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id: buyerAccountId },
    });

    if (account) {
      await this.checkAndResetMonthlyCount(account);
      account.monthlyTaskCount += 1;

      // 累计总任务数（用于星级升级判断）
      account.totalTaskCount = (account.totalTaskCount || 0) + 1;

      // P1: 从动态配置读取升星阶梯
      const starThresholds = await this.systemConfigService.getStarThresholds();
      const totalTasks = account.totalTaskCount;
      let newStar = 1; // 默认1星

      // 按阶梯判断应达到的星级 (thresholds: {2:30, 3:60, 4:90, 5:120})
      for (const [star, threshold] of Object.entries(starThresholds)) {
        if (totalTasks >= threshold) {
          newStar = Math.max(newStar, parseInt(star, 10));
        }
      }

      // 只升级不降级
      if (newStar > account.star) {
        account.star = newStar;
      }

      await this.buyerAccountsRepository.save(account);
    }
  }

  /**
   * 获取买号的接单能力信息
   */
  async getAccountCapability(
    buyerAccountId: string,
    userId: string,
  ): Promise<{
    star: number;
    maxPrice: number;
    monthlyUsed: number;
    monthlyLimit: number;
    remainingTasks: number;
  } | null> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id: buyerAccountId, userId },
    });

    if (!account) return null;

    await this.checkAndResetMonthlyCount(account);

    const maxPrice =
      BuyerAccountsService.STAR_PRICE_LIMITS[account.star] || 100;
    const remainingTasks = Math.max(
      0,
      BuyerAccountsService.MONTHLY_TASK_LIMIT - account.monthlyTaskCount,
    );

    return {
      star: account.star,
      maxPrice,
      monthlyUsed: account.monthlyTaskCount,
      monthlyLimit: BuyerAccountsService.MONTHLY_TASK_LIMIT,
      remainingTasks,
    };
  }

  // ============ 管理员操作 ============

  /**
   * 管理员设置买号星级
   */
  async setAccountStar(
    buyerAccountId: string,
    star: number,
  ): Promise<BuyerAccount> {
    if (star < 1 || star > 5) {
      throw new BadRequestException('星级必须在1-5之间');
    }

    const account = await this.buyerAccountsRepository.findOne({
      where: { id: buyerAccountId },
    });

    if (!account) {
      throw new NotFoundException('买号不存在');
    }

    account.star = star;
    return this.buyerAccountsRepository.save(account);
  }

  /**
   * 管理员审核买号
   */
  async reviewAccount(
    buyerAccountId: string,
    approved: boolean,
    rejectReason?: string,
  ): Promise<BuyerAccount> {
    const account = await this.buyerAccountsRepository.findOne({
      where: { id: buyerAccountId },
    });

    if (!account) {
      throw new NotFoundException('买号不存在');
    }

    if (approved) {
      // P0-2: 新人VIP奖励
      // 如果是用户首个通过审核的买号，自动赠送VIP (P1: 天数从配置读取)
      // 检查该用户是否已有APPROVED的买号
      const approvedCount = await this.buyerAccountsRepository.count({
        where: {
          userId: account.userId,
          status: BuyerAccountStatus.APPROVED,
        },
      });

      // 如果之前没有APPROVED的买号，说明是首个
      if (approvedCount === 0) {
        // P1: 从动态配置读取VIP天数
        const vipDays = await this.systemConfigService.getFirstAccountVipDays();
        await this.usersService.grantVip(account.userId, vipDays);
      }

      account.status = BuyerAccountStatus.APPROVED;
      account.rejectReason = undefined;
    } else {
      account.status = BuyerAccountStatus.REJECTED;
      account.rejectReason = rejectReason || '审核未通过';
    }

    return this.buyerAccountsRepository.save(account);
  }

  /**
   * 获取待审核买号列表（管理员用）
   */
  async getPendingAccounts(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: BuyerAccount[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.buyerAccountsRepository.findAndCount({
      where: { status: BuyerAccountStatus.PENDING },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * 获取所有买号列表（管理员用）
   */
  async getAllAccounts(
    page: number = 1,
    limit: number = 20,
    status?: BuyerAccountStatus,
  ): Promise<{
    data: BuyerAccount[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {};
    if (status !== undefined) {
      where.status = status;
    }

    const [data, total] = await this.buyerAccountsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  /**
   * 批量审核买号（管理员用）
   */
  async batchReviewAccounts(
    ids: string[],
    approved: boolean,
    rejectReason?: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const account = await this.buyerAccountsRepository.findOne({
          where: { id, status: BuyerAccountStatus.PENDING },
        });
        if (account) {
          if (approved) {
            account.status = BuyerAccountStatus.APPROVED;
            account.rejectReason = undefined;
          } else {
            account.status = BuyerAccountStatus.REJECTED;
            account.rejectReason = rejectReason || '审核未通过';
          }
          await this.buyerAccountsRepository.save(account);
          success++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }
}
