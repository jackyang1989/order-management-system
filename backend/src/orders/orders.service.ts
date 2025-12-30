import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, CreateOrderDto, SubmitStepDto, OrderStepData, OrderFilterDto } from './order.entity';
import { TasksService } from '../tasks/tasks.service';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus } from '../buyer-accounts/buyer-account.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @Inject(forwardRef(() => TasksService))
        private tasksService: TasksService,
        private buyerAccountsService: BuyerAccountsService
    ) { }

    async findAll(userId: string, filter?: OrderFilterDto): Promise<Order[]> {
        const queryBuilder = this.ordersRepository.createQueryBuilder('order')
            .where('order.userId = :userId', { userId });

        if (filter) {
            if (filter.status) {
                queryBuilder.andWhere('order.status = :status', { status: filter.status });
            }
            if (filter.platform) {
                queryBuilder.andWhere('order.platform = :platform', { platform: filter.platform });
            }
        }

        queryBuilder.orderBy('order.createdAt', 'DESC');
        return queryBuilder.getMany();
    }

    async findOne(id: string): Promise<Order | null> {
        return this.ordersRepository.findOne({ where: { id } });
    }

    async findByUserAndTask(userId: string, taskId: string): Promise<Order | null> {
        return this.ordersRepository.findOne({ where: { userId, taskId } });
    }

    async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
        const task = await this.tasksService.findOne(createOrderDto.taskId);
        if (!task) {
            throw new NotFoundException('任务不存在');
        }

        // 检查是否已领取过
        const existing = await this.findByUserAndTask(userId, createOrderDto.taskId);
        if (existing) {
            throw new BadRequestException('您已领取过此任务');
        }

        // 1. 验证买号归属权 (Security Fix: IDOR)
        const buyerAccount = await this.buyerAccountsService.findOne(createOrderDto.buynoId, userId);
        if (!buyerAccount) {
            throw new BadRequestException('买号不存在或不属于您');
        }
        if (buyerAccount.status !== BuyerAccountStatus.APPROVED) {
            throw new BadRequestException('该买号状态异常，无法接单');
        }

        // 2. 扣减库存 (Security Fix: Inventory Race Condition)
        // 这一步是原子的，如果失败会抛出异常
        await this.tasksService.claim(createOrderDto.taskId, userId, createOrderDto.buynoId);

        // 构建步骤数据
        const stepData: OrderStepData[] = task.steps.map(s => ({
            step: s.step,
            title: s.title,
            description: s.description,
            submitted: false
        }));

        // 设置订单超时时间 (1小时后)
        const endingTime = new Date();
        endingTime.setHours(endingTime.getHours() + 1);

        const newOrder = this.ordersRepository.create({
            taskId: task.id,
            userId,
            buynoId: createOrderDto.buynoId,
            buynoAccount: createOrderDto.buynoAccount,
            taskTitle: task.title,
            platform: task.platform,
            productName: task.productName,
            productPrice: task.productPrice,
            commission: task.commission,
            currentStep: 1,
            totalSteps: task.steps.length,
            stepData,
            status: OrderStatus.PENDING,
            endingTime,
        });

        return this.ordersRepository.save(newOrder);
    }

    async submitStep(orderId: string, userId: string, submitStepDto: SubmitStepDto): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.status !== OrderStatus.PENDING) {
            throw new BadRequestException('订单状态不允许提交');
        }

        if (submitStepDto.step !== order.currentStep) {
            throw new BadRequestException('步骤顺序错误');
        }

        // 更新步骤数据
        const stepIndex = order.stepData.findIndex(s => s.step === submitStepDto.step);
        if (stepIndex !== -1) {
            order.stepData[stepIndex].submitted = true;
            order.stepData[stepIndex].submittedAt = new Date();
            order.stepData[stepIndex].screenshot = submitStepDto.screenshot;
            order.stepData[stepIndex].inputData = submitStepDto.inputData;
        }

        // 判断是否是最后一步
        if (order.currentStep >= order.totalSteps) {
            order.status = OrderStatus.SUBMITTED;
            order.completedAt = new Date();
        } else {
            order.currentStep++;
        }

        return this.ordersRepository.save(order);
    }

    async updateStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) return null;

        order.status = status;
        return this.ordersRepository.save(order);
    }

    async getStats(userId: string): Promise<{ pending: number; submitted: number; completed: number; total: number }> {
        const pending = await this.ordersRepository.count({ where: { userId, status: OrderStatus.PENDING } });
        const submitted = await this.ordersRepository.count({ where: { userId, status: OrderStatus.SUBMITTED } });
        const completed = await this.ordersRepository.count({ where: { userId, status: OrderStatus.COMPLETED } });
        const total = await this.ordersRepository.count({ where: { userId } });

        return { pending, submitted, completed, total };
    }
}
