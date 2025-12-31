import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
    UserInvite,
    InviteCode,
    InviteRewardConfig,
    InviteStatus,
    InviteType,
    InviteFilterDto,
    UpdateRewardConfigDto,
} from './user-invite.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { FinanceUserType, FinanceMoneyType } from '../finance-records/finance-record.entity';

@Injectable()
export class UserInvitesService {
    constructor(
        @InjectRepository(UserInvite)
        private inviteRepository: Repository<UserInvite>,
        @InjectRepository(InviteCode)
        private codeRepository: Repository<InviteCode>,
        @InjectRepository(InviteRewardConfig)
        private configRepository: Repository<InviteRewardConfig>,
        private financeRecordsService: FinanceRecordsService,
    ) { }

    // ============ 邀请码管理 ============

    /**
     * 生成邀请码
     */
    async generateInviteCode(userId: string, userType: InviteType): Promise<InviteCode> {
        // 检查是否已有邀请码
        const existing = await this.codeRepository.findOne({
            where: { userId, userType }
        });
        if (existing) {
            return existing;
        }

        // 生成唯一邀请码
        const code = this.generateCode();
        const inviteCode = this.codeRepository.create({
            userId,
            userType,
            code,
        });
        return this.codeRepository.save(inviteCode);
    }

    /**
     * 生成随机邀请码
     */
    private generateCode(): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * 获取用户邀请码
     */
    async getUserInviteCode(userId: string, userType: InviteType): Promise<InviteCode | null> {
        return this.codeRepository.findOne({
            where: { userId, userType, isActive: true }
        });
    }

    /**
     * 验证邀请码
     */
    async validateInviteCode(code: string): Promise<InviteCode | null> {
        return this.codeRepository.findOne({
            where: { code, isActive: true }
        });
    }

    // ============ 邀请记录管理 ============

    /**
     * 记录邀请（用户注册时调用）
     */
    async recordInvite(
        inviteCode: string,
        inviteeId: string,
        inviteePhone: string,
        inviteeName?: string
    ): Promise<UserInvite | null> {
        const code = await this.validateInviteCode(inviteCode);
        if (!code) {
            return null;
        }

        // 创建邀请记录
        const invite = this.inviteRepository.create({
            inviterId: code.userId,
            inviterType: code.userType,
            inviteeId,
            inviteePhone,
            inviteeName,
            inviteCode,
            status: InviteStatus.PENDING,
        });

        // 更新邀请码使用次数
        code.usedCount += 1;
        await this.codeRepository.save(code);

        return this.inviteRepository.save(invite);
    }

    /**
     * 激活邀请（被邀请人完成首充后调用）
     */
    async activateInvite(inviteeId: string, rechargeAmount: number): Promise<UserInvite | null> {
        const invite = await this.inviteRepository.findOne({
            where: { inviteeId, status: InviteStatus.PENDING }
        });

        if (!invite) {
            return null;
        }

        // 获取奖励配置
        const config = await this.getRewardConfig(invite.inviterType);
        if (!config || rechargeAmount < config.minRechargeAmount) {
            return null;  // 充值金额不满足条件
        }

        invite.status = InviteStatus.ACTIVATED;
        invite.rewardAmount = config.inviterReward;
        invite.inviteeRewardAmount = config.inviteeReward;
        invite.activatedAt = new Date();

        return this.inviteRepository.save(invite);
    }

    /**
     * 发放邀请奖励
     */
    async processInviteReward(inviteId: string): Promise<boolean> {
        const invite = await this.inviteRepository.findOne({
            where: { id: inviteId, status: InviteStatus.ACTIVATED }
        });

        if (!invite) {
            return false;
        }

        // 这里需要调用用户服务增加余额，简化处理只记录状态
        // 实际应该通过事务处理

        invite.status = InviteStatus.REWARDED;
        invite.rewardedAt = new Date();
        await this.inviteRepository.save(invite);

        // 记录财务流水
        if (invite.rewardAmount > 0) {
            const userType = invite.inviterType === InviteType.BUYER
                ? FinanceUserType.BUYER
                : FinanceUserType.MERCHANT;

            // 记录邀请人奖励（这里简化处理，实际需要获取余额）
            // await this.financeRecordsService.recordAdminOperation(...)
        }

        return true;
    }

    /**
     * 获取用户邀请列表
     */
    async findUserInvites(
        userId: string,
        filter?: InviteFilterDto
    ): Promise<{
        data: UserInvite[];
        total: number;
        stats: {
            totalInvites: number;
            activatedCount: number;
            rewardedCount: number;
            totalReward: number;
        };
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.inviteRepository.createQueryBuilder('i')
            .where('i.inviterId = :userId', { userId });

        if (filter?.status !== undefined) {
            queryBuilder.andWhere('i.status = :status', { status: filter.status });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('i.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        // 统计数据
        const stats = await this.inviteRepository
            .createQueryBuilder('i')
            .select('COUNT(*)', 'totalInvites')
            .addSelect('SUM(CASE WHEN i.status >= 1 THEN 1 ELSE 0 END)', 'activatedCount')
            .addSelect('SUM(CASE WHEN i.status = 2 THEN 1 ELSE 0 END)', 'rewardedCount')
            .addSelect('COALESCE(SUM(CASE WHEN i.status = 2 THEN i.rewardAmount ELSE 0 END), 0)', 'totalReward')
            .where('i.inviterId = :userId', { userId })
            .getRawOne();

        return {
            data,
            total,
            stats: {
                totalInvites: parseInt(stats.totalInvites, 10),
                activatedCount: parseInt(stats.activatedCount, 10),
                rewardedCount: parseInt(stats.rewardedCount, 10),
                totalReward: parseFloat(stats.totalReward),
            }
        };
    }

    /**
     * 获取邀请详情
     */
    async findOne(id: string): Promise<UserInvite | null> {
        return this.inviteRepository.findOne({ where: { id } });
    }

    /**
     * 获取被邀请人的邀请信息
     */
    async getInviteByInvitee(inviteeId: string): Promise<UserInvite | null> {
        return this.inviteRepository.findOne({ where: { inviteeId } });
    }

    // ============ 奖励配置管理 ============

    /**
     * 获取奖励配置
     */
    async getRewardConfig(inviteType: InviteType): Promise<InviteRewardConfig | null> {
        return this.configRepository.findOne({
            where: { inviteType, isActive: true }
        });
    }

    /**
     * 获取所有奖励配置
     */
    async getAllRewardConfigs(): Promise<InviteRewardConfig[]> {
        return this.configRepository.find({ order: { inviteType: 'ASC' } });
    }

    /**
     * 更新奖励配置
     */
    async updateRewardConfig(
        inviteType: InviteType,
        dto: UpdateRewardConfigDto
    ): Promise<InviteRewardConfig> {
        let config = await this.getRewardConfig(inviteType);

        if (!config) {
            config = this.configRepository.create({
                inviteType,
                inviterReward: dto.inviterReward || 0,
                inviteeReward: dto.inviteeReward || 0,
                minRechargeAmount: dto.minRechargeAmount || 0,
            });
        } else {
            Object.assign(config, dto);
        }

        return this.configRepository.save(config);
    }

    /**
     * 初始化默认奖励配置
     */
    async initDefaultConfigs(): Promise<void> {
        const configs = [
            {
                inviteType: InviteType.BUYER,
                inviterReward: 10,
                inviteeReward: 5,
                minRechargeAmount: 100,
                description: '邀请买手奖励：邀请人10元，被邀请人5元，需首充100元',
            },
            {
                inviteType: InviteType.MERCHANT,
                inviterReward: 50,
                inviteeReward: 20,
                minRechargeAmount: 500,
                description: '邀请商家奖励：邀请人50元，被邀请人20元，需首充500元',
            },
        ];

        for (const cfg of configs) {
            const exists = await this.configRepository.findOne({
                where: { inviteType: cfg.inviteType }
            });
            if (!exists) {
                await this.configRepository.save(this.configRepository.create(cfg));
            }
        }
    }

    // ============ 管理员功能 ============

    /**
     * 获取所有邀请记录（管理员）
     */
    async findAllInvites(filter?: InviteFilterDto): Promise<{
        data: UserInvite[];
        total: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.inviteRepository.createQueryBuilder('i');

        if (filter?.status !== undefined) {
            queryBuilder.andWhere('i.status = :status', { status: filter.status });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('i.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 手动发放奖励（管理员）
     */
    async adminProcessReward(inviteId: string): Promise<boolean> {
        return this.processInviteReward(inviteId);
    }

    /**
     * 获取邀请统计
     */
    async getInviteStats(): Promise<{
        totalInvites: number;
        pendingCount: number;
        activatedCount: number;
        rewardedCount: number;
        totalRewardPaid: number;
    }> {
        const result = await this.inviteRepository
            .createQueryBuilder('i')
            .select('COUNT(*)', 'totalInvites')
            .addSelect('SUM(CASE WHEN i.status = 0 THEN 1 ELSE 0 END)', 'pendingCount')
            .addSelect('SUM(CASE WHEN i.status = 1 THEN 1 ELSE 0 END)', 'activatedCount')
            .addSelect('SUM(CASE WHEN i.status = 2 THEN 1 ELSE 0 END)', 'rewardedCount')
            .addSelect('COALESCE(SUM(CASE WHEN i.status = 2 THEN i.rewardAmount ELSE 0 END), 0)', 'totalRewardPaid')
            .getRawOne();

        return {
            totalInvites: parseInt(result.totalInvites, 10),
            pendingCount: parseInt(result.pendingCount, 10),
            activatedCount: parseInt(result.activatedCount, 10),
            rewardedCount: parseInt(result.rewardedCount, 10),
            totalRewardPaid: parseFloat(result.totalRewardPaid),
        };
    }
}
