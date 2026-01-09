import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  Order,
  OrderStatus,
  CreateOrderDto,
  SubmitStepDto,
  OrderStepData,
  OrderFilterDto,
} from './order.entity';
import { TasksService } from '../tasks/tasks.service';
import { Task, getTaskTypeName } from '../tasks/task.entity';
import { BuyerAccountsService } from '../buyer-accounts/buyer-accounts.service';
import { BuyerAccountStatus } from '../buyer-accounts/buyer-account.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { DingdanxiaService } from '../dingdanxia/dingdanxia.service';
import { MerchantBlacklistService } from '../merchant-blacklist/merchant-blacklist.service';
import { ReferralService } from '../referral/referral.service';
import { MessagesService } from '../messages/messages.service';
import { MessageUserType } from '../messages/message.entity';
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
    private referralService: ReferralService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private dataSource: DataSource,
  ) { }

  /**
   * 智能遮罩口令
   * 6-10字: 保留前2后2 "布朗博士防胀气奶瓶" → "布朗博****奶瓶"
   * 4-5字: 保留首尾各1 "防胀气奶瓶" → "防***瓶"
   */
  maskPassword(password: string): string {
    if (!password) return '';
    const len = password.length;
    if (len >= 6) {
      return password.slice(0, 2) + '*'.repeat(len - 4) + password.slice(-2);
    } else if (len >= 4) {
      return password.slice(0, 1) + '*'.repeat(len - 2) + password.slice(-1);
    }
    return '*'.repeat(len);
  }

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
        '(order.id LIKE :keyword OR order.taskTitle LIKE :keyword OR order.platformOrderNumber LIKE :keyword)',
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

  async findAllAndCount(userId: string, filter?: OrderFilterDto & { page?: number; limit?: number }): Promise<{ data: Order[]; total: number }> {
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

    if (filter?.page && filter?.limit) {
      queryBuilder.skip((filter.page - 1) * filter.limit);
      queryBuilder.take(filter.limit);
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
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

    // ========== P0 Fix: 未完成任务校验 (Incomplete Task Check) ==========
    // 旧版逻辑: Task.php -> user() Line 531-543
    // 必须确保用户没有未完成的任务才能接新单
    const incompleteOrder = await this.ordersRepository.findOne({
      where: {
        userId,
        status: In([OrderStatus.PENDING, OrderStatus.SUBMITTED]),
      },
      order: { createdAt: 'DESC' },
    });

    if (incompleteOrder) {
      throw new BadRequestException('有未完成任务，请完成后再接！');
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
      buyerAccount.platformAccount,
    );
    if (isBlacklisted) {
      throw new BadRequestException('当前买号已被商家拉黑，无法接取此任务');
    }

    // ========== P0 Fix: 回购任务校验 (Repurchase Task Validation) ==========
    // 旧版逻辑: Task.php Line 269-275
    // 回购任务只允许曾在该店铺完成过订单的买号接取
    if (task.isRepay && task.shopId) {
      const completedOrderInShop = await this.ordersRepository
        .createQueryBuilder('order')
        .innerJoin('tasks', 'task', 'order.taskId = task.id')
        .where('order.buynoId = :buynoId', { buynoId: createOrderDto.buynoId })
        .andWhere('task.shopId = :shopId', { shopId: task.shopId })
        .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
        .getOne();

      if (!completedOrderInShop) {
        throw new BadRequestException('此任务是回购任务，无法接取！');
      }
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

    // INVARIANT: 银锭余额不可为负（防止未来回退）
    if (user.silver < 0) {
      throw new Error('[INVARIANT] silver < 0 after takeTask');
    }

    // 构建步骤数据 (根据任务配置动态生成，
    const steps: OrderStepData[] = this.generateTaskSteps(task);

    // ========== P0 Fix: 动态超时时间计算 (Dynamic Timeout Calculation) ==========
    // 旧版逻辑: Task.php Line 292-307
    let endingTime = new Date();

    if (task.isTimingPay && task.timingTime) {
      // 定时付款任务: timingTime + 120分钟
      endingTime = new Date(task.timingTime.getTime() + 120 * 60 * 1000);
    } else if (task.isNextDay) {
      // 隔天任务: 次日下午16:40
      endingTime = new Date();
      endingTime.setDate(endingTime.getDate() + 1);
      endingTime.setHours(16, 40, 0, 0);
    } else {
      // 普通任务: 当前时间 + 1小时
      endingTime.setHours(endingTime.getHours() + 1);
    }

    // 计算每单的买手分成佣金
    // userDivided = task.userDivided / task.count
    const userDividedPerOrder =
      task.count > 0
        ? Math.round((Number(task.userDivided || 0) / task.count) * 100) / 100
        : 0;

    const newOrder = this.ordersRepository.create({
      taskId: task.id,
      userId,
      buynoId: createOrderDto.buynoId,
      buynoAccount: createOrderDto.buynoAccount,
      taskTitle: task.title,
      platform: getTaskTypeName(task.taskType),
      productName: task.title, // 使用任务标题作为商品名
      productPrice: Number(task.goodsPrice),
      commission: Number(task.baseServiceFee),
      userDivided: userDividedPerOrder, // 买手分成佣金（每单）
      currentStep: 1,
      totalSteps: steps.length,
      stepData: steps,
      status: OrderStatus.PENDING,
      endingTime,
      silverPrepay: SILVER_PREPAY, // 记录押金金额
      // 预售任务字段
      isPresale: !!task.isPresale,
      yfPrice: Number(task.yfPrice || 0),
      wkPrice: Number(task.wkPrice || 0),
      okYf: false,
      okWk: false,
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

    // 发送消息通知商家：有新订单
    try {
      await this.messagesService.sendOrderMessage(
        task.merchantId,
        MessageUserType.MERCHANT,
        savedOrder.id,
        '新订单通知',
        `任务「${task.title}」有新订单，买手已领取，请关注订单进度。`,
      );
    } catch (e) {
      // 消息发送失败不影响主流程
    }

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

    // ============ P0 风控校验 ============

    // 获取当前步骤信息
    const currentStepData = order.stepData.find(
      (s) => s.step === submitStepDto.step,
    );
    const isPaymentStep = currentStepData?.title === '下单截图';

    // 1. 接单时间限制校验：付款步骤需要接单后至少15分钟才能提交
    // 原版规则：总浏览时间低于15分钟无法提交订单（移动端5分钟，PC端10分钟，但实际前端提示15分钟）
    if (isPaymentStep) {
      const orderCreatedAt = new Date(order.createdAt);
      const now = new Date();
      const minutesSinceCreation =
        (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60);

      // 原版要求：总浏览时间低于15分钟无法提交订单
      // 主商品8分钟 + 副商品5分钟 + 其他商品2分钟 = 至少15分钟
      const MIN_BROWSE_MINUTES = 15;
      if (minutesSinceCreation < MIN_BROWSE_MINUTES) {
        const remainingMinutes = Math.ceil(MIN_BROWSE_MINUTES - minutesSinceCreation);
        throw new BadRequestException(
          `请认真完成任务：总浏览时间需满足${MIN_BROWSE_MINUTES}分钟要求，还需${remainingMinutes}分钟后才能提交付款步骤`,
        );
      }
    }

    // 2. 第一步商品链接/淘口令核对
    if (submitStepDto.step === 1) {
      if (submitStepDto.inputData?.goodsLink) {
        const task = await this.tasksService.findOne(order.taskId);
        if (task?.platformProductId) {
          const validationResult = await this.dingdanxiaService.validateGoodsLink(
            submitStepDto.inputData.goodsLink,
            task.platformProductId,
          );
          if (!validationResult.valid) {
            throw new BadRequestException(
              `商品核对失败，请输入正确的链接或口令。${validationResult.error || ''}`,
            );
          }
        }
      }

      // P1+: 商品口令核对
      const taskForPassword = await this.tasksService.findOne(order.taskId);
      if (taskForPassword?.isPasswordEnabled && taskForPassword?.checkPassword) {
        const userPasswordInput = submitStepDto.inputData?.passwordInput;
        if (!userPasswordInput || userPasswordInput !== taskForPassword.checkPassword) {
          throw new BadRequestException('商品口令核对不正确，请重新在详情页寻找');
        }
      }
    }

    // 3. 隔天任务校验：次日16:40后才允许提交
    const task = await this.tasksService.findOne(order.taskId);
    if (task?.isNextDay) {
      const orderCreatedAt = new Date(order.createdAt);
      const nextDay = new Date(orderCreatedAt);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(16, 40, 0, 0);

      const now = new Date();
      if (now < nextDay) {
        throw new BadRequestException(
          `隔天任务：需次日16:40后才能提交，请于 ${nextDay.toLocaleString('zh-CN')} 后操作`,
        );
      }
    }

    // 4. 本金误差校验：如果用户填写了"实际支付金额"，检查误差是否在±100元内
    if (submitStepDto.inputData?.actualPayment !== undefined) {
      const actualPayment = Number(submitStepDto.inputData.actualPayment);
      const expectedPrincipal = Number(order.productPrice);
      const deviation = Math.abs(actualPayment - expectedPrincipal);

      if (deviation > 100) {
        throw new BadRequestException(
          `实际支付金额与任务本金误差超过100元（任务本金: ${expectedPrincipal}元, 填写金额: ${actualPayment}元），请核对后重新提交`,
        );
      }
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

  /**
   * 确认收货 (Confirm Receipt)
   * Unified method for both MobileCompat and OrdersController
   */
  async confirmReceipt(
    orderId: string,
    userId: string,
    praiseImg?: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    // Optional: Check if already confirmed or invalid state
    // if (order.status === OrderStatus.WAITING_REFUND || order.status === OrderStatus.COMPLETED) {
    //   throw new BadRequestException('订单已确认收货');
    // }

    // Update Delivery State (Legacy logic from old confirmReceipt)
    // 1=Shipped, 2=Received
    if (order.deliveryState === 1) {
      order.deliveryState = 2;
    }

    // Update Order Status to WAITING_REFUND (Legacy state 5)
    order.status = OrderStatus.WAITING_REFUND;

    // Store praise image if field exists (omitted for now to avoid schema change)
    // if (praiseImg) { ... }

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

        // 计算返款金额：本金 + 佣金 + 分成佣金
        const principalAmount =
          Number(order.sellerPrincipal) || Number(order.productPrice);
        const commissionAmount = Number(order.commission);
        const userDividedAmount = Number(order.userDivided) || 0; // 买手分成佣金
        const totalCommissionAmount = commissionAmount + userDividedAmount; // 总佣金 = 基础佣金 + 分成佣金

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
          totalCommissionAmount, // 总佣金包含分成
          Number(user.balance),
          Number(user.silver),
          order.id,
          '任务完成返款',
        );

        // 3. 买手获得佣金+分成（到银锭）
        user.silver = Number(user.silver) + totalCommissionAmount;

        // 4. 返还银锭押金
        const silverPrepayAmount = Number(order.silverPrepay) || 0;
        if (silverPrepayAmount > 0) {
          user.silver = Number(user.silver) + silverPrepayAmount;
        }
        await queryRunner.manager.save(user);

        // 记录买手收到佣金（包含分成）
        await this.financeRecordsService.recordBuyerTaskCommission(
          order.userId,
          totalCommissionAmount,
          Number(user.silver),
          order.id,
          userDividedAmount > 0
            ? `任务佣金${commissionAmount}+分成${userDividedAmount}银锭`
            : '任务佣金',
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

        // 更新订单返款金额（本金 + 总佣金）
        order.refundAmount = principalAmount + totalCommissionAmount;

        // 4. 增加买号月度任务计数
        await this.buyerAccountsService.incrementMonthlyTaskCount(
          order.buynoId,
        );

        // 5. 更新用户月度任务计数
        user.monthlyTaskCount = (user.monthlyTaskCount || 0) + 1;

        // 6. 更新用户最后任务完成时间（用于30天活跃熔断判定）
        user.lastTaskAt = new Date();
        await queryRunner.manager.save(user);

        // 7. 推荐奖励发放（在事务外异步执行，避免影响主流程）
        // 使用 setImmediate 确保在事务提交后执行
        const orderId = order.id;
        const userId = order.userId;
        const taskTitle = order.taskTitle;
        const monthlyCount = user.monthlyTaskCount;
        setImmediate(async () => {
          try {
            // 发放推荐奖励
            await this.referralService.processReferralBonus(
              orderId,
              userId,
              taskTitle,
            );

            // 检查并恢复可能熔断的推荐关系
            await this.referralService.checkAndRestoreBond(userId);

            // P1: 里程碑奖励已删除，改为每单1银锭（上限10单）
          } catch (err) {
            // 推荐奖励发放失败不影响订单完成
            console.error('推荐奖励发放失败:', err);
          }
        });
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

      // 发送消息通知买手：订单审核结果
      try {
        if (approved) {
          await this.messagesService.sendOrderMessage(
            order.userId,
            MessageUserType.BUYER,
            order.id,
            '订单审核通过',
            `您的订单「${order.taskTitle}」已审核通过，本金+佣金已返还至账户。`,
          );
        } else {
          await this.messagesService.sendOrderMessage(
            order.userId,
            MessageUserType.BUYER,
            order.id,
            '订单审核未通过',
            `您的订单「${order.taskTitle}」审核未通过，原因：${rejectReason || '未说明'}。银锭押金已返还。`,
          );
        }
      } catch (e) {
        // 消息发送失败不影响主流程
      }

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

    const savedOrder = await this.ordersRepository.save(order);

    // 发送消息通知买手：商家已发货
    try {
      await this.messagesService.sendOrderMessage(
        order.userId,
        MessageUserType.BUYER,
        order.id,
        '订单已发货',
        `您的订单「${order.taskTitle}」已发货，快递公司：${delivery}，快递单号：${deliveryNum}，请注意查收。`,
      );
    } catch (e) {
      // 消息发送失败不影响主流程
    }

    return savedOrder;
  }

  /**
   * 商家返款
   * 将商品本金+佣金返还给买手
   */
  async returnPayment(
    orderId: string,
    merchantId: string,
    amount: number,
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

    // 检查订单状态是否为待返款
    if (order.status !== OrderStatus.WAITING_REFUND) {
      throw new BadRequestException('订单状态不正确，无法返款');
    }

    // 验证返款金额范围（80%-120%）
    const expectedAmount = Number(order.productPrice) + Number(order.commission);
    const minAmount = expectedAmount * 0.8;
    const maxAmount = expectedAmount * 1.2;
    if (amount < minAmount || amount > maxAmount) {
      throw new BadRequestException(`返款金额必须在${minAmount.toFixed(2)}-${maxAmount.toFixed(2)}之间`);
    }

    // 使用事务处理返款
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 更新订单状态为已完成
      order.status = OrderStatus.COMPLETED;
      order.returnAmount = amount;
      order.refundTime = new Date();
      await queryRunner.manager.save(order);

      // 给买手增加余额
      const user = await this.usersRepository.findOne({
        where: { id: order.userId },
      });
      if (user) {
        user.balance = Number(user.balance) + amount;
        await queryRunner.manager.save(user);

        // 记录财务流水
        await this.financeRecordsService.createWithManager(
          queryRunner.manager,
          {
            userId: order.userId,
            userType: 'buyer',
            type: 'return',
            amount: amount,
            balanceAfter: user.balance,
            description: `订单返款 - ${order.taskTitle}`,
            relatedOrderId: order.id,
          },
        );
      }

      await queryRunner.commitTransaction();

      // 发送消息通知买手
      try {
        await this.messagesService.sendOrderMessage(
          order.userId,
          MessageUserType.BUYER,
          order.id,
          '订单已返款',
          `您的订单「${order.taskTitle}」已返款 ¥${amount.toFixed(2)}，款项已到账。`,
        );
      } catch (e) {
        // 消息发送失败不影响主流程
      }

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 更新平台订单号
   */
  async updatePlatformOrderNumber(
    orderId: string,
    userId: string,
    platformOrderNumber: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    order.platformOrderNumber = platformOrderNumber;
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

      // 发送消息通知商家：订单已取消
      try {
        const task = await this.tasksService.findOne(order.taskId);
        if (task) {
          await this.messagesService.sendOrderMessage(
            task.merchantId,
            MessageUserType.MERCHANT,
            order.id,
            '订单已取消',
            `任务「${order.taskTitle}」的订单已被买手取消，本金已退还至您的账户。`,
          );
        }
      } catch (e) {
        // 消息发送失败不影响主流程
      }

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

    // 如果任务没有设置 platformProductId，则跳过验证
    if (!task.platformProductId) {
      return { valid: true };
    }

    // 调用订单侠 API 验证
    const result = await this.dingdanxiaService.validateGoodsLink(
      goodsLink,
      task.platformProductId,
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

  // ============ 预售任务流程 ============

  /**
   * 确认支付定金（买手操作）
   * 预售任务第一阶段：买手付定金
   */
  async confirmPresaleDeposit(
    orderId: string,
    userId: string,
    depositScreenshot?: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (!order.isPresale) {
      throw new BadRequestException('该订单不是预售任务');
    }

    if (order.okYf) {
      throw new BadRequestException('定金已确认，请勿重复操作');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许操作');
    }

    order.okYf = true;
    if (depositScreenshot) {
      // 可以将截图存储到 stepData 或专门字段
      order.stepData = [
        ...(order.stepData || []),
        {
          step: 0,
          title: '定金截图',
          description: '预售定金支付截图',
          submitted: true,
          submittedAt: new Date(),
          screenshot: depositScreenshot,
        },
      ];
    }

    const savedOrder = await this.ordersRepository.save(order);

    // 通知商家：定金已付
    try {
      const task = await this.tasksService.findOne(order.taskId);
      if (task) {
        await this.messagesService.sendOrderMessage(
          task.merchantId,
          MessageUserType.MERCHANT,
          order.id,
          '预售定金已付',
          `订单「${order.taskTitle}」的买手已支付定金${order.yfPrice}元，请等待尾款。`,
        );
      }
    } catch (e) {
      // 消息发送失败不影响主流程
    }

    return savedOrder;
  }

  /**
   * 确认支付尾款（买手操作）
   * 预售任务第二阶段：买手付尾款
   */
  async confirmPresaleFinal(
    orderId: string,
    userId: string,
    finalScreenshot?: string,
  ): Promise<Order> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (!order.isPresale) {
      throw new BadRequestException('该订单不是预售任务');
    }

    if (!order.okYf) {
      throw new BadRequestException('请先确认支付定金');
    }

    if (order.okWk) {
      throw new BadRequestException('尾款已确认，请勿重复操作');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('订单状态不允许操作');
    }

    order.okWk = true;
    if (finalScreenshot) {
      order.stepData = [
        ...(order.stepData || []),
        {
          step: -1,
          title: '尾款截图',
          description: '预售尾款支付截图',
          submitted: true,
          submittedAt: new Date(),
          screenshot: finalScreenshot,
        },
      ];
    }

    const savedOrder = await this.ordersRepository.save(order);

    // 通知商家：尾款已付
    try {
      const task = await this.tasksService.findOne(order.taskId);
      if (task) {
        await this.messagesService.sendOrderMessage(
          task.merchantId,
          MessageUserType.MERCHANT,
          order.id,
          '预售尾款已付',
          `订单「${order.taskTitle}」的买手已支付尾款${order.wkPrice}元，总计${Number(order.yfPrice) + Number(order.wkPrice)}元，请注意发货。`,
        );
      }
    } catch (e) {
      // 消息发送失败不影响主流程
    }

    return savedOrder;
  }

  /**
   * 获取预售订单状态
   */
  async getPresaleStatus(orderId: string, userId: string): Promise<{
    isPresale: boolean;
    yfPrice: number;
    wkPrice: number;
    totalPrice: number;
    okYf: boolean;
    okWk: boolean;
    stage: 'waiting_deposit' | 'waiting_final' | 'completed' | 'not_presale';
  }> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, userId },
    });
    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    if (!order.isPresale) {
      return {
        isPresale: false,
        yfPrice: 0,
        wkPrice: 0,
        totalPrice: Number(order.productPrice),
        okYf: false,
        okWk: false,
        stage: 'not_presale',
      };
    }

    let stage: 'waiting_deposit' | 'waiting_final' | 'completed' = 'waiting_deposit';
    if (order.okYf && order.okWk) {
      stage = 'completed';
    } else if (order.okYf) {
      stage = 'waiting_final';
    }

    return {
      isPresale: true,
      yfPrice: Number(order.yfPrice),
      wkPrice: Number(order.wkPrice),
      totalPrice: Number(order.yfPrice) + Number(order.wkPrice),
      okYf: order.okYf,
      okWk: order.okWk,
      stage,
    };
  }
}
