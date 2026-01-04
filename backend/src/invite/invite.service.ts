import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserInvite } from '../user-invites/user-invite.entity';
import { User } from '../users/user.entity';
import { Order, OrderStatus } from '../orders/order.entity';

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
  ) {}

  /**
   * 获取邀请记录
   * 对齐旧版: Invite::record()
   */
  async record(
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

    const [invites, total] = await this.inviteRepository.findAndCount({
      where: { inviterId: userId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // 获取被邀请用户的信息
    const list = await Promise.all(
      invites.map(async (invite) => {
        const invitee = await this.userRepository.findOne({
          where: { id: invite.inviteeId },
          select: ['id', 'username', 'phone', 'vip', 'vipExpireAt', 'createdAt'],
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
          inviteeName: invitee?.username || '未知用户',
          inviteePhone: invitee?.phone
            ? invitee.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
            : '',
          inviteeVip: invitee?.vip || false,
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
      select: ['id', 'username'],
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const list = orders.map((order) => ({
      id: order.id,
      orderId: order.id,
      taskTitle: order.taskTitle || '未知任务',
      username: userMap.get(order.userId)?.username || '未知用户',
      completedAt: order.updatedAt,
      commissionAmount: Number(order.commission) || 0,
      month: order.updatedAt
        ? new Date(order.updatedAt).toISOString().substring(0, 7)
        : '',
    }));

    return { list, total, page, limit };
  }
}
