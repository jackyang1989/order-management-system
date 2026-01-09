import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Recharge,
  RechargeStatus,
  RechargeUserType,
  RechargeType,
  PaymentMethod,
  CreateRechargeDto,
  AdminRechargeDto,
  RechargeFilterDto,
} from './recharge.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import {
  FinanceUserType,
  FinanceMoneyType,
} from '../finance-records/finance-record.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Injectable()
export class RechargeService {
  constructor(
    @InjectRepository(Recharge)
    private rechargeRepository: Repository<Recharge>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    private financeRecordsService: FinanceRecordsService,
    private dataSource: DataSource,
  ) {}

  /**
   * 生成充值订单号
   */
  private generateOrderNumber(
    userType: RechargeUserType,
    userId: string,
  ): string {
    const prefix = userType === RechargeUserType.BUYER ? '2' : '1';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  }

  /**
   * 创建充值订单（买手/商家端）
   */
  async createOrder(
    userId: string,
    userType: RechargeUserType,
    dto: CreateRechargeDto,
  ): Promise<Recharge> {
    if (dto.amount <= 0) {
      throw new BadRequestException('充值金额必须大于0');
    }

    // 检查是否有未支付的订单（6分钟内）
    const pendingOrder = await this.rechargeRepository.findOne({
      where: { userId, userType, status: RechargeStatus.PENDING },
      order: { createdAt: 'DESC' },
    });

    if (pendingOrder) {
      const timeDiff = Date.now() - pendingOrder.createdAt.getTime();
      if (timeDiff < 6 * 60 * 1000) {
        throw new BadRequestException('上一单未支付，请等待6分钟后再次充值');
      }
    }

    const orderNumber = this.generateOrderNumber(userType, userId);

    const recharge = this.rechargeRepository.create({
      userId,
      orderNumber,
      userType,
      rechargeType: dto.rechargeType,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod || PaymentMethod.ALIPAY,
      status: RechargeStatus.PENDING,
    });

    return this.rechargeRepository.save(recharge);
  }

  /**
   * 支付回调处理
   */
  async handleCallback(
    orderNumber: string,
    tradeNo: string,
    success: boolean,
  ): Promise<Recharge> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recharge = await this.rechargeRepository.findOne({
        where: { orderNumber },
      });

      if (!recharge) {
        throw new NotFoundException('充值订单不存在');
      }

      if (recharge.status !== RechargeStatus.PENDING) {
        throw new BadRequestException('订单已处理');
      }

      recharge.tradeNo = tradeNo;

      if (success) {
        recharge.status = RechargeStatus.SUCCESS;
        recharge.arrivalTime = new Date();

        // 更新用户余额
        await this.updateUserBalance(
          queryRunner,
          recharge.userId,
          recharge.userType,
          recharge.rechargeType,
          recharge.amount,
          recharge.id,
        );
      } else {
        recharge.status = RechargeStatus.FAILED;
      }

      await queryRunner.manager.save(recharge);
      await queryRunner.commitTransaction();

      return recharge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 管理员直接充值
   */
  async adminRecharge(
    dto: AdminRechargeDto,
    operatorId: string,
  ): Promise<Recharge> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderNumber = this.generateOrderNumber(dto.userType, dto.userId);

      const recharge = this.rechargeRepository.create({
        userId: dto.userId,
        orderNumber,
        userType: dto.userType,
        rechargeType: dto.rechargeType,
        amount: dto.amount,
        paymentMethod: PaymentMethod.ADMIN,
        status: RechargeStatus.SUCCESS,
        arrivalTime: new Date(),
        remark: dto.remark,
        operatorId,
      });

      const savedRecharge = await queryRunner.manager.save(recharge);

      // 更新用户余额
      await this.updateUserBalance(
        queryRunner,
        dto.userId,
        dto.userType,
        dto.rechargeType,
        dto.amount,
        savedRecharge.id,
        operatorId,
      );

      await queryRunner.commitTransaction();
      return savedRecharge;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 更新用户余额
   */
  private async updateUserBalance(
    queryRunner: any,
    userId: string,
    userType: RechargeUserType,
    rechargeType: RechargeType,
    amount: number,
    rechargeId: string,
    operatorId?: string,
  ): Promise<void> {
    if (userType === RechargeUserType.BUYER) {
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });
      if (!user) throw new NotFoundException('用户不存在');

      let balanceAfter: number;
      let memo: string;
      let moneyType: FinanceMoneyType;

      if (rechargeType === RechargeType.BALANCE) {
        user.balance = Number(user.balance) + amount;
        balanceAfter = Number(user.balance);
        memo = `充值押金 ${amount} 元`;
        moneyType = FinanceMoneyType.BALANCE;
      } else {
        user.silver = Number(user.silver) + amount;
        balanceAfter = Number(user.silver);
        memo = `充值银锭 ${amount}`;
        moneyType = FinanceMoneyType.SILVER;
      }

      await queryRunner.manager.save(user);

      // 记录财务流水
      await this.financeRecordsService.recordBuyerRecharge(
        userId,
        amount,
        balanceAfter,
        moneyType,
        memo,
        rechargeId,
      );
    } else {
      const merchant = await queryRunner.manager.findOne(Merchant, {
        where: { id: userId },
      });
      if (!merchant) throw new NotFoundException('商家不存在');

      let balanceAfter: number;
      let memo: string;

      if (rechargeType === RechargeType.BALANCE) {
        merchant.balance = Number(merchant.balance) + amount;
        balanceAfter = Number(merchant.balance);
        memo = `充值押金 ${amount} 元`;
      } else {
        merchant.silver = Number(merchant.silver) + amount;
        balanceAfter = Number(merchant.silver);
        memo = `充值银锭 ${amount}`;
      }

      await queryRunner.manager.save(merchant);

      // 记录财务流水
      await this.financeRecordsService.recordAdminOperation(
        userId,
        FinanceUserType.MERCHANT,
        rechargeType === RechargeType.BALANCE
          ? FinanceMoneyType.BALANCE
          : FinanceMoneyType.SILVER,
        amount,
        balanceAfter,
        memo,
        operatorId || 'system',
      );
    }
  }

  /**
   * 查询充值记录
   */
  async findAll(filter: RechargeFilterDto): Promise<{
    data: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;

    const queryBuilder = this.rechargeRepository.createQueryBuilder('r');

    if (filter.userId) {
      queryBuilder.andWhere('r.userId = :userId', { userId: filter.userId });
    }
    if (filter.userType !== undefined) {
      queryBuilder.andWhere('r.userType = :userType', {
        userType: filter.userType,
      });
    }
    if (filter.rechargeType !== undefined) {
      queryBuilder.andWhere('r.rechargeType = :rechargeType', {
        rechargeType: filter.rechargeType,
      });
    }
    if (filter.status !== undefined) {
      queryBuilder.andWhere('r.status = :status', { status: filter.status });
    }
    if (filter.startDate && filter.endDate) {
      queryBuilder.andWhere('r.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(filter.startDate),
        endDate: new Date(filter.endDate),
      });
    }

    const total = await queryBuilder.getCount();
    const records = await queryBuilder
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Enrich with username and phone from User or Merchant
    const data = await Promise.all(
      records.map(async (r) => {
        let username = '';
        let phone = '';
        if (r.userType === RechargeUserType.MERCHANT) {
          const merchant = await this.merchantRepository.findOne({
            where: { id: r.userId },
            select: ['username', 'phone'],
          });
          username = merchant?.username || '';
          phone = merchant?.phone || '';
        } else {
          const user = await this.userRepository.findOne({
            where: { id: r.userId },
            select: ['username', 'phone'],
          });
          username = user?.username || '';
          phone = user?.phone || '';
        }
        return {
          ...r,
          username,
          phone,
          moneyType: r.rechargeType, // Frontend expects moneyType
        };
      }),
    );

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(
    userId: string,
    userType: RechargeUserType,
  ): Promise<Recharge[]> {
    return this.rechargeRepository.find({
      where: { userId, userType },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Recharge | null> {
    return this.rechargeRepository.findOne({ where: { id } });
  }
}
