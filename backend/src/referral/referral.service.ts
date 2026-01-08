import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ReferralReward,
  ReferralRewardType,
  ReferralRewardStatus,
} from './referral-reward.entity';
import { User } from '../users/user.entity';
import { SystemConfig } from '../admin-config/config.entity';
import {
  FinanceRecord,
  FinanceType,
  FinanceUserType,
  FinanceMoneyType,
} from '../finance-records/finance-record.entity';
import {
  UserInvite,
  ReferralBondStatus,
} from '../user-invites/user-invite.entity';

/**
 * 推荐奖励与活跃熔断服务
 *
 * 核心逻辑：
 * 1. 双30天守卫：推荐人和被推荐人都必须在30天内完成过任务
 * 2. 双上限校验：单日次数上限 + 单日金额上限
 * 3. 终身上限：单个被推荐人对推荐人的终身奖励上限
 * 4. 原子事务：所有余额更新使用事务保证一致性
 */
@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  // P1: 里程碑奖励已删除，改为简化的每单1银锭（上限10单）模式

  constructor(
    @InjectRepository(ReferralReward)
    private rewardRepository: Repository<ReferralReward>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SystemConfig)
    private configRepository: Repository<SystemConfig>,
    @InjectRepository(FinanceRecord)
    private financeRecordRepository: Repository<FinanceRecord>,
    @InjectRepository(UserInvite)
    private userInviteRepository: Repository<UserInvite>,
    private dataSource: DataSource,
  ) { }

  // ============ 系统配置获取 ============

  /**
   * 获取系统配置值
   */
  private async getConfig(key: string, defaultValue: number): Promise<number> {
    const config = await this.configRepository.findOne({ where: { key } });
    return config ? parseFloat(config.value) : defaultValue;
  }

  // ============ 核心方法：处理订单完成推荐奖励 ============

  /**
   * 处理订单完成推荐奖励
   *
   * @param orderId 订单ID
   * @param buyerId 买手ID
   * @param taskNumber 任务编号（用于日志）
   * @returns 是否成功发放奖励
   *
   * 业务逻辑：
   * 1. 查找被推荐人的推荐人
   * 2. 双30天守卫检查（推荐人和被推荐人都必须活跃）
   * 3. 检查推荐关系是否已熔断
   * 4. 双上限校验（每日次数 + 每日金额）
   * 5. 终身上限校验
   * 6. 原子事务发放奖励
   */
  async processReferralBonus(
    orderId: string,
    buyerId: string,
    taskNumber?: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 获取买手信息
      const buyer = await queryRunner.manager.findOne(User, {
        where: { id: buyerId },
      });
      if (!buyer || !buyer.referrerId) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 2. 获取推荐人信息
      const referrer = await queryRunner.manager.findOne(User, {
        where: { id: buyer.referrerId },
      });
      if (!referrer) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 3. 获取推荐关系记录
      const inviteRecord = await queryRunner.manager.findOne(UserInvite, {
        where: { inviteeId: buyerId },
      });

      // 4. 检查推荐关系是否已熔断
      if (inviteRecord?.bondStatus === ReferralBondStatus.BROKEN) {
        this.logger.log(
          `推荐关系已熔断，不发放奖励: ${buyer.referrerId} -> ${buyerId}`,
        );
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 5. 双30天守卫检查
      const activeDays = await this.getConfig('referral_active_days', 30);
      const activeThreshold = new Date();
      activeThreshold.setDate(activeThreshold.getDate() - activeDays);

      // 5.1 检查推荐人活跃状态
      if (!referrer.lastTaskAt || referrer.lastTaskAt < activeThreshold) {
        this.logger.log(
          `推荐人 ${referrer.id} 超过${activeDays}天未完成任务，不发放奖励`,
        );
        // 标记熔断
        if (inviteRecord) {
          inviteRecord.bondStatus = ReferralBondStatus.BROKEN;
          inviteRecord.bondBrokenAt = new Date();
          await queryRunner.manager.save(inviteRecord);
        }
        await queryRunner.commitTransaction();
        return false;
      }

      // 5.2 检查被推荐人活跃状态（当前正在完成任务，所以会更新lastTaskAt）
      // 这里不需要检查buyer的lastTaskAt，因为他刚完成任务

      // 6. 获取配置参数 (P1简化版)
      const rewardPerOrder = await this.getConfig(
        'invite_reward_amount',
        1,
      );
      const maxOrdersPerInvitee = await this.getConfig('invite_max_orders', 10);

      // 7. P1简化: 检查该被邀请人已贡献的单数是否达到上限
      const earnedCount = inviteRecord?.earnedCount || 0;
      if (earnedCount >= maxOrdersPerInvitee) {
        this.logger.log(
          `被邀请人 ${buyerId} 已贡献 ${earnedCount} 单，达到上限 ${maxOrdersPerInvitee}，不再发放奖励`,
        );
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 8. 计算实际奖励金额
      const actualReward = rewardPerOrder;

      if (actualReward <= 0) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      // 10. 创建奖励记录
      const reward = queryRunner.manager.create(ReferralReward, {
        userId: buyer.referrerId,
        referredUserId: buyerId,
        type: ReferralRewardType.BUYER_ORDER,
        amount: actualReward,
        status: ReferralRewardStatus.PAID, // 直接发放
        relatedOrderId: orderId,
        remark: `推广买家(${buyer.username})任务${taskNumber || orderId}已完成,奖励${actualReward}银锭`,
        paidAt: new Date(),
      });
      await queryRunner.manager.save(reward);

      // 11. 更新推荐人余额（银锭）
      referrer.silver = Number(referrer.silver) + actualReward;
      referrer.reward = Number(referrer.reward || 0) + actualReward;
      referrer.referralReward = Number(referrer.referralReward || 0) + actualReward;
      referrer.referralRewardToday =
        Number(referrer.referralRewardToday || 0) + actualReward;
      await queryRunner.manager.save(referrer);

      // 12. 创建财务记录
      const financeRecord = queryRunner.manager.create(FinanceRecord, {
        userId: buyer.referrerId,
        userType: FinanceUserType.BUYER,
        moneyType: FinanceMoneyType.SILVER,
        financeType: FinanceType.REWARD,
        amount: actualReward,
        balanceAfter: referrer.silver,
        memo: `推广买家(${buyer.username})任务完成,奖励${actualReward}银锭`,
        relatedId: reward.id,
        relatedType: 'referral_reward',
      });
      await queryRunner.manager.save(financeRecord);

      // 13. 更新邀请记录的累计统计
      if (inviteRecord) {
        inviteRecord.earnedCount = (inviteRecord.earnedCount || 0) + 1;
        inviteRecord.earnedAmount =
          Number(inviteRecord.earnedAmount || 0) + actualReward;
        await queryRunner.manager.save(inviteRecord);
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `推荐奖励发放成功: ${buyer.referrerId} 获得 ${actualReward} 银锭 (来自 ${buyerId})`,
      );

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`推荐奖励发放失败: ${error.message}`, error.stack);
      return false;
    } finally {
      await queryRunner.release();
    }
  }

  // ============ 活跃生命周期同步 ============

  /**
   * 更新用户最后任务完成时间
   * 在订单完成时调用，用于维护30天活跃状态
   */
  async updateUserLastTaskAt(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastTaskAt: new Date(),
    });
  }

  /**
   * 检查并恢复推荐关系
   * 当双方都再次活跃时，可以恢复熔断的推荐关系
   */
  async checkAndRestoreBond(inviteeId: string): Promise<void> {
    const inviteRecord = await this.userInviteRepository.findOne({
      where: { inviteeId, bondStatus: ReferralBondStatus.BROKEN },
    });

    if (!inviteRecord) return;

    // 检查推荐人是否活跃
    const referrer = await this.userRepository.findOne({
      where: { id: inviteRecord.inviterId },
    });

    if (!referrer || !referrer.lastTaskAt) return;

    const activeDays = await this.getConfig('referral_active_days', 30);
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - activeDays);

    if (referrer.lastTaskAt >= activeThreshold) {
      // 推荐人活跃，恢复关系
      inviteRecord.bondStatus = ReferralBondStatus.ACTIVE;
      inviteRecord.bondBrokenAt = undefined as unknown as Date;
      await this.userInviteRepository.save(inviteRecord);

      this.logger.log(
        `推荐关系已恢复: ${inviteRecord.inviterId} -> ${inviteeId}`,
      );
    }
  }

  // ============ 定时任务：每日熔断检查 ============

  /**
   * 每日凌晨2点执行熔断检查
   * 将超过30天未活跃的推荐关系标记为BROKEN
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async dailyBondCheck(): Promise<void> {
    this.logger.log('开始执行每日推荐关系熔断检查...');

    const activeDays = await this.getConfig('referral_active_days', 30);
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - activeDays);

    // 查找所有活跃状态的推荐关系
    const activeInvites = await this.userInviteRepository.find({
      where: { bondStatus: ReferralBondStatus.ACTIVE },
    });

    let brokenCount = 0;

    for (const invite of activeInvites) {
      // 检查推荐人活跃状态
      const referrer = await this.userRepository.findOne({
        where: { id: invite.inviterId },
      });

      const invitee = await this.userRepository.findOne({
        where: { id: invite.inviteeId },
      });

      // 任一方超过30天未活跃则熔断
      const referrerInactive =
        !referrer?.lastTaskAt || referrer.lastTaskAt < activeThreshold;
      const inviteeInactive =
        !invitee?.lastTaskAt || invitee.lastTaskAt < activeThreshold;

      if (referrerInactive || inviteeInactive) {
        invite.bondStatus = ReferralBondStatus.BROKEN;
        invite.bondBrokenAt = new Date();
        await this.userInviteRepository.save(invite);
        brokenCount++;

        this.logger.log(
          `推荐关系熔断: ${invite.inviterId} -> ${invite.inviteeId} (${referrerInactive ? '推荐人' : '被推荐人'}不活跃)`,
        );
      }
    }

    this.logger.log(`每日熔断检查完成，共熔断 ${brokenCount} 个推荐关系`);
  }

  /**
   * 每日0点重置今日推荐奖励统计
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyReferralReward(): Promise<void> {
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ referralRewardToday: 0 })
      .execute();

    this.logger.log('已重置所有用户今日推荐奖励统计');
  }

  // P1: 里程碑奖励方法已删除，改为简化的每单1银锭（上限10单）

  // ============ 注册推荐奖励 ============

  /**
   * 处理新用户注册推荐奖励
   */
  async handleUserRegistration(
    userId: string,
    referrerId: string,
    userType: 'buyer' | 'merchant',
  ): Promise<void> {
    if (!referrerId) return;

    const referrer = await this.userRepository.findOne({
      where: { id: referrerId },
    });
    if (!referrer) return;

    // 获取推荐奖励金额
    const rewardAmount =
      userType === 'buyer'
        ? await this.getConfig('buyer_referral_reward', 5)
        : await this.getConfig('merchant_referral_reward', 10);

    // 创建推荐奖励记录
    const reward = this.rewardRepository.create({
      userId: referrerId,
      referredUserId: userId,
      type:
        userType === 'buyer'
          ? ReferralRewardType.BUYER_REFERRAL
          : ReferralRewardType.MERCHANT_REFERRAL,
      amount: rewardAmount,
      status: ReferralRewardStatus.PENDING,
      remark: `推荐新${userType === 'buyer' ? '买手' : '商家'}注册奖励`,
    });

    await this.rewardRepository.save(reward);

    // 更新推荐人的推荐计数
    referrer.referralCount = (referrer.referralCount || 0) + 1;
    await this.userRepository.save(referrer);

    this.logger.log(
      `用户 ${referrerId} 推荐新用户 ${userId} 注册，待发放奖励 ${rewardAmount}`,
    );
  }

  // ============ 统计查询 ============

  /**
   * 获取用户推荐统计
   */
  async getUserReferralStats(userId: string): Promise<{
    totalReferrals: number;
    totalReward: number;
    todayReward: number;
    pendingReward: number;
    activeReferrals: number;
    brokenReferrals: number;
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    const pendingReward = await this.rewardRepository
      .createQueryBuilder('reward')
      .where('reward.userId = :userId', { userId })
      .andWhere('reward.status = :status', {
        status: ReferralRewardStatus.PENDING,
      })
      .select('SUM(reward.amount)', 'total')
      .getRawOne();

    // 统计活跃和熔断的推荐关系
    const activeReferrals = await this.userInviteRepository.count({
      where: { inviterId: userId, bondStatus: ReferralBondStatus.ACTIVE },
    });

    const brokenReferrals = await this.userInviteRepository.count({
      where: { inviterId: userId, bondStatus: ReferralBondStatus.BROKEN },
    });

    return {
      totalReferrals: user?.referralCount || 0,
      totalReward: Number(user?.referralReward || 0),
      todayReward: Number(user?.referralRewardToday || 0),
      pendingReward: Number(pendingReward?.total || 0),
      activeReferrals,
      brokenReferrals,
    };
  }

  /**
   * 获取用户的推荐奖励记录
   */
  async getUserRewards(userId: string): Promise<ReferralReward[]> {
    return this.rewardRepository.find({
      where: { userId },
      relations: ['referredUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取推荐的用户列表
   */
  async getReferredUsers(userId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { referrerId: userId },
      select: ['id', 'username', 'createdAt', 'isActive', 'lastTaskAt'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 生成邀请码
   * 简单实现：使用用户ID的后6位作为邀请码
   */
  async generateInviteCode(userId: string): Promise<string> {
    // 使用用户ID生成唯一邀请码
    // 实际生产环境可能需要更复杂的逻辑
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }
    // 使用用户名或手机号的hash作为邀请码
    const baseCode = user.username || user.id;
    const hash = baseCode
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `INV${hash.toString(36).toUpperCase().padStart(6, '0')}`;
  }
}
