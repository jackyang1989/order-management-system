import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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
  ) {}

  /**
   * 创建财务记录
   */
  async create(dto: CreateFinanceRecordDto): Promise<FinanceRecord> {
    const record = this.financeRecordRepository.create(dto);
    return this.financeRecordRepository.save(record);
  }

  /**
   * 查询财务记录列表
   */
  async findAll(filter: FinanceRecordFilterDto): Promise<{
    data: FinanceRecord[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;

    const queryBuilder = this.financeRecordRepository.createQueryBuilder('fr');

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

    const total = await queryBuilder.getCount();
    const data = await queryBuilder
      .orderBy('fr.createdAt', 'DESC')
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
   * 对应原版: 任务审核拒绝时退还银锭
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
   * 对应原版: 接单时冻结1银锭
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
   * 对应原版 type=11: 返还做任务押的银锭
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
   * 对应原版 type=13: 取消任务扣除冻结银锭
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
   * 对应原版 type=12: 拒绝提现退款
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
}
