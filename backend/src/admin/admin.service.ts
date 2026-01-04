import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { Merchant, MerchantStatus } from '../merchants/merchant.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Withdrawal, WithdrawalStatus } from '../withdrawals/withdrawal.entity';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Withdrawal)
    private withdrawalsRepository: Repository<Withdrawal>,
    private withdrawalsService: WithdrawalsService,
  ) { }

  // ============ 平台统计 ============
  async getStats(): Promise<{
    totalUsers: number;
    totalMerchants: number;
    totalTasks: number;
    totalOrders: number;
    pendingMerchants: number;
    pendingWithdrawals: number;
    todayUsers: number;
    todayOrders: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalUsers = await this.usersRepository.count();
    const totalMerchants = await this.merchantsRepository.count();
    const totalTasks = await this.tasksRepository.count();
    const totalOrders = await this.ordersRepository.count();

    const pendingMerchants = await this.merchantsRepository.count({
      where: { status: MerchantStatus.PENDING },
    });
    const pendingWithdrawals = await this.withdrawalsRepository.count({
      where: { status: WithdrawalStatus.PENDING },
    });

    const todayUsers = await this.usersRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :today', { today })
      .getCount();

    const todayOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.createdAt >= :today', { today })
      .getCount();

    return {
      totalUsers,
      totalMerchants,
      totalTasks,
      totalOrders,
      pendingMerchants,
      pendingWithdrawals,
      todayUsers,
      todayOrders,
    };
  }

  // ============ 用户管理 ============
  async getUsers(
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (search) {
      query.where('user.username ILIKE :search OR user.phone ILIKE :search', {
        search: `%${search}%`,
      });
    }

    const total = await query.getCount();
    const data = await query
      .select([
        'user.id',
        'user.username',
        'user.phone',
        'user.balance',
        'user.status',
        'user.createdAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUserStatus(id: string, active: boolean): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return null;
    // Note: User entity may need status field added for full support
    return this.usersRepository.save(user);
  }

  // ============ 商家管理 ============
  async getMerchants(
    page = 1,
    limit = 20,
    status?: MerchantStatus,
  ): Promise<{
    data: Merchant[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.merchantsRepository.createQueryBuilder('merchant');

    if (status !== undefined) {
      query.where('merchant.status = :status', { status });
    }

    const total = await query.getCount();
    const data = await query
      .select([
        'merchant.id',
        'merchant.username',
        'merchant.phone',
        'merchant.companyName',
        'merchant.balance',
        'merchant.status',
        'merchant.createdAt',
      ])
      .orderBy('merchant.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveMerchant(
    id: string,
    approved: boolean,
  ): Promise<Merchant | null> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) return null;
    merchant.status = approved
      ? MerchantStatus.APPROVED
      : MerchantStatus.REJECTED;
    return this.merchantsRepository.save(merchant);
  }

  // ============ 任务管理 ============
  async getTasks(
    page = 1,
    limit = 20,
    status?: number,
  ): Promise<{
    data: Task[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.tasksRepository.createQueryBuilder('task');

    if (status !== undefined) {
      query.where('task.status = :status', { status });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateTaskStatus(id: string, status: number): Promise<Task | null> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    if (!task) return null;
    task.status = status;
    return this.tasksRepository.save(task);
  }

  // ============ 提现审核 ============
  async getWithdrawals(
    page = 1,
    limit = 20,
    status?: WithdrawalStatus,
  ): Promise<{
    data: Withdrawal[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.withdrawalsRepository.createQueryBuilder('withdrawal');

    if (status !== undefined) {
      query.where('withdrawal.status = :status', { status });
    }

    const total = await query.getCount();
    const data = await query
      .orderBy('withdrawal.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async approveWithdrawal(
    id: string,
    approved: boolean,
    remark?: string,
    adminId?: string,
  ): Promise<Withdrawal | null> {
    const status = approved
      ? WithdrawalStatus.APPROVED
      : WithdrawalStatus.REJECTED;
    return this.withdrawalsService.review(id, { status, remark }, adminId || 'admin');
  }

  // ============ 批量提现审核 ============
  async batchApproveWithdrawals(
    ids: string[],
    approved: boolean,
    remark?: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of ids) {
      try {
        const withdrawal = await this.withdrawalsRepository.findOne({
          where: { id, status: WithdrawalStatus.PENDING },
        });
        if (withdrawal) {
          withdrawal.status = approved
            ? WithdrawalStatus.APPROVED
            : WithdrawalStatus.REJECTED;
          if (remark) withdrawal.remark = remark;
          await this.withdrawalsRepository.save(withdrawal);
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

  // ============ 用户/商家余额管理 ============

  /**
   * 管理员调整用户余额
 *
   */
  async adjustUserBalance(
    userId: string,
    type: 'balance' | 'silver',
    amount: number,
    reason: string,
    operatorId: string,
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, newBalance: 0, error: '用户不存在' };
    }

    const currentValue =
      type === 'balance' ? Number(user.balance) : Number(user.silver);
    const newValue = currentValue + amount;

    if (newValue < 0) {
      return {
        success: false,
        newBalance: currentValue,
        error: '余额不能为负数',
      };
    }

    if (type === 'balance') {
      user.balance = newValue;
    } else {
      user.silver = newValue;
    }

    await this.usersRepository.save(user);

    return { success: true, newBalance: newValue };
  }

  /**
   * 管理员调整商家余额
 *
   */
  async adjustMerchantBalance(
    merchantId: string,
    type: 'balance' | 'silver',
    amount: number,
    reason: string,
    operatorId: string,
  ): Promise<{ success: boolean; newBalance: number; error?: string }> {
    const merchant = await this.merchantsRepository.findOne({
      where: { id: merchantId },
    });
    if (!merchant) {
      return { success: false, newBalance: 0, error: '商家不存在' };
    }

    const currentValue =
      type === 'balance' ? Number(merchant.balance) : Number(merchant.silver);
    const newValue = currentValue + amount;

    if (newValue < 0) {
      return {
        success: false,
        newBalance: currentValue,
        error: '余额不能为负数',
      };
    }

    if (type === 'balance') {
      merchant.balance = newValue;
    } else {
      merchant.silver = newValue;
    }

    await this.merchantsRepository.save(merchant);

    return { success: true, newBalance: newValue };
  }

  /**
   * 获取用户详细信息（包含余额）
   */
  async getUserDetail(userId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  /**
   * 获取商家详细信息（包含余额）
   */
  async getMerchantDetail(merchantId: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { id: merchantId } });
  }

  /**
   * 设置用户VIP状态
 *
   */
  async setUserVip(
    userId: string,
    vip: boolean,
    expireAt?: Date,
  ): Promise<{ success: boolean; error?: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    user.vip = vip;
    if (vip && expireAt) {
      user.vipExpireAt = expireAt;
    } else if (!vip) {
      user.vipExpireAt = undefined;
    }

    await this.usersRepository.save(user);
    return { success: true };
  }

  /**
   * 设置商家VIP状态
   */
  async setMerchantVip(
    merchantId: string,
    vip: boolean,
    expireAt?: Date,
  ): Promise<{ success: boolean; error?: string }> {
    const merchant = await this.merchantsRepository.findOne({
      where: { id: merchantId },
    });
    if (!merchant) {
      return { success: false, error: '商家不存在' };
    }

    merchant.vip = vip;
    if (vip && expireAt) {
      merchant.vipExpireAt = expireAt;
    } else if (!vip) {
      merchant.vipExpireAt = undefined as any;
    }

    await this.merchantsRepository.save(merchant);
    return { success: true };
  }
}
