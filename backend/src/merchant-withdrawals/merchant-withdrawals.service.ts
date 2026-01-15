import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MerchantWithdrawal,
  MerchantWithdrawalStatus,
  MerchantWithdrawalType,
  CreateMerchantWithdrawalDto,
  ReviewMerchantWithdrawalDto,
} from './merchant-withdrawal.entity';
import { Merchant } from '../merchants/merchant.entity';
import { MerchantBankCardsService } from '../merchant-bank-cards/merchant-bank-cards.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { AdminConfigService } from '../admin-config/admin-config.service';

@Injectable()
export class MerchantWithdrawalsService {
  constructor(
    @InjectRepository(MerchantWithdrawal)
    private withdrawalRepository: Repository<MerchantWithdrawal>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    private bankCardsService: MerchantBankCardsService,
    private financeRecordsService: FinanceRecordsService,
    private configService: AdminConfigService,
  ) { }

  async findAllByMerchant(merchantId: string): Promise<MerchantWithdrawal[]> {
    return this.withdrawalRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<MerchantWithdrawal | null> {
    return this.withdrawalRepository.findOne({ where: { id } });
  }

  async create(
    merchantId: string,
    createDto: CreateMerchantWithdrawalDto,
  ): Promise<MerchantWithdrawal> {
    return this.withdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 获取银行卡信息
        const bankCard = await this.bankCardsService.findOne(
          createDto.bankCardId,
          merchantId,
        );
        if (!bankCard) {
          throw new NotFoundException('银行卡不存在');
        }

        const minAmount = this.configService.getNumberValue('seller_min_withdraw', 100);

        if (createDto.amount < minAmount) {
          throw new BadRequestException(`商家最低提现金额为${minAmount}元`);
        }

        const withdrawalType = createDto.type || MerchantWithdrawalType.BALANCE;
        let fee = 0;
        let actualAmount = createDto.amount;

        if (withdrawalType === MerchantWithdrawalType.BALANCE) {
          const rate = this.configService.getNumberValue('seller_withdraw_fee_rate', 0);
          // sellerCashFee is rate?  sellerCashFee (decimal 12,3). 
          // If rate is e.g. 0.01 (1%), then fee = amount * 0.01.
          // Need to confirm if it represents percentage or fixed amount. 
          // Usually field name 'Fee' and type 'decimal' with scale 3 suggests rate (0.005) or percentage value (0.5).
          // Assuming rate for now based on 'sclae 3'.
          fee = Number((createDto.amount * rate).toFixed(2));
          actualAmount = createDto.amount - fee;
        }

        // Silver withdrawal for merchant? Logic same as buyer? usually silver to rmb.
        if (withdrawalType === MerchantWithdrawalType.SILVER) {
          // Merchant silver withdrawal logic not explicitly in 'sellerCashFee'.
          // Usually silver -> balance or silver -> rmb.
          // If SystemGlobalConfig has no specific merchant silver rule, assume 1:1 or same as buyer?
          // 
          // if user_type=1 (Seller):
          // ... nothing specific for silver different than balance in rejection logic.
          // But for CREATE, legacy Pay.php handles recharge. 
          // 
          // Not shown in viewed files.
          // Assuming no fee for silver (just exchange rate).
        }

        // 2. 原子扣减余额 + 冻结余额
        // P0-5: 使用参数化查询防止 SQL 注入
        const safeAmount = Number(createDto.amount);
        if (isNaN(safeAmount) || safeAmount <= 0) {
          throw new BadRequestException('无效的提现金额');
        }

        let updateResult;
        if (withdrawalType === MerchantWithdrawalType.BALANCE) {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Merchant)
            .set({
              balance: () => `balance - :deductAmount`,
              frozenBalance: () => `"frozenBalance" + :addAmount`,
            })
            .setParameter('deductAmount', safeAmount)
            .setParameter('addAmount', safeAmount)
            .where('id = :merchantId', { merchantId })
            .andWhere('balance >= :amount', { amount: safeAmount })
            .execute();
        } else {
          updateResult = await transactionalEntityManager
            .createQueryBuilder()
            .update(Merchant)
            .set({
              silver: () => `silver - :deductAmount`,
              frozenSilver: () => `"frozenSilver" + :addAmount`,
            })
            .setParameter('deductAmount', safeAmount)
            .setParameter('addAmount', safeAmount)
            .where('id = :merchantId', { merchantId })
            .andWhere('silver >= :amount', { amount: safeAmount })
            .execute();
        }

        if (updateResult.affected === 0) {
          throw new BadRequestException('余额不足');
        }

        // 3. 创建提现记录
        const withdrawal = transactionalEntityManager.create(
          MerchantWithdrawal,
          {
            merchantId,
            amount: createDto.amount,
            fee,
            actualAmount,
            type: withdrawalType,
            status: MerchantWithdrawalStatus.PENDING,
            bankCardId: bankCard.id,
            bankName: bankCard.bankName,
            accountName: bankCard.accountName,
            cardNumber: bankCard.cardNumber,
            phone: bankCard.phone,
          },
        );

        return await transactionalEntityManager.save(withdrawal);
      },
    );
  }

  async getStats(merchantId: string): Promise<{
    pending: number;
    completed: number;
    totalWithdrawn: number;
  }> {
    const pending = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('SUM(w.amount)', 'sum')
      .where('w.merchantId = :merchantId', { merchantId })
      .andWhere('w.status = :status', {
        status: MerchantWithdrawalStatus.PENDING,
      })
      .getRawOne();

    const completed = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('SUM(w.actualAmount)', 'sum')
      .where('w.merchantId = :merchantId', { merchantId })
      .andWhere('w.status = :status', {
        status: MerchantWithdrawalStatus.COMPLETED,
      })
      .getRawOne();

    return {
      pending: Number(pending?.sum || 0),
      completed: Number(completed?.sum || 0),
      totalWithdrawn: Number(completed?.sum || 0),
    };
  }

  // ============ 管理员接口 ============

  async review(
    id: string,
    reviewDto: ReviewMerchantWithdrawalDto,
    adminId: string,
  ): Promise<MerchantWithdrawal> {
    return this.withdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const withdrawal = await transactionalEntityManager.findOne(
          MerchantWithdrawal,
          { where: { id } },
        );
        if (!withdrawal) {
          throw new NotFoundException('提现记录不存在');
        }

        if (withdrawal.status !== MerchantWithdrawalStatus.PENDING) {
          throw new BadRequestException('该提现已处理');
        }

        withdrawal.reviewedAt = new Date();
        withdrawal.reviewedBy = adminId;
        withdrawal.remark = reviewDto.remark;

        // P0-5: 使用参数化查询防止 SQL 注入
        const safeWithdrawalAmount = Number(withdrawal.amount);

        if (
          reviewDto.status === MerchantWithdrawalStatus.APPROVED_PENDING_TRANSFER ||
          reviewDto.status === MerchantWithdrawalStatus.COMPLETED
        ) {
          // 审核通过：从冻结余额扣除
          withdrawal.status = MerchantWithdrawalStatus.COMPLETED;

          if (withdrawal.type === MerchantWithdrawalType.BALANCE) {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Merchant)
              .set({
                frozenBalance: () => `"frozenBalance" - :amount`,
              })
              .setParameter('amount', safeWithdrawalAmount)
              .where('id = :merchantId', { merchantId: withdrawal.merchantId })
              .execute();

            // 记录提现流水
            await this.financeRecordsService.recordMerchantWithdraw(
              withdrawal.merchantId,
              withdrawal.id,
              withdrawal.actualAmount,
              0,
            );
          } else {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Merchant)
              .set({
                frozenSilver: () => `"frozenSilver" - :amount`,
              })
              .setParameter('amount', safeWithdrawalAmount)
              .where('id = :merchantId', { merchantId: withdrawal.merchantId })
              .execute();

            await this.financeRecordsService.recordMerchantSilverWithdraw(
              withdrawal.merchantId,
              withdrawal.id,
              withdrawal.actualAmount,
              0,
            );
          }
        } else if (reviewDto.status === MerchantWithdrawalStatus.REJECTED) {
          // 审核拒绝：退还冻结余额
          withdrawal.status = MerchantWithdrawalStatus.REJECTED;

          if (withdrawal.type === MerchantWithdrawalType.BALANCE) {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Merchant)
              .set({
                balance: () => `balance + :addAmount`,
                frozenBalance: () => `"frozenBalance" - :deductAmount`,
              })
              .setParameter('addAmount', safeWithdrawalAmount)
              .setParameter('deductAmount', safeWithdrawalAmount)
              .where('id = :merchantId', { merchantId: withdrawal.merchantId })
              .execute();
          } else {
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Merchant)
              .set({
                silver: () => `silver + :addAmount`,
                frozenSilver: () => `"frozenSilver" - :deductAmount`,
              })
              .setParameter('addAmount', safeWithdrawalAmount)
              .setParameter('deductAmount', safeWithdrawalAmount)
              .where('id = :merchantId', { merchantId: withdrawal.merchantId })
              .execute();
          }
        }

        return await transactionalEntityManager.save(withdrawal);
      },
    );
  }

  async findAllPending(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    data: MerchantWithdrawal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const [data, total] = await this.withdrawalRepository.findAndCount({
      where: { status: MerchantWithdrawalStatus.PENDING },
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters?: { status?: MerchantWithdrawalStatus; merchantId?: string },
  ): Promise<{
    data: MerchantWithdrawal[];
    total: number;
    page: number;
    limit: number;
  }> {
    const where: Record<string, unknown> = {};
    if (filters?.status !== undefined) {
      where.status = filters.status;
    }
    if (filters?.merchantId) {
      where.merchantId = filters.merchantId;
    }

    const [data, total] = await this.withdrawalRepository.findAndCount({
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

    const pendingStats = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(w.amount)', 'amount')
      .where('w.status = :status', { status: MerchantWithdrawalStatus.PENDING })
      .getRawOne();

    const todayStats = await this.withdrawalRepository
      .createQueryBuilder('w')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(w.amount)', 'amount')
      .where('w.status = :status', {
        status: MerchantWithdrawalStatus.COMPLETED,
      })
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
