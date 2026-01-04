import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  Withdrawal,
  WithdrawalStatus,
  WithdrawalType,
  WithdrawalOwnerType,
  CreateWithdrawalDto,
  ReviewWithdrawalDto,
} from './withdrawal.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';
import { BankCardsService } from '../bank-cards/bank-cards.service';
import { UsersService } from '../users/users.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalsRepository: Repository<Withdrawal>,
    @InjectRepository(Merchant)
    @Optional()
    private merchantRepository: Repository<Merchant>,
    private bankCardsService: BankCardsService,
    private usersService: UsersService,
    private financeRecordsService: FinanceRecordsService,
    private systemConfigService: SystemConfigService,
  ) { }

  /**
   * 计算提现手续费
   * 原版规则:
   * - 本金提现: 金额 <= userFeeMaxPrice 时收取 userCashFree 元手续费
   * - 银锭提现: 按 rewardPrice 单价折算取整
   */
  async calculateWithdrawalFee(
    amount: number,
    type: WithdrawalType,
  ): Promise<{
    fee: number;
    actualAmount: number;
    rewardPrice?: number;
  }> {
    const config = await this.systemConfigService.getGlobalConfig();

    if (type === WithdrawalType.BALANCE) {
      // 本金提现手续费
      // parse comma separated string "45,80" if needed? 
      // UserFeeMaxPrice is string in entity? checking entity...
      // In SystemGlobalConfig entity: userFeeMaxPrice is string.
      // In legacy code it logic was: if amount <= userFeeMaxPrice then fee = userCashFree.

      const userFeeMaxPrice = parseFloat(config.userFeeMaxPrice) || 100;
      // userCashFree is string in entity? 
      const userCashFree = parseFloat(config.userCashFree) || 2;

      let fee = 0;
      if (amount <= userFeeMaxPrice) {
        fee = userCashFree;
      }

      const actualAmount = Math.max(0, amount - fee);
      return { fee, actualAmount };
    } else {
      // 银锭提现: 按单价折算
      const rewardPrice = config.rewardPrice || 1;
      // 银锭转换为人民币金额，取整
      const actualAmount = Math.floor(amount * rewardPrice);
      const fee = 0;

      return { fee, actualAmount, rewardPrice };
    }
  }

  /**
   * 获取提现配置（供前端显示）
   */
  async getWithdrawalConfig(): Promise<{
    userMinMoney: number;
    userMinReward: number;
    userFeeMaxPrice: number;
    userCashFree: number;
    rewardPrice: number;
  }> {
    const config = await this.systemConfigService.getGlobalConfig();
    return {
      userMinMoney: config.userMinMoney,
      userMinReward: config.userMinReward,
      userFeeMaxPrice: parseFloat(config.userFeeMaxPrice) || 0,
      userCashFree: parseFloat(config.userCashFree) || 0,
      rewardPrice: config.rewardPrice,
    };
  }

  async findAllByUser(userId: string): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({
      where: [
        { userId },
        { ownerId: userId, ownerType: WithdrawalOwnerType.BUYER },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 按商家ID查询提现记录
   */
  async findAllByMerchant(merchantId: string): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({
      where: { ownerId: merchantId, ownerType: WithdrawalOwnerType.MERCHANT },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 统一查询方法：按所有者类型和ID查询
   */
  async findAllByOwner(
    ownerId: string,
    ownerType: WithdrawalOwnerType,
  ): Promise<Withdrawal[]> {
    return this.withdrawalsRepository.find({
      where: { ownerId, ownerType },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Withdrawal | null> {
    return this.withdrawalsRepository.findOne({ where: { id } });
  }

  async create(
    userId: string,
    createDto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {
    // 使用事务确保资金安全 (Transaction & Atomic Update)
    // 这一步是关键修复：防止高并发下的"双花"攻击
    return this.withdrawalsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 0. 验证支付密码（匹配原版逻辑）
        // Use transactionalEntityManager to get raw user with secrets
        const user = await transactionalEntityManager.findOne(User, { where: { id: userId } });
        if (!user) {
          throw new NotFoundException('用户不存在');
        }
        if (!user.payPassword) {
          throw new BadRequestException('请先设置支付密码');
        }
        if (createDto.payPassword) {
          const isPasswordValid = await bcrypt.compare(
            createDto.payPassword,
            user.payPassword,
          );
          if (!isPasswordValid) {
            throw new ForbiddenException('支付密码错误');
          }
        } else {
          throw new BadRequestException('请输入支付密码');
        }

        // 1. 获取银行卡信息
        const bankCard = await this.bankCardsService.findOne(
          createDto.bankCardId,
          userId,
        );
        if (!bankCard) {
          throw new NotFoundException('银行卡不存在');
        }

        const withdrawalType = createDto.type || WithdrawalType.BALANCE;

        // 2. 获取系统配置的最低提现金额
        const config = await this.getWithdrawalConfig();
        const minAmount =
          withdrawalType === WithdrawalType.BALANCE
            ? config.userMinMoney
            : config.userMinReward;

        if (createDto.amount < minAmount) {
          throw new BadRequestException(
            withdrawalType === WithdrawalType.BALANCE
              ? `本金最低提现金额为${minAmount}元`
              : `银锭最低提现数量为${minAmount}`,
          );
        }

        // 3. 计算手续费（使用原版逻辑）
        const { fee, actualAmount } = await this.calculateWithdrawalFee(
          createDto.amount,
          withdrawalType,
        );

        // 4. 原子扣减余额 + 冻结余额
        // UPDATE user SET balance = balance - :amount, frozenBalance = frozenBalance + :amount
        // WHERE id = :userId AND balance >= :amount
        let updateResult;

        if (withdrawalType === WithdrawalType.BALANCE) {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(User)
            .set({
              balance: () => `balance - ${createDto.amount}`,
              frozenBalance: () => `frozenBalance + ${createDto.amount}`,
            })
            .where('id = :userId', { userId })
            .andWhere('balance >= :amount', { amount: createDto.amount })
            .execute();
        } else {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(User)
            .set({
              silver: () => `silver - ${createDto.amount}`,
              frozenSilver: () => `frozenSilver + ${createDto.amount}`,
            })
            .where('id = :userId', { userId })
            .andWhere('silver >= :amount', { amount: createDto.amount })
            .execute();
        }

        // 如果没有行被更新，说明余额不足
        if (updateResult.affected === 0) {
          throw new BadRequestException('余额不足');
        }

        // 5. 创建提现记录（使用统一的ownerType和ownerId）
        const withdrawal = transactionalEntityManager.create(Withdrawal, {
          ownerType: WithdrawalOwnerType.BUYER,
          ownerId: userId,
          userId, // 保留向后兼容
          amount: createDto.amount,
          fee,
          actualAmount,
          type: withdrawalType,
          status: WithdrawalStatus.PENDING,
          bankCardId: bankCard.id,
          bankName: bankCard.bankName,
          accountName: bankCard.accountName,
          cardNumber: bankCard.cardNumber,
          phone: bankCard.phone,
        });

        return await transactionalEntityManager.save(withdrawal);
      },
    );
  }

  /**
   * 商家提现（统一到Withdrawal表）
   */
  async createForMerchant(
    merchantId: string,
    createDto: CreateWithdrawalDto,
  ): Promise<Withdrawal> {
    return this.withdrawalsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 获取商家信息
        const merchant = await transactionalEntityManager.findOne(Merchant, {
          where: { id: merchantId },
        });
        if (!merchant) {
          throw new NotFoundException('商家不存在');
        }

        // 商家提现不强制验证支付密码，但如果设置了需要验证
        if (merchant.payPassword && createDto.payPassword) {
          const isPasswordValid = await bcrypt.compare(
            createDto.payPassword,
            merchant.payPassword,
          );
          if (!isPasswordValid) {
            throw new ForbiddenException('支付密码错误');
          }
        }

        const withdrawalType = createDto.type || WithdrawalType.BALANCE;

        // 获取系统配置的最低提现金额（商家最低100元）
        const minAmount = withdrawalType === WithdrawalType.BALANCE ? 100 : 100;

        if (createDto.amount < minAmount) {
          throw new BadRequestException(`最低提现金额为${minAmount}元`);
        }

        // 计算手续费
        const { fee, actualAmount } = await this.calculateWithdrawalFee(
          createDto.amount,
          withdrawalType,
        );

        // 原子扣减商家余额
        let updateResult;
        if (withdrawalType === WithdrawalType.BALANCE) {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Merchant)
            .set({
              balance: () => `balance - ${createDto.amount}`,
              frozenBalance: () => `"frozenBalance" + ${createDto.amount}`,
            })
            .where('id = :merchantId', { merchantId })
            .andWhere('balance >= :amount', { amount: createDto.amount })
            .execute();
        } else {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Merchant)
            .set({
              silver: () => `silver - ${createDto.amount}`,
              frozenSilver: () => `"frozenSilver" + ${createDto.amount}`,
            })
            .where('id = :merchantId', { merchantId })
            .andWhere('silver >= :amount', { amount: createDto.amount })
            .execute();
        }

        if (updateResult.affected === 0) {
          throw new BadRequestException('余额不足');
        }

        // 获取银行卡信息（需要从merchant-bank-cards获取，这里简化处理）
        // TODO: 待银行卡模块合并后统一处理
        const withdrawal = transactionalEntityManager.create(Withdrawal, {
          ownerType: WithdrawalOwnerType.MERCHANT,
          ownerId: merchantId,
          amount: createDto.amount,
          fee,
          actualAmount,
          type: withdrawalType,
          status: WithdrawalStatus.PENDING,
          bankCardId: createDto.bankCardId,
          bankName: '待获取',
          accountName: merchant.username,
          cardNumber: '待获取',
        });

        return await transactionalEntityManager.save(withdrawal);
      },
    );
  }

  async getStats(userId: string): Promise<{
    pending: number;
    completed: number;
    totalWithdrawn: number;
  }> {
    const pending = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'sum')
      .where('w.userId = :userId', { userId })
      .andWhere('w.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    const completed = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('SUM(w.actualAmount)', 'sum')
      .where('w.userId = :userId', { userId })
      .andWhere('w.status = :status', { status: WithdrawalStatus.COMPLETED })
      .getRawOne();

    return {
      pending: Number(pending?.sum || 0),
      completed: Number(completed?.sum || 0),
      totalWithdrawn: Number(completed?.sum || 0),
    };
  }

  // 管理员审核提现
  async review(
    id: string,
    reviewDto: ReviewWithdrawalDto,
    adminId: string,
  ): Promise<Withdrawal> {
    return this.withdrawalsRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const withdrawal = await transactionalEntityManager.findOne(
          Withdrawal,
          { where: { id } },
        );
        if (!withdrawal) {
          throw new NotFoundException('提现记录不存在');
        }

        if (withdrawal.status !== WithdrawalStatus.PENDING) {
          throw new BadRequestException('该提现已处理');
        }

        withdrawal.reviewedAt = new Date();
        withdrawal.reviewedBy = adminId;
        withdrawal.remark = reviewDto.remark;

        if (
          reviewDto.status === WithdrawalStatus.APPROVED ||
          reviewDto.status === WithdrawalStatus.COMPLETED
        ) {
          // 审核通过：从冻结余额扣除
          withdrawal.status = WithdrawalStatus.COMPLETED;

          if (withdrawal.type === WithdrawalType.BALANCE) {
            // 扣除冻结的本金
            await transactionalEntityManager
              .createQueryBuilder()
              .update(User)
              .set({
                frozenBalance: () => `"frozenBalance" - ${withdrawal.amount}`,
              })
              .where('id = :userId', { userId: withdrawal.userId })
              .execute();

            // 记录提现流水
            await this.financeRecordsService.recordBuyerWithdraw(
              withdrawal.ownerId,
              withdrawal.id,
              withdrawal.actualAmount,
              0, // 余额已为0或更新后的值
            );
          } else {
            // 扣除冻结的银锭
            await transactionalEntityManager
              .createQueryBuilder()
              .update(User)
              .set({
                frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`,
              })
              .where('id = :userId', { userId: withdrawal.userId })
              .execute();

            // 记录银锭提现流水
            await this.financeRecordsService.recordBuyerSilverWithdraw(
              withdrawal.ownerId,
              withdrawal.id,
              withdrawal.actualAmount,
              0,
            );
          }
        } else if (reviewDto.status === WithdrawalStatus.REJECTED) {
          // 审核拒绝：退还冻结余额到可用余额
          withdrawal.status = WithdrawalStatus.REJECTED;

          if (withdrawal.type === WithdrawalType.BALANCE) {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(User)
              .set({
                balance: () => `balance + ${withdrawal.amount}`,
                frozenBalance: () => `"frozenBalance" - ${withdrawal.amount}`,
              })
              .where('id = :userId', { userId: withdrawal.userId })
              .execute();
          } else {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(User)
              .set({
                silver: () => `silver + ${withdrawal.amount}`,
                frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`,
              })
              .where('id = :userId', { userId: withdrawal.userId })
              .execute();
          }
        }

        return await transactionalEntityManager.save(withdrawal);
      },
    );
  }

  // ============ 管理员查询接口 ============

  async findAllPending(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: Withdrawal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.withdrawalsRepository.findAndCount({
      where: { status: WithdrawalStatus.PENDING },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: { status?: WithdrawalStatus; userId?: string },
  ): Promise<{
    data: Withdrawal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: any = {};
    if (filters?.status !== undefined) {
      where.status = filters.status;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }

    const [data, total] = await this.withdrawalsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getAdminStats(): Promise<{
    pendingCount: number;
    pendingAmount: number;
    todayCount: number;
    todayAmount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingStats = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(w.amount)', 'amount')
      .where('w.status = :status', { status: WithdrawalStatus.PENDING })
      .getRawOne();

    const todayStats = await this.withdrawalsRepository
      .createQueryBuilder('w')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(w.amount)', 'amount')
      .where('w.status = :status', { status: WithdrawalStatus.COMPLETED })
      .andWhere('w.reviewedAt >= :today', { today })
      .getRawOne();

    return {
      pendingCount: Number(pendingStats?.count || 0),
      pendingAmount: Number(pendingStats?.amount || 0),
      todayCount: Number(todayStats?.count || 0),
      todayAmount: Number(todayStats?.amount || 0),
    };
  }
}
