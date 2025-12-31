import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
    VipRecord,
    VipLevelConfig,
    UserVipStatus,
    VipLevel,
    VipUserType,
    VipRecordType,
    PurchaseVipDto,
    AdminSetVipDto,
    VipLevelConfigDto,
    VipRecordFilterDto,
} from './vip-record.entity';

@Injectable()
export class VipRecordsService {
    constructor(
        @InjectRepository(VipRecord)
        private recordRepository: Repository<VipRecord>,
        @InjectRepository(VipLevelConfig)
        private configRepository: Repository<VipLevelConfig>,
        @InjectRepository(UserVipStatus)
        private statusRepository: Repository<UserVipStatus>,
    ) { }

    // ============ 用户VIP状态管理 ============

    /**
     * 获取用户VIP状态
     */
    async getUserVipStatus(userId: string): Promise<UserVipStatus | null> {
        return this.statusRepository.findOne({ where: { userId } });
    }

    /**
     * 创建或获取用户VIP状态
     */
    async getOrCreateVipStatus(userId: string, userType: VipUserType): Promise<UserVipStatus> {
        let status = await this.getUserVipStatus(userId);
        if (!status) {
            status = this.statusRepository.create({
                userId,
                userType,
                level: VipLevel.NORMAL,
            });
            status = await this.statusRepository.save(status);
        }
        return status;
    }

    /**
     * 购买/升级VIP
     */
    async purchaseVip(
        userId: string,
        userType: VipUserType,
        dto: PurchaseVipDto
    ): Promise<{ success: boolean; message: string; status?: UserVipStatus }> {
        const config = await this.getLevelConfig(userType, dto.level);
        if (!config) {
            return { success: false, message: 'VIP等级配置不存在' };
        }

        // 计算价格
        const price = dto.months >= 12
            ? config.yearlyPrice
            : config.monthlyPrice * dto.months;

        // 获取当前状态
        const status = await this.getOrCreateVipStatus(userId, userType);
        const oldLevel = status.level;

        // 计算新的到期时间
        const now = new Date();
        let expireAt: Date;
        if (status.expireAt && status.expireAt > now && status.level === dto.level) {
            // 续费：在原到期时间基础上延长
            expireAt = new Date(status.expireAt);
        } else {
            // 新购或升级：从现在开始计算
            expireAt = now;
        }
        expireAt.setDate(expireAt.getDate() + dto.months * 30);

        // 更新VIP状态
        status.level = dto.level;
        status.expireAt = expireAt;
        status.isExpired = false;
        status.totalDays += dto.months * 30;
        status.totalSpent = Number(status.totalSpent) + price;

        await this.statusRepository.save(status);

        // 记录VIP变更
        await this.createRecord({
            userId,
            userType,
            oldLevel,
            newLevel: dto.level,
            recordType: oldLevel === dto.level ? VipRecordType.RENEW : VipRecordType.UPGRADE,
            amount: price,
            duration: dto.months * 30,
            expireAt,
            remark: `购买VIP${dto.level}，${dto.months}个月`,
        });

        return { success: true, message: '购买成功', status };
    }

    /**
     * 管理员设置VIP
     */
    async adminSetVip(dto: AdminSetVipDto, operatorId: string): Promise<UserVipStatus> {
        const status = await this.getOrCreateVipStatus(dto.userId, dto.userType);
        const oldLevel = status.level;

        // 计算到期时间
        const now = new Date();
        const expireAt = new Date(now);
        expireAt.setDate(expireAt.getDate() + dto.duration);

        // 更新状态
        status.level = dto.level;
        status.expireAt = expireAt;
        status.isExpired = false;
        status.totalDays += dto.duration;

        await this.statusRepository.save(status);

        // 记录
        await this.createRecord({
            userId: dto.userId,
            userType: dto.userType,
            oldLevel,
            newLevel: dto.level,
            recordType: VipRecordType.ADMIN_SET,
            amount: 0,
            duration: dto.duration,
            expireAt,
            operatorId,
            remark: dto.remark || `管理员设置VIP${dto.level}，${dto.duration}天`,
        });

        return status;
    }

    /**
     * 检查并处理过期VIP
     */
    async processExpiredVip(): Promise<number> {
        const now = new Date();
        const expiredStatuses = await this.statusRepository.find({
            where: {
                expireAt: LessThan(now),
                isExpired: false,
                level: LessThan(VipLevel.NORMAL) as any,  // 排除普通用户
            }
        });

        let count = 0;
        for (const status of expiredStatuses) {
            if (status.level > VipLevel.NORMAL) {
                const oldLevel = status.level;
                status.level = VipLevel.NORMAL;
                status.isExpired = true;
                await this.statusRepository.save(status);

                // 记录过期
                await this.createRecord({
                    userId: status.userId,
                    userType: status.userType,
                    oldLevel,
                    newLevel: VipLevel.NORMAL,
                    recordType: VipRecordType.EXPIRE,
                    amount: 0,
                    duration: 0,
                    remark: 'VIP已过期',
                });

                count++;
            }
        }

        return count;
    }

    /**
     * 创建VIP记录
     */
    private async createRecord(data: Partial<VipRecord>): Promise<VipRecord> {
        const record = this.recordRepository.create(data);
        return this.recordRepository.save(record);
    }

    /**
     * 获取用户VIP记录
     */
    async getUserRecords(
        userId: string,
        filter?: VipRecordFilterDto
    ): Promise<{ data: VipRecord[]; total: number }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.recordRepository.createQueryBuilder('r')
            .where('r.userId = :userId', { userId });

        if (filter?.recordType !== undefined) {
            queryBuilder.andWhere('r.recordType = :recordType', { recordType: filter.recordType });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('r.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    // ============ VIP等级配置管理 ============

    /**
     * 获取等级配置
     */
    async getLevelConfig(userType: VipUserType, level: VipLevel): Promise<VipLevelConfig | null> {
        return this.configRepository.findOne({
            where: { userType, level, isActive: true }
        });
    }

    /**
     * 获取所有等级配置
     */
    async getAllLevelConfigs(userType?: VipUserType): Promise<VipLevelConfig[]> {
        const where = userType !== undefined ? { userType, isActive: true } : { isActive: true };
        return this.configRepository.find({
            where,
            order: { userType: 'ASC', level: 'ASC' }
        });
    }

    /**
     * 创建或更新等级配置
     */
    async upsertLevelConfig(
        userType: VipUserType,
        dto: VipLevelConfigDto
    ): Promise<VipLevelConfig> {
        let config = await this.getLevelConfig(userType, dto.level);

        if (!config) {
            config = this.configRepository.create({
                userType,
                ...dto,
            });
        } else {
            Object.assign(config, dto);
        }

        return this.configRepository.save(config);
    }

    /**
     * 初始化默认VIP配置
     */
    async initDefaultConfigs(): Promise<void> {
        const buyerConfigs = [
            { level: VipLevel.VIP1, name: '青铜会员', monthlyPrice: 30, yearlyPrice: 288, commissionRate: 0.02, maxDailyTasks: 50 },
            { level: VipLevel.VIP2, name: '白银会员', monthlyPrice: 68, yearlyPrice: 680, commissionRate: 0.05, maxDailyTasks: 100 },
            { level: VipLevel.VIP3, name: '黄金会员', monthlyPrice: 128, yearlyPrice: 1280, commissionRate: 0.08, maxDailyTasks: 200 },
            { level: VipLevel.VIP4, name: '铂金会员', monthlyPrice: 268, yearlyPrice: 2680, commissionRate: 0.10, maxDailyTasks: 0, priorityMatching: true },
            { level: VipLevel.VIP5, name: '钻石会员', monthlyPrice: 518, yearlyPrice: 5180, commissionRate: 0.15, maxDailyTasks: 0, priorityMatching: true, exclusiveTasks: true },
        ];

        const merchantConfigs = [
            { level: VipLevel.VIP1, name: '基础商家', monthlyPrice: 99, yearlyPrice: 999, commissionRate: -0.02 },  // 负数表示服务费减免
            { level: VipLevel.VIP2, name: '高级商家', monthlyPrice: 199, yearlyPrice: 1999, commissionRate: -0.05 },
            { level: VipLevel.VIP3, name: '金牌商家', monthlyPrice: 399, yearlyPrice: 3999, commissionRate: -0.08, priorityMatching: true },
            { level: VipLevel.VIP4, name: '钻石商家', monthlyPrice: 699, yearlyPrice: 6999, commissionRate: -0.10, priorityMatching: true },
            { level: VipLevel.VIP5, name: '至尊商家', monthlyPrice: 999, yearlyPrice: 9999, commissionRate: -0.15, priorityMatching: true, exclusiveTasks: true },
        ];

        for (const cfg of buyerConfigs) {
            const exists = await this.configRepository.findOne({
                where: { userType: VipUserType.BUYER, level: cfg.level }
            });
            if (!exists) {
                await this.configRepository.save(this.configRepository.create({
                    userType: VipUserType.BUYER,
                    ...cfg,
                    maxTaskPrice: 0,
                }));
            }
        }

        for (const cfg of merchantConfigs) {
            const exists = await this.configRepository.findOne({
                where: { userType: VipUserType.MERCHANT, level: cfg.level }
            });
            if (!exists) {
                await this.configRepository.save(this.configRepository.create({
                    userType: VipUserType.MERCHANT,
                    ...cfg,
                    maxDailyTasks: 0,
                    maxTaskPrice: 0,
                }));
            }
        }
    }

    // ============ 管理员功能 ============

    /**
     * 获取所有VIP记录
     */
    async getAllRecords(filter?: VipRecordFilterDto): Promise<{ data: VipRecord[]; total: number }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.recordRepository.createQueryBuilder('r');

        if (filter?.recordType !== undefined) {
            queryBuilder.andWhere('r.recordType = :recordType', { recordType: filter.recordType });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('r.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 获取VIP统计
     */
    async getVipStats(userType?: VipUserType): Promise<{
        totalVipUsers: number;
        byLevel: Record<VipLevel, number>;
        totalRevenue: number;
    }> {
        const queryBuilder = this.statusRepository.createQueryBuilder('s')
            .where('s.level > :normal', { normal: VipLevel.NORMAL })
            .andWhere('s.isExpired = :expired', { expired: false });

        if (userType !== undefined) {
            queryBuilder.andWhere('s.userType = :userType', { userType });
        }

        const totalVipUsers = await queryBuilder.getCount();

        // 按等级统计
        const levelStats = await this.statusRepository
            .createQueryBuilder('s')
            .select('s.level', 'level')
            .addSelect('COUNT(*)', 'count')
            .where('s.level > :normal', { normal: VipLevel.NORMAL })
            .andWhere('s.isExpired = :expired', { expired: false })
            .groupBy('s.level')
            .getRawMany();

        const byLevel: Record<number, number> = {};
        for (const level of Object.values(VipLevel).filter(v => typeof v === 'number')) {
            byLevel[level as number] = 0;
        }
        for (const row of levelStats) {
            byLevel[row.level] = parseInt(row.count, 10);
        }

        // 总收入
        const revenueResult = await this.recordRepository
            .createQueryBuilder('r')
            .select('COALESCE(SUM(r.amount), 0)', 'total')
            .where('r.recordType IN (:...types)', {
                types: [VipRecordType.UPGRADE, VipRecordType.RENEW]
            })
            .getRawOne();

        return {
            totalVipUsers,
            byLevel: byLevel as Record<VipLevel, number>,
            totalRevenue: parseFloat(revenueResult.total),
        };
    }
}
