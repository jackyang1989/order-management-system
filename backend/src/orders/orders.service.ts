import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  Order,
  OrderStatus,
  CreateOrderDto,
  SubmitStepDto,
  OrderStepData,
  OrderFilterDto,
} from './order.entity';
import { TasksService } from '../tasks/tasks.service';
import { Task } from '../tasks/task.entity';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus } from '../buyer-accounts/buyer-account.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { DingdanxiaService } from '../dingdanxia/dingdanxia.service';
import { MerchantBlacklistService } from '../merchant-blacklist/merchant-blacklist.service';
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
    private merchantBlacklistService: MerchantBlacklistService,
    private dataSource: DataSource,
  ) { }

  // ============ 管理员端方法 ============

  async findAllAdmin(filter: {
    page: number;
    limit: number;
    status?: string;
    keyword?: string;
  }): Promise<{ data: Order[]; total: number }> {
    const queryBuilder = this.ordersRepository.createQueryBuilder('order');

    if (filter.status) {
      queryBuilder.andWhere('order.status = :status', { status: filter.status });
    }

    if (filter.keyword) {
      queryBuilder.andWhere(
        '(order.id LIKE :keyword OR order.taskTitle LIKE :keyword OR order.taobaoOrderNumber LIKE :keyword)',
        { keyword: `%${filter.keyword}%` },
      );
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');
    queryBuilder.skip((filter.page - 1) * filter.limit);
    queryBuilder.take(filter.limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  // ============ 用户端方法 ============

  async findAll(userId: string, filter?: OrderFilterDto): Promise<Order[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId });

    if (filter) {
      if (filter.status) {
        queryBuilder.andWhere('order.status = :status', {
          status: filter.status,
        });
      }
      if (filter.platform) {
        queryBuilder.andWhere('order.platform = :platform', {
          platform: filter.platform,
        });
      }
    }

    queryBuilder.orderBy('order.createdAt', 'DESC');
    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Order | null> {
    return this.ordersRepository.findOne({ where: { id } });
  }

  async findByUserAndTask(
    userId: string,
    taskId: string,
  ): Promise<Order | null> {
    return this.ordersRepository.findOne({ where: { userId, taskId } });
  }

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const task = await this.tasksService.findOne(createOrderDto.taskId);
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 获取用户信息
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // VIP验证)
    if (!user.vip) {
      throw new BadRequestException('您还不是VIP，请先充值');
    }
    if (user.vipExpireAt && new Date(user.vipExpireAt) < new Date()) {
      throw new BadRequestException('VIP已过期，请先续费');
    }

    // 银锭验证 - 接单需要冻结1银锭
    const SILVER_PREPAY = 1; // 接单押金1银锭
    if (Number(user.silver) < SILVER_PREPAY) {
      throw new BadRequestException('银锭不足，接单需要1银锭作为押金');
    }

    // 检查是否已领取过
    const existing = await this.findByUserAndTask(
      userId,
      createOrderDto.taskId,
    );
    if (existing) {
      throw new BadRequestException('您已领取过此任务');
    }

    // 1. 验证买号归属权 (Security Fix: IDOR)
    const buyerAccount = await this.buyerAccountsService.findOne(
      createOrderDto.buynoId,
      userId,
    );
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
      Number(task.goodsPrice),
    );
    if (!eligibility.eligible) {
      throw new BadRequestException(
        eligibility.reason || '该买号无法接取此任务',
      );
    }

    // 2.3 黑名单校验
    const isBlacklisted = await this.merchantBlacklistService.isBlacklisted(
      task.merchantId,
      buyerAccount.accountName,
    );
    if (isBlacklisted) {
      throw new BadRequestException('当前买号已被商家拉黑，无法接取此任务');
    }

    // 2.4 购物周期校验
    // 检查该买号是否在商家设置的周期内接过此店铺的任务
    if (task.cycle > 0 && task.shopId) {
      const cycleMonths = task.cycle * 30; // cycle存储的是费用，对应的天数
      const cycleCheckDate = new Date();
      cycleCheckDate.setDate(cycleCheckDate.getDate() - cycleMonths);

      const recentOrder = await this.ordersRepository
        .createQueryBuilder('order')
        .innerJoin('tasks', 'task', 'order.taskId = task.id')
        .where('order.buynoId = :buynoId', { buynoId: createOrderDto.buynoId })
        .andWhere('task.shopId = :shopId', { shopId: task.shopId })
        .andWhere('order.createdAt > :cycleCheckDate', { cycleCheckDate })
        .getOne();

      if (recentOrder) {
        throw new BadRequestException(
          `该商家设置买家购物周期为${cycleMonths}天，您在周期内已接过此店铺任务`,
        );
      }
    }

    // 2.45 接单间隔时间校验
    if (task.unionInterval > 0 && task.receiptTime) {
      const intervalMs = task.unionInterval * 60 * 1000; // 分钟转毫秒
      const nextAllowedTime = new Date(task.receiptTime.getTime() + intervalMs);
      if (new Date() < nextAllowedTime) {
        const remainingMinutes = Math.ceil(
          (nextAllowedTime.getTime() - Date.now()) / 60000,
        );
        throw new BadRequestException(
          `未达到商家设定的接单间隔时间，请${remainingMinutes}分钟后再试`,
        );
      }
    }

    // 2.5 验证每日/每月接单限制
    const DAILY_LIMIT_PER_BUYNO = 4; // 每个买号每天最多4单
    const MONTHLY_LIMIT_PER_USER = 220; // 每个用户每月最多220单

    const buynoTodayCount = await this.getBuynoTodayOrderCount(
      createOrderDto.buynoId,
    );
    if (buynoTodayCount >= DAILY_LIMIT_PER_BUYNO) {
      throw new BadRequestException(
        `该买号今日已接${buynoTodayCount}单，每日最多${DAILY_LIMIT_PER_BUYNO}单`,
      );
    }

    const userMonthlyCount = await this.getUserMonthlyOrderCount(userId);
    if (userMonthlyCount >= MONTHLY_LIMIT_PER_USER) {
      throw new BadRequestException(
        `您本月已接${userMonthlyCount}单，每月最多${MONTHLY_LIMIT_PER_USER}单`,
      );
    }

    // 3. 扣减库存 (Security Fix: Inventory Race Condition)
    await this.tasksService.claim(
      createOrderDto.taskId,
      userId,
      createOrderDto.buynoId,
    );

    // 4. 扣除银锭押金
    user.silver = Number(user.silver) - SILVER_PREPAY;
    await this.usersRepository.save(user);

    // 构建步骤数据 (根据任务配置动态生成，
    const steps: OrderStepData[] = this.generateTaskSteps(task);

    // 设置订单超时时间 (1小时后)
    const endingTime = new Date();
    endingTime.setHours(endingTime.getHours() + 1);

    // 平台名称映射
    const platformMap: Record<number, string> = {
      1: '淘宝',
      2: '天猫',
      3: '京东',
      4: '拼多多',
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
      totalSteps: steps.length,
      stepData: steps,
      status: OrderStatus.PENDING,
      endingTime,
      silverPrepay: SILVER_PREPAY, // 记录押金金额
    });

    const savedOrder = await this.ordersRepository.save(newOrder);

    // 更新任务的最后接单时间 (用于接单间隔校验)
    await this.tasksService.updateReceiptTime(task.id);

    // 记录银锭押金扣除流水
    await this.financeRecordsService.recordBuyerTaskSilverPrepay(
      userId,
      SILVER_PREPAY,
      Number(user.silver),
      savedOrder.id,
      '接单银锭押金',
    );

    return savedOrder;
  }

  async submitStep(
    orderId: string,
    userId: string,
    submitStepDto: SubmitStepDto,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
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
    const stepIndex = order.stepData.findIndex(
      (s) => s.step === submitStepDto.step,
    );
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

  async updateStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order | null> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
    if (!order) return null;

    order.status = status;
    return this.ordersRepository.save(order);
  }

  async getStats(userId: string): Promise<{
    pending: number;
    submitted: number;
    completed: number;
    total: number;
  }> {
    const pending = await this.ordersRepository.count({
      where: { userId, status: OrderStatus.PENDING },
    });
    const submitted = await this.ordersRepository.count({
      where: { userId, status: OrderStatus.SUBMITTED },
    });
    const completed = await this.ordersRepository.count({
      where: { userId, status: OrderStatus.COMPLETED },
    });
    const total = await this.ordersRepository.count({ where: { userId } });

    return { pending, submitted, completed, total };
  }

  /**
   * 获取买号今日接单数量
 *
   */
  async getBuynoTodayOrderCount(buynoId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.buynoId = :buynoId', { buynoId })
      .andWhere('order.createdAt >= :today', { today })
      .andWhere('order.createdAt < :tomorrow', { tomorrow })
      .getCount();
  }

  /**
   * 获取用户本月接单数量
 *
   */
  async getUserMonthlyOrderCount(userId: string): Promise<number> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere('order.createdAt >= :monthStart', { monthStart })
      .andWhere('order.createdAt < :nextMonth', { nextMonth })
      .getCount();
  }

  // ============ 商家端订单审核 ============

  /**
   * 获取商家的待审核订单列表
   * 通过 taskId 关联找到属于该商家的订单
   */
  async findByMerchant(
    merchantId: string,
    filter?: { status?: OrderStatus },
  ): Promise<Order[]> {
    // 获取商家的所有任务 ID
    const merchantTasks = await this.tasksService.findByMerchant(merchantId);
    const taskIds = merchantTasks.map((t) => t.id);

    if (taskIds.length === 0) {
      return [];
    }

    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .where('order.taskId IN (:...taskIds)', { taskIds });

    if (filter?.status) {
      queryBuilder.andWhere('order.status = :status', {
        status: filter.status,
      });
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
    rejectReason?: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
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
      const merchant = await queryRunner.manager.findOne(Merchant, {
        where: { id: merchantId },
      });
      const user = await queryRunner.manager.findOne(User, {
        where: { id: order.userId },
      });

      if (!merchant || !user) {
        throw new BadRequestException('商家或用户不存在');
      }

      if (approved) {
        order.status = OrderStatus.APPROVED;
        order.refundTime = new Date();

        // 计算返款金额：本金 + 佣金
        const principalAmount =
          Number(order.sellerPrincipal) || Number(order.productPrice);
        const commissionAmount = Number(order.commission);

        // 1. 商家冻结余额减少本金
        merchant.frozenBalance =
          Number(merchant.frozenBalance) - principalAmount;
        await queryRunner.manager.save(merchant);

        // 记录商家结算流水
        await this.financeRecordsService.recordMerchantTaskSettle(
          merchantId,
          principalAmount,
          Number(merchant.frozenBalance),
          order.id,
          '订单结算',
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
          '任务完成返款',
        );

        // 3. 买手获得佣金（到银锭）
        user.silver = Number(user.silver) + commissionAmount;

        // 4. 返还银锭押金
        const silverPrepayAmount = Number(order.silverPrepay) || 0;
        if (silverPrepayAmount > 0) {
          user.silver = Number(user.silver) + silverPrepayAmount;
        }
        await queryRunner.manager.save(user);

        // 记录买手收到佣金
        await this.financeRecordsService.recordBuyerTaskCommission(
          order.userId,
          commissionAmount,
          Number(user.silver),
          order.id,
          '任务佣金',
        );

        // 记录银锭押金返还
        if (silverPrepayAmount > 0) {
          await this.financeRecordsService.recordBuyerTaskSilverRefund(
            order.userId,
            silverPrepayAmount,
            Number(user.silver),
            order.id,
            '任务完成返还银锭押金',
          );
        }

        // 更新订单返款金额
        order.refundAmount = principalAmount + commissionAmount;

        // 4. 增加买号月度任务计数
        await this.buyerAccountsService.incrementMonthlyTaskCount(
          order.buynoId,
        );
      } else {
        order.status = OrderStatus.REJECTED;
        order.rejectReason = rejectReason || '';

        // 驳回时：将本金从冻结余额退还到商家可用余额
        const principalAmount =
          Number(order.sellerPrincipal) || Number(order.productPrice);
        merchant.frozenBalance =
          Number(merchant.frozenBalance) - principalAmount;
        merchant.balance = Number(merchant.balance) + principalAmount;
        await queryRunner.manager.save(merchant);

        // 记录商家退款流水
        await this.financeRecordsService.recordMerchantTaskRefund(
          merchantId,
          principalAmount,
          Number(merchant.balance),
          order.id,
          '订单驳回退款',
        );

        // 驳回时也返还买手银锭押金
        const silverPrepayAmount = Number(order.silverPrepay) || 0;
        if (silverPrepayAmount > 0) {
          user.silver = Number(user.silver) + silverPrepayAmount;
          await queryRunner.manager.save(user);

          await this.financeRecordsService.recordBuyerTaskSilverRefund(
            order.userId,
            silverPrepayAmount,
            Number(user.silver),
            order.id,
            '订单驳回返还银锭押金',
          );
        }
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
    const taskIds = merchantTasks.map((t) => t.id);

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
    deliveryNum: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
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
    taobaoOrderNumber: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
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
    addressData: { addressName: string; addressPhone: string; address: string },
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 只有待处理或已提交的订单可以取消
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.SUBMITTED
    ) {
      throw new BadRequestException('该订单状态不允许取消');
    }

    // 使用事务处理退款
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await this.tasksService.findOne(order.taskId);
      if (task) {
        const merchant = await queryRunner.manager.findOne(Merchant, {
          where: { id: task.merchantId },
        });
        if (merchant) {
          // 退还商家冻结的本金
          const principalAmount =
            Number(order.sellerPrincipal) || Number(order.productPrice);
          merchant.frozenBalance =
            Number(merchant.frozenBalance) - principalAmount;
          merchant.balance = Number(merchant.balance) + principalAmount;
          await queryRunner.manager.save(merchant);

          // 记录退款流水
          await this.financeRecordsService.recordMerchantTaskRefund(
            task.merchantId,
            principalAmount,
            Number(merchant.balance),
            order.id,
            '用户取消订单退款',
          );
        }

        // 恢复任务领取数量
        task.claimedCount = Math.max(0, (task.claimedCount || 0) - 1);
        await queryRunner.manager.save(task);
      }

      // 检查是否符合免罚条件
      const shouldPunish = await this.shouldPunishForCancel(userId, order.id);

      // 用户取消订单，根据规则决定是否扣除银锭押金
      const silverPrepayAmount = Number(order.silverPrepay) || 0;
      if (silverPrepayAmount > 0) {
        const user = await queryRunner.manager.findOne(User, {
          where: { id: userId },
        });
        if (user) {
          if (shouldPunish) {
            // 银锭已经在接单时扣除，取消时不返还（作为惩罚）
            await this.financeRecordsService.recordBuyerTaskCancelSilver(
              userId,
              silverPrepayAmount,
              Number(user.silver),
              order.id,
              '用户取消订单扣除银锭押金',
            );
          } else {
            // 免罚：返还银锭押金
            user.silver = Number(user.silver) + silverPrepayAmount;
            await queryRunner.manager.save(user);
            await this.financeRecordsService.recordBuyerTaskSilverRefund(
              userId,
              silverPrepayAmount,
              Number(user.silver),
              order.id,
              '取消订单免罚返还银锭押金',
            );
          }
        }
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId },
    });
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
        const merchant = await queryRunner.manager.findOne(Merchant, {
          where: { id: task.merchantId },
        });
        if (merchant) {
          // 退还商家冻结的本金
          const principalAmount =
            Number(order.sellerPrincipal) || Number(order.productPrice);
          merchant.frozenBalance =
            Number(merchant.frozenBalance) - principalAmount;
          merchant.balance = Number(merchant.balance) + principalAmount;
          await queryRunner.manager.save(merchant);

          // 记录退款流水
          await this.financeRecordsService.recordMerchantTaskRefund(
            task.merchantId,
            principalAmount,
            Number(merchant.balance),
            order.id,
            '订单取消退款',
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
  async getPendingRefundOrders(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
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
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // 第一步时验证商品链接
    if (submitStepDto.step === 1 && submitStepDto.goodsLink) {
      const validation = await this.validateGoodsLink(
        orderId,
        userId,
        submitStepDto.goodsLink,
      );
      if (!validation.valid) {
        throw new BadRequestException(
          validation.error || '商品链接验证失败，请确认购买的是正确的商品',
        );
      }
    }

    // 调用原有的 submitStep 逻辑
    return this.submitStep(orderId, userId, submitStepDto);
  }

  // ============ 任务步骤模板生成 ============

  /**
   * 根据任务配置生成详细的步骤列表
 *
   */
  private generateTaskSteps(task: Task): OrderStepData[] {
    const steps: OrderStepData[] = [];
    let stepNumber = 1;

    // 第一步：搜索和浏览 (固定步骤)
    steps.push({
      step: stepNumber++,
      title: '搜索商品',
      description: this.generateSearchDescription(task),
      submitted: false,
    });

    // 货比步骤 (如果任务需要)
    if (task.needHuobi) {
      steps.push({
        step: stepNumber++,
        title: '货比加购',
        description: `搜索货比关键词"${task.huobiKeyword || task.keyword}"，浏览5家同类商品每家2分钟，将其中3个商家的货比商品加入购物车并截图`,
        submitted: false,
      });
    }

    // 收藏步骤
    if (task.needShoucang) {
      steps.push({
        step: stepNumber++,
        title: '收藏商品',
        description: '收藏商品并截图',
        submitted: false,
      });
    }

    // 关注店铺步骤
    if (task.needGuanzhu) {
      steps.push({
        step: stepNumber++,
        title: '关注店铺',
        description: '关注店铺并截图',
        submitted: false,
      });
    }

    // 假聊步骤
    if (task.needJialiao) {
      steps.push({
        step: stepNumber++,
        title: '假聊截图',
        description: '与店家客服聊天并截图（按商家要求内容聊天）',
        submitted: false,
      });
    }

    // 加购物车步骤
    if (task.needJiagou) {
      steps.push({
        step: stepNumber++,
        title: '加入购物车',
        description: '将商品加入购物车并截图',
        submitted: false,
      });
    }

    // 下单截图 (固定步骤)
    steps.push({
      step: stepNumber++,
      title: '下单截图',
      description: `付款并上传订单截图（浏览时间需满${task.totalBrowseMinutes || 15}分钟）`,
      submitted: false,
    });

    // 物流截图 (根据是否需要物流)
    steps.push({
      step: stepNumber++,
      title: '物流截图',
      description: task.isFreeShipping
        ? '等待发货，上传物流截图'
        : '确认收货并上传物流截图',
      submitted: false,
    });

    // 好评截图 (如果任务需要好评)
    if (task.isPraise || task.isImgPraise || task.isVideoPraise) {
      let praiseDesc = '提交好评并截图';
      if (task.isVideoPraise) {
        praiseDesc = '提交视频好评并截图';
      } else if (task.isImgPraise) {
        praiseDesc = '提交图片好评并截图';
      }
      steps.push({
        step: stepNumber++,
        title: '好评截图',
        description: praiseDesc,
        submitted: false,
      });
    }

    return steps;
  }

  /**
   * 生成搜索步骤的详细描述
   */
  private generateSearchDescription(task: Task): string {
    let desc = '';

    // 根据任务类型生成不同的搜索说明
    if (task.qrCode) {
      desc = '打开淘宝APP，扫描二维码进入商品页面';
    } else if (task.taoWord) {
      desc = `复制淘口令"${task.taoWord}"，打开淘宝APP`;
    } else if (task.keyword) {
      desc = `在淘宝APP搜索框手动输入关键词"${task.keyword}"，找到指定商品`;
    } else {
      desc = '按照商家指定方式进入商品页面';
    }

    // 添加浏览时间要求
    desc += `\n浏览主商品${task.mainBrowseMinutes || 8}分钟以上，随机浏览店铺其他2个商品各${task.subBrowseMinutes || 2}分钟`;

    return desc;
  }

  // ============ 免罚逻辑 ============

  /**
   * 判断取消订单是否应该扣罚
 *
   * 1. 每天前2单取消不扣银锭
   * 2. 晚上11点到第二天9点取消免罚
   */
  private async shouldPunishForCancel(
    userId: string,
    currentOrderId: string,
  ): Promise<boolean> {
    const now = new Date();
    const hour = now.getHours();

    // 夜间免罚: 晚上11点到第二天9点
    if (hour >= 23 || hour < 9) {
      return false;
    }

    // 今日取消次数检查: 每天前2单取消免罚
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCancelCount = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
      .andWhere('order.completedAt >= :today', { today })
      .andWhere('order.completedAt < :tomorrow', { tomorrow })
      .andWhere('order.id != :currentOrderId', { currentOrderId })
      .getCount();

    if (todayCancelCount < 2) {
      return false;
    }

    // 超过免罚限额，需要扣罚
    return true;
  }

  /**
   * 获取用户今日取消次数
   */
  async getUserTodayCancelCount(userId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.ordersRepository
      .createQueryBuilder('order')
      .where('order.userId = :userId', { userId })
      .andWhere('order.status = :status', { status: OrderStatus.CANCELLED })
      .andWhere('order.completedAt >= :today', { today })
      .andWhere('order.completedAt < :tomorrow', { tomorrow })
      .getCount();
  }
}
