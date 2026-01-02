import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, CreateOrderDto, SubmitStepDto, OrderStepData, OrderFilterDto } from './order.entity';
import { TasksService } from '../tasks/tasks.service';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus } from '../buyer-accounts/buyer-account.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { DingdanxiaService } from '../dingdanxia/dingdanxia.service';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';

@Injectable()
export class OrdersService {
    constructor(
        @InjectRepository(Order)
        private ordersRepository: Repository<Order>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Merchant)
        private merchantsRepository: Repository<Merchant>,
        @Inject(forwardRef(() => TasksService))
        private tasksService: TasksService,
        private buyerAccountsService: BuyerAccountsService,
        private financeRecordsService: FinanceRecordsService,
        private dingdanxiaService: DingdanxiaService,
        private dataSource: DataSource
    ) { }

    // ============ 管理员端方法 ============

    async findAllAdmin(filter: { page: number; limit: number; status?: string }): Promise<{ data: Order[]; total: number }> {
        const queryBuilder = this.ordersRepository.createQueryBuilder('order');

        if (filter.status) {
            queryBuilder.where('order.status = :status', { status: filter.status });
        }

        queryBuilder.orderBy('order.createdAt', 'DESC');
        queryBuilder.skip((filter.page - 1) * filter.limit);
        queryBuilder.take(filter.limit);

        const [data, total] = await queryBuilder.getManyAndCount();
        return { data, total };
    }

    // ============ 用户端方法 ============

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

        // 2. 验证星级限价和月度限额
        const eligibility = await this.buyerAccountsService.validateTaskEligibility(
            createOrderDto.buynoId,
            userId,
            Number(task.goodsPrice)
        );
        if (!eligibility.eligible) {
            throw new BadRequestException(eligibility.reason || '该买号无法接取此任务');
        }

        // 3. 扣减库存 (Security Fix: Inventory Race Condition)
        await this.tasksService.claim(createOrderDto.taskId, userId, createOrderDto.buynoId);

        // 构建默认步骤数据 (简化版：3步流程)
        const defaultSteps: OrderStepData[] = [
            { step: 1, title: '下单截图', description: '请上传订单截图', submitted: false },
            { step: 2, title: '物流截图', description: '请上传物流截图', submitted: false },
            { step: 3, title: '好评截图', description: '请上传好评截图', submitted: false },
        ];

        // 设置订单超时时间 (1小时后)
        const endingTime = new Date();
        endingTime.setHours(endingTime.getHours() + 1);

        // 平台名称映射
        const platformMap: Record<number, string> = {
            1: '淘宝', 2: '天猫', 3: '京东', 4: '拼多多'
        };

        const newOrder = this.ordersRepository.create({
            taskId: task.id,
            userId,
            buynoId: createOrderDto.buynoId,
            buynoAccount: createOrderDto.buynoAccount,
            taskTitle: task.title,
            platform: platformMap[task.taskType] || '其他',
            productName: task.title, // 使用任务标题作为商品名
            productPrice: Number(task.goodsPrice),
            commission: Number(task.baseServiceFee),
            currentStep: 1,
            totalSteps: defaultSteps.length,
            stepData: defaultSteps,
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

    // ============ 商家端订单审核 ============

    /**
     * 获取商家的待审核订单列表
     * 通过 taskId 关联找到属于该商家的订单
     */
    async findByMerchant(merchantId: string, filter?: { status?: OrderStatus }): Promise<Order[]> {
        // 获取商家的所有任务 ID
        const merchantTasks = await this.tasksService.findByMerchant(merchantId);
        const taskIds = merchantTasks.map(t => t.id);

        if (taskIds.length === 0) {
            return [];
        }

        const queryBuilder = this.ordersRepository.createQueryBuilder('order')
            .where('order.taskId IN (:...taskIds)', { taskIds });

        if (filter?.status) {
            queryBuilder.andWhere('order.status = :status', { status: filter.status });
        }

        queryBuilder.orderBy('order.createdAt', 'DESC');
        return queryBuilder.getMany();
    }

    /**
     * 商家审核订单
     * @param orderId 订单ID
     * @param merchantId 商家ID (用于验证权限)
     * @param approved 是否通过
     * @param rejectReason 驳回原因
     */
    async review(
        orderId: string,
        merchantId: string,
        approved: boolean,
        rejectReason?: string
    ): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        // 验证订单是否属于该商家的任务
        const task = await this.tasksService.findOne(order.taskId);
        if (!task || task.merchantId !== merchantId) {
            throw new BadRequestException('无权审核此订单');
        }

        if (order.status !== OrderStatus.SUBMITTED) {
            throw new BadRequestException('该订单不是待审核状态');
        }

        // 使用事务确保资金操作原子性
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const merchant = await queryRunner.manager.findOne(Merchant, { where: { id: merchantId } });
            const user = await queryRunner.manager.findOne(User, { where: { id: order.userId } });

            if (!merchant || !user) {
                throw new BadRequestException('商家或用户不存在');
            }

            if (approved) {
                order.status = OrderStatus.APPROVED;
                order.refundTime = new Date();

                // 计算返款金额：本金 + 佣金
                const principalAmount = Number(order.sellerPrincipal) || Number(order.productPrice);
                const commissionAmount = Number(order.commission);

                // 1. 商家冻结余额减少本金
                merchant.frozenBalance = Number(merchant.frozenBalance) - principalAmount;
                await queryRunner.manager.save(merchant);

                // 记录商家结算流水
                await this.financeRecordsService.recordMerchantTaskSettle(
                    merchantId,
                    principalAmount,
                    Number(merchant.frozenBalance),
                    order.id,
                    '订单结算'
                );

                // 2. 买手获得本金返还（到余额）
                user.balance = Number(user.balance) + principalAmount;
                await queryRunner.manager.save(user);

                // 记录买手收到本金
                await this.financeRecordsService.recordBuyerTaskRefund(
                    order.userId,
                    principalAmount,
                    commissionAmount,
                    Number(user.balance),
                    Number(user.silver),
                    order.id,
                    '任务完成返款'
                );

                // 3. 买手获得佣金（到银锭）
                user.silver = Number(user.silver) + commissionAmount;
                await queryRunner.manager.save(user);

                // 记录买手收到佣金
                await this.financeRecordsService.recordBuyerTaskCommission(
                    order.userId,
                    commissionAmount,
                    Number(user.silver),
                    order.id,
                    '任务佣金'
                );

                // 更新订单返款金额
                order.refundAmount = principalAmount + commissionAmount;

                // 4. 增加买号月度任务计数
                await this.buyerAccountsService.incrementMonthlyTaskCount(order.buynoId);
            } else {
                order.status = OrderStatus.REJECTED;
                order.rejectReason = rejectReason || '';

                // 驳回时：将本金从冻结余额退还到商家可用余额
                const principalAmount = Number(order.sellerPrincipal) || Number(order.productPrice);
                merchant.frozenBalance = Number(merchant.frozenBalance) - principalAmount;
                merchant.balance = Number(merchant.balance) + principalAmount;
                await queryRunner.manager.save(merchant);

                // 记录商家退款流水
                await this.financeRecordsService.recordMerchantTaskRefund(
                    merchantId,
                    principalAmount,
                    Number(merchant.balance),
                    order.id,
                    '订单驳回退款'
                );
            }

            order.completedAt = new Date();
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();
            return order;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 获取商家订单统计
     */
    async getMerchantStats(merchantId: string): Promise<{
        pendingReview: number;
        approved: number;
        rejected: number;
        total: number;
    }> {
        const merchantTasks = await this.tasksService.findByMerchant(merchantId);
        const taskIds = merchantTasks.map(t => t.id);

        if (taskIds.length === 0) {
            return { pendingReview: 0, approved: 0, rejected: 0, total: 0 };
        }

        const pendingReview = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.taskId IN (:...taskIds)', { taskIds })
            .andWhere('order.status = :status', { status: OrderStatus.SUBMITTED })
            .getCount();

        const approved = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.taskId IN (:...taskIds)', { taskIds })
            .andWhere('order.status = :status', { status: OrderStatus.APPROVED })
            .getCount();

        const rejected = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.taskId IN (:...taskIds)', { taskIds })
            .andWhere('order.status = :status', { status: OrderStatus.REJECTED })
            .getCount();

        const total = await this.ordersRepository
            .createQueryBuilder('order')
            .where('order.taskId IN (:...taskIds)', { taskIds })
            .getCount();

        return { pendingReview, approved, rejected, total };
    }

    // ============ 发货管理 ============

    /**
     * 商家发货
     */
    async shipOrder(
        orderId: string,
        merchantId: string,
        delivery: string,
        deliveryNum: string
    ): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        // 验证权限
        const task = await this.tasksService.findOne(order.taskId);
        if (!task || task.merchantId !== merchantId) {
            throw new BadRequestException('无权操作此订单');
        }

        if (order.deliveryState !== 0) {
            throw new BadRequestException('订单已发货');
        }

        order.deliveryState = 1;
        order.delivery = delivery;
        order.deliveryNum = deliveryNum;
        order.deliveryTime = new Date();

        return this.ordersRepository.save(order);
    }

    /**
     * 买手确认收货
     */
    async confirmReceipt(orderId: string, userId: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        if (order.deliveryState !== 1) {
            throw new BadRequestException('订单未发货或已签收');
        }

        order.deliveryState = 2;
        return this.ordersRepository.save(order);
    }

    /**
     * 更新淘宝订单号
     */
    async updateTaobaoOrderNumber(
        orderId: string,
        userId: string,
        taobaoOrderNumber: string
    ): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        order.taobaoOrderNumber = taobaoOrderNumber;
        return this.ordersRepository.save(order);
    }

    /**
     * 更新收货地址
     */
    async updateAddress(
        orderId: string,
        userId: string,
        addressData: { addressName: string; addressPhone: string; address: string }
    ): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        order.addressName = addressData.addressName;
        order.addressPhone = addressData.addressPhone;
        order.address = addressData.address;

        return this.ordersRepository.save(order);
    }

    /**
     * 用户取消订单
     */
    async cancelOrder(orderId: string, userId: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        // 只有待处理或已提交的订单可以取消
        if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.SUBMITTED) {
            throw new BadRequestException('该订单状态不允许取消');
        }

        // 使用事务处理退款
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const task = await this.tasksService.findOne(order.taskId);
            if (task) {
                const merchant = await queryRunner.manager.findOne(Merchant, { where: { id: task.merchantId } });
                if (merchant) {
                    // 退还商家冻结的本金
                    const principalAmount = Number(order.sellerPrincipal) || Number(order.productPrice);
                    merchant.frozenBalance = Number(merchant.frozenBalance) - principalAmount;
                    merchant.balance = Number(merchant.balance) + principalAmount;
                    await queryRunner.manager.save(merchant);

                    // 记录退款流水
                    await this.financeRecordsService.recordMerchantTaskRefund(
                        task.merchantId,
                        principalAmount,
                        Number(merchant.balance),
                        order.id,
                        '用户取消订单退款'
                    );
                }

                // 恢复任务领取数量
                task.claimedCount = Math.max(0, (task.claimedCount || 0) - 1);
                await queryRunner.manager.save(task);
            }

            order.status = OrderStatus.CANCELLED;
            order.completedAt = new Date();
            order.remark = '用户主动取消';
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();
            return order;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // ============ 管理员操作 ============

    /**
     * 管理员强制完成订单（用于特殊情况）
     */
    async adminCompleteOrder(orderId: string, remark?: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        order.status = OrderStatus.COMPLETED;
        order.completedAt = new Date();
        if (remark) {
            order.remark = remark;
        }

        return this.ordersRepository.save(order);
    }

    /**
     * 管理员取消订单
     */
    async adminCancelOrder(orderId: string, remark?: string): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        // 使用事务处理退款
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const task = await this.tasksService.findOne(order.taskId);
            if (task) {
                const merchant = await queryRunner.manager.findOne(Merchant, { where: { id: task.merchantId } });
                if (merchant) {
                    // 退还商家冻结的本金
                    const principalAmount = Number(order.sellerPrincipal) || Number(order.productPrice);
                    merchant.frozenBalance = Number(merchant.frozenBalance) - principalAmount;
                    merchant.balance = Number(merchant.balance) + principalAmount;
                    await queryRunner.manager.save(merchant);

                    // 记录退款流水
                    await this.financeRecordsService.recordMerchantTaskRefund(
                        task.merchantId,
                        principalAmount,
                        Number(merchant.balance),
                        order.id,
                        '订单取消退款'
                    );
                }
            }

            order.status = OrderStatus.CANCELLED;
            order.completedAt = new Date();
            if (remark) {
                order.remark = remark;
            }
            await queryRunner.manager.save(order);

            await queryRunner.commitTransaction();
            return order;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * 获取待返款订单列表（管理员用）
     */
    async getPendingRefundOrders(page: number = 1, limit: number = 20): Promise<{
        data: Order[];
        total: number;
        page: number;
        limit: number;
    }> {
        const [data, total] = await this.ordersRepository.findAndCount({
            where: { status: OrderStatus.APPROVED, deliveryState: 2 },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { data, total, page, limit };
    }

    // ============ 商品链接验证（订单侠 API）============

    /**
     * 验证买手提交的商品链接是否匹配任务商品
     * 在买手提交下单截图时调用
     */
    async validateGoodsLink(
        orderId: string,
        userId: string,
        goodsLink: string,
    ): Promise<{ valid: boolean; error?: string }> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            return { valid: false, error: '订单不存在' };
        }

        // 获取任务信息
        const task = await this.tasksService.findOne(order.taskId);
        if (!task) {
            return { valid: false, error: '任务不存在' };
        }

        // 如果任务没有设置 taobaoId，则跳过验证
        if (!task.taobaoId) {
            return { valid: true };
        }

        // 调用订单侠 API 验证
        const result = await this.dingdanxiaService.validateGoodsLink(
            goodsLink,
            task.taobaoId,
        );

        return result;
    }

    /**
     * 带商品验证的步骤提交
     * 在第一步（下单截图）时验证商品链接
     */
    async submitStepWithValidation(
        orderId: string,
        userId: string,
        submitStepDto: SubmitStepDto & { goodsLink?: string },
    ): Promise<Order> {
        const order = await this.ordersRepository.findOne({ where: { id: orderId, userId } });
        if (!order) {
            throw new NotFoundException('订单不存在');
        }

        // 第一步时验证商品链接
        if (submitStepDto.step === 1 && submitStepDto.goodsLink) {
            const validation = await this.validateGoodsLink(orderId, userId, submitStepDto.goodsLink);
            if (!validation.valid) {
                throw new BadRequestException(validation.error || '商品链接验证失败，请确认购买的是正确的商品');
            }
        }

        // 调用原有的 submitStep 逻辑
        return this.submitStep(orderId, userId, submitStepDto);
    }
}

