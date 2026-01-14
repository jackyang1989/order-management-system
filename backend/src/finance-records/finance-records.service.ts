import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  FinanceRecord,
  CreateFinanceRecordDto,
  FinanceRecordFilterDto,
  FinanceUserType,
  FinanceMoneyType,
  FinanceType,
} from './finance-record.entity';

@Injectable()
export class FinanceRecordsService {
  constructor(
    @InjectRepository(FinanceRecord)
    private financeRecordRepository: Repository<FinanceRecord>,
    private dataSource: DataSource,
  ) { }

  /**
   * 创建财务记录
   */
  async create(dto: CreateFinanceRecordDto): Promise<FinanceRecord> {
    const record = this.financeRecordRepository.create(dto);
    return this.financeRecordRepository.save(record);
  }

  /**
   * 使用指定的EntityManager创建财务记录（用于事务）
   */
  async createWithManager(
    manager: EntityManager,
    data: {
      userId: string;
      userType: 'buyer' | 'merchant';
      type: string;
      amount: number;
      balanceAfter: number;
      description: string;
      relatedOrderId?: string;
    },
  ): Promise<FinanceRecord> {
    const record = manager.create(FinanceRecord, {
      userId: data.userId,
      userType: data.userType === 'buyer' ? FinanceUserType.BUYER : FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: data.type === 'return' ? FinanceType.BUYER_TASK_REFUND : FinanceType.BUYER_TASK_COMMISSION,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      memo: data.description,
      relatedId: data.relatedOrderId,
      relatedType: 'order',
    });
    return manager.save(record);
  }

  /**
   * 查询财务记录列表（带用户名）
   */
  async findAll(filter: FinanceRecordFilterDto): Promise<{
    data: Array<FinanceRecord & { username?: string; changeType?: string }>;
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;

    const queryBuilder = this.financeRecordRepository
      .createQueryBuilder('fr')
      .leftJoin('users', 'u', 'fr.userId::uuid = u.id AND fr.userType = 1')
      .leftJoin('merchants', 'm', 'fr.userId::uuid = m.id AND fr.userType = 2')
      .addSelect('COALESCE(u.username, m.username)', 'username');

    if (filter.userId) {
      queryBuilder.andWhere('fr.userId = :userId', { userId: filter.userId });
    }
    if (filter.userType !== undefined) {
      queryBuilder.andWhere('fr.userType = :userType', {
        userType: filter.userType,
      });
    }
    if (filter.moneyType !== undefined) {
      queryBuilder.andWhere('fr.moneyType = :moneyType', {
        moneyType: filter.moneyType,
      });
    }
    if (filter.financeType !== undefined) {
      queryBuilder.andWhere('fr.financeType = :financeType', {
        financeType: filter.financeType,
      });
    }
    if (filter.startDate && filter.endDate) {
      queryBuilder.andWhere('fr.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filter.startDate),
        endDate: new Date(filter.endDate),
      });
    }

    // Get count before pagination
    const total = await queryBuilder.getCount();

    // Get paginated raw results with username
    const rawResults = await queryBuilder
      .orderBy('fr.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    // Merge username into entity data
    const data = rawResults.entities.map((entity, index) => ({
      ...entity,
      username: rawResults.raw[index]?.username || null,
      changeType: this.getFinanceTypeText(entity.financeType),
    }));

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 查询用户余额记录（买手押金流水）
   */
  async findUserBalanceRecords(
    userId: string,
    filter?: FinanceRecordFilterDto,
  ): Promise<{
    data: FinanceRecord[];
    total: number;
  }> {
    return this.findAll({
      ...filter,
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.BALANCE,
    });
  }

  /**
   * 查询用户银锭记录（买手礼金流水）
   */
  async findUserSilverRecords(
    userId: string,
    filter?: FinanceRecordFilterDto,
  ): Promise<{
    data: FinanceRecord[];
    total: number;
  }> {
    return this.findAll({
      ...filter,
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
    });
  }

  /**
   * 查询商家押金记录
   */
  async findMerchantBalanceRecords(
    merchantId: string,
    filter?: FinanceRecordFilterDto,
  ): Promise<{
    data: FinanceRecord[];
    total: number;
  }> {
    return this.findAll({
      ...filter,
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.BALANCE,
    });
  }

  /**
   * 查询商家银锭记录
   */
  async findMerchantSilverRecords(
    merchantId: string,
    filter?: FinanceRecordFilterDto,
  ): Promise<{
    data: FinanceRecord[];
    total: number;
  }> {
    return this.findAll({
      ...filter,
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.SILVER,
    });
  }

  // ============ 便捷记录方法 ============

  /**
   * 记录买手充值
   */
  async recordBuyerRecharge(
    userId: string,
    amount: number,
    balanceAfter: number,
    moneyType: FinanceMoneyType,
    memo: string,
    relatedId?: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType,
      financeType:
        moneyType === FinanceMoneyType.BALANCE
          ? FinanceType.BUYER_RECHARGE
          : FinanceType.BUYER_RECHARGE_SILVER,
      amount,
      balanceAfter,
      memo,
      relatedId,
      relatedType: 'recharge',
    });
  }

  /**
   * 记录买手提现
   */
  async recordBuyerWithdraw(
    userId: string,
    withdrawalId: string,
    amount: number,
    balanceAfter: number,
    memo?: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.BUYER_WITHDRAW,
      amount: -Math.abs(amount), // 提现为负数
      balanceAfter,
      memo: memo || '余额提现',
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
    });
  }

  /**
   * 记录买手银锭提现
   */
  async recordBuyerSilverWithdraw(
    userId: string,
    withdrawalId: string,
    amount: number,
    balanceAfter: number,
    memo?: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.BUYER_WITHDRAW_SILVER,
      amount: -Math.abs(amount),
      balanceAfter,
      memo: memo || '银锭提现',
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
    });
  }

  /**
   * 记录买手做单垫付
   */
  async recordBuyerTaskPrepay(
    userId: string,
    amount: number,
    balanceAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.BUYER_TASK_PREPAY,
      amount: -Math.abs(amount),
      balanceAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录买手任务返款（本金+佣金）
   */
  async recordBuyerTaskRefund(
    userId: string,
    principalAmount: number,
    commissionAmount: number,
    balanceAfter: number,
    silverAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord[]> {
    const records: FinanceRecord[] = [];

    // 本金返款
    if (principalAmount > 0) {
      records.push(
        await this.create({
          userId,
          userType: FinanceUserType.BUYER,
          moneyType: FinanceMoneyType.BALANCE,
          financeType: FinanceType.BUYER_TASK_REFUND,
          amount: principalAmount,
          balanceAfter,
          memo: `${memo} - 本金返款`,
          relatedId: orderId,
          relatedType: 'order',
        }),
      );
    }

    // 佣金发放
    if (commissionAmount > 0) {
      records.push(
        await this.create({
          userId,
          userType: FinanceUserType.BUYER,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.BUYER_TASK_COMMISSION,
          amount: commissionAmount,
          balanceAfter: silverAfter,
          memo: `${memo} - 佣金发放`,
          relatedId: orderId,
          relatedType: 'order',
        }),
      );
    }

    return records;
  }

  /**
   * 记录商家发布任务冻结
   */
  async recordMerchantTaskFreeze(
    merchantId: string,
    depositAmount: number,
    commissionAmount: number,
    balanceAfter: number,
    silverAfter: number,
    taskId: string,
    memo: string,
  ): Promise<FinanceRecord[]> {
    const records: FinanceRecord[] = [];

    // 押金冻结
    records.push(
      await this.create({
        userId: merchantId,
        userType: FinanceUserType.MERCHANT,
        moneyType: FinanceMoneyType.BALANCE,
        financeType: FinanceType.MERCHANT_TASK_FREEZE,
        amount: -Math.abs(depositAmount),
        balanceAfter,
        memo: `${memo} - 押金冻结`,
        relatedId: taskId,
        relatedType: 'task',
      }),
    );

    // 佣金扣除
    records.push(
      await this.create({
        userId: merchantId,
        userType: FinanceUserType.MERCHANT,
        moneyType: FinanceMoneyType.SILVER,
        financeType: FinanceType.MERCHANT_TASK_FEE,
        amount: -Math.abs(commissionAmount),
        balanceAfter: silverAfter,
        memo: `${memo} - 服务费扣除`,
        relatedId: taskId,
        relatedType: 'task',
      }),
    );

    return records;
  }

  /**
   * 记录商家任务结算（返款给买手）
   */
  async recordMerchantTaskSettle(
    merchantId: string,
    amount: number,
    frozenBalanceAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.MERCHANT_TASK_SETTLE,
      amount: -Math.abs(amount), // 从冻结余额扣除
      balanceAfter: frozenBalanceAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录管理员操作（充值/扣除）
   */
  async recordAdminOperation(
    userId: string,
    userType: FinanceUserType,
    moneyType: FinanceMoneyType,
    amount: number,
    balanceAfter: number,
    memo: string,
    operatorId: string,
  ): Promise<FinanceRecord> {
    const isDeduct = amount < 0;
    let financeType: FinanceType;

    if (userType === FinanceUserType.BUYER) {
      financeType = isDeduct
        ? FinanceType.BUYER_ADMIN_DEDUCT
        : FinanceType.BUYER_ADMIN_ADD;
    } else {
      financeType = isDeduct
        ? FinanceType.MERCHANT_ADMIN_DEDUCT
        : FinanceType.MERCHANT_ADMIN_ADD;
    }

    return this.create({
      userId,
      userType,
      moneyType,
      financeType,
      amount,
      balanceAfter,
      memo,
      operatorId,
      relatedType: 'admin',
    });
  }

  // ============ 商家提现记录 ============

  /**
   * 记录商家本金提现
   */
  async recordMerchantWithdraw(
    merchantId: string,
    withdrawalId: string,
    amount: number,
    balanceAfter: number,
    memo?: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.MERCHANT_WITHDRAW,
      amount: -Math.abs(amount),
      balanceAfter,
      memo: memo || '本金提现',
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
    });
  }

  /**
   * 记录商家银锭提现
   */
  async recordMerchantSilverWithdraw(
    merchantId: string,
    withdrawalId: string,
    amount: number,
    balanceAfter: number,
    memo?: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.MERCHANT_WITHDRAW_SILVER,
      amount: -Math.abs(amount),
      balanceAfter,
      memo: memo || '银锭提现',
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
    });
  }

  /**
   * 记录买手任务佣金
   */
  async recordBuyerTaskCommission(
    userId: string,
    amount: number,
    silverAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.BUYER_TASK_COMMISSION,
      amount,
      balanceAfter: silverAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录商家任务退款（解冻返还）
   */
  async recordMerchantTaskRefund(
    merchantId: string,
    amount: number,
    balanceAfter: number,
    taskId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.MERCHANT_TASK_REFUND,
      amount,
      balanceAfter,
      memo,
      relatedId: taskId,
      relatedType: 'task',
    });
  }

  /**
   * 记录商家任务银锭退款（拒绝审核时退还服务费银锭）
 *
   */
  async recordMerchantTaskSilverRefund(
    merchantId: string,
    amount: number,
    silverAfter: number,
    taskId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId: merchantId,
      userType: FinanceUserType.MERCHANT,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.MERCHANT_TASK_REFUND,
      amount,
      balanceAfter: silverAfter,
      memo,
      relatedId: taskId,
      relatedType: 'task',
    });
  }

  // ============ 买手银锭押金相关 (原版 type=11/13) ============

  /**
   * 记录买手接单扣除银锭押金
 *
   */
  async recordBuyerTaskSilverPrepay(
    userId: string,
    amount: number,
    silverAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.BUYER_TASK_PREPAY, // 使用做单垫付类型
      amount: -Math.abs(amount),
      balanceAfter: silverAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录买手任务完成返还银锭押金
 *
   */
  async recordBuyerTaskSilverRefund(
    userId: string,
    amount: number,
    silverAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.BUYER_TASK_SILVER_REFUND,
      amount: Math.abs(amount),
      balanceAfter: silverAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录取消任务扣除冻结银锭
 *
   */
  async recordBuyerTaskCancelSilver(
    userId: string,
    amount: number,
    silverAfter: number,
    orderId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.SILVER,
      financeType: FinanceType.BUYER_TASK_CANCEL_SILVER,
      amount: -Math.abs(amount),
      balanceAfter: silverAfter,
      memo,
      relatedId: orderId,
      relatedType: 'order',
    });
  }

  /**
   * 记录买手提现拒绝退款
 *
   */
  async recordBuyerWithdrawReject(
    userId: string,
    amount: number,
    balanceAfter: number,
    withdrawalId: string,
    memo: string,
  ): Promise<FinanceRecord> {
    return this.create({
      userId,
      userType: FinanceUserType.BUYER,
      moneyType: FinanceMoneyType.BALANCE,
      financeType: FinanceType.BUYER_WITHDRAW_REJECT,
      amount: Math.abs(amount), // 退回为正数
      balanceAfter,
      memo,
      relatedId: withdrawalId,
      relatedType: 'withdrawal',
    });
  }

  // ============ 导出功能 ============

  /**
   * 获取财务类型文字描述
   */
  getFinanceTypeText(type: FinanceType): string {
    const map: Record<number, string> = {
      [FinanceType.BUYER_RECHARGE]: '充值押金',
      [FinanceType.BUYER_RECHARGE_SILVER]: '充值银锭',
      [FinanceType.BUYER_WITHDRAW]: '提现',
      [FinanceType.BUYER_WITHDRAW_SILVER]: '银锭提现',
      [FinanceType.BUYER_BALANCE_TO_SILVER]: '本金转银锭',
      [FinanceType.BUYER_TASK_PREPAY]: '做单垫付',
      [FinanceType.BUYER_TASK_REFUND]: '任务返款',
      [FinanceType.BUYER_TASK_COMMISSION]: '任务佣金',
      [FinanceType.BUYER_INVITE_REWARD]: '邀请奖励',
      [FinanceType.BUYER_ADMIN_ADD]: '管理员充值',
      [FinanceType.BUYER_ADMIN_DEDUCT]: '管理员扣除',
      [FinanceType.BUYER_TASK_SILVER_REFUND]: '返还银锭押金',
      [FinanceType.BUYER_WITHDRAW_REJECT]: '拒绝提现退款',
      [FinanceType.BUYER_TASK_CANCEL_SILVER]: '取消任务扣除银锭',
      [FinanceType.BUYER_REGISTER_GIFT]: '注册赠送',
      [FinanceType.MERCHANT_RECHARGE]: '充值押金',
      [FinanceType.MERCHANT_RECHARGE_SILVER]: '充值银锭',
      [FinanceType.MERCHANT_WITHDRAW]: '本金提现',
      [FinanceType.MERCHANT_WITHDRAW_SILVER]: '银锭提现',
      [FinanceType.MERCHANT_TASK_FREEZE]: '发布任务冻结',
      [FinanceType.MERCHANT_TASK_UNFREEZE]: '任务取消解冻',
      [FinanceType.MERCHANT_TASK_SETTLE]: '任务结算',
      [FinanceType.MERCHANT_TASK_FEE]: '任务服务费',
      [FinanceType.MERCHANT_TASK_REFUND]: '任务退款',
      [FinanceType.MERCHANT_ADMIN_ADD]: '管理员充值',
      [FinanceType.MERCHANT_ADMIN_DEDUCT]: '管理员扣除',
      [FinanceType.REVIEW_TASK_PAY_BALANCE]: '追评任务支付(押金)',
      [FinanceType.REVIEW_TASK_PAY_SILVER]: '追评任务支付(银锭)',
      [FinanceType.REVIEW_TASK_CANCEL_REFUND]: '取消追评退回',
      [FinanceType.REVIEW_TASK_COMMISSION]: '追评任务佣金',
      [FinanceType.REVIEW_TASK_REJECT_REFUND]: '拒绝追评退回',
      [FinanceType.REWARD]: '奖励',
      [FinanceType.REFUND]: '退款',
    };
    return map[type] || '其他';
  }

  /**
   * 导出商家押金流水（用于生成CSV）
   */
  async exportMerchantBalanceRecords(
    merchantId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    data: Array<{
      amount: number;
      financeType: string;
      balanceAfter: number;
      memo: string;
      createdAt: string;
    }>;
  }> {
    // 验证时间范围不超过31天
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      throw new Error('最多下载时间区间为31天');
    }

    const records = await this.financeRecordRepository
      .createQueryBuilder('fr')
      .where('fr.userId = :merchantId', { merchantId })
      .andWhere('fr.userType = :userType', {
        userType: FinanceUserType.MERCHANT,
      })
      .andWhere('fr.moneyType = :moneyType', {
        moneyType: FinanceMoneyType.BALANCE,
      })
      .andWhere('fr.createdAt BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .orderBy('fr.createdAt', 'DESC')
      .getMany();

    return {
      data: records.map((r) => ({
        amount: Number(r.amount),
        financeType: this.getFinanceTypeText(r.financeType),
        balanceAfter: Number(r.balanceAfter),
        memo: r.memo || '',
        createdAt: r.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      })),
    };
  }

  /**
   * 导出商家银锭流水（用于生成CSV）
   */
  async exportMerchantSilverRecords(
    merchantId: string,
    startDate: string,
    endDate: string,
  ): Promise<{
    data: Array<{
      amount: number;
      financeType: string;
      balanceAfter: number;
      memo: string;
      createdAt: string;
    }>;
  }> {
    // 验证时间范围不超过31天
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      throw new Error('最多下载时间区间为31天');
    }

    const records = await this.financeRecordRepository
      .createQueryBuilder('fr')
      .where('fr.userId = :merchantId', { merchantId })
      .andWhere('fr.userType = :userType', {
        userType: FinanceUserType.MERCHANT,
      })
      .andWhere('fr.moneyType = :moneyType', {
        moneyType: FinanceMoneyType.SILVER,
      })
      .andWhere('fr.createdAt BETWEEN :startDate AND :endDate', {
        startDate: start,
        endDate: end,
      })
      .orderBy('fr.createdAt', 'DESC')
      .getMany();

    return {
      data: records.map((r) => ({
        amount: Number(r.amount),
        financeType: this.getFinanceTypeText(r.financeType),
        balanceAfter: Number(r.balanceAfter),
        memo: r.memo || '',
        createdAt: r.createdAt.toISOString().replace('T', ' ').substring(0, 19),
      })),
    };
  }
}
