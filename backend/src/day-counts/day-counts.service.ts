import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
    UserDayCount,
    PlatformDayStat,
    DayCountUserType,
    DayCountFilterDto,
    IncrementDayCountDto,
} from './day-count.entity';

@Injectable()
export class DayCountsService {
    constructor(
        @InjectRepository(UserDayCount)
        private userDayCountRepository: Repository<UserDayCount>,
        @InjectRepository(PlatformDayStat)
        private platformStatRepository: Repository<PlatformDayStat>,
    ) { }

    // ============ 用户每日统计 ============

    /**
     * 获取今天的日期字符串
     */
    private getToday(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 获取或创建用户当日统计
     */
    async getOrCreateUserDayCount(
        userId: string,
        userType: DayCountUserType,
        date?: string
    ): Promise<UserDayCount> {
        const targetDate = date || this.getToday();

        let record = await this.userDayCountRepository.findOne({
            where: { userId, date: targetDate }
        });

        if (!record) {
            record = this.userDayCountRepository.create({
                userId,
                userType,
                date: targetDate,
            });
            record = await this.userDayCountRepository.save(record);
        }

        return record;
    }

    /**
     * 增加用户当日统计
     */
    async incrementUserDayCount(
        userId: string,
        userType: DayCountUserType,
        increment: IncrementDayCountDto
    ): Promise<UserDayCount> {
        const record = await this.getOrCreateUserDayCount(userId, userType);

        if (increment.taskCount) record.taskCount += increment.taskCount;
        if (increment.completedCount) record.completedCount += increment.completedCount;
        if (increment.cancelledCount) record.cancelledCount += increment.cancelledCount;
        if (increment.totalAmount) record.totalAmount = Number(record.totalAmount) + increment.totalAmount;
        if (increment.commissionEarned) record.commissionEarned = Number(record.commissionEarned) + increment.commissionEarned;
        if (increment.commissionPaid) record.commissionPaid = Number(record.commissionPaid) + increment.commissionPaid;

        return this.userDayCountRepository.save(record);
    }

    /**
     * 记录买手接单
     */
    async recordBuyerTask(buyerId: string, amount: number): Promise<void> {
        await this.incrementUserDayCount(buyerId, DayCountUserType.BUYER, {
            taskCount: 1,
            totalAmount: amount,
        });
    }

    /**
     * 记录买手完成订单
     */
    async recordBuyerComplete(buyerId: string, commission: number): Promise<void> {
        await this.incrementUserDayCount(buyerId, DayCountUserType.BUYER, {
            completedCount: 1,
            commissionEarned: commission,
        });
    }

    /**
     * 记录商家发布任务
     */
    async recordMerchantTask(merchantId: string, amount: number): Promise<void> {
        await this.incrementUserDayCount(merchantId, DayCountUserType.MERCHANT, {
            taskCount: 1,
            totalAmount: amount,
        });
    }

    /**
     * 记录商家任务完成
     */
    async recordMerchantComplete(merchantId: string, commission: number): Promise<void> {
        await this.incrementUserDayCount(merchantId, DayCountUserType.MERCHANT, {
            completedCount: 1,
            commissionPaid: commission,
        });
    }

    /**
     * 获取用户某段时间统计
     */
    async getUserStats(
        userId: string,
        filter?: DayCountFilterDto
    ): Promise<{ data: UserDayCount[]; summary: Record<string, number> }> {
        const queryBuilder = this.userDayCountRepository.createQueryBuilder('c')
            .where('c.userId = :userId', { userId });

        if (filter?.startDate) {
            queryBuilder.andWhere('c.date >= :startDate', { startDate: filter.startDate });
        }
        if (filter?.endDate) {
            queryBuilder.andWhere('c.date <= :endDate', { endDate: filter.endDate });
        }

        const data = await queryBuilder
            .orderBy('c.date', 'DESC')
            .getMany();

        // 汇总
        const summary = {
            totalTasks: 0,
            totalCompleted: 0,
            totalCancelled: 0,
            totalAmount: 0,
            totalCommissionEarned: 0,
            totalCommissionPaid: 0,
        };

        for (const record of data) {
            summary.totalTasks += record.taskCount;
            summary.totalCompleted += record.completedCount;
            summary.totalCancelled += record.cancelledCount;
            summary.totalAmount += Number(record.totalAmount);
            summary.totalCommissionEarned += Number(record.commissionEarned);
            summary.totalCommissionPaid += Number(record.commissionPaid);
        }

        return { data, summary };
    }

    // ============ 平台每日统计 ============

    /**
     * 获取或创建平台当日统计
     */
    async getOrCreatePlatformStat(date?: string): Promise<PlatformDayStat> {
        const targetDate = date || this.getToday();

        let record = await this.platformStatRepository.findOne({
            where: { date: targetDate }
        });

        if (!record) {
            record = this.platformStatRepository.create({ date: targetDate });
            record = await this.platformStatRepository.save(record);
        }

        return record;
    }

    /**
     * 增加平台当日统计
     */
    async incrementPlatformStat(field: keyof PlatformDayStat, amount: number = 1): Promise<void> {
        const record = await this.getOrCreatePlatformStat();
        (record as any)[field] = Number((record as any)[field] || 0) + amount;
        await this.platformStatRepository.save(record);
    }

    /**
     * 记录新增用户
     */
    async recordNewUser(isMerchant: boolean): Promise<void> {
        await this.incrementPlatformStat(isMerchant ? 'newMerchants' : 'newBuyers');
    }

    /**
     * 记录新任务
     */
    async recordNewTask(): Promise<void> {
        await this.incrementPlatformStat('newTasks');
    }

    /**
     * 记录新订单
     */
    async recordNewOrder(amount: number, commission: number): Promise<void> {
        const record = await this.getOrCreatePlatformStat();
        record.newOrders += 1;
        record.totalOrderAmount = Number(record.totalOrderAmount) + amount;
        record.totalCommission = Number(record.totalCommission) + commission;
        await this.platformStatRepository.save(record);
    }

    /**
     * 记录充值
     */
    async recordRecharge(amount: number): Promise<void> {
        await this.incrementPlatformStat('rechargeAmount', amount);
    }

    /**
     * 记录提现
     */
    async recordWithdraw(amount: number): Promise<void> {
        await this.incrementPlatformStat('withdrawAmount', amount);
    }

    /**
     * 获取平台统计
     */
    async getPlatformStats(filter?: DayCountFilterDto): Promise<{
        data: PlatformDayStat[];
        summary: Record<string, number>;
    }> {
        const queryBuilder = this.platformStatRepository.createQueryBuilder('s');

        if (filter?.startDate) {
            queryBuilder.andWhere('s.date >= :startDate', { startDate: filter.startDate });
        }
        if (filter?.endDate) {
            queryBuilder.andWhere('s.date <= :endDate', { endDate: filter.endDate });
        }

        const data = await queryBuilder
            .orderBy('s.date', 'DESC')
            .getMany();

        // 汇总
        const summary = {
            totalNewBuyers: 0,
            totalNewMerchants: 0,
            totalNewTasks: 0,
            totalNewOrders: 0,
            totalCompletedOrders: 0,
            totalOrderAmount: 0,
            totalCommission: 0,
            totalRecharge: 0,
            totalWithdraw: 0,
        };

        for (const record of data) {
            summary.totalNewBuyers += record.newBuyers;
            summary.totalNewMerchants += record.newMerchants;
            summary.totalNewTasks += record.newTasks;
            summary.totalNewOrders += record.newOrders;
            summary.totalCompletedOrders += record.completedOrders;
            summary.totalOrderAmount += Number(record.totalOrderAmount);
            summary.totalCommission += Number(record.totalCommission);
            summary.totalRecharge += Number(record.rechargeAmount);
            summary.totalWithdraw += Number(record.withdrawAmount);
        }

        return { data, summary };
    }

    /**
     * 获取今日概览
     */
    async getTodayOverview(): Promise<PlatformDayStat> {
        return this.getOrCreatePlatformStat();
    }

    /**
     * 获取趋势数据（最近N天）
     */
    async getTrend(days: number = 7): Promise<PlatformDayStat[]> {
        const endDate = this.getToday();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        const startDateStr = startDate.toISOString().split('T')[0];

        return this.platformStatRepository.find({
            where: {
                date: Between(startDateStr, endDate)
            },
            order: { date: 'ASC' }
        });
    }
}
