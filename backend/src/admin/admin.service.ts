import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThan } from 'typeorm';
import { User } from '../users/user.entity';
import { Merchant, MerchantStatus } from '../merchants/merchant.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { TaskGoods, TaskKeyword } from '../task-goods/task-goods.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { Withdrawal, WithdrawalStatus } from '../withdrawals/withdrawal.entity';
import { WithdrawalsService } from '../withdrawals/withdrawals.service';
import { FinanceRecord, FinanceType, FinanceMoneyType } from '../finance-records/finance-record.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskGoods)
    private taskGoodsRepository: Repository<TaskGoods>,
    @InjectRepository(TaskKeyword)
    private taskKeywordRepository: Repository<TaskKeyword>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Withdrawal)
    private withdrawalsRepository: Repository<Withdrawal>,
    @InjectRepository(FinanceRecord)
    private financeRecordRepository: Repository<FinanceRecord>,
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
    todayWithdrawalAmount: number;
    todayRechargeAmount: number;
    todayTasks: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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

    // 今日任务数
    const todayTasks = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.createdAt >= :today', { today })
      .getCount();

    // 今日提现金额（已审核通过或已完成的）
    const withdrawResult = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'total')
      .where('w.createdAt BETWEEN :start AND :end', { start: today, end: todayEnd })
      .andWhere('w.status IN (:...statuses)', { statuses: [WithdrawalStatus.APPROVED_PENDING_TRANSFER, WithdrawalStatus.COMPLETED] })
      .getRawOne();

    // 今日充值金额
    const rechargeResult = await this.financeRecordRepository
      .createQueryBuilder('f')
      .select('SUM(f.amount)', 'total')
      .where('f.createdAt BETWEEN :start AND :end', { start: today, end: todayEnd })
      .andWhere('f.financeType IN (:...types)', { types: [FinanceType.BUYER_RECHARGE, FinanceType.BUYER_RECHARGE_SILVER, FinanceType.MERCHANT_RECHARGE] })
      .getRawOne();

    return {
      totalUsers,
      totalMerchants,
      totalTasks,
      totalOrders,
      pendingMerchants,
      pendingWithdrawals,
      todayUsers,
      todayOrders,
      todayWithdrawalAmount: Number(withdrawResult?.total || 0),
      todayRechargeAmount: Number(rechargeResult?.total || 0),
      todayTasks,
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
    keyword?: string,
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

    if (keyword) {
      const condition = status !== undefined ? 'andWhere' : 'where';
      query[condition](
        '(merchant.username ILIKE :keyword OR merchant.phone ILIKE :keyword OR merchant.wechat ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    const total = await query.getCount();
    const merchants = await query
      .select([
        'merchant.id',
        'merchant.username',
        'merchant.phone',
        'merchant.wechat',
        'merchant.companyName',
        'merchant.balance',
        'merchant.frozenBalance',
        'merchant.silver',
        'merchant.vip',
        'merchant.vipExpireAt',
        'merchant.status',
        'merchant.referrerId',
        'merchant.note',
        'merchant.createdAt',
      ])
      .orderBy('merchant.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Enrich with referrer name
    const data = await Promise.all(
      merchants.map(async (m) => {
        let referrerName = '';
        if (m.referrerId) {
          const referrer = await this.merchantsRepository.findOne({
            where: { id: m.referrerId },
            select: ['username'],
          });
          referrerName = referrer?.username || '';
        }
        return { ...m, referrerName };
      }),
    );

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
    data: (Task & { goodsList?: TaskGoods[]; keywords?: TaskKeyword[] })[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.merchant', 'merchant');

    if (status !== undefined) {
      query.where('task.status = :status', { status });
    }

    const total = await query.getCount();
    const tasks = await query
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Fetch goodsList and keywords for each task
    const taskIds = tasks.map(t => t.id);
    const allGoodsList = taskIds.length > 0
      ? await this.taskGoodsRepository.find({
          where: taskIds.map(id => ({ taskId: id })),
          order: { createdAt: 'ASC' },
        })
      : [];
    const allKeywords = taskIds.length > 0
      ? await this.taskKeywordRepository.find({
          where: taskIds.map(id => ({ taskId: id })),
          order: { createdAt: 'ASC' },
        })
      : [];

    // Group by taskId
    const goodsByTask = new Map<string, TaskGoods[]>();
    const keywordsByTask = new Map<string, TaskKeyword[]>();
    for (const goods of allGoodsList) {
      if (!goodsByTask.has(goods.taskId)) {
        goodsByTask.set(goods.taskId, []);
      }
      goodsByTask.get(goods.taskId)!.push(goods);
    }
    for (const keyword of allKeywords) {
      if (!keywordsByTask.has(keyword.taskId)) {
        keywordsByTask.set(keyword.taskId, []);
      }
      keywordsByTask.get(keyword.taskId)!.push(keyword);
    }

    // Attach to tasks
    const data = tasks.map(task => ({
      ...task,
      goodsList: goodsByTask.get(task.id) || [],
      keywords: keywordsByTask.get(task.id) || [],
    }));

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
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.withdrawalsRepository.createQueryBuilder('withdrawal');

    if (status !== undefined) {
      query.where('withdrawal.status = :status', { status });
    }

    const total = await query.getCount();
    const withdrawals = await query
      .orderBy('withdrawal.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Enrich with username from User or Merchant based on ownerType
    const data = await Promise.all(
      withdrawals.map(async (w) => {
        let username = '';
        let userType = 1; // 1=buyer, 2=merchant
        if (w.ownerType === 'merchant') {
          const merchant = await this.merchantsRepository.findOne({
            where: { id: w.ownerId },
            select: ['username'],
          });
          username = merchant?.username || '';
          userType = 2;
        } else {
          const user = await this.usersRepository.findOne({
            where: { id: w.ownerId || w.userId },
            select: ['username'],
          });
          username = user?.username || '';
          userType = 1;
        }
        return {
          ...w,
          username,
          userType,
        };
      }),
    );

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
      ? WithdrawalStatus.APPROVED_PENDING_TRANSFER
      : WithdrawalStatus.REJECTED;
    return this.withdrawalsService.review(id, { status, remark }, adminId || 'admin');
  }

  /**
   * 确认提现已打款
   * 将状态从APPROVED_PENDING_TRANSFER变为COMPLETED
   */
  async confirmWithdrawalPayment(
    id: string,
    adminId: string,
  ): Promise<Withdrawal | null> {
    const withdrawal = await this.withdrawalsRepository.findOne({
      where: { id, status: WithdrawalStatus.APPROVED_PENDING_TRANSFER },
    });
    if (!withdrawal) {
      return null;
    }
    withdrawal.status = WithdrawalStatus.COMPLETED;
    withdrawal.completedAt = new Date();
    if (adminId) {
      withdrawal.remark = (withdrawal.remark || '') + ` [已打款 by ${adminId}]`;
    }
    return this.withdrawalsRepository.save(withdrawal);
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
            ? WithdrawalStatus.APPROVED_PENDING_TRANSFER
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

  // ============ 经营概况统计 ============

  /**
   * 获取经营概况 - 今日/昨日/本周/本月数据对比
   */
  async getBusinessOverview(): Promise<{
    today: BusinessMetrics;
    yesterday: BusinessMetrics;
    thisWeek: BusinessMetrics;
    thisMonth: BusinessMetrics;
  }> {
    const now = new Date();

    // 今日
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    // 昨日
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);
    yesterdayEnd.setMilliseconds(-1);

    // 本周（周一开始）
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay() || 7;
    weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);

    // 本月
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, yesterday, thisWeek, thisMonth] = await Promise.all([
      this.getMetricsForPeriod(todayStart, todayEnd),
      this.getMetricsForPeriod(yesterdayStart, yesterdayEnd),
      this.getMetricsForPeriod(weekStart, todayEnd),
      this.getMetricsForPeriod(monthStart, todayEnd),
    ]);

    return { today, yesterday, thisWeek, thisMonth };
  }

  private async getMetricsForPeriod(start: Date, end: Date): Promise<BusinessMetrics> {
    // 订单统计
    const ordersQuery = this.ordersRepository
      .createQueryBuilder('o')
      .where('o.createdAt BETWEEN :start AND :end', { start, end });

    const orderCount = await ordersQuery.getCount();
    const completedOrders = await ordersQuery.clone()
      .andWhere('o.status IN (:...statuses)', { statuses: [OrderStatus.APPROVED, OrderStatus.COMPLETED] })
      .getCount();

    // 交易金额统计
    const amountResult = await this.ordersRepository
      .createQueryBuilder('o')
      .select('SUM(o.productPrice)', 'totalAmount')
      .addSelect('SUM(o.commission)', 'totalCommission')
      .addSelect('SUM(o.userDivided)', 'totalUserDivided')
      .where('o.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('o.status IN (:...statuses)', { statuses: [OrderStatus.APPROVED, OrderStatus.COMPLETED] })
      .getRawOne();

    // 新增用户统计
    const newUsers = await this.usersRepository
      .createQueryBuilder('u')
      .where('u.createdAt BETWEEN :start AND :end', { start, end })
      .getCount();

    const newMerchants = await this.merchantsRepository
      .createQueryBuilder('m')
      .where('m.createdAt BETWEEN :start AND :end', { start, end })
      .getCount();

    // 任务统计
    const newTasks = await this.tasksRepository
      .createQueryBuilder('t')
      .where('t.createdAt BETWEEN :start AND :end', { start, end })
      .getCount();

    return {
      orderCount,
      completedOrders,
      totalAmount: Number(amountResult?.totalAmount || 0),
      totalCommission: Number(amountResult?.totalCommission || 0),
      totalUserDivided: Number(amountResult?.totalUserDivided || 0),
      newUsers,
      newMerchants,
      newTasks,
    };
  }

  // ============ 资金大盘统计 ============

  /**
   * 获取资金大盘 - 平台资金流转统计
   */
  async getFundOverview(): Promise<{
    userBalance: { total: number; frozen: number };
    merchantBalance: { total: number; frozen: number };
    userSilver: number;
    merchantSilver: number;
    todayRecharge: number;
    todayWithdraw: number;
    todayCommission: number;
    pendingWithdraw: number;
  }> {
    // 用户余额汇总
    const userBalanceResult = await this.usersRepository
      .createQueryBuilder('u')
      .select('SUM(u.balance)', 'total')
      .addSelect('SUM(u.silver)', 'silver')
      .getRawOne();

    // 商家余额汇总
    const merchantBalanceResult = await this.merchantsRepository
      .createQueryBuilder('m')
      .select('SUM(m.balance)', 'total')
      .addSelect('SUM(m.frozenBalance)', 'frozen')
      .addSelect('SUM(m.silver)', 'silver')
      .getRawOne();

    // 今日时间范围
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 今日充值金额
    const rechargeResult = await this.financeRecordRepository
      .createQueryBuilder('f')
      .select('SUM(f.amount)', 'total')
      .where('f.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .andWhere('f.financeType IN (:...types)', { types: [FinanceType.BUYER_RECHARGE, FinanceType.BUYER_RECHARGE_SILVER, FinanceType.MERCHANT_RECHARGE] })
      .getRawOne();

    // 今日提现金额
    const withdrawResult = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'total')
      .where('w.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .andWhere('w.status IN (:...statuses)', { statuses: [WithdrawalStatus.APPROVED_PENDING_TRANSFER, WithdrawalStatus.COMPLETED] })
      .getRawOne();

    // 今日佣金发放
    const commissionResult = await this.financeRecordRepository
      .createQueryBuilder('f')
      .select('SUM(f.amount)', 'total')
      .where('f.createdAt BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
      .andWhere('f.financeType = :type', { type: FinanceType.BUYER_TASK_COMMISSION })
      .getRawOne();

    // 待处理提现
    const pendingWithdrawResult = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'total')
      .where('w.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    return {
      userBalance: {
        total: Number(userBalanceResult?.total || 0),
        frozen: 0,
      },
      merchantBalance: {
        total: Number(merchantBalanceResult?.total || 0),
        frozen: Number(merchantBalanceResult?.frozen || 0),
      },
      userSilver: Number(userBalanceResult?.silver || 0),
      merchantSilver: Number(merchantBalanceResult?.silver || 0),
      todayRecharge: Number(rechargeResult?.total || 0),
      todayWithdraw: Number(withdrawResult?.total || 0),
      todayCommission: Number(commissionResult?.total || 0),
      pendingWithdraw: Number(pendingWithdrawResult?.total || 0),
    };
  }

  // ============ 用户增长趋势 ============

  /**
   * 获取用户增长趋势 - 过去N天每日新增
   */
  async getUserGrowthTrend(days: number = 30): Promise<{
    dates: string[];
    users: number[];
    merchants: number[];
  }> {
    const dates: string[] = [];
    const users: number[] = [];
    const merchants: number[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dateStr = dayStart.toISOString().split('T')[0];
      dates.push(dateStr);

      const userCount = await this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .getCount();
      users.push(userCount);

      const merchantCount = await this.merchantsRepository
        .createQueryBuilder('m')
        .where('m.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .getCount();
      merchants.push(merchantCount);
    }

    return { dates, users, merchants };
  }

  /**
   * 获取订单趋势 - 过去N天每日订单量
   */
  async getOrderTrend(days: number = 30): Promise<{
    dates: string[];
    orders: number[];
    completed: number[];
    amount: number[];
  }> {
    const dates: string[] = [];
    const orders: number[] = [];
    const completed: number[] = [];
    const amount: number[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dateStr = dayStart.toISOString().split('T')[0];
      dates.push(dateStr);

      const orderCount = await this.ordersRepository
        .createQueryBuilder('o')
        .where('o.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .getCount();
      orders.push(orderCount);

      const completedCount = await this.ordersRepository
        .createQueryBuilder('o')
        .where('o.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .andWhere('o.status IN (:...statuses)', { statuses: [OrderStatus.APPROVED, OrderStatus.COMPLETED] })
        .getCount();
      completed.push(completedCount);

      const amountResult = await this.ordersRepository
        .createQueryBuilder('o')
        .select('SUM(o.productPrice)', 'total')
        .where('o.createdAt BETWEEN :start AND :end', { start: dayStart, end: dayEnd })
        .andWhere('o.status IN (:...statuses)', { statuses: [OrderStatus.APPROVED, OrderStatus.COMPLETED] })
        .getRawOne();
      amount.push(Number(amountResult?.total || 0));
    }

    return { dates, orders, completed, amount };
  }
}

export interface BusinessMetrics {
  orderCount: number;
  completedOrders: number;
  totalAmount: number;
  totalCommission: number;
  totalUserDivided: number;
  newUsers: number;
  newMerchants: number;
  newTasks: number;
}
