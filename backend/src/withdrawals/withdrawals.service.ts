import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Withdrawal, WithdrawalStatus, WithdrawalType, CreateWithdrawalDto, ReviewWithdrawalDto } from './withdrawal.entity';
import { User } from '../users/user.entity';
import { BankCardsService } from '../bank-cards/bank-cards.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class WithdrawalsService {
    constructor(
        @InjectRepository(Withdrawal)
        private withdrawalsRepository: Repository<Withdrawal>,
        private bankCardsService: BankCardsService,
        private usersService: UsersService,
    ) { }

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
            // 1. 获取银行卡信息
            const bankCard = await this.bankCardsService.findOne(createDto.bankCardId, userId);
            if (!bankCard) {
                throw new NotFoundException('银行卡不存在');
            }

            if (createDto.amount < 10) {
                throw new BadRequestException('最低提现金额为10元');
            }

            const withdrawalType = createDto.type || WithdrawalType.BALANCE;
            const fee = 0;
            const actualAmount = createDto.amount - fee;

            // 2. 原子扣减余额 + 冻结余额
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
        const withdrawal = await this.withdrawalsRepository.findOne({ where: { id } });
        if (!withdrawal) {
            throw new NotFoundException('提现记录不存在');
        }

        if (withdrawal.status !== WithdrawalStatus.PENDING) {
            throw new BadRequestException('该提现已处理');
        }

        withdrawal.status = reviewDto.status;
        withdrawal.remark = reviewDto.remark;
        withdrawal.reviewedAt = new Date();
        withdrawal.reviewedBy = adminId;

        // TODO: 如果通过，需要扣除用户余额
        // if (reviewDto.status === WithdrawalStatus.APPROVED) {
        //     await this.usersService.deductBalance(withdrawal.userId, withdrawal.amount, withdrawal.type);
        // }

        return this.withdrawalsRepository.save(withdrawal);
    }
}
