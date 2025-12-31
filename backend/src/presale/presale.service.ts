import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Task } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { FinanceRecord, FinanceType } from '../finance-records/finance-record.entity';

@Injectable()
export class PresaleService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(FinanceRecord)
        private financeRecordRepository: Repository<FinanceRecord>,
    ) { }

    /**
     * 获取预售任务列表（买手视角）
     * 只显示需要付尾款的订单
     */
    async getPresaleOrders(userId: string): Promise<Order[]> {
        return this.orderRepository.find({
            where: {
                userId,
                isPresale: true,
                okYf: true,
                okWk: false,
            },
            relations: ['task'],
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * 领取预售任务（第一步：付预付款）
     */
    async claimPresaleTask(
        taskId: string,
        userId: string,
        buyerAccountId: string,
    ): Promise<Order> {
        const task = await this.taskRepository.findOne({ where: { id: taskId } });
        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        if (!task.isPresale) {
            throw new BadRequestException('该任务不是预售任务');
        }

        // 检查是否已领取
        const existingOrder = await this.orderRepository.findOne({
            where: { taskId, userId },
        });
        if (existingOrder) {
            throw new BadRequestException('您已领取过该任务');
        }

        // 创建预售订单
        const order = this.orderRepository.create({
            taskId,
            userId,
            buyerAccountId,
            status: OrderStatus.PENDING,
            isPresale: true,
            yfPrice: task.yfPrice,
            wkPrice: task.wkPrice,
            goodsPrice: task.goodsPrice,
            commission: task.commission,
            totalAmount: task.goodsPrice,
            okYf: false,
            okWk: false,
            claimTime: new Date(),
        });

        return this.orderRepository.save(order);
    }

    /**
     * 提交预付款凭证
     */
    async submitYfPayment(
        orderId: string,
        userId: string,
        data: {
            yfScreenshot: string;
            orderNo?: string;
        },
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
            relations: ['task'],
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (!order.isPresale) {
            throw new BadRequestException('该订单不是预售订单');
        }

        if (order.okYf) {
            throw new BadRequestException('预付款已提交');
        }

        order.keywordImg = data.yfScreenshot; // 复用字段存储预付款截图
        order.orderNo = data.orderNo;
        order.status = OrderStatus.SUBMITTED;

        return this.orderRepository.save(order);
    }

    /**
     * 商家确认预付款
     */
    async confirmYfPayment(
        orderId: string,
        merchantId: string,
        approved: boolean,
        remarks?: string,
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['task'],
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.task.merchantId !== merchantId) {
            throw new BadRequestException('无权操作此订单');
        }

        if (approved) {
            order.okYf = true;
            order.status = OrderStatus.WAITING_DELIVERY; // 等待发货（等待买手付尾款）
        } else {
            order.status = OrderStatus.REJECTED;
            order.cancelRemarks = remarks || '预付款审核不通过';
        }

        return this.orderRepository.save(order);
    }

    /**
     * 提交尾款凭证
     */
    async submitWkPayment(
        orderId: string,
        userId: string,
        data: {
            wkScreenshot: string;
        },
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId, userId },
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (!order.isPresale) {
            throw new BadRequestException('该订单不是预售订单');
        }

        if (!order.okYf) {
            throw new BadRequestException('请先提交预付款');
        }

        if (order.okWk) {
            throw new BadRequestException('尾款已提交');
        }

        order.chatImg = data.wkScreenshot; // 复用字段存储尾款截图
        order.status = OrderStatus.SUBMITTED;

        return this.orderRepository.save(order);
    }

    /**
     * 商家确认尾款
     */
    async confirmWkPayment(
        orderId: string,
        merchantId: string,
        approved: boolean,
        remarks?: string,
    ): Promise<Order> {
        const order = await this.orderRepository.findOne({
            where: { id: orderId },
            relations: ['task'],
        });

        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.task.merchantId !== merchantId) {
            throw new BadRequestException('无权操作此订单');
        }

        if (!order.okYf) {
            throw new BadRequestException('预付款尚未确认');
        }

        if (approved) {
            order.okWk = true;
            order.status = OrderStatus.WAITING_DELIVERY; // 等待发货
        } else {
            order.status = OrderStatus.REJECTED;
            order.cancelRemarks = remarks || '尾款审核不通过';
        }

        return this.orderRepository.save(order);
    }

    /**
     * 获取待处理的预售订单（商家视角）
     */
    async getPendingPresaleOrders(merchantId: string): Promise<Order[]> {
        return this.orderRepository
            .createQueryBuilder('order')
            .innerJoinAndSelect('order.task', 'task')
            .where('task.merchantId = :merchantId', { merchantId })
            .andWhere('order.isPresale = :isPresale', { isPresale: true })
            .andWhere('order.status IN (:...statuses)', {
                statuses: [OrderStatus.SUBMITTED, OrderStatus.WAITING_DELIVERY],
            })
            .orderBy('order.createdAt', 'DESC')
            .getMany();
    }

    /**
     * 获取预售统计
     */
    async getPresaleStats(merchantId: string): Promise<{
        pendingYf: number;
        pendingWk: number;
        completed: number;
    }> {
        const pendingYf = await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.task', 'task')
            .where('task.merchantId = :merchantId', { merchantId })
            .andWhere('order.isPresale = :isPresale', { isPresale: true })
            .andWhere('order.okYf = :okYf', { okYf: false })
            .getCount();

        const pendingWk = await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.task', 'task')
            .where('task.merchantId = :merchantId', { merchantId })
            .andWhere('order.isPresale = :isPresale', { isPresale: true })
            .andWhere('order.okYf = :okYf', { okYf: true })
            .andWhere('order.okWk = :okWk', { okWk: false })
            .getCount();

        const completed = await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.task', 'task')
            .where('task.merchantId = :merchantId', { merchantId })
            .andWhere('order.isPresale = :isPresale', { isPresale: true })
            .andWhere('order.okYf = :okYf', { okYf: true })
            .andWhere('order.okWk = :okWk', { okWk: true })
            .getCount();

        return { pendingYf, pendingWk, completed };
    }
}
