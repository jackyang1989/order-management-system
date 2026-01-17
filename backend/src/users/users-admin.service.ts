import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  Like,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { FundRecord, FundType, FundAction } from './fund-record.entity';
import { Message, MessageType, MessageStatus, MessageUserType } from '../messages/message.entity';
import {
  UserQueryDto,
  AdjustBalanceDto,
  BatchOperationDto,
  UserDetailUpdateDto,
} from './users-admin.controller';

/**
 * 余额变动日志（简化版，可以扩展为独立实体）
 */
export interface BalanceLog {
  id: string;
  userId: string;
  type: string;
  action: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string;
  operator: string;
  createdAt: Date;
}

@Injectable()
export class UsersAdminService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(FundRecord)
    private fundRecordRepo: Repository<FundRecord>,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  /**
   * 获取用户列表
   */
  async findAll(query: UserQueryDto): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.userRepo.createQueryBuilder('u');

    // 关键词搜索
    if (query.keyword) {
      qb.andWhere(
        '(u.username LIKE :keyword OR u.phone LIKE :keyword OR u.realName LIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    // 状态筛选
    if (query.status === 'active') {
      qb.andWhere('u.isBanned = false AND u.isActive = true');
    } else if (query.status === 'banned') {
      qb.andWhere('u.isBanned = true');
    }

    // VIP筛选 - VIP功能已移除，忽略此筛选条件

    // 实名状态
    if (query.verifyStatus !== undefined) {
      qb.andWhere('u.verifyStatus = :verifyStatus', {
        verifyStatus: query.verifyStatus,
      });
    }

    // 日期范围
    if (query.startDate) {
      qb.andWhere('u.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('u.createdAt <= :endDate', { endDate: query.endDate });
    }

    // 排序
    const sortBy = query.sortField || query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder?.toUpperCase() as 'ASC' | 'DESC') || 'DESC';
    qb.orderBy(`u.${sortBy}`, sortOrder);

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // 移除敏感信息
    const sanitizedData = data.map((u) => this.sanitizeUser(u));

    return { data: sanitizedData, total, page, limit };
  }

  /**
   * 获取用户详情
   */
  async findOne(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }
    return this.sanitizeUser(user);
  }

  /**
   * 获取用户统计
   */
  async getUserStats(id: string): Promise<{
    totalOrders: number;
    completedOrders: number;
    totalEarnings: number;
    totalWithdrawals: number;
    referralCount: number;
    referralEarnings: number;
  }> {
    const user = await this.findOne(id);

    // TODO: 从相关表查询实际数据
    return {
      totalOrders: 0,
      completedOrders: 0,
      totalEarnings: Number(user.reward) || 0,
      totalWithdrawals: 0,
      referralCount: user.referralCount || 0,
      referralEarnings: Number(user.referralReward) || 0,
    };
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: UserDetailUpdateDto): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    Object.assign(user, data);
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  /**
   * 调整用户余额
   */
  async adjustBalance(
    id: string,
    dto: AdjustBalanceDto,
  ): Promise<{
    user: User;
    log: FundRecord;
  }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    const field = dto.type === 'balance' ? 'balance' : 'silver';
    const rawValue = user[field];

    // 确保 amount 是数字
    const amount = typeof dto.amount === 'string' ? parseFloat(dto.amount) : dto.amount;

    // 处理余额：可能是字符串、数字或 Decimal 对象
    let balanceBefore: number;
    if (typeof rawValue === 'string') {
      balanceBefore = parseFloat(rawValue) || 0;
    } else if (typeof rawValue === 'number') {
      balanceBefore = rawValue;
    } else if (rawValue && typeof rawValue === 'object') {
      // Decimal 对象或其他对象
      balanceBefore = parseFloat(String(rawValue)) || 0;
    } else {
      balanceBefore = 0;
    }

    console.log('[adjustBalance] balanceBefore:', balanceBefore);
    console.log('[adjustBalance] amount:', amount);

    let balanceAfter: number;

    if (dto.action === 'add') {
      balanceAfter = balanceBefore + amount;
    } else {
      if (balanceBefore < amount) {
        console.log('[adjustBalance] 余额不足! balanceBefore:', balanceBefore, '< amount:', amount);
        throw new BadRequestException(`余额不足 (当前: ${balanceBefore}, 扣除: ${amount})`);
      }
      balanceAfter = balanceBefore - amount;
    }

    console.log('[adjustBalance] balanceAfter:', balanceAfter);

    user[field] = balanceAfter as any;
    await this.userRepo.save(user);

    // 记录到 FundRecord 表
    const fundRecord = new FundRecord();
    fundRecord.userId = id;
    fundRecord.type = dto.type === 'balance' ? FundType.PRINCIPAL : FundType.SILVER;
    fundRecord.action = dto.action === 'add' ? FundAction.IN : FundAction.OUT;
    fundRecord.amount = amount;
    fundRecord.balance = balanceAfter;
    fundRecord.description = dto.reason;
    await this.fundRecordRepo.save(fundRecord);

    return { user: this.sanitizeUser(user), log: fundRecord };
  }

  /**
   * 封禁用户
   */
  async banUser(id: string, reason: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    user.isBanned = true;
    user.banReason = reason;
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  /**
   * 解封用户
   */
  async unbanUser(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    user.isBanned = false;
    user.banReason = '';
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }


  /**
   * 重置密码
   */
  async resetPassword(id: string, newPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);
  }

  /**
   * 重置支付密码
   */
  async resetPayPassword(id: string, newPayPassword: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    user.payPassword = await bcrypt.hash(newPayPassword, 10);
    await this.userRepo.save(user);
  }

  /**
   * 审核实名认证
   */
  async verifyUser(id: string, status: number, reason?: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 ${id} 不存在`);
    }

    user.verifyStatus = status;
    // 可以添加审核拒绝原因字段
    await this.userRepo.save(user);
    return this.sanitizeUser(user);
  }

  /**
   * 获取余额变动记录
   */
  async getBalanceLogs(
    userId: string,
    page: number,
    limit: number,
    type?: string,
  ): Promise<{ data: FundRecord[]; total: number }> {
    const qb = this.fundRecordRepo.createQueryBuilder('fr')
      .where('fr.userId = :userId', { userId })
      .orderBy('fr.createdAt', 'DESC');

    if (type === 'principal' || type === 'silver') {
      qb.andWhere('fr.type = :type', { type });
    }

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total };
  }

  /**
   * 获取登录日志
   */
  async getLoginLogs(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ data: any[]; total: number }> {
    // TODO: 从登录日志表查询
    return { data: [], total: 0 };
  }

  /**
   * 批量操作
   */
  async batchOperation(dto: BatchOperationDto): Promise<{
    success: number;
    failed: number;
  }> {
    let success = 0;
    let failed = 0;

    for (const userId of dto.userIds) {
      try {
        switch (dto.action) {
          case 'ban':
            await this.banUser(userId, dto.reason || '批量封禁');
            break;
          case 'unban':
            await this.unbanUser(userId);
            break;
          case 'activate':
            await this.updateUser(userId, { isActive: true });
            break;
          case 'deactivate':
            await this.updateUser(userId, { isActive: false });
            break;
        }
        success++;
      } catch {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * 导出用户数据
   */
  async exportUsers(query: UserQueryDto): Promise<{
    filename: string;
    data: any[];
  }> {
    const result = await this.findAll({ ...query, limit: 10000 });
    const exportData = result.data.map((u) => ({
      ID: u.id,
      用户名: u.username,
      手机号: u.phone,
      微信号: u.wechat,
      本金余额: u.balance,
      银锭余额: u.silver,
      实名状态:
        ['未认证', '待审核', '已认证', '已拒绝'][u.verifyStatus] || '未知',
      状态: u.isBanned ? '已封禁' : u.isActive ? '正常' : '未激活',
      注册时间: u.createdAt,
    }));

    return {
      filename: `users_${Date.now()}.xlsx`,
      data: exportData,
    };
  }

  /**
   * 获取统计概览
   */
  async getOverviewStats(): Promise<{
    totalUsers: number;
    todayNewUsers: number;
    vipUsers: number;
    bannedUsers: number;
    verifiedUsers: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, todayNewUsers, bannedUsers, verifiedUsers] =
      await Promise.all([
        this.userRepo.count(),
        this.userRepo.count({ where: { createdAt: MoreThanOrEqual(today) } }),
        this.userRepo.count({ where: { isBanned: true } }),
        this.userRepo.count({ where: { verifyStatus: 2 } }),
      ]);

    return {
      totalUsers,
      todayNewUsers,
      vipUsers: 0,
      bannedUsers,
      verifiedUsers,
    };
  }

  /**
   * 移除敏感信息
   */
  private sanitizeUser(user: User): User {
    const { password, payPassword, ...rest } = user;
    return { ...rest, password: '', payPassword: '' } as User;
  }

  /**
   * 获取用户消息列表
   */
  async getUserMessages(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: Message[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.messageRepo.findAndCount({
      where: { receiverId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: data.map((msg) => ({
        ...msg,
        isRead: msg.status === MessageStatus.READ,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * 发送消息给用户
   */
  async sendMessage(
    userId: string,
    title: string,
    content: string,
  ): Promise<Message> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const message = this.messageRepo.create({
      receiverId: userId,
      receiverType: MessageUserType.BUYER,
      senderType: MessageUserType.ADMIN,
      type: MessageType.PRIVATE,
      title,
      content,
      status: MessageStatus.UNREAD,
    });

    return this.messageRepo.save(message);
  }
}
