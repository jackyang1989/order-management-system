import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, Between } from 'typeorm';
import { User, CreateUserDto, UpdateUserDto } from './user.entity';
import { FundRecord, FundType, FundAction } from './fund-record.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import * as bcrypt from 'bcrypt';
import { AdminConfigService } from '../admin-config/admin-config.service';

// 用户统计数据接口
export interface UserProfileStats {
  totalPaidPrincipal: number; // 累计垫付本金
  monthlyRemainingTasks: number; // 本月剩余任务数 (220 - 已完成)
  totalCompletedTasks: number; // 累计完成任务数
  totalEarnedSilver: number; // 累计赚取银锭
  pendingMerchantSilver: number; // 待商家发放银锭
  frozenSilver: number; // 冻结的银锭
  silverToYuan: number; // 银锭折现金额 (按1:1)
  todayInvited: number; // 今日邀请人数
  totalInvited: number; // 总邀请人数
  pendingOrders: number; // 进行中订单数
  submittedOrders: number; // 待审核订单数
  experience: number; // 经验值

  // Legacy mapping fields
  allObtainReward: number; // $all_obtain_reward
  waitShopIssue: number; // $wait_shop_issue
  freezeReward: number; // $freeze_reward
  silverCny: number; // Silver to CNY value
}

@Injectable()
export class UsersService {
  // 每月最大任务限额
  private readonly MONTHLY_TASK_LIMIT = 220;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(FundRecord)
    private fundRecordRepository: Repository<FundRecord>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private configService: AdminConfigService,
  ) { }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find();
    return users.map((u) => this.sanitizeUser(u));
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user ? this.sanitizeUser(user) : null;
  }

  // 更新用户资料（头像、微信号等）
  async updateProfile(
    userId: string,
    data: { avatar?: string; wechat?: string },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.usersRepository.findOne({ where: { id: userId } });
      if (!user) {
        return { success: false, message: '用户不存在' };
      }

      // 更新字段
      if (data.avatar !== undefined) {
        user.avatar = data.avatar;
      }
      if (data.wechat !== undefined) {
        user.wechat = data.wechat;
      }

      await this.usersRepository.save(user);
      return { success: true, message: '更新成功' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: '更新失败' };
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByUserNo(userNo: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { userNo } });
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (!ids || ids.length === 0) return [];
    return this.usersRepository.findByIds(ids);
  }

  async findByInvitationCode(code: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { invitationCode: code } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 生成唯一邀请码
    let newInvitationCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    while (
      await this.usersRepository.findOne({
        where: { invitationCode: newInvitationCode },
      })
    ) {
      newInvitationCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
    }

    // 查找邀请人
    let invitedBy: string | undefined;
    if (createUserDto.invitationCode) {
      const referrer = await this.findByInvitationCode(
        createUserDto.invitationCode,
      );
      if (referrer) {
        invitedBy = referrer.id;
      }
    }

    // ============ P0-1 Fix: 注册赠送VIP + 银锭 ============
    // 计算VIP到期时间（管理员可以指定，否则使用默认值）
    let vipExpireDate: Date;
    let isVip: boolean;
    if (createUserDto.vipExpireAt) {
      vipExpireDate = new Date(createUserDto.vipExpireAt);
      isVip = vipExpireDate > new Date();
    } else {
      const registerVipDays = this.configService.getNumberValue('user_vip_time', 7);
      vipExpireDate = new Date();
      vipExpireDate.setDate(
        vipExpireDate.getDate() + registerVipDays,
      );
      isVip = true;
    }

    // 管理员可以指定初始余额
    const registerSilver = this.configService.getNumberValue('user_register_reward', 0);
    const initialBalance = createUserDto.balance ?? 0;
    const initialSilver = createUserDto.silver ?? registerSilver;

    // 生成用户编号 userNo (U + 5位数字)
    const userNo = await this.generateUserNo();

    const newUser = this.usersRepository.create({
      username: createUserDto.username,
      password: hashedPassword,
      phone: createUserDto.phone,
      wechat: createUserDto.wechat || '',
      vip: isVip, // P0-1: 注册即赠送VIP
      vipExpireAt: vipExpireDate, // P0-1: VIP到期时间
      balance: initialBalance,
      silver: initialSilver, // P0-1: 注册赠送银锭
      frozenSilver: 0,
      reward: initialSilver, // P0-1: 累计赚取银锭
      invitationCode: newInvitationCode,
      invitedBy: invitedBy,
      note: createUserDto.note || '',
      userNo,
    });

    const savedUser = await this.usersRepository.save(newUser);

    // P0-1: 记录注册赠送银锭的财务记录
    if (registerSilver > 0) {
      await this.fundRecordRepository.save({
        userId: savedUser.id,
        type: FundType.SILVER,
        action: FundAction.IN,
        amount: registerSilver,
        balance: registerSilver,
        description: '首次注册赠送银锭',
      });
    }

    return this.sanitizeUser(savedUser);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return null;

    Object.assign(user, updateUserDto);
    const updatedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(updatedUser);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return false;

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);
    return true;
  }

  async updatePayPassword(
    id: string,
    newPayPassword: string,
  ): Promise<boolean> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) return false;

    user.payPassword = await bcrypt.hash(newPayPassword, 10);
    await this.usersRepository.save(user);
    return true;
  }

  // 获取邀请统计
  async getInviteStats(userId: string): Promise<{
    totalInvited: number;
    todayInvited: number;
    totalReward: number;
    todayReward: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 查询被该用户邀请的所有用户
    const allInvitees = await this.usersRepository.find({
      where: { invitedBy: userId },
    });

    // 查询今日邀请的用户
    const todayInvitees = allInvitees.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= today,
    );

    // 计算奖励（简化：每邀请一人奖励1元，实际应该根据被邀请人完成的任务计算）
    const totalReward = allInvitees.length * 1;
    const todayReward = todayInvitees.length * 1;

    return {
      totalInvited: allInvitees.length,
      todayInvited: todayInvitees.length,
      totalReward,
      todayReward,
    };
  }

  // 获取邀请记录
  async getInviteRecords(userId: string): Promise<
    Array<{
      id: string;
      username: string;
      registerTime: string;
      completedTasks: number;
      reward: number;
    }>
  > {
    const invitees = await this.usersRepository.find({
      where: { invitedBy: userId },
      order: { createdAt: 'DESC' },
    });

    return invitees.map((u) => ({
      id: u.id,
      username: u.username,
      registerTime: u.createdAt?.toISOString() || '',
      completedTasks: 0, // TODO: 从订单表查询完成的任务数
      reward: 1, // 简化奖励计算
    }));
  }

  // 移除敏感信息
  private sanitizeUser(user: User): User {
    const { password, payPassword, ...sanitized } = user;
    return { ...sanitized, password: '', payPassword: '' } as User;
  }

  /**
   * 生成用户编号 (U + 5位数字)
   * 格式: U10001, U10002, ...
   */
  private async generateUserNo(): Promise<string> {
    // 查询最大的用户编号
    const lastUser = await this.usersRepository
      .createQueryBuilder('u')
      .where('u.userNo IS NOT NULL')
      .orderBy('u.userNo', 'DESC')
      .getOne();

    let nextNumber = 10001; // 起始编号

    if (lastUser && lastUser.userNo) {
      // 提取数字部分并加1
      const lastNumber = parseInt(lastUser.userNo.substring(1));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `U${nextNumber}`;
  }

  // 获取资金记录
  async getFundRecords(
    userId: string,
    type?: 'principal' | 'silver',
    action?: 'in' | 'out',
    page: number = 1,
    pageSize: number = 20,
  ): Promise<{ list: FundRecord[]; total: number }> {
    const queryBuilder = this.fundRecordRepository
      .createQueryBuilder('fr')
      .where('fr.userId = :userId', { userId });

    if (type) {
      queryBuilder.andWhere('fr.type = :type', { type });
    }

    if (action) {
      queryBuilder.andWhere('fr.action = :action', { action });
    }

    const [list, total] = await queryBuilder
      .orderBy('fr.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { list, total };
  }

  // 添加资金记录
  async addFundRecord(
    userId: string,
    type: FundType,
    action: FundAction,
    amount: number,
    description: string,
    options?: {
      orderId?: string;
      withdrawalId?: string;
      relatedUserId?: string;
    },
  ): Promise<FundRecord> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // 计算变动后余额
    let balance: number;
    if (type === FundType.PRINCIPAL) {
      balance =
        Number(user.balance) + (action === FundAction.IN ? amount : -amount);
    } else {
      balance =
        Number(user.silver) + (action === FundAction.IN ? amount : -amount);
    }

    const record = this.fundRecordRepository.create({
      userId,
      type,
      action,
      amount,
      balance,
      description,
      orderId: options?.orderId,
      withdrawalId: options?.withdrawalId,
      relatedUserId: options?.relatedUserId,
    });

    return this.fundRecordRepository.save(record);
  }

  // ============ 用户统计数据 ============

  /**
   * 获取用户个人中心完整统计数据
 *
   */
  async getProfileStats(userId: string): Promise<UserProfileStats> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    // 计算本月起止时间
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
    );

    // 计算今日起止时间
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. 累计垫付本金 - 所有已完成订单的商品价格总和
    const completedOrders = await this.ordersRepository.find({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
      },
    });
    const totalPaidPrincipal = completedOrders.reduce(
      (sum, order) => sum + Number(order.productPrice || 0),
      0,
    );

    // 2. 累计完成任务数
    const totalCompletedTasks = completedOrders.length;

    // 3. 本月完成任务数
    const monthlyCompletedOrders = await this.ordersRepository.count({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
        completedAt: Between(monthStart, monthEnd),
      },
    });

    // 4. 本月剩余任务数 (220 - 本月已完成)
    const monthlyRemainingTasks = Math.max(
      0,
      this.MONTHLY_TASK_LIMIT - monthlyCompletedOrders,
    );

    // 5. 累计赚取银锭 - 从用户的 reward 字段获取
    const totalEarnedSilver = Number(user.reward) || 0;

    // 6. 待商家发放银锭 - 状态为待审核/已审核但未返款的订单佣金总和
    const pendingOrders = await this.ordersRepository.find({
      where: [
        { userId, status: OrderStatus.SUBMITTED },
        { userId, status: OrderStatus.APPROVED },
      ],
    });
    const pendingMerchantSilver = pendingOrders.reduce(
      (sum, order) => sum + Number(order.commission || 0),
      0,
    );

    // 7. 冻结的银锭
    const frozenSilver = Number(user.frozenSilver) || 0;

    // 8. 银锭折现金额 (按1:1)
    const silverToYuan = Number(user.silver) || 0;

    // 9. 邀请统计
    const allInvitees = await this.usersRepository.find({
      where: { invitedBy: userId },
    });
    const todayInvitees = allInvitees.filter(
      (u) => u.createdAt && new Date(u.createdAt) >= today,
    );

    // 10. 订单状态统计
    const pendingOrdersCount = await this.ordersRepository.count({
      where: { userId, status: OrderStatus.PENDING },
    });
    const submittedOrdersCount = await this.ordersRepository.count({
      where: { userId, status: OrderStatus.SUBMITTED },
    });

    return {
      totalPaidPrincipal,
      monthlyRemainingTasks,
      totalCompletedTasks,
      totalEarnedSilver,
      pendingMerchantSilver,
      frozenSilver,
      silverToYuan,
      todayInvited: todayInvitees.length,
      totalInvited: allInvitees.length,
      pendingOrders: pendingOrdersCount,
      submittedOrders: submittedOrdersCount,
      experience: totalCompletedTasks, // [FIXED] Map experience to total completed tasks as per legacy system

      // [NEW] Fields for dashboard alignment
      allObtainReward: totalEarnedSilver, // $all_obtain_reward
      waitShopIssue: pendingMerchantSilver, // $wait_shop_issue
      freezeReward: frozenSilver, // $freeze_reward
      silverCny: silverToYuan, // Real-time value
    };
  }

  /**
   * 获取用户资金概览（用于个人中心顶部显示）
   */
  async getBalanceOverview(userId: string): Promise<{
    balance: number; // 本金余额
    frozenBalance: number; // 冻结本金
    silver: number; // 银锭余额
    frozenSilver: number; // 冻结银锭
    totalAssets: number; // 总资产 (本金 + 银锭)
  }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const balance = Number(user.balance) || 0;
    const frozenBalance = Number(user.frozenBalance) || 0;
    const silver = Number(user.silver) || 0;
    const frozenSilver = Number(user.frozenSilver) || 0;

    return {
      balance,
      frozenBalance,
      silver,
      frozenSilver,
      totalAssets: balance + silver,
    };
  }

  // ============ 用户安全设置 ============

  /**
   * 修改登录密码
   * 需要验证原密码
   */
  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 验证原密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      return { success: false, message: '原密码错误' };
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await this.usersRepository.save(user);

    return { success: true, message: '密码修改成功' };
  }

  /**
   * 修改支付密码
   * 需要验证手机验证码（此处简化处理，实际应对接短信服务）
   */
  async changePayPassword(
    userId: string,
    newPayPassword: string,
    phone: string,
    smsCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 验证手机号
    if (user.phone !== phone) {
      return { success: false, message: '手机号不匹配' };
    }

    // TODO: 验证短信验证码（需对接短信服务）
    // 暂时跳过验证码验证

    // 验证支付密码格式（6位数字）
    if (!/^\d{6}$/.test(newPayPassword)) {
      return { success: false, message: '支付密码必须为6位数字' };
    }

    // 加密新支付密码
    const hashedPayPassword = await bcrypt.hash(newPayPassword, 10);
    user.payPassword = hashedPayPassword;
    await this.usersRepository.save(user);

    return { success: true, message: '支付密码修改成功' };
  }

  /**
   * 修改手机号
   * 需要验证支付密码和新手机验证码
   */
  async changePhone(
    userId: string,
    oldPhone: string,
    payPassword: string,
    newPhone: string,
    smsCode: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    // 验证原手机号
    if (user.phone !== oldPhone) {
      return { success: false, message: '原手机号不正确' };
    }

    // 验证支付密码
    if (!user.payPassword) {
      return { success: false, message: '请先设置支付密码' };
    }
    const isPayPasswordValid = await bcrypt.compare(
      payPassword,
      user.payPassword,
    );
    if (!isPayPasswordValid) {
      return { success: false, message: '支付密码错误' };
    }

    // 检查新手机号是否已被使用
    const existingUser = await this.usersRepository.findOne({
      where: { phone: newPhone },
    });
    if (existingUser && existingUser.id !== userId) {
      return { success: false, message: '该手机号已被其他用户使用' };
    }

    // TODO: 验证短信验证码（需对接短信服务）

    // 更新手机号
    user.phone = newPhone;
    await this.usersRepository.save(user);

    return { success: true, message: '手机号修改成功' };
  }

  /**
   * 发送短信验证码（Mock实现）
   */
  async sendSmsCode(
    phone: string,
    type: 'change_phone' | 'change_password' | 'change_pay_password',
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return { success: false, message: '手机号格式不正确' };
    }

    // TODO: 对接真实短信服务
    // 此处为Mock实现，直接返回成功
    console.log(`[SMS] Sending ${type} verification code to ${phone}`);

    return { success: true, message: '验证码发送成功' };
  }

  // ============ 月度任务计数 ============

  /**
   * 检查并重置月度任务计数（如果跨月了）
   */
  private async checkAndResetMonthlyTaskCount(user: User): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

    if (user.monthlyTaskCountResetDate) {
      const resetDate = new Date(user.monthlyTaskCountResetDate);
      const resetMonth = `${resetDate.getFullYear()}-${resetDate.getMonth() + 1}`;

      if (currentMonth !== resetMonth) {
        // 跨月了，重置计数
        user.monthlyTaskCount = 0;
        user.monthlyTaskCountResetDate = now;
        await this.usersRepository.save(user);
      }
    } else {
      // 首次设置重置日期
      user.monthlyTaskCountResetDate = now;
      await this.usersRepository.save(user);
    }
  }

  /**
   * 增加用户月度任务计数并返回新计数
   * 用于里程碑奖励判断
   */
  async incrementMonthlyTaskCount(userId: string): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return 0;

    await this.checkAndResetMonthlyTaskCount(user);
    user.monthlyTaskCount = (user.monthlyTaskCount || 0) + 1;
    await this.usersRepository.save(user);

    return user.monthlyTaskCount;
  }

  /**
   * 获取用户月度任务计数
   */
  async getMonthlyTaskCount(userId: string): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return 0;

    await this.checkAndResetMonthlyTaskCount(user);
    return user.monthlyTaskCount || 0;
  }

  /**
   * 赠送VIP (叠加时长)
   */
  async grantVip(userId: string, days: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    let newExpire: Date;

    if (user.vip && user.vipExpireAt && new Date(user.vipExpireAt) > now) {
      // 如果已是VIP且未过期，在原到期时间上叠加
      newExpire = new Date(user.vipExpireAt);
      newExpire.setDate(newExpire.getDate() + days);
    } else {
      // 否则从当前时间开始计算
      newExpire = new Date();
      newExpire.setDate(newExpire.getDate() + days);
    }

    user.vip = true;
    user.vipExpireAt = newExpire;
    await this.usersRepository.save(user);
  }

  /**
   * 本金转银锭 (1:1 兑换)
   * P1: 原子事务 + 双向流水
   */
  async convertBalanceToSilver(
    userId: string,
    amount: number,
  ): Promise<{ success: boolean; message: string }> {
    if (amount <= 0) {
      return { success: false, message: '转换金额必须大于0' };
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    if (Number(user.balance) < amount) {
      return { success: false, message: '本金余额不足' };
    }

    // 原子事务
    const queryRunner = this.usersRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 扣除本金
      user.balance = Number(user.balance) - amount;
      // 2. 增加银锭
      user.silver = Number(user.silver) + amount;
      await queryRunner.manager.save(user);

      // 3. 记录本金扣除流水
      await queryRunner.manager.save(
        queryRunner.manager.create(FundRecord, {
          userId,
          type: FundType.PRINCIPAL,
          action: FundAction.OUT,
          amount,
          balance: user.balance,
          description: '本金转银锭',
        }),
      );

      // 4. 记录银锭增加流水
      await queryRunner.manager.save(
        queryRunner.manager.create(FundRecord, {
          userId,
          type: FundType.SILVER,
          action: FundAction.IN,
          amount,
          balance: user.silver,
          description: '本金转入银锭',
        }),
      );

      await queryRunner.commitTransaction();
      return { success: true, message: `成功将${amount}元本金转换为${amount}银锭` };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return { success: false, message: '转换失败，请重试' };
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * P1: 获取邀请状态（是否解锁邀请功能）
   * 需要完成 invitationNum 单才能解锁
   */
  async getInviteStatus(userId: string): Promise<{
    totalCompletedOrders: number;
    invitationUnlockThreshold: number;
    isUnlocked: boolean;
    referralCode: string;
    referralLink: string;
  }> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      return {
        totalCompletedOrders: 0,
        invitationUnlockThreshold: 999,
        isUnlocked: false,
        referralCode: '',
        referralLink: '',
      };
    }

    // 获取用户完成的订单数
    const completedOrders = await this.ordersRepository.count({
      where: {
        userId,
        status: OrderStatus.COMPLETED,
      },
    });

    // 获取邀请解锁阈值配置 (默认10单)
    const invitationNum = this.configService.getNumberValue('invitation_num', 10);

    const isUnlocked = completedOrders >= invitationNum;

    return {
      totalCompletedOrders: completedOrders,
      invitationUnlockThreshold: invitationNum,
      isUnlocked,
      referralCode: user.invitationCode || '',
      referralLink: isUnlocked
        ? `https://example.com/register?ref=${user.invitationCode}`
        : '',
    };
  }

  /**
   * 更新用户的推荐好友权限
   */
  async updateReferPermission(
    userId: string,
    canReferFriends: boolean,
  ): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    user.canReferFriends = canReferFriends;
    return this.usersRepository.save(user);
  }

  /**
   * 检查用户是否有推荐权限
   */
  async checkUserReferPermission(userId: string): Promise<boolean> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });
    return user?.canReferFriends ?? true;
  }
}
