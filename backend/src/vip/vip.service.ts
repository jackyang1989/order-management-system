import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { VipPackage, VipPurchase, VipPurchaseStatus, CreateVipPackageDto, PurchaseVipDto } from './vip.entity';
import { User } from '../users/user.entity';

@Injectable()
export class VipService {
    constructor(
        @InjectRepository(VipPackage)
        private vipPackageRepository: Repository<VipPackage>,
        @InjectRepository(VipPurchase)
        private vipPurchaseRepository: Repository<VipPurchase>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private dataSource: DataSource,
    ) { }

    // ========== VIP 套餐管理 ==========

    async findAllPackages(): Promise<VipPackage[]> {
        return this.vipPackageRepository.find({
            where: { isActive: true },
            order: { sortOrder: 'ASC' }
        });
    }

    async findPackageById(id: string): Promise<VipPackage | null> {
        return this.vipPackageRepository.findOne({ where: { id } });
    }

    async createPackage(dto: CreateVipPackageDto): Promise<VipPackage> {
        const pkg = this.vipPackageRepository.create({
            name: dto.name,
            days: dto.days,
            price: dto.price,
            discountPrice: dto.discountPrice,
            description: dto.description || '',
            benefits: dto.benefits || [],
            sortOrder: dto.sortOrder || 0
        });
        return this.vipPackageRepository.save(pkg);
    }

    async updatePackage(id: string, dto: Partial<CreateVipPackageDto>): Promise<VipPackage | null> {
        const pkg = await this.vipPackageRepository.findOne({ where: { id } });
        if (!pkg) return null;
        Object.assign(pkg, dto);
        return this.vipPackageRepository.save(pkg);
    }

    async deletePackage(id: string): Promise<boolean> {
        const result = await this.vipPackageRepository.delete(id);
        return result.affected !== 0;
    }

    // ========== VIP 购买 ==========

    async purchaseVip(userId: string, dto: PurchaseVipDto): Promise<VipPurchase> {
        const pkg = await this.vipPackageRepository.findOne({ where: { id: dto.packageId } });
        if (!pkg || !pkg.isActive) {
            throw new NotFoundException('套餐不存在或已下架');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        // 检查用户银锭余额
        if (Number(user.silver) < Number(pkg.discountPrice)) {
            throw new BadRequestException('银锭余额不足');
        }

        // 使用事务
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 计算VIP时间
            const now = new Date();
            let vipStartAt: Date;
            let vipEndAt: Date;

            // 如果已是VIP，则续费
            if (user.vip && user.vipExpireAt && user.vipExpireAt > now) {
                vipStartAt = user.vipExpireAt;
                vipEndAt = new Date(user.vipExpireAt.getTime() + pkg.days * 24 * 60 * 60 * 1000);
            } else {
                vipStartAt = now;
                vipEndAt = new Date(now.getTime() + pkg.days * 24 * 60 * 60 * 1000);
            }

            // 扣除银锭
            user.silver = Number(user.silver) - Number(pkg.discountPrice);
            user.vip = true;
            user.vipExpireAt = vipEndAt;
            await queryRunner.manager.save(user);

            // 创建购买记录
            const purchase = this.vipPurchaseRepository.create({
                userId,
                packageId: pkg.id,
                packageName: pkg.name,
                days: pkg.days,
                amount: Number(pkg.discountPrice),
                status: VipPurchaseStatus.PAID,
                paymentMethod: dto.paymentMethod || 'silver',
                paidAt: now,
                vipStartAt,
                vipEndAt
            });
            await queryRunner.manager.save(purchase);

            await queryRunner.commitTransaction();
            return purchase;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ========== VIP 查询 ==========

    async getUserVipStatus(userId: string): Promise<{
        isVip: boolean;
        expireAt: Date | null;
        daysRemaining: number;
    }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            return { isVip: false, expireAt: null, daysRemaining: 0 };
        }

        const now = new Date();
        const isVip = user.vip && user.vipExpireAt && user.vipExpireAt > now;
        const daysRemaining = isVip && user.vipExpireAt
            ? Math.ceil((user.vipExpireAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            : 0;

        return {
            isVip: !!isVip,
            expireAt: user.vipExpireAt || null,
            daysRemaining
        };
    }

    async getUserPurchases(userId: string, page: number = 1, pageSize: number = 20): Promise<{
        list: VipPurchase[];
        total: number;
    }> {
        const [list, total] = await this.vipPurchaseRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize
        });
        return { list, total };
    }

    // ========== 初始化默认套餐 ==========

    async initDefaultPackages(): Promise<void> {
        const count = await this.vipPackageRepository.count();
        if (count > 0) return;

        const defaultPackages = [
            {
                name: '月度VIP',
                days: 30,
                price: 30,
                discountPrice: 19.9,
                description: '适合新手体验',
                benefits: ['专属任务优先领取', '佣金提升10%', '免费提现次数+2'],
                sortOrder: 1
            },
            {
                name: '季度VIP',
                days: 90,
                price: 90,
                discountPrice: 49.9,
                description: '高性价比之选',
                benefits: ['专属任务优先领取', '佣金提升15%', '免费提现次数+5', '专属客服'],
                sortOrder: 2
            },
            {
                name: '年度VIP',
                days: 365,
                price: 360,
                discountPrice: 168,
                description: '资深用户首选',
                benefits: ['专属任务优先领取', '佣金提升20%', '无限免费提现', '专属客服', '生日礼包'],
                sortOrder: 3
            }
        ];

        for (const pkg of defaultPackages) {
            await this.createPackage(pkg);
        }
    }
}
