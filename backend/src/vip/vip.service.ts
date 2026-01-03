import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThan } from 'typeorm';
import { VipPackage, VipPurchase, VipPurchaseStatus, CreateVipPackageDto, PurchaseVipDto, RechargeOrder, RechargeOrderStatus } from './vip.entity';
import { User } from '../users/user.entity';
import { FundRecord, FundType, FundAction } from '../users/fund-record.entity';

@Injectable()
export class VipService {
    // 订单防重复提交时间（秒）- 原版为6分钟
    private readonly ORDER_COOLDOWN_SECONDS = 360;

    constructor(
        @InjectRepository(VipPackage)
        private vipPackageRepository: Repository<VipPackage>,
        @InjectRepository(VipPurchase)
        private vipPurchaseRepository: Repository<VipPurchase>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(RechargeOrder)
        private rechargeOrderRepository: Repository<RechargeOrder>,
        @InjectRepository(FundRecord)
        private fundRecordRepository: Repository<FundRecord>,
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

    /**
     * 购买VIP - 支持银锭/本金/支付宝三种支付方式
     * 对应原版: principal_member(), silver_member(), creat_order()
     */
    async purchaseVip(userId: string, dto: PurchaseVipDto): Promise<VipPurchase | { payUrl: string; orderNo: string }> {
        const pkg = await this.vipPackageRepository.findOne({ where: { id: dto.packageId } });
        if (!pkg || !pkg.isActive) {
            throw new NotFoundException('套餐不存在或已下架');
        }

        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const paymentMethod = dto.paymentMethod || 'silver';

        // 根据支付方式处理
        switch (paymentMethod) {
            case 'balance':
                return this.purchaseWithBalance(user, pkg);
            case 'alipay':
                return this.createAlipayOrder(user, pkg);
            case 'silver':
            default:
                return this.purchaseWithSilver(user, pkg);
        }
    }

    /**
     * 银锭支付VIP
     * 对应原版: silver_member()
     */
    private async purchaseWithSilver(user: User, pkg: VipPackage): Promise<VipPurchase> {
        // 检查银锭余额
        if (Number(user.silver) < Number(pkg.discountPrice)) {
            throw new BadRequestException('银锭余额不足，请先充值');
        }

        return this.processPurchase(user, pkg, 'silver', 'silver');
    }

    /**
     * 本金支付VIP
     * 对应原版: principal_member()
     */
    private async purchaseWithBalance(user: User, pkg: VipPackage): Promise<VipPurchase> {
        // 检查本金余额
        if (Number(user.balance) < Number(pkg.discountPrice)) {
            throw new BadRequestException('本金余额不足，请先充值');
        }

        return this.processPurchase(user, pkg, 'balance', 'balance');
    }

    /**
     * 创建支付宝订单
     * 对应原版: creat_order()
     */
    private async createAlipayOrder(user: User, pkg: VipPackage): Promise<{ payUrl: string; orderNo: string }> {
        const now = Math.floor(Date.now() / 1000);

        // 检查是否有未支付的订单（6分钟内防重复）
        const pendingOrder = await this.rechargeOrderRepository.findOne({
            where: {
                userId: user.id,
                userType: 2,
                state: RechargeOrderStatus.PENDING
            },
            order: { createTime: 'DESC' }
        });

        if (pendingOrder && (now - Number(pendingOrder.createTime)) < this.ORDER_COOLDOWN_SECONDS) {
            const remainingSeconds = this.ORDER_COOLDOWN_SECONDS - (now - Number(pendingOrder.createTime));
            const remainingMinutes = Math.ceil(remainingSeconds / 60);
            throw new BadRequestException(`上一单未支付，请等待${remainingMinutes}分钟后再次充值`);
        }

        // 生成订单号
        const random = Math.floor(100000 + Math.random() * 900000);
        const orderNo = `${random}${now}`;

        // 创建订单记录
        const order = this.rechargeOrderRepository.create({
            orderNo,
            userId: user.id,
            userType: 2,
            packageId: pkg.id,
            price: Number(pkg.discountPrice),
            state: RechargeOrderStatus.PENDING,
            createTime: now
        });
        await this.rechargeOrderRepository.save(order);

        // TODO: 对接真实支付宝接口
        // 目前返回模拟支付链接
        const payUrl = `/pay/alipay?orderNo=${orderNo}&amount=${pkg.discountPrice}`;

        return {
            payUrl,
            orderNo
        };
    }

    /**
     * 处理实际购买（扣款 + 开通VIP）
     */
    private async processPurchase(
        user: User,
        pkg: VipPackage,
        paymentMethod: string,
        fundType: 'silver' | 'balance'
    ): Promise<VipPurchase> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const now = new Date();
            const amount = Number(pkg.discountPrice);

            // 计算VIP时间（对应原版逻辑：已是VIP则叠加时间）
            let vipStartAt: Date;
            let vipEndAt: Date;
            const oneMonth = pkg.days * 24 * 60 * 60 * 1000;

            if (user.vip && user.vipExpireAt && user.vipExpireAt > now) {
                // 已是VIP，在原有基础上延期
                vipStartAt = user.vipExpireAt;
                vipEndAt = new Date(user.vipExpireAt.getTime() + oneMonth);
            } else {
                // 已过期或非VIP，从当前时间开始
                vipStartAt = now;
                vipEndAt = new Date(now.getTime() + oneMonth);
            }

            // 扣除余额
            if (fundType === 'silver') {
                user.silver = Number(user.silver) - amount;
            } else {
                user.balance = Number(user.balance) - amount;
            }
            user.vip = true;
            user.vipExpireAt = vipEndAt;
            await queryRunner.manager.save(user);

            // 创建购买记录
            const purchase = this.vipPurchaseRepository.create({
                userId: user.id,
                packageId: pkg.id,
                packageName: pkg.name,
                days: pkg.days,
                amount,
                status: VipPurchaseStatus.PAID,
                paymentMethod,
                paidAt: now,
                vipStartAt,
                vipEndAt
            });
            await queryRunner.manager.save(purchase);

            // 创建资金记录
            const fundRecord = this.fundRecordRepository.create({
                userId: user.id,
                type: fundType === 'silver' ? FundType.SILVER : FundType.PRINCIPAL,
                action: FundAction.OUT,
                amount: amount,
                balance: fundType === 'silver' ? user.silver : user.balance,
                description: `购买${pkg.name}会员`
            });
            await queryRunner.manager.save(fundRecord);

            await queryRunner.commitTransaction();
            return purchase;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 支付宝回调处理（模拟）
     */
    async handleAlipayCallback(orderNo: string): Promise<VipPurchase> {
        const order = await this.rechargeOrderRepository.findOne({
            where: { orderNo }
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.state !== RechargeOrderStatus.PENDING) {
            throw new BadRequestException('订单状态异常');
        }

        const user = await this.userRepository.findOne({ where: { id: order.userId } });
        if (!user) {
            throw new NotFoundException('用户不存在');
        }

        const pkg = await this.vipPackageRepository.findOne({ where: { id: order.packageId } });
        if (!pkg) {
            throw new NotFoundException('套餐不存在');
        }

        // 更新订单状态
        order.state = RechargeOrderStatus.PAID;
        order.paidTime = Math.floor(Date.now() / 1000);
        await this.rechargeOrderRepository.save(order);

        // 开通VIP（不扣款，因为是支付宝支付）
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const now = new Date();
            const oneMonth = pkg.days * 24 * 60 * 60 * 1000;

            let vipStartAt: Date;
            let vipEndAt: Date;

            if (user.vip && user.vipExpireAt && user.vipExpireAt > now) {
                vipStartAt = user.vipExpireAt;
                vipEndAt = new Date(user.vipExpireAt.getTime() + oneMonth);
            } else {
                vipStartAt = now;
                vipEndAt = new Date(now.getTime() + oneMonth);
            }

            user.vip = true;
            user.vipExpireAt = vipEndAt;
            await queryRunner.manager.save(user);

            const purchase = this.vipPurchaseRepository.create({
                userId: user.id,
                packageId: pkg.id,
                packageName: pkg.name,
                days: pkg.days,
                amount: Number(pkg.discountPrice),
                status: VipPurchaseStatus.PAID,
                paymentMethod: 'alipay',
                transactionId: orderNo,
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
