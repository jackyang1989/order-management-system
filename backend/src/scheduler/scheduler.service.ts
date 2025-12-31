import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { FinanceRecord, FinanceType } from '../finance-records/finance-record.entity';

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
    ) { }

    /**
     * 每分钟检查订单超时
     * 订单提交后24小时未审核自动取消
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async handleOrderTimeout() {
        this.logger.debug('检查订单超时...');

        const timeoutHours = 24;
        const timeoutDate = new Date();
        timeoutDate.setHours(timeoutDate.getHours() - timeoutHours);

        // 找出超时未审核的订单
        const timeoutOrders = await this.orderRepository.find({
            where: {
                status: OrderStatus.SUBMITTED,
                createdAt: LessThan(timeoutDate),
            },
        });

        for (const order of timeoutOrders) {
            await this.cancelOrderWithRefund(order, '订单超时未审核，系统自动取消');
        }

        if (timeoutOrders.length > 0) {
            this.logger.log(`自动取消了 ${timeoutOrders.length} 个超时订单`);
        }
    }

    /**
     * 每5分钟检查任务过期
     * 任务到达结束时间自动关闭
     */
    @Cron(CronExpression.EVERY_5_MINUTES)
    async handleTaskExpiration() {
        this.logger.debug('检查任务过期...');

        const now = new Date();

        // 找出已过期但仍在进行中的任务
        const expiredTasks = await this.taskRepository.find({
            where: {
                status: In([TaskStatus.ACTIVE, TaskStatus.PENDING]),
                endTime: LessThan(now),
            },
        });

        for (const task of expiredTasks) {
            task.status = TaskStatus.COMPLETED;
            await this.taskRepository.save(task);

            // 如果有未领取的任务数量，退还给商家
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
                updatedAt: LessThan(timeoutDate),
            },
        });

        for (const order of timeoutOrders) {
            order.status = OrderStatus.WAITING_REFUND;
            order.receiveTime = new Date();
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
        const unclaimedCount = task.totalCount - (task.completedCount || 0) - (task.incompleteCount || 0);

        if (unclaimedCount > 0) {
            const refundAmount = unclaimedCount * task.totalAmount / task.totalCount;

            // 创建退款记录
            const financeRecord = this.financeRecordRepository.create({
                userId: task.merchantId,
                type: FinanceType.REFUND,
                amount: refundAmount,
                balance: 0, // 需要查询当前余额后更新
                remark: `任务过期退款，退还${unclaimedCount}个未领取任务`,
                relatedId: task.id,
                relatedType: 'task',
            });
            await this.financeRecordRepository.save(financeRecord);

            // 这里应该更新商家余额
        }
    }
}
