import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus } from '../tasks/task.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { User } from '../users/user.entity';
import { BuyerAccount } from '../buyer-accounts/buyer-account.entity';

export interface TaskClaimJob {
    taskId: string;
    userId: string;
    buyerAccountId: string;
    timestamp: number;
}

@Processor('task-claim')
export class TaskClaimProcessor extends WorkerHost {
    private readonly logger = new Logger(TaskClaimProcessor.name);

    constructor(
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(BuyerAccount)
        private buyerAccountRepository: Repository<BuyerAccount>,
    ) {
        super();
    }

    async process(job: Job<TaskClaimJob>): Promise<{ success: boolean; orderId?: string; error?: string }> {
        const { taskId, userId, buyerAccountId } = job.data;
        this.logger.debug(`处理抢单任务: taskId=${taskId}, userId=${userId}`);

        try {
            // 1. 获取任务并锁定
            const task = await this.taskRepository.findOne({
                where: { id: taskId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!task) {
                return { success: false, error: '任务不存在' };
            }

            if (task.status !== TaskStatus.ACTIVE) {
                return { success: false, error: '任务未开放' };
            }

            // 2. 检查任务剩余数量
            const claimedCount = await this.orderRepository.count({
                where: { taskId },
            });

            if (claimedCount >= task.totalCount) {
                return { success: false, error: '任务已被抢完' };
            }

            // 3. 检查用户是否已领取过该任务
            const existingOrder = await this.orderRepository.findOne({
                where: { taskId, userId },
            });

            if (existingOrder) {
                return { success: false, error: '您已领取过该任务' };
            }

            // 4. 检查买手账号是否已用于该任务
            const accountUsed = await this.orderRepository.findOne({
                where: { taskId, buyerAccountId },
            });

            if (accountUsed) {
                return { success: false, error: '该买手号已用于此任务' };
            }

            // 5. 获取用户和买手账号信息
            const user = await this.userRepository.findOne({ where: { id: userId } });
            const buyerAccount = await this.buyerAccountRepository.findOne({ where: { id: buyerAccountId } });

            if (!user || !buyerAccount) {
                return { success: false, error: '用户或买手账号不存在' };
            }

            // 6. 创建订单
            const order = this.orderRepository.create({
                taskId,
                userId,
                buyerAccountId,
                status: OrderStatus.PENDING,
                goodsPrice: task.goodsPrice,
                commission: task.commission,
                totalAmount: task.goodsPrice,
                claimTime: new Date(),
            });

            await this.orderRepository.save(order);

            this.logger.log(`抢单成功: orderId=${order.id}`);
            return { success: true, orderId: order.id };

        } catch (error) {
            this.logger.error(`抢单失败: ${error.message}`);
            return { success: false, error: error.message };
        }
    }
}
