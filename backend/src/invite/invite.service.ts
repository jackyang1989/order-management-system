import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { UserInvite } from '../user-invites/user-invite.entity';
import { User } from '../users/user.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { AdminConfigService } from '../admin-config/admin-config.service';

/**
 * 邀请记录筛选参数
 */
export interface InviteRecordFilter {
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

/**
 * 邀请/推荐服务
 * 对齐旧版 PHP: Recommend::getCTask()
 */
@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(UserInvite)
    private inviteRepository: Repository<UserInvite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private configService: AdminConfigService,
  ) { }

  /**
   * 获取邀请记录
   * 对齐旧版: Invite::record()
   * 支持日期筛选和关键词搜索
   */
  async record(
    userId: string,
    page: number = 1,
    limit: number = 15,
    filter?: InviteRecordFilter,
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    // 构建查询条件
    const queryBuilder = this.inviteRepository
      .createQueryBuilder('invite')
      .where('invite.inviterId = :userId', { userId })
      .orderBy('invite.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    // 日期筛选
    if (filter?.startDate) {
      queryBuilder.andWhere('invite.createdAt >= :startDate', {
        startDate: new Date(filter.startDate),
      });
    }
    if (filter?.endDate) {
      const endDate = new Date(filter.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('invite.createdAt <= :endDate', { endDate });
    }

    const [invites, total] = await queryBuilder.getManyAndCount();

    // 获取被邀请用户的信息
    const list = await Promise.all(
      invites.map(async (invite) => {
        const invitee = await this.userRepository.findOne({
          where: { id: invite.inviteeId },
          select: ['id', 'userNo', 'phone', 'createdAt'],
        });

        // 获取被邀请用户完成的订单数
        const completedOrders = await this.orderRepository.count({
          where: {
            userId: invite.inviteeId,
            status: OrderStatus.COMPLETED,
          },
        });

        return {
          id: invite.id,
          inviteeId: invite.inviteeId,
          inviteeName: invitee?.userNo || '未知用户',
          inviteePhone: invitee?.phone
            ? invitee.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : '',
          completedOrders,
          rewardAmount: invite.rewardAmount || 0,
          rewardStatus: invite.status, // 使用 status 字段代替 rewardStatus
          createdAt: invite.createdAt,
        };
      }),
    );

    return { list, total, page, limit };
  }

  /**
   * 获取推荐任务（被邀请用户完成的任务）
   * 对齐旧版: Recommend::getCTask()
   */
  async recommendedTasks(
    userId: string,
    page: number = 1,
    limit: number = 15,
  ): Promise<{
    list: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const skip = (page - 1) * limit;

    // 获取我邀请的用户ID列表
    const myInvites = await this.inviteRepository.find({
      where: { inviterId: userId },
      select: ['inviteeId'],
    });

    if (myInvites.length === 0) {
      return { list: [], total: 0, page, limit };
    }

    const inviteeIds = myInvites
      .map((i) => i.inviteeId)
      .filter((id) => id != null);

    if (inviteeIds.length === 0) {
      return { list: [], total: 0, page, limit };
    }

    // 获取被邀请用户完成的订单
    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        userId: In(inviteeIds),
        status: OrderStatus.COMPLETED,
      },
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    // 获取用户信息
    const userIds = [...new Set(orders.map((o) => o.userId))];
    const users = await this.userRepository.find({
      where: { id: In(userIds) },
      select: ['id', 'userNo'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = orders.map((order) => ({
      id: order.id,
      orderId: order.id,
      taskTitle: order.taskTitle || '未知任务',
      username: userMap.get(order.userId)?.userNo || '未知用户',
      completedAt: order.updatedAt,
      commissionAmount: Number(order.commission) || 0,
      month: order.updatedAt
        ? new Date(order.updatedAt).toISOString().substring(0, 7)
        : '',
    }));

    return { list, total, page, limit };
  }

  /**
   * 获取邀请配置
   */
  async getInviteConfig(): Promise<{
    merchantInviteEnabled: boolean;
    inviteUnlockThreshold: number;
    referralRewardPerOrder: number;
    referralMaxCount: number;
    referralMaxAmount: number;
    referralLifetimeMaxAmount: number;
    buyerReferralReward: number;
    merchantReferralReward: number;
  }> {
    return {
      merchantInviteEnabled: this.configService.getBooleanValue('merchant_invite_enabled', false),
      inviteUnlockThreshold: this.configService.getNumberValue('invite_unlock_threshold', 10),
      referralRewardPerOrder: this.configService.getNumberValue('referral_reward_per_order', 1),
      referralMaxCount: this.configService.getNumberValue('referral_max_count', 5),
      referralMaxAmount: this.configService.getNumberValue('referral_max_amount', 5),
      referralLifetimeMaxAmount: this.configService.getNumberValue('referral_lifetime_max_amount', 1000),
      buyerReferralReward: this.configService.getNumberValue('buyer_referral_reward', 5),
      merchantReferralReward: this.configService.getNumberValue('merchant_referral_reward', 10),
    };
  }

  /**
   * 检查用户是否可以使用商家邀请功能
   */
  async canInviteMerchant(userId: string): Promise<{
    canInvite: boolean;
    reason?: string;
    completedTasks: number;
    requiredTasks: number;
  }> {
    const config = await this.getInviteConfig();

    if (!config.merchantInviteEnabled) {
      return {
        canInvite: false,
        reason: '商家邀请功能暂未开放',
        completedTasks: 0,
        requiredTasks: config.inviteUnlockThreshold,
      };
    }

    // 获取用户完成的任务数
    const completedTasks = await this.orderRepository.count({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
      },
    });

    if (completedTasks < config.inviteUnlockThreshold) {
      return {
        canInvite: false,
        reason: `需完成${config.inviteUnlockThreshold}单任务后解锁`,
        completedTasks,
        requiredTasks: config.inviteUnlockThreshold,
      };
    }

    return {
      canInvite: true,
      completedTasks,
      requiredTasks: config.inviteUnlockThreshold,
    };
  }

  /**
   * 检查用户是否具备邀请资格（通用）
   * 仅检查任务完成数门槛，不受 merchant_invite_enabled 影响
   */
  async checkInviteEligibility(userId: string): Promise<{
    canInvite: boolean;
    reason?: string;
    completedTasks: number;
    requiredTasks: number;
  }> {
    const config = await this.getInviteConfig();

    // 获取用户完成的任务数
    const completedTasks = await this.orderRepository.count({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
      },
    });

    if (completedTasks < config.inviteUnlockThreshold) {
      return {
        canInvite: false,
        reason: `需完成${config.inviteUnlockThreshold}单任务后解锁`,
        completedTasks,
        requiredTasks: config.inviteUnlockThreshold,
      };
    }

    return {
      canInvite: true,
      completedTasks,
      requiredTasks: config.inviteUnlockThreshold,
    };
  }
}
