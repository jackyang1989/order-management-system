import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import {
  ReviewTask,
  ReviewTaskPraise,
  ReviewTaskStatus,
  ReviewPraiseType,
  CreateReviewTaskDto,
  PayReviewTaskDto,
  SubmitReviewDto,
  RejectReviewDto,
  ConfirmReviewDto,
  CancelReviewDto,
  ReviewTaskFilterDto,
  GoodsPraiseSettingDto,
} from './review-task.entity';
import { Order, OrderStatus } from '../orders/order.entity';
import { UsersService } from '../users/users.service';
import { MerchantsService } from '../merchants/merchants.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { MessagesService } from '../messages/messages.service';
import {
  FinanceUserType,
  FinanceMoneyType,
  FinanceType,
} from '../finance-records/finance-record.entity';

/**
 * 追评费用标准
 */
const REVIEW_PRICE = {
  TEXT: 2, // 文字追评 2元/件
  IMAGE: 3, // 图片追评 3元/件
  VIDEO: 10, // 视频追评 10元/件
};

/**
 * 买手佣金比例
 */
const USER_COMMISSION_RATE = 0.5; // 50%

@Injectable()
export class ReviewTasksService {
  constructor(
    @InjectRepository(ReviewTask)
    private reviewTaskRepo: Repository<ReviewTask>,
    @InjectRepository(ReviewTaskPraise)
    private reviewTaskPraiseRepo: Repository<ReviewTaskPraise>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectDataSource()
    private dataSource: DataSource,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
    private financeRecordsService: FinanceRecordsService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
  ) {}

  /**
   * 生成追评任务编号 (格式: ZP + 时间戳 + 随机数)
   */
  private generateTaskNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ZP${timestamp}${random}`;
  }

  /**
   * 获取可追评的订单列表
   * 条件: is_shengji=2 AND state=1(已完成) AND is_zp=0
   */
  async getReviewableOrders(
    merchantId: string,
    page = 1,
    limit = 15,
  ): Promise<{
    list: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.orderRepo
      .createQueryBuilder('o')
      .innerJoin('tasks', 't', 't.id = o.taskId')
      .where('t.merchantId = :merchantId', { merchantId })
      .andWhere('o.status = :status', { status: OrderStatus.COMPLETED })
      .andWhere('o.isShengji = :isShengji', { isShengji: 2 })
      .andWhere('o.isZp = :isZp', { isZp: false });

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .orderBy('o.completedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { list, total, page, limit };
  }

  /**
   * 检查订单是否可以发布追评
   */
  async checkReviewable(
    orderId: string,
    merchantId: string,
  ): Promise<{ canReview: boolean; reason?: string; order?: Order }> {
    // 获取订单信息
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      return { canReview: false, reason: '订单不存在' };
    }

    // 验证订单状态
    if (order.status !== OrderStatus.COMPLETED) {
      return { canReview: false, reason: '订单状态不正确，必须是已完成状态' };
    }

    // 验证升级版本
    if (order.isShengji !== 2) {
      return { canReview: false, reason: '订单版本不支持追评' };
    }

    // 验证是否已发布过追评
    if (order.isZp) {
      return { canReview: false, reason: '已发布追评不能重复发布！' };
    }

    // 检查是否存在进行中的追评订单
    const existingReview = await this.reviewTaskRepo.findOne({
      where: {
        userTaskId: orderId,
        state: In([
          ReviewTaskStatus.UNPAID,
          ReviewTaskStatus.PAID,
          ReviewTaskStatus.APPROVED,
          ReviewTaskStatus.UPLOADED,
          ReviewTaskStatus.COMPLETED,
          ReviewTaskStatus.REJECTED,
        ]),
      },
    });

    if (existingReview) {
      return { canReview: false, reason: '该订单已存在追评任务' };
    }

    return { canReview: true, order };
  }

  /**
   * 创建追评任务
   * 第一步: 创建任务并计算费用，状态为0(未支付)
   */
  async createReviewTask(
    merchantId: string,
    dto: CreateReviewTaskDto,
  ): Promise<ReviewTask> {
    // 验证商家VIP
    const merchant = await this.merchantsService.findOne(merchantId);
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }
    if (
      !merchant.vip ||
      (merchant.vipExpireAt && new Date(merchant.vipExpireAt) < new Date())
    ) {
      throw new BadRequestException('非VIP会员不能发布追评任务');
    }

    // 验证订单可追评
    const { canReview, reason, order } = await this.checkReviewable(
      dto.userTaskId,
      merchantId,
    );
    if (!canReview) {
      throw new BadRequestException(reason);
    }

    // 计算追评费用
    let totalPrice = 0;
    for (const goods of dto.goods) {
      if (goods.isPraise) {
        totalPrice += REVIEW_PRICE.TEXT;
      }
      if (goods.isImgPraise) {
        totalPrice += REVIEW_PRICE.IMAGE;
      }
      if (goods.isVideoPraise) {
        totalPrice += REVIEW_PRICE.VIDEO;
      }
    }

    if (totalPrice <= 0) {
      throw new BadRequestException('请至少选择一种追评类型');
    }

    // 使用事务创建追评任务
    return await this.dataSource.transaction(async (manager) => {
      // 创建追评任务
      const reviewTask = manager.create(ReviewTask, {
        merchantId,
        userId: order!.userId,
        buynoId: order!.buynoId,
        shopId: undefined, // 需要从task获取
        taobaoOrderNumber: order!.taobaoOrderNumber,
        taskNumber: this.generateTaskNumber(),
        userTaskId: order!.id,
        sellerTaskId: order!.taskId,
        payPrice: Number(order!.sellerPrincipal || 0),
        money: totalPrice,
        userMoney: totalPrice * USER_COMMISSION_RATE,
        state: ReviewTaskStatus.UNPAID,
      });

      const savedTask = await manager.save(reviewTask);

      // 创建追评内容记录
      for (const goods of dto.goods) {
        if (goods.isPraise && goods.praiseContent) {
          await manager.save(ReviewTaskPraise, {
            reviewTaskId: savedTask.id,
            goodsId: goods.goodsId,
            type: ReviewPraiseType.TEXT,
            content: goods.praiseContent,
          });
        }
        if (goods.isImgPraise && goods.praiseImages?.length) {
          await manager.save(ReviewTaskPraise, {
            reviewTaskId: savedTask.id,
            goodsId: goods.goodsId,
            type: ReviewPraiseType.IMAGE,
            content: JSON.stringify(goods.praiseImages),
          });
        }
        if (goods.isVideoPraise && goods.praiseVideo) {
          await manager.save(ReviewTaskPraise, {
            reviewTaskId: savedTask.id,
            goodsId: goods.goodsId,
            type: ReviewPraiseType.VIDEO,
            content: goods.praiseVideo,
          });
        }
      }

      return savedTask;
    });
  }

  /**
   * 支付追评任务
   * 支持两种支付方式: 纯押金支付 / 银锭+押金混合支付
   */
  async payReviewTask(
    merchantId: string,
    dto: PayReviewTaskDto,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: dto.reviewTaskId, merchantId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.UNPAID) {
      throw new BadRequestException('该任务已支付或状态不正确');
    }

    const merchant = await this.merchantsService.findOne(merchantId);
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }

    const totalPrice = Number(reviewTask.money);
    let balanceDeduct = 0; // 押金扣除
    let silverDeduct = 0; // 银锭扣除

    if (!dto.useReward) {
      // 纯押金支付
      if (Number(merchant.balance) < totalPrice) {
        throw new BadRequestException('押金余额不足');
      }
      balanceDeduct = totalPrice;
    } else {
      // 银锭+押金混合支付
      const merchantSilver = Number(merchant.silver || 0);
      if (totalPrice > merchantSilver) {
        // 银锭不足，差额用押金
        silverDeduct = merchantSilver;
        balanceDeduct = totalPrice - merchantSilver;
        if (Number(merchant.balance) < balanceDeduct) {
          throw new BadRequestException('余额不足（押金+银锭）');
        }
      } else {
        // 银锭足够
        silverDeduct = totalPrice;
      }
    }

    // 使用事务执行支付
    return await this.dataSource.transaction(async (manager) => {
      // 扣除商家余额
      if (balanceDeduct > 0) {
        const newBalance = Number(merchant.balance) - balanceDeduct;
        await manager.update('merchants', merchantId, { balance: newBalance });

        // 记录财务流水 - 押金支付追评
        await this.financeRecordsService.create({
          userId: merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.BALANCE,
          financeType: FinanceType.REVIEW_TASK_PAY_BALANCE,
          amount: -balanceDeduct,
          balanceAfter: newBalance,
          memo: `押金:${balanceDeduct},追评任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 扣除商家银锭
      if (silverDeduct > 0) {
        const newSilver = Number(merchant.silver || 0) - silverDeduct;
        await manager.update('merchants', merchantId, { silver: newSilver });

        // 记录财务流水 - 银锭支付追评
        await this.financeRecordsService.create({
          userId: merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.REVIEW_TASK_PAY_SILVER,
          amount: -silverDeduct,
          balanceAfter: newSilver,
          memo: `银锭:${silverDeduct},追评任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 更新追评任务状态
      reviewTask.state = ReviewTaskStatus.PAID;
      reviewTask.payTime = new Date();
      reviewTask.yjprice = balanceDeduct;
      reviewTask.ydprice = silverDeduct;

      return await manager.save(reviewTask);
    });
  }

  /**
   * 商家取消追评任务
   * 只有 state < 3 时可以取消
   */
  async cancelReviewTask(
    merchantId: string,
    dto: CancelReviewDto,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: dto.reviewTaskId, merchantId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state > ReviewTaskStatus.APPROVED) {
      throw new BadRequestException('状态不正确，不允许取消！');
    }

    const merchant = await this.merchantsService.findOne(merchantId);
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }

    // 使用事务执行取消并退款
    return await this.dataSource.transaction(async (manager) => {
      // 退还押金
      if (Number(reviewTask.yjprice) > 0) {
        const newBalance =
          Number(merchant.balance) + Number(reviewTask.yjprice);
        await manager.update('merchants', merchantId, { balance: newBalance });

        // 记录财务流水
        await this.financeRecordsService.create({
          userId: merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.BALANCE,
          financeType: FinanceType.REVIEW_TASK_CANCEL_REFUND,
          amount: Number(reviewTask.yjprice),
          balanceAfter: newBalance,
          memo: `取消追评任务退回押金:${reviewTask.yjprice},任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 退还银锭
      if (Number(reviewTask.ydprice) > 0) {
        const newSilver =
          Number(merchant.silver || 0) + Number(reviewTask.ydprice);
        await manager.update('merchants', merchantId, { silver: newSilver });

        // 记录财务流水
        await this.financeRecordsService.create({
          userId: merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.REVIEW_TASK_CANCEL_REFUND,
          amount: Number(reviewTask.ydprice),
          balanceAfter: newSilver,
          memo: `取消追评任务退回银锭:${reviewTask.ydprice},任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 更新状态
      reviewTask.state = ReviewTaskStatus.CANCELLED;
      reviewTask.remarks = dto.reason || '商家取消';
      reviewTask.confirmTime = new Date();

      return await manager.save(reviewTask);
    });
  }

  /**
   * 买手提交追评截图
   */
  async submitReview(
    userId: string,
    dto: SubmitReviewDto,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: dto.reviewTaskId, userId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.APPROVED) {
      throw new BadRequestException('任务状态不正确，无法提交追评');
    }

    if (!dto.images || dto.images.length === 0) {
      throw new BadRequestException('请上传追评截图');
    }

    // 更新任务
    reviewTask.img = JSON.stringify(dto.images);
    reviewTask.uploadTime = new Date();
    reviewTask.state = ReviewTaskStatus.UPLOADED;

    return await this.reviewTaskRepo.save(reviewTask);
  }

  /**
   * 买手拒绝追评
   */
  async rejectByBuyer(
    userId: string,
    dto: RejectReviewDto,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: dto.reviewTaskId, userId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.APPROVED) {
      throw new BadRequestException('任务状态不正确，无法拒绝');
    }

    const merchant = await this.merchantsService.findOne(reviewTask.merchantId);
    if (!merchant) {
      throw new NotFoundException('商家不存在');
    }

    // 使用事务执行拒绝并退款给商家
    return await this.dataSource.transaction(async (manager) => {
      // 退还押金给商家
      if (Number(reviewTask.yjprice) > 0) {
        const newBalance =
          Number(merchant.balance) + Number(reviewTask.yjprice);
        await manager.update('merchants', reviewTask.merchantId, {
          balance: newBalance,
        });

        await this.financeRecordsService.create({
          userId: reviewTask.merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.BALANCE,
          financeType: FinanceType.REVIEW_TASK_REJECT_REFUND,
          amount: Number(reviewTask.yjprice),
          balanceAfter: newBalance,
          memo: `买手拒绝追评退回押金:${reviewTask.yjprice},任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 退还银锭给商家
      if (Number(reviewTask.ydprice) > 0) {
        const newSilver =
          Number(merchant.silver || 0) + Number(reviewTask.ydprice);
        await manager.update('merchants', reviewTask.merchantId, {
          silver: newSilver,
        });

        await this.financeRecordsService.create({
          userId: reviewTask.merchantId,
          userType: FinanceUserType.MERCHANT,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.REVIEW_TASK_REJECT_REFUND,
          amount: Number(reviewTask.ydprice),
          balanceAfter: newSilver,
          memo: `买手拒绝追评退回银锭:${reviewTask.ydprice},任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 更新状态
      reviewTask.state = ReviewTaskStatus.BUYER_REJECTED;
      reviewTask.remarks = dto.reason || '买手拒绝';
      reviewTask.confirmTime = new Date();

      return await manager.save(reviewTask);
    });
  }

  /**
   * 商家确认追评完成
   * 发放佣金给买手，标记原订单已追评
   */
  async confirmReview(
    merchantId: string,
    dto: ConfirmReviewDto,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: dto.reviewTaskId, merchantId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.UPLOADED) {
      throw new BadRequestException('状态不正确，不允许操作！');
    }

    const user = await this.usersService.findOne(reviewTask.userId);
    if (!user) {
      throw new NotFoundException('买手不存在');
    }

    // 使用事务执行确认
    return await this.dataSource.transaction(async (manager) => {
      // 给买手发放佣金 (银锭)
      const commission = Number(reviewTask.userMoney);
      if (commission > 0) {
        const newSilver = Number(user.silver || 0) + commission;
        await manager.update('users', reviewTask.userId, { silver: newSilver });

        await this.financeRecordsService.create({
          userId: reviewTask.userId,
          userType: FinanceUserType.BUYER,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.REVIEW_TASK_COMMISSION,
          amount: commission,
          balanceAfter: newSilver,
          memo: `追评任务完成获得佣金:${commission},任务${reviewTask.taskNumber}`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 标记原订单已追评
      await manager.update('orders', reviewTask.userTaskId, { isZp: true });

      // 更新追评任务状态
      reviewTask.state = ReviewTaskStatus.COMPLETED;
      reviewTask.confirmTime = new Date();

      return await manager.save(reviewTask);
    });
  }

  /**
   * 管理员审核追评
   * state: 2=通过(通知买手), 7=拒绝
   */
  async adminExamine(
    reviewTaskId: string,
    state: number,
    remarks?: string,
  ): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: reviewTaskId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.PAID) {
      throw new BadRequestException('只能审核已支付的追评任务');
    }

    reviewTask.state = state;
    reviewTask.remarks = remarks || '';
    reviewTask.examineTime = new Date();

    const savedTask = await this.reviewTaskRepo.save(reviewTask);

    // 如果审核通过，发送消息通知买手
    if (state === ReviewTaskStatus.APPROVED) {
      try {
        await this.messagesService.sendSystemMessage(
          reviewTask.userId,
          1, // MessageUserType.BUYER
          '追评任务',
          `您有新的追评任务！请查看。任务编号：${reviewTask.taskNumber}`,
          3, // MessageType.TASK
          reviewTask.id,
          'review_task',
        );
      } catch (e) {
        // 消息发送失败不影响主流程
        console.error('发送追评通知失败:', e);
      }
    }

    return savedTask;
  }

  /**
   * 管理员批量审核
   */
  async adminBatchExamine(
    reviewTaskIds: string[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of reviewTaskIds) {
      try {
        await this.adminExamine(id, ReviewTaskStatus.APPROVED);
        success++;
      } catch (e) {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * 管理员返款
   * 直接将佣金发放给买手
   */
  async adminRefund(reviewTaskId: string): Promise<ReviewTask> {
    const reviewTask = await this.reviewTaskRepo.findOne({
      where: { id: reviewTaskId },
    });

    if (!reviewTask) {
      throw new NotFoundException('追评任务不存在');
    }

    if (reviewTask.state !== ReviewTaskStatus.UPLOADED) {
      throw new BadRequestException('只能对已上传的追评任务进行返款');
    }

    const user = await this.usersService.findOne(reviewTask.userId);
    if (!user) {
      throw new NotFoundException('买手不存在');
    }

    return await this.dataSource.transaction(async (manager) => {
      const commission = Number(reviewTask.userMoney);
      if (commission > 0) {
        const newSilver = Number(user.silver || 0) + commission;
        await manager.update('users', reviewTask.userId, { silver: newSilver });

        await this.financeRecordsService.create({
          userId: reviewTask.userId,
          userType: FinanceUserType.BUYER,
          moneyType: FinanceMoneyType.SILVER,
          financeType: FinanceType.BUYER_TASK_COMMISSION,
          amount: commission,
          balanceAfter: newSilver,
          memo: `银锭:${commission},追评任务${reviewTask.taskNumber}返款`,
          relatedId: reviewTask.id,
          relatedType: 'review_task',
        });
      }

      // 标记原订单已追评
      await manager.update('orders', reviewTask.userTaskId, { isZp: true });

      reviewTask.state = ReviewTaskStatus.COMPLETED;
      reviewTask.confirmTime = new Date();

      return await manager.save(reviewTask);
    });
  }

  /**
   * 管理员批量返款
   */
  async adminBatchRefund(
    reviewTaskIds: string[],
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of reviewTaskIds) {
      try {
        await this.adminRefund(id);
        success++;
      } catch (e) {
        failed++;
      }
    }

    return { success, failed };
  }

  // ============ 查询方法 ============

  /**
   * 获取商家的追评任务列表
   */
  async findByMerchant(
    merchantId: string,
    filter: ReviewTaskFilterDto,
  ): Promise<{
    list: ReviewTask[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 15;

    const queryBuilder = this.reviewTaskRepo
      .createQueryBuilder('rt')
      .where('rt.merchantId = :merchantId', { merchantId });

    if (filter.state !== undefined) {
      queryBuilder.andWhere('rt.state = :state', { state: filter.state });
    }
    if (filter.taskNumber) {
      queryBuilder.andWhere('rt.taskNumber LIKE :taskNumber', {
        taskNumber: `%${filter.taskNumber}%`,
      });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .orderBy('rt.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { list, total, page, limit };
  }

  /**
   * 获取买手的追评任务列表
   */
  async findByUser(
    userId: string,
    filter: ReviewTaskFilterDto,
  ): Promise<{
    list: ReviewTask[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 15;

    const queryBuilder = this.reviewTaskRepo
      .createQueryBuilder('rt')
      .where('rt.userId = :userId', { userId });

    if (filter.state !== undefined) {
      queryBuilder.andWhere('rt.state = :state', { state: filter.state });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .orderBy('rt.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { list, total, page, limit };
  }

  /**
   * 获取追评任务详情
   */
  async findOne(id: string): Promise<ReviewTask | null> {
    return this.reviewTaskRepo.findOne({ where: { id } });
  }

  /**
   * 获取追评任务的好评内容
   */
  async findPraises(reviewTaskId: string): Promise<ReviewTaskPraise[]> {
    return this.reviewTaskPraiseRepo.find({ where: { reviewTaskId } });
  }

  /**
   * 获取追评任务详情（含好评内容）
   */
  async findOneWithPraises(
    id: string,
  ): Promise<{ task: ReviewTask; praises: ReviewTaskPraise[] } | null> {
    const task = await this.findOne(id);
    if (!task) return null;

    const praises = await this.findPraises(id);
    return { task, praises };
  }

  /**
   * 管理员获取追评任务列表
   */
  async findAll(filter: ReviewTaskFilterDto): Promise<{
    list: ReviewTask[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page || 1;
    const limit = filter.limit || 15;

    const queryBuilder = this.reviewTaskRepo.createQueryBuilder('rt');

    if (filter.state !== undefined) {
      queryBuilder.andWhere('rt.state = :state', { state: filter.state });
    }
    if (filter.taskNumber) {
      queryBuilder.andWhere('rt.taskNumber LIKE :taskNumber', {
        taskNumber: `%${filter.taskNumber}%`,
      });
    }
    if (filter.startDate) {
      queryBuilder.andWhere('rt.createdAt >= :startDate', {
        startDate: new Date(filter.startDate),
      });
    }
    if (filter.endDate) {
      queryBuilder.andWhere('rt.createdAt <= :endDate', {
        endDate: new Date(filter.endDate),
      });
    }

    const total = await queryBuilder.getCount();
    const list = await queryBuilder
      .orderBy('rt.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { list, total, page, limit };
  }

  /**
   * 获取统计数据
   */
  async getStats(merchantId?: string): Promise<{
    unpaid: number;
    paid: number;
    approved: number;
    uploaded: number;
    completed: number;
    cancelled: number;
    rejected: number;
  }> {
    const baseWhere = merchantId ? { merchantId } : {};

    const [unpaid, paid, approved, uploaded, completed, cancelled, rejected] =
      await Promise.all([
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.UNPAID },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.PAID },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.APPROVED },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.UPLOADED },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.COMPLETED },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.CANCELLED },
        }),
        this.reviewTaskRepo.count({
          where: { ...baseWhere, state: ReviewTaskStatus.REJECTED },
        }),
      ]);

    return { unpaid, paid, approved, uploaded, completed, cancelled, rejected };
  }
}
