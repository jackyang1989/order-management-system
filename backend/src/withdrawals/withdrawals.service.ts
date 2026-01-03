import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Withdrawal, WithdrawalStatus, WithdrawalType, CreateWithdrawalDto, ReviewWithdrawalDto } from './withdrawal.entity';
import { User } from '../users/user.entity';
import { BankCardsService } from '../bank-cards/bank-cards.service';
import { UsersService } from '../users/users.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { SystemConfigService } from '../system-config/system-config.service';

@Injectable()
export class WithdrawalsService {
    constructor(
        @InjectRepository(Withdrawal)
        private withdrawalsRepository: Repository<Withdrawal>,
        private bankCardsService: BankCardsService,
        private usersService: UsersService,
        private financeRecordsService: FinanceRecordsService,
        private systemConfigService: SystemConfigService,
    ) { }

    /**
     * 计算提现手续费（对应原版逻辑）
     * 原版规则:
     * - 本金提现: 金额 <= userFeeMaxPrice 时收取 userCashFree 元手续费
     * - 银锭提现: 按 rewardPrice 单价折算取整
     */
    async calculateWithdrawalFee(amount: number, type: WithdrawalType): Promise<{
        fee: number;
        actualAmount: number;
        rewardPrice?: number;
    }> {
        if (type === WithdrawalType.BALANCE) {
            // 本金提现手续费
            const userFeeMaxPrice = await this.systemConfigService.getNumberValue('userFeeMaxPrice', 100);
            const userCashFree = await this.systemConfigService.getNumberValue('userCashFree', 2);

            let fee = 0;
            if (amount <= userFeeMaxPrice) {
                fee = userCashFree;
            }
            // 超过阈值免手续费

            const actualAmount = Math.max(0, amount - fee);
            return { fee, actualAmount };
        } else {
            // 银锭提现: 按单价折算
            const rewardPrice = await this.systemConfigService.getNumberValue('rewardPrice', 1);
            // 银锭转换为人民币金额，取整
            const actualAmount = Math.floor(amount * rewardPrice);
            const fee = 0; // 银锭提现不收手续费，只是按单价折算

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
        const userMinMoney = await this.systemConfigService.getNumberValue('userMinMoney', 10);
        const userMinReward = await this.systemConfigService.getNumberValue('userMinReward', 10);
        const userFeeMaxPrice = await this.systemConfigService.getNumberValue('userFeeMaxPrice', 100);
        const userCashFree = await this.systemConfigService.getNumberValue('userCashFree', 2);
        const rewardPrice = await this.systemConfigService.getNumberValue('rewardPrice', 1);

        return {
            userMinMoney,
            userMinReward,
            userFeeMaxPrice,
            userCashFree,
            rewardPrice
        };
    }

    async findAllByUser(userId: string): Promise<Withdrawal[]> {
        return this.withdrawalsRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' }
        });
    }

    async findOne(id: string): Promise<Withdrawal | null> {
        return this.withdrawalsRepository.findOne({ where: { id } });
    }

    async create(userId: string, createDto: CreateWithdrawalDto): Promise<Withdrawal> {
        // 使用事务确保资金安全 (Transaction & Atomic Update)
        // 这一步是关键修复：防止高并发下的"双花"攻击
        return this.withdrawalsRepository.manager.transaction(async transactionalEntityManager => {
            // 0. 验证支付密码（匹配原版逻辑）
            const user = await this.usersService.findOne(userId);
            if (!user) {
                throw new NotFoundException('用户不存在');
            }
            if (!user.payPassword) {
                throw new BadRequestException('请先设置支付密码');
            }
            const isPasswordValid = await bcrypt.compare(createDto.payPassword, user.payPassword);
            if (!isPasswordValid) {
                throw new ForbiddenException('支付密码错误');
            }

            // 1. 获取银行卡信息
            const bankCard = await this.bankCardsService.findOne(createDto.bankCardId, userId);
            if (!bankCard) {
                throw new NotFoundException('银行卡不存在');
            }

            const withdrawalType = createDto.type || WithdrawalType.BALANCE;

            // 2. 获取系统配置的最低提现金额
            const config = await this.getWithdrawalConfig();
            const minAmount = withdrawalType === WithdrawalType.BALANCE
                ? config.userMinMoney
                : config.userMinReward;

            if (createDto.amount < minAmount) {
                throw new BadRequestException(
                    withdrawalType === WithdrawalType.BALANCE
                        ? `本金最低提现金额为${minAmount}元`
                        : `银锭最低提现数量为${minAmount}`
                );
            }

            // 3. 计算手续费（使用原版逻辑）
            const { fee, actualAmount, rewardPrice } = await this.calculateWithdrawalFee(
                createDto.amount,
                withdrawalType
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
                        frozenBalance: () => `frozenBalance + ${createDto.amount}`
                    })
                    .where("id = :userId", { userId })
                    .andWhere("balance >= :amount", { amount: createDto.amount })
                    .execute();
            } else {
                updateResult = await transactionalEntityManager
                    .createQueryBuilder()
                    .update(User)
                    .set({
                        silver: () => `silver - ${createDto.amount}`,
                        frozenSilver: () => `frozenSilver + ${createDto.amount}`
                    })
                    .where("id = :userId", { userId })
                    .andWhere("silver >= :amount", { amount: createDto.amount })
                    .execute();
            }

            // 如果没有行被更新，说明余额不足
            if (updateResult.affected === 0) {
                throw new BadRequestException('余额不足');
            }

            // 3. 创建提现记录
            const withdrawal = transactionalEntityManager.create(Withdrawal, {
                userId,
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
        });
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
            totalWithdrawn: Number(completed?.sum || 0)
        };
    }

    // 管理员审核提现
    async review(id: string, reviewDto: ReviewWithdrawalDto, adminId: string): Promise<Withdrawal> {
        return this.withdrawalsRepository.manager.transaction(async transactionalEntityManager => {
            const withdrawal = await transactionalEntityManager.findOne(Withdrawal, { where: { id } });
            if (!withdrawal) {
                throw new NotFoundException('提现记录不存在');
            }

            if (withdrawal.status !== WithdrawalStatus.PENDING) {
                throw new BadRequestException('该提现已处理');
            }

            withdrawal.reviewedAt = new Date();
            withdrawal.reviewedBy = adminId;
            withdrawal.remark = reviewDto.remark;

            if (reviewDto.status === WithdrawalStatus.APPROVED || reviewDto.status === WithdrawalStatus.COMPLETED) {
                // 审核通过：从冻结余额扣除
                withdrawal.status = WithdrawalStatus.COMPLETED;

                if (withdrawal.type === WithdrawalType.BALANCE) {
                    // 扣除冻结的本金
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .update(User)
                        .set({
                            frozenBalance: () => `"frozenBalance" - ${withdrawal.amount}`
                        })
                        .where("id = :userId", { userId: withdrawal.userId })
                        .execute();

                    // 记录提现流水
                    await this.financeRecordsService.recordBuyerWithdraw(
                        withdrawal.userId,
                        withdrawal.id,
                        withdrawal.actualAmount,
                        0  // 余额已为0或更新后的值
                    );
                } else {
                    // 扣除冻结的银锭
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .update(User)
                        .set({
                            frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`
                        })
                        .where("id = :userId", { userId: withdrawal.userId })
                        .execute();

                    // 记录银锭提现流水
                    await this.financeRecordsService.recordBuyerSilverWithdraw(
                        withdrawal.userId,
                        withdrawal.id,
                        withdrawal.actualAmount,
                        0
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
                            frozenBalance: () => `"frozenBalance" - ${withdrawal.amount}`
                        })
                        .where("id = :userId", { userId: withdrawal.userId })
                        .execute();
                } else {
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .update(User)
                        .set({
                            silver: () => `silver + ${withdrawal.amount}`,
                            frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`
                        })
                        .where("id = :userId", { userId: withdrawal.userId })
                        .execute();
                }
            }

            return await transactionalEntityManager.save(withdrawal);
        });
    }

    // ============ 管理员查询接口 ============

    async findAllPending(page: number = 1, limit: number = 20): Promise<{
        data: Withdrawal[];
        total: number;
        page: number;
        limit: number;
    }> {
        const [data, total] = await this.withdrawalsRepository.findAndCount({
            where: { status: WithdrawalStatus.PENDING },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit
        });

        return { data, total, page, limit };
    }

    async findAll(
        page: number = 1,
        limit: number = 20,
        filters?: { status?: WithdrawalStatus; userId?: string }
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
            take: limit
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
            todayAmount: Number(todayStats?.amount || 0)
        };
    }
}
