import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VipLevel, DEFAULT_VIP_LEVELS } from './vip-level.entity';

@Injectable()
export class VipLevelService implements OnModuleInit {
    private vipCache: Map<string, VipLevel> = new Map();

    constructor(
        @InjectRepository(VipLevel)
        private vipRepo: Repository<VipLevel>,
    ) { }

    async onModuleInit() {
        await this.ensureDefaults();
        await this.loadCache();
    }

    /**
     * 确保默认VIP等级存在
     */
    private async ensureDefaults(): Promise<void> {
        for (const vip of DEFAULT_VIP_LEVELS) {
            const existing = await this.vipRepo.findOne({
                where: { type: vip.type, level: vip.level },
            });
            if (!existing) {
                await this.vipRepo.save(this.vipRepo.create({
                    ...vip,
                    isActive: true,
                }));
            }
        }
    }

    /**
     * 加载缓存
     */
    private async loadCache(): Promise<void> {
        const levels = await this.vipRepo.find({ where: { isActive: true } });
        this.vipCache.clear();
        for (const level of levels) {
            this.vipCache.set(`${level.type}-${level.level}`, level);
        }
    }

    /**
     * 刷新缓存
     */
    async refreshCache(): Promise<void> {
        await this.loadCache();
    }

    /**
     * 获取所有VIP等级
     */
    async findAll(type?: 'buyer' | 'merchant', includeInactive = false): Promise<VipLevel[]> {
        const where: Record<string, unknown> = {};
        if (type) where.type = type;
        if (!includeInactive) where.isActive = true;

        return this.vipRepo.find({
            where,
            order: { type: 'ASC', sortOrder: 'ASC' },
        });
    }

    /**
     * 获取单个VIP等级
     */
    async findOne(id: string): Promise<VipLevel> {
        const level = await this.vipRepo.findOne({ where: { id } });
        if (!level) {
            throw new NotFoundException(`VIP等级 ${id} 不存在`);
        }
        return level;
    }

    /**
     * 根据类型和等级获取VIP配置
     */
    async findByTypeAndLevel(type: 'buyer' | 'merchant', level: number): Promise<VipLevel | null> {
        const cacheKey = `${type}-${level}`;
        if (this.vipCache.has(cacheKey)) {
            return this.vipCache.get(cacheKey)!;
        }
        return this.vipRepo.findOne({ where: { type, level, isActive: true } });
    }

    /**
     * 获取用户VIP权益
     */
    async getUserVipPrivileges(type: 'buyer' | 'merchant', level: number): Promise<{
        dailyTaskLimit: number;
        commissionBonus: number;
        withdrawFeeDiscount: number;
        serviceFeeDiscount: number;
        canReserveTask: boolean;
        priorityLevel: number;
        priorityReview: boolean;
    }> {
        const vip = await this.findByTypeAndLevel(type, level);
        if (!vip) {
            // 返回默认值
            return {
                dailyTaskLimit: type === 'buyer' ? 10 : 5,
                commissionBonus: 0,
                withdrawFeeDiscount: 0,
                serviceFeeDiscount: 0,
                canReserveTask: false,
                priorityLevel: 0,
                priorityReview: false,
            };
        }

        return {
            dailyTaskLimit: type === 'buyer' ? vip.dailyTaskLimit : vip.publishTaskLimit,
            commissionBonus: Number(vip.commissionBonus) || 0,
            withdrawFeeDiscount: Number(vip.withdrawFeeDiscount) || 0,
            serviceFeeDiscount: Number(vip.serviceFeeDiscount) || 0,
            canReserveTask: vip.canReserveTask,
            priorityLevel: vip.priorityLevel,
            priorityReview: vip.priorityReview,
        };
    }

    /**
     * 计算VIP佣金
     */
    calculateVipCommission(baseCommission: number, vipLevel: number, type: 'buyer' | 'merchant' = 'buyer'): number {
        const cacheKey = `${type}-${vipLevel}`;
        const vip = this.vipCache.get(cacheKey);
        if (!vip) return baseCommission;

        const bonus = Number(vip.commissionBonus) || 0;
        return baseCommission * (1 + bonus / 100);
    }

    /**
     * 计算VIP服务费折扣
     */
    calculateVipServiceFee(baseFee: number, vipLevel: number, type: 'buyer' | 'merchant' = 'merchant'): number {
        const cacheKey = `${type}-${vipLevel}`;
        const vip = this.vipCache.get(cacheKey);
        if (!vip) return baseFee;

        const discount = Number(vip.serviceFeeDiscount) || 0;
        return baseFee * (1 - discount / 100);
    }

    /**
     * 创建VIP等级
     */
    async create(data: Partial<VipLevel>): Promise<VipLevel> {
        const level = this.vipRepo.create(data);
        const saved = await this.vipRepo.save(level);
        await this.refreshCache();
        return saved;
    }

    /**
     * 更新VIP等级
     */
    async update(id: string, data: Partial<VipLevel>): Promise<VipLevel> {
        const level = await this.findOne(id);
        Object.assign(level, data);
        const saved = await this.vipRepo.save(level);
        await this.refreshCache();
        return saved;
    }

    /**
     * 删除VIP等级
     */
    async remove(id: string): Promise<void> {
        const level = await this.findOne(id);
        await this.vipRepo.remove(level);
        await this.refreshCache();
    }

    /**
     * 切换激活状态
     */
    async toggleActive(id: string): Promise<VipLevel> {
        const level = await this.findOne(id);
        level.isActive = !level.isActive;
        const saved = await this.vipRepo.save(level);
        await this.refreshCache();
        return saved;
    }

    /**
     * 获取VIP升级所需金额
     */
    async getUpgradePrice(type: 'buyer' | 'merchant', currentLevel: number, targetLevel: number): Promise<number> {
        if (targetLevel <= currentLevel) return 0;

        const target = await this.findByTypeAndLevel(type, targetLevel);
        if (!target) return 0;

        return Number(target.price) || 0;
    }
}
