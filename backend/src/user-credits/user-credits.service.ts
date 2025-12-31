import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
    UserCredit,
    CreditLog,
    CreditLevelConfig,
    CreditUserType,
    CreditChangeType,
    CreditLevel,
    AdminAdjustCreditDto,
    BlacklistUserDto,
    CreditLogFilterDto,
} from './user-credit.entity';

@Injectable()
export class UserCreditsService {
    // 信用分变动规则
    private readonly CREDIT_RULES: Record<CreditChangeType, number> = {
        [CreditChangeType.INIT]: 100,
        [CreditChangeType.ORDER_COMPLETE]: 2,
        [CreditChangeType.ORDER_CANCEL]: -5,
        [CreditChangeType.REFUND]: -3,
        [CreditChangeType.TIMEOUT]: -10,
        [CreditChangeType.COMPLAINT]: -15,
        [CreditChangeType.REWARD]: 10,
        [CreditChangeType.PENALTY]: -20,
        [CreditChangeType.ADMIN_ADJUST]: 0,
        [CreditChangeType.DAILY_BONUS]: 1,
        [CreditChangeType.VIP_BONUS]: 5,
    };

    constructor(
        @InjectRepository(UserCredit)
        private creditRepository: Repository<UserCredit>,
        @InjectRepository(CreditLog)
        private logRepository: Repository<CreditLog>,
        @InjectRepository(CreditLevelConfig)
        private configRepository: Repository<CreditLevelConfig>,
    ) { }

    // ============ 信用管理 ============

    /**
     * 获取用户信用信息
     */
    async getUserCredit(userId: string): Promise<UserCredit | null> {
        return this.creditRepository.findOne({ where: { userId } });
    }

    /**
     * 获取或创建用户信用
     */
    async getOrCreateCredit(userId: string, userType: CreditUserType): Promise<UserCredit> {
        let credit = await this.getUserCredit(userId);
        if (!credit) {
            credit = this.creditRepository.create({
                userId,
                userType,
                score: 100,
                level: CreditLevel.NORMAL,
            });
            credit = await this.creditRepository.save(credit);

            // 记录初始化
            await this.createLog(userId, userType, CreditChangeType.INIT, 0, 100, 100, '初始化信用分');
        }
        return credit;
    }

    /**
     * 变更信用分
     */
    async changeCredit(
        userId: string,
        userType: CreditUserType,
        changeType: CreditChangeType,
        customChange?: number,
        reason?: string,
        relatedId?: string,
        operatorId?: string
    ): Promise<UserCredit> {
        const credit = await this.getOrCreateCredit(userId, userType);
        const oldScore = credit.score;
        const change = customChange ?? this.CREDIT_RULES[changeType];

        // 计算新分数（0-150范围）
        let newScore = oldScore + change;
        newScore = Math.max(0, Math.min(150, newScore));

        credit.score = newScore;
        credit.level = this.calculateLevel(newScore);

        // 更新订单统计
        switch (changeType) {
            case CreditChangeType.ORDER_COMPLETE:
                credit.totalOrders += 1;
                credit.completedOrders += 1;
                break;
            case CreditChangeType.ORDER_CANCEL:
                credit.totalOrders += 1;
                credit.cancelledOrders += 1;
                break;
            case CreditChangeType.REFUND:
                credit.refundedOrders += 1;
                break;
            case CreditChangeType.TIMEOUT:
                credit.timeoutCount += 1;
                break;
            case CreditChangeType.COMPLAINT:
                credit.complaintCount += 1;
                break;
        }

        // 更新完成率
        if (credit.totalOrders > 0) {
            credit.completionRate = (credit.completedOrders / credit.totalOrders) * 100;
        }

        // 如果分数过低，自动加入黑名单
        if (credit.score < 20 && !credit.isBlacklisted) {
            credit.isBlacklisted = true;
            credit.level = CreditLevel.BLACKLIST;
            credit.blacklistReason = '信用分过低自动加入黑名单';
        }

        await this.creditRepository.save(credit);

        // 记录日志
        await this.createLog(
            userId,
            userType,
            changeType,
            oldScore,
            change,
            newScore,
            reason || this.getDefaultReason(changeType),
            relatedId,
            operatorId
        );

        return credit;
    }

    /**
     * 计算信用等级
     */
    private calculateLevel(score: number): CreditLevel {
        if (score < 20) return CreditLevel.BLACKLIST;
        if (score < 60) return CreditLevel.POOR;
        if (score < 80) return CreditLevel.NORMAL;
        if (score < 100) return CreditLevel.GOOD;
        if (score < 130) return CreditLevel.EXCELLENT;
        return CreditLevel.OUTSTANDING;
    }

    /**
     * 获取默认变动原因
     */
    private getDefaultReason(changeType: CreditChangeType): string {
        const reasons: Record<CreditChangeType, string> = {
            [CreditChangeType.INIT]: '初始化信用分',
            [CreditChangeType.ORDER_COMPLETE]: '订单完成奖励',
            [CreditChangeType.ORDER_CANCEL]: '订单取消扣分',
            [CreditChangeType.REFUND]: '退款扣分',
            [CreditChangeType.TIMEOUT]: '任务超时扣分',
            [CreditChangeType.COMPLAINT]: '被投诉扣分',
            [CreditChangeType.REWARD]: '系统奖励',
            [CreditChangeType.PENALTY]: '系统处罚',
            [CreditChangeType.ADMIN_ADJUST]: '管理员调整',
            [CreditChangeType.DAILY_BONUS]: '每日活跃奖励',
            [CreditChangeType.VIP_BONUS]: 'VIP奖励',
        };
        return reasons[changeType];
    }

    /**
     * 创建信用日志
     */
    private async createLog(
        userId: string,
        userType: CreditUserType,
        changeType: CreditChangeType,
        oldScore: number,
        change: number,
        newScore: number,
        reason: string,
        relatedId?: string,
        operatorId?: string
    ): Promise<CreditLog> {
        const log = this.logRepository.create({
            userId,
            userType,
            changeType,
            oldScore,
            change,
            newScore,
            reason,
            relatedId,
            operatorId,
        });
        return this.logRepository.save(log);
    }

    /**
     * 订单完成加分
     */
    async recordOrderComplete(userId: string, userType: CreditUserType, orderId: string): Promise<UserCredit> {
        return this.changeCredit(userId, userType, CreditChangeType.ORDER_COMPLETE, undefined, undefined, orderId);
    }

    /**
     * 订单取消扣分
     */
    async recordOrderCancel(userId: string, userType: CreditUserType, orderId: string): Promise<UserCredit> {
        return this.changeCredit(userId, userType, CreditChangeType.ORDER_CANCEL, undefined, undefined, orderId);
    }

    /**
     * 获取用户信用日志
     */
    async getUserLogs(userId: string, filter?: CreditLogFilterDto): Promise<{
        data: CreditLog[];
        total: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.logRepository.createQueryBuilder('l')
            .where('l.userId = :userId', { userId });

        if (filter?.changeType) {
            queryBuilder.andWhere('l.changeType = :changeType', { changeType: filter.changeType });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('l.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    // ============ 黑名单管理 ============

    /**
     * 加入黑名单
     */
    async addToBlacklist(userId: string, dto: BlacklistUserDto, operatorId: string): Promise<UserCredit> {
        const credit = await this.getUserCredit(userId);
        if (!credit) {
            throw new Error('用户信用记录不存在');
        }

        credit.isBlacklisted = true;
        credit.level = CreditLevel.BLACKLIST;
        credit.blacklistReason = dto.reason;

        if (dto.days && dto.days > 0) {
            const until = new Date();
            until.setDate(until.getDate() + dto.days);
            credit.blacklistUntil = until;
        } else {
            credit.blacklistUntil = null as any;  // 永久
        }

        await this.creditRepository.save(credit);

        // 记录日志
        await this.changeCredit(
            userId,
            credit.userType,
            CreditChangeType.PENALTY,
            -50,
            `加入黑名单：${dto.reason}`,
            undefined,
            operatorId
        );

        return credit;
    }

    /**
     * 移出黑名单
     */
    async removeFromBlacklist(userId: string, operatorId: string): Promise<UserCredit> {
        const credit = await this.getUserCredit(userId);
        if (!credit) {
            throw new Error('用户信用记录不存在');
        }

        credit.isBlacklisted = false;
        credit.blacklistReason = null as any;
        credit.blacklistUntil = null as any;
        credit.level = this.calculateLevel(credit.score);

        await this.creditRepository.save(credit);

        return credit;
    }

    /**
     * 处理过期黑名单
     */
    async processExpiredBlacklist(): Promise<number> {
        const now = new Date();
        const expiredCredits = await this.creditRepository.find({
            where: {
                isBlacklisted: true,
                blacklistUntil: LessThan(now),
            }
        });

        let count = 0;
        for (const credit of expiredCredits) {
            credit.isBlacklisted = false;
            credit.level = this.calculateLevel(credit.score);
            await this.creditRepository.save(credit);
            count++;
        }

        return count;
    }

    /**
     * 检查用户是否在黑名单
     */
    async isBlacklisted(userId: string): Promise<boolean> {
        const credit = await this.getUserCredit(userId);
        if (!credit) return false;

        if (credit.isBlacklisted) {
            // 检查是否已过期
            if (credit.blacklistUntil && credit.blacklistUntil < new Date()) {
                await this.removeFromBlacklist(userId, 'system');
                return false;
            }
            return true;
        }
        return false;
    }

    // ============ 管理员功能 ============

    /**
     * 管理员调整信用分
     */
    async adminAdjustCredit(
        userId: string,
        dto: AdminAdjustCreditDto,
        operatorId: string
    ): Promise<UserCredit> {
        const credit = await this.getUserCredit(userId);
        if (!credit) {
            throw new Error('用户信用记录不存在');
        }

        return this.changeCredit(
            userId,
            credit.userType,
            CreditChangeType.ADMIN_ADJUST,
            dto.change,
            dto.reason,
            undefined,
            operatorId
        );
    }

    /**
     * 获取黑名单用户列表
     */
    async getBlacklistUsers(page: number = 1, limit: number = 20): Promise<{
        data: UserCredit[];
        total: number;
    }> {
        const [data, total] = await this.creditRepository.findAndCount({
            where: { isBlacklisted: true },
            order: { updatedAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    /**
     * 获取信用等级配置
     */
    async getLevelConfigs(): Promise<CreditLevelConfig[]> {
        return this.configRepository.find({
            where: { isActive: true },
            order: { level: 'ASC' }
        });
    }

    /**
     * 初始化默认等级配置
     */
    async initDefaultConfigs(): Promise<void> {
        const configs = [
            { level: CreditLevel.BLACKLIST, name: '黑名单', minScore: 0, maxScore: 19 },
            { level: CreditLevel.POOR, name: '较差', minScore: 20, maxScore: 59 },
            { level: CreditLevel.NORMAL, name: '正常', minScore: 60, maxScore: 79 },
            { level: CreditLevel.GOOD, name: '良好', minScore: 80, maxScore: 99, commissionBonus: 0.02 },
            { level: CreditLevel.EXCELLENT, name: '优秀', minScore: 100, maxScore: 129, commissionBonus: 0.05 },
            { level: CreditLevel.OUTSTANDING, name: '卓越', minScore: 130, maxScore: 150, commissionBonus: 0.10 },
        ];

        for (const cfg of configs) {
            const exists = await this.configRepository.findOne({
                where: { level: cfg.level }
            });
            if (!exists) {
                await this.configRepository.save(this.configRepository.create(cfg));
            }
        }
    }
}
