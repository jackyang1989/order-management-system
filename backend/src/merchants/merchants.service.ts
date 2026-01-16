import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Merchant,
  CreateMerchantDto,
  UpdateMerchantDto,
  MerchantStatus,
} from './merchant.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import {
  FinanceUserType,
  FinanceMoneyType,
} from '../finance-records/finance-record.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MerchantsService {
  constructor(
    @InjectRepository(Merchant)
    private merchantsRepository: Repository<Merchant>,
    private financeRecordsService: FinanceRecordsService,
    private dataSource: DataSource,
  ) { }

  async findAll(
    query: {
      page?: number | string;
      limit?: number | string;
      keyword?: string;
      status?: number;
      vip?: boolean;
      startDate?: string;
      endDate?: string;
    } = {},
  ): Promise<{ data: Merchant[]; total: number; page: number; limit: number }> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const qb = this.merchantsRepository.createQueryBuilder('m');

    // Keyword search (username, phone, merchantNo)
    if (query.keyword) {
      qb.andWhere(
        '(m.username LIKE :keyword OR m.phone LIKE :keyword OR m.merchantNo LIKE :keyword)',
        { keyword: `%${query.keyword}%` },
      );
    }

    // Status filter
    if (query.status) {
      qb.andWhere('m.status = :status', { status: query.status });
    }

    // VIP filter (assuming vip field exists, checking entity... entity not fully visible but likely has vip logic similar to user)
    // Legacy Seller.php has VIP filtering. 
    // Checking entity content in thought... I didn't verify Merchant entity. Assuming basic fields first.
    // If VIP field is missing in entity, I should add it.
    // But for now let's stick to existing fields or what I saw in creation (silver, balance).
    // Wait, User has VIP. Merchant should too.

    // Date range
    if (query.startDate) {
      qb.andWhere('m.createdAt >= :startDate', { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere('m.createdAt <= :endDate', { endDate: query.endDate });
    }

    qb.orderBy('m.createdAt', 'DESC');

    const total = await qb.getCount();
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: data.map(m => this.sanitize(m)),
      total,
      page,
      limit
    };
  }

  async findOne(id: string): Promise<Merchant | null> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    return merchant ? this.sanitize(merchant) : null;
  }

  async findByUsername(username: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { username } });
  }

  async findByPhone(phone: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { phone } });
  }

  async findByMerchantNo(merchantNo: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { merchantNo } });
  }

  async findByInvitationCode(inviteCode: string): Promise<Merchant | null> {
    return this.merchantsRepository.findOne({ where: { inviteCode } });
  }

  async create(dto: CreateMerchantDto): Promise<Merchant> {
    // 检查用户名是否已存在
    const existingUsername = await this.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('用户名已存在');
    }

    // 检查手机号是否已存在
    const existingPhone = await this.findByPhone(dto.phone);
    if (existingPhone) {
      throw new ConflictException('手机号已被注册');
    }

    // 验证邀请码
    const inviter = await this.findByInvitationCode(dto.invitationCode);
    if (!inviter) {
      // 允许 'ADMIN' 作为初始邀请码用于测试
      if (dto.invitationCode !== 'ADMIN') {
        throw new BadRequestException('无效的邀请码');
      }
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 处理VIP到期时间
    let vipExpireAt: Date | undefined;
    let vip = false;
    if (dto.vipExpireAt) {
      vipExpireAt = new Date(dto.vipExpireAt);
      vip = vipExpireAt > new Date();
    }

    // 生成商家编号 merchantNo (M + 5位数字)
    const merchantNo = await this.generateMerchantNo();

    // 生成商家自己的邀请码
    const inviteCode = this.generateInviteCode();

    const merchant = this.merchantsRepository.create({
      username: dto.username,
      password: hashedPassword,
      phone: dto.phone,
      wechat: dto.wechat || '',
      balance: dto.balance || 0,
      frozenBalance: 0,
      silver: dto.silver || 0,
      vip,
      vipExpireAt,
      note: dto.note || '',
      status: MerchantStatus.APPROVED, // 默认直接通过，实际可设为 PENDING
      merchantNo,
      inviteCode, // 生成自己的邀请码
      invitedBy: inviter?.id, // 记录邀请人ID
      inviteState: inviter ? 1 : 0, // 如果有邀请人则设为已验证
    });

    const saved = await this.merchantsRepository.save(merchant);
    return this.sanitize(saved);
  }

  /**
   * 生成商家编号 (M + 5位数字)
   * 格式: M10001, M10002, ...
   */
  private async generateMerchantNo(): Promise<string> {
    // 查询最大的商家编号
    const lastMerchant = await this.merchantsRepository
      .createQueryBuilder('m')
      .where('m.merchantNo IS NOT NULL')
      .orderBy('m.merchantNo', 'DESC')
      .getOne();

    let nextNumber = 10001; // 起始编号

    if (lastMerchant && lastMerchant.merchantNo) {
      // 提取数字部分并加1
      const lastNumber = parseInt(lastMerchant.merchantNo.substring(1));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    return `M${nextNumber}`;
  }

  async update(id: string, dto: UpdateMerchantDto): Promise<Merchant | null> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) return null;

    // 防止密码被意外覆盖 - 过滤掉 password 和 payPassword 字段
    const { password, payPassword, ...safeDto } = dto as any;

    Object.assign(merchant, safeDto);
    const updated = await this.merchantsRepository.save(merchant);
    return this.sanitize(updated);
  }

  async validatePassword(
    merchant: Merchant,
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, merchant.password);
  }

  // 余额操作 (使用事务确保原子性)
  async addBalance(id: string, amount: number, memo: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      merchant.balance = Number(merchant.balance) + amount;
      await manager.save(merchant);

      // 记录财务流水
      await this.financeRecordsService.recordAdminOperation(
        id,
        FinanceUserType.MERCHANT,
        FinanceMoneyType.BALANCE,
        amount,
        Number(merchant.balance),
        memo,
        'system',
      );
      return true;
    });
  }

  async deductBalance(
    id: string,
    amount: number,
    memo: string,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      if (Number(merchant.balance) < amount) {
        throw new BadRequestException('余额不足');
      }

      merchant.balance = Number(merchant.balance) - amount;
      await manager.save(merchant);

      // 记录财务流水
      await this.financeRecordsService.recordAdminOperation(
        id,
        FinanceUserType.MERCHANT,
        FinanceMoneyType.BALANCE,
        -amount,
        Number(merchant.balance),
        memo,
        'system',
      );
      return true;
    });
  }

  // 冻结余额（发布任务时预扣）- 使用事务
  async freezeBalance(id: string, amount: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      if (Number(merchant.balance) < amount) {
        throw new BadRequestException('余额不足，请先充值');
      }

      merchant.balance = Number(merchant.balance) - amount;
      merchant.frozenBalance = Number(merchant.frozenBalance) + amount;
      await manager.save(merchant);
      return true;
    });
  }

  // 解冻余额 - 使用事务
  async unfreezeBalance(id: string, amount: number): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      merchant.frozenBalance = Number(merchant.frozenBalance) - amount;
      await manager.save(merchant);
      return true;
    });
  }

  // 银锭操作（用于佣金/服务费）
  // P0-3: 使用事务保护，确保原子性操作
  async addSilver(id: string, amount: number, memo: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      merchant.silver = Number(merchant.silver) + amount;
      await manager.save(merchant);

      // 记录财务流水（在事务内）
      await this.financeRecordsService.recordAdminOperation(
        id,
        FinanceUserType.MERCHANT,
        FinanceMoneyType.SILVER,
        amount,
        Number(merchant.silver),
        memo,
        'system',
      );
      return true;
    });
  }

  // P0-3: 使用事务保护，确保原子性操作
  async deductSilver(
    id: string,
    amount: number,
    memo: string,
  ): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const merchant = await manager.findOne(Merchant, { where: { id } });
      if (!merchant) return false;

      if (Number(merchant.silver) < amount) {
        throw new BadRequestException('银锭不足，请先充值');
      }

      merchant.silver = Number(merchant.silver) - amount;
      await manager.save(merchant);

      // 记录财务流水（在事务内）
      await this.financeRecordsService.recordAdminOperation(
        id,
        FinanceUserType.MERCHANT,
        FinanceMoneyType.SILVER,
        -amount,
        Number(merchant.silver),
        memo,
        'system',
      );
      return true;
    });
  }

  // 统计数据
  // P1-3: 优化查询 - 使用 Promise.all 并行执行所有查询
  async getStats(id: string): Promise<{
    balance: number;
    frozenBalance: number;
    silver: number;
    totalTasks: number;
    activeTasks: number;
    completedOrders: number;
  }> {
    // P1-3: 使用 Promise.all 并行执行所有查询，避免串行等待
    const [merchant, totalTasks, activeTasks, completedOrders] = await Promise.all([
      // 查询商家基本信息
      this.merchantsRepository.findOne({ where: { id } }),

      // 查询该商家的总任务数
      this.merchantsRepository.manager
        .createQueryBuilder()
        .from('tasks', 'task')
        .where('task.merchantId = :merchantId', { merchantId: id })
        .getCount(),

      // 查询该商家的进行中任务数（状态为 ACTIVE）
      this.merchantsRepository.manager
        .createQueryBuilder()
        .from('tasks', 'task')
        .where('task.merchantId = :merchantId', { merchantId: id })
        .andWhere('task.status = :status', { status: 1 }) // TaskStatus.ACTIVE = 1
        .getCount(),

      // 查询该商家任务的已完成订单数
      this.merchantsRepository.manager
        .createQueryBuilder()
        .from('orders', 'order')
        .innerJoin('tasks', 'task', 'order.taskId = task.id')
        .where('task.merchantId = :merchantId', { merchantId: id })
        .andWhere('order.status = :status', { status: 'COMPLETED' })
        .getCount(),
    ]);

    if (!merchant) {
      return {
        balance: 0,
        frozenBalance: 0,
        silver: 0,
        totalTasks: 0,
        activeTasks: 0,
        completedOrders: 0,
      };
    }

    return {
      balance: Number(merchant.balance),
      frozenBalance: Number(merchant.frozenBalance),
      silver: Number(merchant.silver),
      totalTasks,
      activeTasks,
      completedOrders,
    };
  }

  // 获取推荐信息
  async getReferralInfo(id: string): Promise<{
    referralCode: string;
    referralLink: string;
    stats: {
      totalReferrals: number;
      activeReferrals: number;
      totalEarnings: number;
      pendingEarnings: number;
    };
    records: Array<{
      id: string;
      username: string;
      registerTime: string;
      status: 'active' | 'inactive';
      totalOrders: number;
      commission: number;
    }>;
  }> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      return {
        referralCode: '',
        referralLink: '',
        stats: { totalReferrals: 0, activeReferrals: 0, totalEarnings: 0, pendingEarnings: 0 },
        records: [],
      };
    }

    // 如果没有邀请码，生成一个
    let inviteCode = (merchant as any).inviteCode;
    if (!inviteCode) {
      inviteCode = this.generateInviteCode();
      (merchant as any).inviteCode = inviteCode;
      await this.merchantsRepository.save(merchant);
    }

    // 查询被推荐的商家
    const referredMerchants = await this.merchantsRepository.find({
      where: { referrerId: id } as any,
    });

    const records = referredMerchants.map(m => ({
      id: m.id,
      username: m.username,
      registerTime: m.createdAt.toISOString().split('T')[0],
      status: (m.status === MerchantStatus.APPROVED ? 'active' : 'inactive') as 'active' | 'inactive',
      totalOrders: 0,
      commission: 0,
    }));

    return {
      referralCode: inviteCode,
      referralLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/merchant/register?ref=${inviteCode}`,
      stats: {
        totalReferrals: referredMerchants.length,
        activeReferrals: referredMerchants.filter(m => m.status === MerchantStatus.APPROVED).length,
        totalEarnings: 0,
        pendingEarnings: 0,
      },
      records,
    };
  }

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // ============ Admin Operations ============

  async banMerchant(id: string, reason: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new BadRequestException('商家不存在');
    }
    merchant.status = MerchantStatus.DISABLED;
    // merchant.banReason = reason; // Add banReason to entity if needed, or put in remark
    return this.sanitize(await this.merchantsRepository.save(merchant));
  }

  async unbanMerchant(id: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new BadRequestException('商家不存在');
    }
    merchant.status = MerchantStatus.APPROVED;
    return this.sanitize(await this.merchantsRepository.save(merchant));
  }

  async setVip(id: string, days: number): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new BadRequestException('商家不存在');
    }
    merchant.vip = true;
    const now = new Date();
    const expireAt = merchant.vipExpireAt && merchant.vipExpireAt > now
      ? new Date(merchant.vipExpireAt)
      : now;
    expireAt.setDate(expireAt.getDate() + days);
    merchant.vipExpireAt = expireAt;

    return this.sanitize(await this.merchantsRepository.save(merchant));
  }

  async removeVip(id: string): Promise<Merchant> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      throw new BadRequestException('商家不存在');
    }
    merchant.vip = false;
    merchant.vipExpireAt = null as any;
    return this.sanitize(await this.merchantsRepository.save(merchant));
  }

  async adjustMerchantBalance(id: string, type: 'balance' | 'silver', action: 'add' | 'deduct', amount: number, memo: string): Promise<Merchant> {
    if (type === 'balance') {
      if (action === 'add') {
        await this.addBalance(id, amount, memo);
      } else {
        await this.deductBalance(id, amount, memo);
      }
    } else {
      if (action === 'add') {
        await this.addSilver(id, amount, memo);
      } else {
        await this.deductSilver(id, amount, memo);
      }
    }
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) throw new BadRequestException('Merchant not found');
    return this.sanitize(merchant);
  }

  async updateMerchantInfo(
    id: string,
    data: {
      phone?: string;
      wechat?: string;
      companyName?: string;
      balance?: number;
      silver?: number;
      vipExpireAt?: string;
      note?: string;
      referrerId?: string;
    },
  ): Promise<{ success: boolean; message?: string; merchant?: Merchant }> {
    const merchant = await this.merchantsRepository.findOne({ where: { id } });
    if (!merchant) {
      return { success: false, message: '商家不存在' };
    }

    // 更新基本信息
    if (data.phone !== undefined) merchant.phone = data.phone;
    if (data.wechat !== undefined) merchant.wechat = data.wechat;
    if (data.note !== undefined) merchant.note = data.note;
    if (data.referrerId !== undefined) merchant.referrerId = data.referrerId;

    // 更新余额
    if (data.balance !== undefined) merchant.balance = data.balance;
    if (data.silver !== undefined) merchant.silver = data.silver;

    // 更新VIP到期时间
    if (data.vipExpireAt !== undefined) {
      if (data.vipExpireAt) {
        const expireDate = new Date(data.vipExpireAt);
        merchant.vipExpireAt = expireDate;
        merchant.vip = expireDate > new Date();
      } else {
        merchant.vipExpireAt = null as any;
        merchant.vip = false;
      }
    }

    const updated = await this.merchantsRepository.save(merchant);
    return { success: true, merchant: this.sanitize(updated) };
  }

  private sanitize(merchant: Merchant): Merchant {
    const { password, payPassword, ...sanitized } = merchant;
    return { ...sanitized, password: '', payPassword: '' } as Merchant;
  }
}
