import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReferralReward, ReferralRewardType, ReferralRewardStatus } from './referral-reward.entity';
import { User } from '../users/user.entity';
import { SystemConfig } from '../system-config/system-config.entity';
import { FinanceRecord, FinanceType } from '../finance-records/finance-record.entity';

@Injectable()
export class ReferralService {
    private readonly logger = new Logger(ReferralService.name);

    constructor(
        @InjectRepository(ReferralReward)
        private rewardRepository: Repository<ReferralReward>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(SystemConfig)
        private configRepository: Repository<SystemConfig>,
        @InjectRepository(FinanceRecord)
        private financeRecordRepository: Repository<FinanceRecord>,
    ) { }

    /**
     * 获取系统配置
     */
    private async getConfig(key: string, defaultValue: number): Promise<number> {
        const config = await this.configRepository.findOne({ where: { key } });
        return config ? parseFloat(config.value) : defaultValue;
    }

    /**
     * 处理新用户注册推荐奖励
     */
    async handleUserRegistration(userId: string, referrerId: string, userType: 'buyer' | 'merchant'): Promise<void> {
        if (!referrerId) return;

        const referrer = await this.userRepository.findOne({ where: { id: referrerId } });
        if (!referrer) return;

        // 获取推荐奖励金额
        const rewardAmount = userType === 'buyer'
            ? await this.getConfig('buyer_referral_reward', 5)
            : await this.getConfig('merchant_referral_reward', 10);

        // 创建推荐奖励记录
        const reward = this.rewardRepository.create({
            userId: referrerId,
            referredUserId: userId,
            type: userType === 'buyer' ? ReferralRewardType.BUYER_REFERRAL : ReferralRewardType.MERCHANT_REFERRAL,
            amount: rewardAmount,
            status: ReferralRewardStatus.PENDING,
            remark: `推荐新${userType === 'buyer' ? '买手' : '商家'}注册奖励`,
        });

        await this.rewardRepository.save(reward);

        // 更新推荐人的推荐计数
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await this.userRepository.save(referrer);

        this.logger.log(`用户 ${referrerId} 推荐新用户 ${userId} 注册，待发放奖励 ${rewardAmount}`);
    }

    /**
     * 处理订单完成推荐奖励（买手完成订单后给推荐人奖励）
     */
    async handleOrderCompletion(
        buyerId: string,
        orderId: string,
        orderAmount: number,
    ): Promise<void> {
        const buyer = await this.userRepository.findOne({ where: { id: buyerId } });
        if (!buyer || !buyer.referrerId) return;

        // 获取订单完成奖励比例
        const rewardRate = await this.getConfig('order_referral_rate', 0.01); // 1%
        const rewardAmount = orderAmount * rewardRate;

        if (rewardAmount <= 0) return;

        // 一级推荐奖励
        const reward = this.rewardRepository.create({
            userId: buyer.referrerId,
            referredUserId: buyerId,
            type: ReferralRewardType.BUYER_ORDER,
            amount: rewardAmount,
            status: ReferralRewardStatus.PENDING,
            relatedOrderId: orderId,
            remark: `推荐买手完成订单奖励`,
        });
        await this.rewardRepository.save(reward);

        // 二级推荐奖励
        const referrer = await this.userRepository.findOne({ where: { id: buyer.referrerId } });
        if (referrer && referrer.referrerId) {
            const secondaryRate = await this.getConfig('secondary_referral_rate', 0.005); // 0.5%
            const secondaryAmount = orderAmount * secondaryRate;

            if (secondaryAmount > 0) {
                const secondaryReward = this.rewardRepository.create({
                    userId: referrer.referrerId,
                    referredUserId: buyerId,
                    type: ReferralRewardType.SECONDARY,
                    amount: secondaryAmount,
                    status: ReferralRewardStatus.PENDING,
                    relatedOrderId: orderId,
                    remark: `二级推荐奖励`,
                });
                await this.rewardRepository.save(secondaryReward);
            }
        }
    }

    /**
     * 处理任务发布推荐奖励（商家发布任务后给推荐人奖励）
     */
    async handleTaskPublication(
        merchantId: string,
        taskId: string,
        taskAmount: number,
    ): Promise<void> {
        const merchant = await this.userRepository.findOne({ where: { id: merchantId } });
        if (!merchant || !merchant.referrerId) return;

        // 获取任务发布奖励比例
        const rewardRate = await this.getConfig('task_referral_rate', 0.005); // 0.5%
        const rewardAmount = taskAmount * rewardRate;

        if (rewardAmount <= 0) return;

        const reward = this.rewardRepository.create({
            userId: merchant.referrerId,
            referredUserId: merchantId,
            type: ReferralRewardType.MERCHANT_TASK,
            amount: rewardAmount,
            status: ReferralRewardStatus.PENDING,
            relatedTaskId: taskId,
            remark: `推荐商家发布任务奖励`,
        });

        await this.rewardRepository.save(reward);
    }

    /**
     * 发放待发放的奖励
     */
    async processAndPayRewards(): Promise<number> {
        const pendingRewards = await this.rewardRepository.find({
            where: { status: ReferralRewardStatus.PENDING },
            relations: ['user'],
        });

        let paidCount = 0;

        for (const reward of pendingRewards) {
            try {
                // 更新用户余额
                const user = await this.userRepository.findOne({ where: { id: reward.userId } });
                if (!user) continue;

                user.balance = Number(user.balance) + Number(reward.amount);
                user.referralReward = Number(user.referralReward || 0) + Number(reward.amount);
                user.referralRewardToday = Number(user.referralRewardToday || 0) + Number(reward.amount);
                await this.userRepository.save(user);

                // 创建财务记录
                const financeRecord = this.financeRecordRepository.create({
                    userId: reward.userId,
                    type: FinanceType.REWARD,
                    amount: reward.amount,
                    balance: user.balance,
                    remark: reward.remark,
                    relatedId: reward.id,
                    relatedType: 'referral_reward',
                });
                await this.financeRecordRepository.save(financeRecord);

                // 更新奖励状态
                reward.status = ReferralRewardStatus.PAID;
                reward.paidAt = new Date();
                await this.rewardRepository.save(reward);

                paidCount++;
            } catch (error) {
                this.logger.error(`发放奖励失败: ${reward.id}, ${error.message}`);
            }
        }

        return paidCount;
    }

    /**
     * 获取用户的推荐奖励记录
     */
    async getUserRewards(userId: string): Promise<ReferralReward[]> {
        return this.rewardRepository.find({
            where: { userId },
            relations: ['referredUser'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * 获取用户推荐统计
     */
    async getUserReferralStats(userId: string): Promise<{
        totalReferrals: number;
        totalReward: number;
        todayReward: number;
        pendingReward: number;
    }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        const pendingReward = await this.rewardRepository
            .createQueryBuilder('reward')
            .where('reward.userId = :userId', { userId })
            .andWhere('reward.status = :status', { status: ReferralRewardStatus.PENDING })
            .select('SUM(reward.amount)', 'total')
            .getRawOne();

        return {
            totalReferrals: user?.referralCount || 0,
            totalReward: Number(user?.referralReward || 0),
            todayReward: Number(user?.referralRewardToday || 0),
            pendingReward: Number(pendingReward?.total || 0),
        };
    }

    /**
     * 获取推荐的用户列表
     */
    async getReferredUsers(userId: string): Promise<User[]> {
        return this.userRepository.find({
            where: { referrerId: userId },
            select: ['id', 'username', 'role', 'createdAt', 'isActive'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * 生成邀请码
     */
    async generateInviteCode(userId: string): Promise<string> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) return null;

        // 简单的邀请码生成：用户ID的哈希
        const code = Buffer.from(userId).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 8).toUpperCase();
        return code;
    }
}
