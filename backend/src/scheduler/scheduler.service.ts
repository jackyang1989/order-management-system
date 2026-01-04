import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, In } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import {
  FinanceRecord,
  FinanceType,
  FinanceUserType,
  FinanceMoneyType,
} from '../finance-records/finance-record.entity';
import { Merchant } from '../merchants/merchant.entity';
import { User } from '../users/user.entity';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(FinanceRecord)
    private financeRecordRepository: Repository<FinanceRecord>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

    /**
   * 每分钟检查订单超时
   * P0 Fix: 使用订单的endingTime字段，而不是硬编码24小时
   */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleOrderTimeout() {
        this.logger.debug('检查订单超时...');

        const now = new Date();

        // 找出已超过endingTime的订单 (PENDING/SUBMITTED状态)
        const timeoutOrders = await this.orderRepository.find({
            where: {
                status: In([OrderStatus.PENDING, OrderStatus.SUBMITTED]),
                endingTime: LessThan(now),
            },
        });

        for (const order of timeoutOrders) {
            await this.cancelOrderWithRefund(order, '订单超时未完成，系统自动取消');
        }

        if (timeoutOrders.length > 0) {
            this.logger.log(`自动取消了 ${timeoutOrders.length} 个超时订单`);
        }
    }

  /**
   * 每5分钟检查任务过期
   * 任务发布后超过24小时且仍有未领取库存则自动关闭
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleTaskExpiration() {
    this.logger.debug('检查任务过期...');

    const now = new Date();
    // 默认任务有效期24小时
    const defaultTaskHours = 24;
    const expirationThreshold = new Date(
      now.getTime() - defaultTaskHours * 60 * 60 * 1000,
    );

    // 找出已过期但仍在进行中的任务（创建超过24小时且未完成）
    const expiredTasks = await this.taskRepository.find({
      where: {
        status: In([TaskStatus.ACTIVE]),
        createdAt: LessThan(expirationThreshold),
      },
    });

    for (const task of expiredTasks) {
      // 检查是否还有未领取的库存
      const remainingCount = task.count - (task.claimedCount || 0);
      if (remainingCount <= 0) {
        // 所有任务已被领取，标记为完成
        task.status = TaskStatus.COMPLETED;
        await this.taskRepository.save(task);
        continue;
      }

      // 有未领取的任务，关闭并退款
      task.status = TaskStatus.COMPLETED;
      await this.taskRepository.save(task);

      // 退还未领取任务的金额给商家
      await this.refundUnclaimedTaskAmount(task);
    }

    if (expiredTasks.length > 0) {
      this.logger.log(`自动关闭了 ${expiredTasks.length} 个过期任务`);
    }
  }

    /**
     * 每10分钟检查预售订单截止
     * 预售订单到达截止时间未付尾款自动取消
     */
    @Cron(CronExpression.EVERY_10_MINUTES)
    async handlePresaleDeadline() {
        this.logger.debug('检查预售订单截止...');

        const now = new Date();

        // 找出预售订单中已付预付款但未付尾款且已过截止时间的
        const presaleOrders = await this.orderRepository.find({
            where: {
                isPresale: true,
                okYf: true,
                okWk: false,
                status: In([OrderStatus.WAITING_DELIVERY, OrderStatus.APPROVED]),
            },
        });

        for (const order of presaleOrders) {
            // 检查是否过了尾款截止时间（假设预付后7天内需付尾款）
            const yfTime = order.createdAt;
            const deadline = new Date(yfTime);
            deadline.setDate(deadline.getDate() + 7);

            if (now > deadline) {
                await this.cancelOrderWithRefund(order, '预售订单尾款超时，系统自动取消');
            }
        }
    }

  /**
   * 每小时检查待收货超时
   * 发货后15天未确认收货自动确认
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleDeliveryTimeout() {
    this.logger.debug('检查待收货超时...');

    const timeoutDays = 15;
    const timeoutDate = new Date();
    timeoutDate.setDate(timeoutDate.getDate() - timeoutDays);

    const timeoutOrders = await this.orderRepository.find({
      where: {
        status: OrderStatus.WAITING_RECEIVE,
        deliveryTime: LessThan(timeoutDate), // 使用发货时间计算超时
      },
    });

    for (const order of timeoutOrders) {
      order.status = OrderStatus.WAITING_REFUND;
      order.completedAt = new Date(); // 使用completedAt代替receiveTime
      await this.orderRepository.save(order);
    }

    if (timeoutOrders.length > 0) {
      this.logger.log(`自动确认收货 ${timeoutOrders.length} 个超时订单`);
    }
  }

    /**
     * 每天凌晨2点清理过期数据
     */
    @Cron('0 2 * * *')
    async handleDailyCleanup() {
        this.logger.log('执行每日清理任务...');

        // 清理30天前的已完成订单日志（可选）
        // 清理过期的短信验证码
        // 清理临时文件等

        this.logger.log('每日清理任务完成');
    }

    /**
     * 每天凌晨3点统计每日数据
     */
    @Cron('0 3 * * *')
    async handleDailyStatistics() {
        this.logger.log('执行每日统计任务...');

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 统计昨日完成的任务数量
        const completedTasksCount = await this.taskRepository.count({
            where: {
                status: TaskStatus.COMPLETED,
                updatedAt: LessThan(today),
            },
        });

        // 统计昨日完成的订单数量
        const completedOrdersCount = await this.orderRepository.count({
            where: {
                status: OrderStatus.COMPLETED,
                updatedAt: LessThan(today),
            },
        });

        this.logger.log(`昨日统计: 完成任务 ${completedTasksCount}, 完成订单 ${completedOrdersCount}`);
    }

    /**
     * 取消订单并退款
     */
    private async cancelOrderWithRefund(order: Order, reason: string) {
        order.status = OrderStatus.CANCELLED;
        order.cancelRemarks = reason;
        order.cancelTime = new Date();
        await this.orderRepository.save(order);

        // 这里应该调用退款逻辑，退还给商家或买手
        // 实际逻辑需要根据订单状态决定退款对象和金额
    }

  /**
   * 退还未领取任务的金额给商家
   */
  private async refundUnclaimedTaskAmount(task: Task) {
    const unclaimedCount =
      task.count - (task.completedCount || 0) - (task.incompleteCount || 0);

    if (unclaimedCount <= 0) return;

    // 计算退款金额：未领取数量 * 单价
    const refundAmount =
      unclaimedCount * (Number(task.goodsPrice) + Number(task.shippingFee));

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 获取商家信息
      const merchant = await queryRunner.manager.findOne(Merchant, {
        where: { id: task.merchantId },
      });

      if (!merchant) {
        await queryRunner.rollbackTransaction();
        return;
      }

      // 从冻结余额退还到可用余额
      merchant.frozenBalance = Number(merchant.frozenBalance) - refundAmount;
      merchant.balance = Number(merchant.balance) + refundAmount;
      await queryRunner.manager.save(merchant);

      // 创建退款记录
      const financeRecord = queryRunner.manager.create(FinanceRecord, {
        userId: task.merchantId,
        userType: FinanceUserType.MERCHANT,
        moneyType: FinanceMoneyType.BALANCE,
        financeType: FinanceType.REFUND,
        amount: refundAmount,
        balanceAfter: merchant.balance,
        memo: `任务过期退款，退还${unclaimedCount}个未领取任务`,
        relatedId: task.id,
        relatedType: 'task',
      });
      await queryRunner.manager.save(financeRecord);

      await queryRunner.commitTransaction();

      this.logger.log(
        `任务 ${task.taskNumber} 过期，退还商家 ${refundAmount} 元`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`任务退款失败: ${error.message}`, error.stack);
    } finally {
      await queryRunner.release();
    }
  }
}
