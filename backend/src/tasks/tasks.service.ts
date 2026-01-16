import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as XLSX from 'xlsx';
import {
  Task,
  TaskStatus,
  TaskType,
  CreateTaskDto,
  TaskFilterDto,
} from './task.entity';
import { TaskGoods, TaskKeyword } from '../task-goods/task-goods.entity';
import { MerchantsService } from '../merchants/merchants.service';
import { MessagesService } from '../messages/messages.service';
import { MessageUserType, MessageType } from '../messages/message.entity';

// P1-5: Type definitions for task creation
interface TaskGoodsDto {
  id?: string;
  goodsId?: string;
  name: string;
  image?: string;
  link?: string;
  specName?: string;
  specValue?: string;
  price: number;
  quantity: number;
  keyword?: string;
  orderSpecs?: Record<string, unknown> | Array<{ specName: string; specValue: string; quantity: number }>;
  verifyCode?: string;
  keywords?: TaskKeywordDto[];
  filterSettings?: FilterSettings;
}

interface TaskKeywordDto {
  keyword: string;
  filterSettings?: FilterSettings;
  advancedSettings?: AdvancedSettings;
}

interface FilterSettings {
  sort?: string;
  province?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface AdvancedSettings {
  compareKeyword?: string;
  backupKeyword?: string;
}

interface OrderPraiseConfig {
  type: 'none' | 'text' | 'image' | 'video';
  text?: string;
  images?: string[];
  video?: string;
}

interface CreateTaskPayDto {
  taskType: number;
  title: string;
  count: number;
  goodsPrice: number;
  goodsList?: TaskGoodsDto[];
  isFreeShipping?: number;
  isPraise?: boolean;
  praiseType?: string;
  orderPraiseConfigs?: OrderPraiseConfig[];
  isTimingPublish?: boolean;
  isTimingPay?: boolean;
  isCycleTime?: boolean;
  cycleTime?: number;
  publishTime?: string | Date;
  timingPayTime?: string | Date;
  needCompare?: boolean;
  keyword?: string;
  needBrowseReviews?: boolean;
  needBrowseQA?: boolean;
  praiseImgList?: string[][];
  praiseVideoList?: string[];
  [key: string]: unknown;
}

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskGoods)
    private taskGoodsRepository: Repository<TaskGoods>,
    @InjectRepository(TaskKeyword)
    private taskKeywordRepository: Repository<TaskKeyword>,
    @Inject(forwardRef(() => MerchantsService))
    private merchantsService: MerchantsService,
    @Inject(forwardRef(() => MessagesService))
    private messagesService: MessagesService,
    private dataSource: DataSource,
  ) { }

  // 初始化时插入种子数据
  async onModuleInit() {
    const count = await this.tasksRepository.count();
    if (count === 0) {
      await this.seedTasks();
    }
  }

  /**
   * 获取货比关键词
   * 规则：
   * 1. 如果主商品的第一个关键词有设置 compareKeyword，使用它
   * 2. 否则，使用主商品的第一个搜索关键词
   * 3. 多商品时，只显示主商品(第一个商品)的货比关键词
   */
  private getCompareKeyword(dto: CreateTaskDto | CreateTaskPayDto): string {
    if (!dto.needCompare) {
      return '';
    }

    // 优先从主商品的关键词高级设置中获取货比关键词
    if (dto.goodsList && dto.goodsList.length > 0) {
      const mainGoods = dto.goodsList[0]; // 主商品是第一个商品

      // 检查主商品的第一个关键词是否有设置 compareKeyword
      if (mainGoods.keywords && mainGoods.keywords.length > 0) {
        const firstKeyword = mainGoods.keywords[0];
        if (firstKeyword.advancedSettings?.compareKeyword) {
          return firstKeyword.advancedSettings.compareKeyword;
        }
        // 没有设置 compareKeyword，使用第一个搜索关键词
        if (firstKeyword.keyword) {
          return firstKeyword.keyword;
        }
      }

      // 兼容旧版单关键词模式
      if (mainGoods.keyword) {
        return mainGoods.keyword;
      }
    }

    // 兼容旧版单商品模式
    if (dto.keyword) {
      return dto.keyword;
    }

    return '';
  }

  /**
   * 获取副关键词/备用关键词
   * 规则：
   * 1. 从主商品的第一个关键词的高级设置中获取 backupKeyword
   */
  private getBackupKeyword(dto: CreateTaskDto | CreateTaskPayDto): string {
    if (dto.goodsList && dto.goodsList.length > 0) {
      const mainGoods = dto.goodsList[0]; // 主商品
      if (mainGoods.keywords && mainGoods.keywords.length > 0) {
        return mainGoods.keywords[0].advancedSettings?.backupKeyword || '';
      }
    }
    return '';
  }

  private async seedTasks() {
    // Mock data adapted to new schema
    const seedTasks: Partial<Task>[] = [
      {
        taskNumber: 'T20241230001',
        title: '淘宝浏览收藏任务',
        taskType: TaskType.TAOBAO,
        shopName: '旗舰店A',
        url: 'https://taobao.com/item/1',
        mainImage: '',
        keyword: '夏季连衣裙',
        goodsPrice: 128.0,
        baseServiceFee: 5.0,
        count: 50,
        claimedCount: 32,
        status: TaskStatus.ACTIVE,
        remark: '需要实名认证的淘宝账号',
        totalCommission: 5.0,
        totalDeposit: 128.0 + 10,
      },
      {
        taskNumber: 'T20241230002',
        title: '京东下单立返任务',
        taskType: TaskType.JD,
        shopName: '京东自营',
        url: 'https://jd.com/item/2',
        mainImage: '',
        keyword: '空气净化器',
        goodsPrice: 299.0,
        baseServiceFee: 15.0,
        count: 30,
        claimedCount: 18,
        status: TaskStatus.ACTIVE,
        remark: '需要京东Plus会员',
        totalCommission: 15.0,
        totalDeposit: 299 + 10,
      },
      {
        taskNumber: 'T20241230003',
        title: '拼多多助力任务',
        taskType: TaskType.PDD,
        shopName: '拼多多店铺',
        url: 'https://pdd.com/item/3',
        mainImage: '',
        keyword: '日用品',
        goodsPrice: 50.0,
        baseServiceFee: 3.0,
        count: 100,
        claimedCount: 45,
        status: TaskStatus.ACTIVE,
        remark: '需要新用户账号',
        totalCommission: 3.0,
        totalDeposit: 60,
      },
    ];

    for (const taskData of seedTasks) {
      const task = this.tasksRepository.create(taskData);
      await this.tasksRepository.save(task);
    }
    console.log('Seed tasks inserted successfully');
  }

  async findAll(filter?: TaskFilterDto): Promise<any[]> {
    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.ACTIVE });

    if (filter) {
      if (filter.taskType) {
        queryBuilder.andWhere('task.taskType = :taskType', {
          taskType: filter.taskType,
        });
      }
      if (filter.search) {
        queryBuilder.andWhere(
          '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.keyword) LIKE LOWER(:search))',
          { search: `%${filter.search}%` },
        );
      }
      if (filter.minCommission !== undefined) {
        queryBuilder.andWhere('task.totalCommission >= :minCommission', {
          minCommission: filter.minCommission,
        });
      }
      if (filter.maxCommission !== undefined) {
        queryBuilder.andWhere('task.totalCommission <= :maxCommission', {
          maxCommission: filter.maxCommission,
        });
      }
    }

    const tasks = await queryBuilder.orderBy('task.createdAt', 'DESC').getMany();

    // 转换任务数据为前端期望的格式
    return tasks.map(task => ({
      ...task,
      randNum: task.taskNumber, // 任务编号显示
      sellerName: task.shopName || '未知商家', // 商家名称
      mobile: '', // 商家电话（如需要可从merchant表关联）
      totalPrice: Number(task.goodsPrice) || 0, // 垫付资金（商品价格）
      userReward: task.count > 0 ? Number((task.totalCommission / task.count).toFixed(2)) : 0, // 单笔佣金
      userDivided: Number(task.userDivided) || 0, // 买手分成总额
      num: task.count || 1, // 任务单数
      progress: '0', // 进度百分比（前端会自己计算）
    }));
  }

  async findByMerchant(
    merchantId: string,
    filter?: TaskFilterDto,
  ): Promise<Task[]> {
    const queryBuilder = this.tasksRepository
      .createQueryBuilder('task')
      .where('task.merchantId = :merchantId', { merchantId });

    if (filter?.status !== undefined) {
      queryBuilder.andWhere('task.status = :status', { status: filter.status });
    }
    if (filter?.taskType) {
      queryBuilder.andWhere('task.taskType = :taskType', {
        taskType: filter.taskType,
      });
    }

    return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
  }

  async findByIds(ids: string[]): Promise<Task[]> {
    if (!ids || ids.length === 0) return [];
    return this.tasksRepository
      .createQueryBuilder('task')
      .where('task.id IN (:...ids)', { ids })
      .getMany();
  }

  async findOne(id: string): Promise<Task | null> {
    return this.tasksRepository.findOne({ where: { id } });
  }

  /**
   * 获取任务详情（包含多商品和关键词）
   * 用于详情页展示完整任务信息
   */
  async findOneWithDetails(id: string): Promise<{
    task: Task;
    goodsList: TaskGoods[];
    keywords: TaskKeyword[];
  } | null> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['merchant'], // 加载关联的商家信息
    });
    if (!task) {
      return null;
    }

    // 获取关联的多商品
    const goodsList = await this.taskGoodsRepository.find({
      where: { taskId: id },
      order: { createdAt: 'ASC' },
    });

    // 获取关联的关键词
    const keywords = await this.taskKeywordRepository.find({
      where: { taskId: id },
      order: { createdAt: 'ASC' },
    });

    return { task, goodsList, keywords };
  }

  /**
   * 创建任务并完成支付
   * 使用事务确保原子性：扣款失败则回滚任务创建
   */
  /**
   * 创建任务并完成支付 (Merchant Portal Standard)
   * 严格遵循原版扣费逻辑：押金 + 佣金 + 增值费
   */
  async createAndPay(dto: any, merchantId: string): Promise<Task> {
    // TODO: P1-5 类型优化 - 需要重新设计 CreateTaskPayDto 类型
    // 当前 CreateTaskDto 和 CreateTaskPayDto 类型不兼容，暂时使用 any
    // 后续需要：1) 统一两个 DTO 的字段定义 2) 或使用 Partial<CreateTaskDto> + 额外字段
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 获取商户信息
      const merchant = await this.merchantsService.findOne(merchantId);
      if (!merchant) throw new BadRequestException('商户不存在');

      // 1.1 VIP Check
      if (!merchant.vip) throw new BadRequestException('非VIP无法发布任务');
      if (merchant.vipExpireAt && new Date(merchant.vipExpireAt) < new Date()) {
        throw new BadRequestException('VIP已过期');
      }

      // ========== P0 FIX: 完整的费用计算逻辑 ==========
      // 2.1 基础数值
      const count = Number(dto.count) || 1;

      // 计算商品价格：优先从 goodsList 计算，其次使用 dto.goodsPrice
      let goodsPrice = Number(dto.goodsPrice) || 0;
      if (dto.goodsList && dto.goodsList.length > 0) {
        // 从多商品列表计算总价（每单的商品总价）
        goodsPrice = dto.goodsList.reduce((sum: number, goods: TaskGoodsDto) => {
          const price = Number(goods.price) || 0;
          const quantity = Number(goods.quantity) || 1;
          return sum + (price * quantity);
        }, 0);
      }

      // 2.2 押金部分 (Principal + Postage + Margin)
      const goodsMoney = goodsPrice * count; // 商品本金总额
      const isFreeShipping = dto.isFreeShipping !== 2; // 1或undefined=包邮, 2=不包邮
      const postagePerOrder = isFreeShipping ? 0 : 10;
      const totalPostage = postagePerOrder * count;
      const marginPerOrder = isFreeShipping ? 0 : 10;
      const totalMargin = marginPerOrder * count;
      const totalDeposit = goodsMoney + totalPostage + totalMargin;

      // 2.3 佣金计算 - 完整版本（包含所有增值服务费用）
      const baseFeePerOrder = 5.0; // 基础服务费固定5元/单

      // 好评费用 - 新版：支持每单独立配置
      let totalPraiseFee = 0;
      if (dto.orderPraiseConfigs && Array.isArray(dto.orderPraiseConfigs) && dto.orderPraiseConfigs.length > 0) {
        // 新版：根据每单的好评类型分别计算
        dto.orderPraiseConfigs.forEach((config: OrderPraiseConfig) => {
          if (config.type === 'text') totalPraiseFee += 2.0;
          else if (config.type === 'image') totalPraiseFee += 4.0;
          else if (config.type === 'video') totalPraiseFee += 10.0;
        });
      } else {
        // 旧版兼容：统一好评类型
        let praiseFeePerOrder = 0;
        if (dto.isPraise) {
          if (dto.praiseType === 'text') praiseFeePerOrder = 2.0;
          else if (dto.praiseType === 'image') praiseFeePerOrder = 4.0;
          else if (dto.praiseType === 'video') praiseFeePerOrder = 10.0;
        }
        totalPraiseFee = praiseFeePerOrder * count;
      }

      // 定时发布费
      const timingPublishFeePerOrder = dto.isTimingPublish ? 1.0 : 0;

      // 定时付款费
      const timingPayFeePerOrder = dto.isTimingPay ? 1.0 : 0;

      // 循环任务费
      const cycleFeePerOrder = (dto.isCycleTime && dto.cycleTime && dto.cycleTime > 0) ? (dto.cycleTime * 1) : 0;

      // 额外悬赏
      const addRewardPerOrder = Number(dto.addReward) || 0;

      // 多商品费用：每多一个商品加1元
      const goodsMoreFeePerOrder = (dto.goodsList && dto.goodsList.length > 1) ? (dto.goodsList.length - 1) * 1 : 0;

      // 隔天任务费
      const nextDayFeePerOrder = dto.isNextDay ? 0.5 : 0;

      // 快速返款费 (0.6%费率)
      const fastRefundFeePerOrder = dto.fastRefund ? (goodsPrice * 0.006) : 0;

      // 单笔佣金 = 基础 + 好评 + 定时发布 + 定时付款 + 循环 + 悬赏 + 多商品 + 隔天 + 快返
      const commissionPerOrder =
        baseFeePerOrder +
        timingPublishFeePerOrder +
        timingPayFeePerOrder +
        cycleFeePerOrder +
        addRewardPerOrder +
        goodsMoreFeePerOrder +
        nextDayFeePerOrder +
        fastRefundFeePerOrder;

      // 总佣金 = 单笔佣金 * 单数 + 总好评费用
      const totalCommission = (commissionPerOrder * count) + totalPraiseFee;

      // 买手分成佣金计算
      const dividedRate = 0.6; // 60%分成给买手
      const dividePrice = baseFeePerOrder * count; // 分成基数
      const userDividedTotal = Math.round(dividePrice * dividedRate * 100) / 100;

      // 2.4 检查余额并扣款
      const useReward = dto.useReward !== false; // 默认启用混合支付
      let balanceDeduct = 0; // 从余额扣除
      let silverDeductForDeposit = 0; // 从银锭扣除（代付押金）
      let silverDeductForCommission = 0; // 从银锭扣除（佣金）

      // 检查银锭是否足够支付佣金
      if (merchant.silver < totalCommission) {
        throw new BadRequestException(
          `银锭不足，需 ${totalCommission.toFixed(2)}锭，当前 ${merchant.silver.toFixed(2)}锭`,
        );
      }
      silverDeductForCommission = totalCommission;

      // 检查余额是否足够支付押金
      if (merchant.balance >= totalDeposit) {
        balanceDeduct = totalDeposit;
      } else if (useReward) {
        balanceDeduct = Number(merchant.balance);
        const shortfall = totalDeposit - balanceDeduct;
        const remainingSilver = Number(merchant.silver) - silverDeductForCommission;
        if (remainingSilver < shortfall) {
          throw new BadRequestException(
            `余额+银锭不足，押金需 ${totalDeposit.toFixed(2)}元，余额 ${merchant.balance.toFixed(2)}元，银锭代付差额 ${shortfall.toFixed(2)}元 但仅剩 ${remainingSilver.toFixed(2)}锭`,
          );
        }
        silverDeductForDeposit = shortfall;
      } else {
        throw new BadRequestException(
          `余额不足，需 ${totalDeposit.toFixed(2)}元，当前 ${merchant.balance.toFixed(2)}元`,
        );
      }

      const totalSilverDeduct = silverDeductForCommission + silverDeductForDeposit;

      // 执行扣款
      if (balanceDeduct > 0) {
        await this.merchantsService.freezeBalance(merchantId, balanceDeduct);
      }
      await this.merchantsService.deductSilver(
        merchantId,
        totalSilverDeduct,
        silverDeductForDeposit > 0
          ? `发布任务: ${dto.title}（佣金${silverDeductForCommission.toFixed(2)}+代付押金${silverDeductForDeposit.toFixed(2)}）`
          : `发布任务: ${dto.title}`,
      );

      // 4. 创建任务记录
      // P0 FIX: 从 goodsList 提取主商品信息
      const mainGoods = dto.goodsList && dto.goodsList.length > 0 ? dto.goodsList[0] : null;
      const mainKeyword = mainGoods?.keywords && mainGoods.keywords.length > 0 ? mainGoods.keywords[0].keyword : '';

      // 生成任务编号 (T + 日期YYYYMMDD + 序号)
      const taskNumber = await this.generateTaskNumber();

      const newTask = this.tasksRepository.create({
        merchantId,
        taskNumber,
        status: TaskStatus.ACTIVE,

        // 基础信息 - P0 FIX: 优先从 goodsList 提取，其次使用 dto 字段
        title: dto.title || mainGoods?.name || '',
        taskType: dto.taskType || 1,
        url: dto.url || mainGoods?.link || '',
        mainImage: dto.mainImage || mainGoods?.image || '',
        keyword: dto.keyword || mainKeyword || '',
        itemToken: dto.taoWord || dto.itemToken || '',
        qrCode: dto.qrCodeImage || '',
        count: count,

        // 费用详细信息 - 使用计算出的值
        goodsPrice,  // 单笔商品价格（元）
        goodsMoney,  // 商品本金总额 = goodsPrice * count
        shippingFee: totalPostage,  // 邮费
        margin: totalMargin,  // 保证金
        totalDeposit,  // 总押金 = goodsMoney + shippingFee + margin
        totalCommission,  // 总佣金（包含所有增值服务费用）
        baseServiceFee: baseFeePerOrder,  // 基础服务费单价 5元/单
        userDivided: userDividedTotal,  // 买手分成佣金
        extraReward: addRewardPerOrder,  // 额外悬赏单价
        extraCommission: addRewardPerOrder,  // 额外佣金（同加赏）

        // Value Added Flags - 智能检测好评内容
        ...(() => {
          const hasPraiseText = dto.praiseList && Array.isArray(dto.praiseList) && dto.praiseList.some(t => t && t.trim().length > 0);
          const hasPraiseImg = dto.praiseImgList && Array.isArray(dto.praiseImgList) && dto.praiseImgList.some(arr => arr && arr.length > 0);
          const hasPraiseVideo = dto.praiseVideoList && Array.isArray(dto.praiseVideoList) && dto.praiseVideoList.some(v => v && v.trim().length > 0);

          let actualPraiseType = dto.praiseType || 'none';
          if (hasPraiseVideo) actualPraiseType = 'video';
          else if (hasPraiseImg) actualPraiseType = 'image';
          else if (hasPraiseText) actualPraiseType = 'text';

          const actualIsPraise = actualPraiseType !== 'none';

          return {
            isPraise: actualIsPraise,
            praiseType: actualPraiseType,
            praiseList: hasPraiseText ? JSON.stringify(dto.praiseList) : '[]',
            isImgPraise: actualPraiseType === 'image' || hasPraiseImg,
            praiseImgList: hasPraiseImg ? JSON.stringify(dto.praiseImgList) : '[]',
            isVideoPraise: actualPraiseType === 'video' || hasPraiseVideo,
            praiseVideoList: hasPraiseVideo ? JSON.stringify(dto.praiseVideoList) : '[]',
            praiseFee: totalPraiseFee / count,  // 平均每单的好评费用
            // 新版：保存每单独立的好评配置
            orderPraiseConfigs: dto.orderPraiseConfigs || null,
          };
        })(),

        // 定时服务
        publishTime: dto.publishTime ? new Date(dto.publishTime) : undefined,
        isTimingPay: !!dto.isTimingPay,
        timingTime: dto.timingPayTime ? new Date(dto.timingPayTime) : undefined,
        timingPayFee: timingPayFeePerOrder,  // 使用计算出的定时付款费
        timingPublishFee: timingPublishFeePerOrder,  // 使用计算出的定时发布费

        // 周期设置
        cycle: dto.cycleTime || 0,

        // 浏览行为设置
        needCompare: !!dto.needCompare,
        compareKeyword: this.getCompareKeyword(dto),
        backupKeyword: this.getBackupKeyword(dto),
        needFavorite: !!dto.needFavorite,
        needFollow: !!dto.needFollow,
        needAddCart: !!dto.needAddCart,
        needContactCS: !!dto.needContactCS,
        contactCSContent: dto.contactCSContent || '',
        compareCount: dto.compareCount || 3,
        needRandomBrowse: !!dto.needRandomBrowse,
        needBrowseReviews: !!dto.needBrowseReviews,
        needBrowseQA: !!dto.needBrowseQA,

        // 浏览时长设置
        totalBrowseMinutes: dto.totalBrowseMinutes || 15,
        compareBrowseMinutes: dto.compareBrowseMinutes || 3,
        mainBrowseMinutes: dto.mainBrowseMinutes || 8,
        subBrowseMinutes: dto.subBrowseMinutes || 2,
        hasSubProduct: dto.goodsList && dto.goodsList.length > 1,  // 根据商品数量自动判断

        // 特殊任务类型
        isRepay: !!dto.isRepay,
        isNextDay: !!dto.isNextDay,
        nextDayFee: nextDayFeePerOrder,  // 使用计算出的隔天任务费

        // P0 Fix: 返款方式和订单设置
        terminal: dto.terminal !== undefined ? dto.terminal : 2,  // 默认本立佣货(2)
        memo: dto.memo || '',
        unionInterval: dto.orderInterval || 0,
        weight: dto.weight || 0,
        fastRefund: !!dto.fastRefund,
        orderInterval: dto.orderInterval || 0,

        // 口令验证
        isPasswordEnabled: !!dto.isPasswordEnabled,
        checkPassword: dto.checkPassword || '',

        // 多商品费用
        goodsMoreFee: goodsMoreFeePerOrder,  // 使用计算出的多商品费用

        // 店铺信息
        shopId: dto.shopId || null,
        shopName: dto.shopName || '',

        // 包邮设置
        isFreeShipping: dto.isFreeShipping !== 2,  // 1或undefined=包邮, 2=不包邮

        claimedCount: 0,
        completedCount: 0,
      });

      const savedTask = await queryRunner.manager.save(newTask);
      const task = Array.isArray(savedTask) ? savedTask[0] : savedTask;

      // 保存多商品列表 (如果有)
      if (dto.goodsList && dto.goodsList.length > 0) {
        const taskGoodsList = dto.goodsList.map((goods: TaskGoodsDto) => {
          return this.taskGoodsRepository.create({
            taskId: task.id,
            goodsId: goods.goodsId || undefined,
            name: goods.name,
            pcImg: goods.image || undefined,
            link: goods.link || undefined,
            specName: goods.specName || undefined,
            specValue: goods.specValue || undefined,
            price: Number(goods.price) || 0,
            num: goods.quantity || 1,
            totalPrice: (Number(goods.price) || 0) * (goods.quantity || 1),
            orderSpecs: goods.orderSpecs ? JSON.stringify(goods.orderSpecs) : undefined,
            verifyCode: goods.verifyCode || undefined,
          });
        });
        await queryRunner.manager.save(TaskGoods, taskGoodsList);

        // 保存多关键词列表 (从商品的 keywords 字段中提取)
        const taskKeywordsList: TaskKeyword[] = [];
        for (const goods of dto.goodsList) {
          if (goods.keywords && goods.keywords.length > 0) {
            for (const kw of goods.keywords) {
              // 筛选设置优先从关键词级别获取，其次从商品级别获取
              const filterSettings = kw.filterSettings || goods.filterSettings || {};
              // 获取高级设置
              const advancedSettings = kw.advancedSettings || {};
              const taskKeyword = this.taskKeywordRepository.create({
                taskId: task.id,
                taskGoodsId: goods.id || undefined,
                keyword: kw.keyword,
                terminal: 1,  // 默认手机端
                sort: filterSettings.sort || undefined,
                province: filterSettings.province || undefined,
                minPrice: filterSettings.minPrice || 0,
                maxPrice: filterSettings.maxPrice || 0,
                // P0 Fix: 保存高级设置 (货比关键词 & 备用关键词)
                compareKeyword: advancedSettings.compareKeyword || undefined,
                backupKeyword: advancedSettings.backupKeyword || undefined,
              });
              taskKeywordsList.push(taskKeyword);
            }
          }
        }
        if (taskKeywordsList.length > 0) {
          await queryRunner.manager.save(TaskKeyword, taskKeywordsList);
        }
      }

      await queryRunner.commitTransaction();

      // 发送消息通知商家：任务发布成功
      try {
        const task = Array.isArray(savedTask) ? savedTask[0] : savedTask;
        if (task && task.id) {
          await this.messagesService.sendTaskMessage(
            merchantId,
            MessageUserType.MERCHANT,
            task.id,
            '任务发布成功',
            `您的任务「${dto.title}」已发布成功，共${count}单，等待买手接单。`,
          );
        }
      } catch (e) {
        // 消息发送失败不影响主流程
      }

      return Array.isArray(savedTask) ? savedTask[0] : savedTask;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 简化版创建（不含支付，保留向后兼容）
  async create(
    createTaskDto: CreateTaskDto,
    merchantId?: string,
  ): Promise<Task> {
    const goodsMoney = createTaskDto.goodsPrice * createTaskDto.count;
    const baseServiceFee = 5.0;
    const deposit = goodsMoney + 10 * createTaskDto.count;

    const newTask = this.tasksRepository.create({
      taskNumber: 'T' + Date.now(),
      ...createTaskDto,
      goodsMoney,
      baseServiceFee,
      totalDeposit: deposit,
      totalCommission: baseServiceFee,
      claimedCount: 0,
      status: TaskStatus.PENDING_PAY,
      merchantId: merchantId,
    } as any);
    const savedTask = await this.tasksRepository.save(newTask);
    return Array.isArray(savedTask) ? savedTask[0] : savedTask;
  }

  async claim(
    taskId: string,
    userId: string,
    buynoId: string,
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    const result = await this.tasksRepository
      .createQueryBuilder()
      .update(Task)
      .set({ claimedCount: () => 'claimedCount + 1' })
      .where('id = :id', { id: taskId })
      .andWhere('status = :status', { status: TaskStatus.ACTIVE })
      .andWhere('claimedCount < count')
      .execute();

    if (result.affected === 0) {
      const task = await this.tasksRepository.findOne({
        where: { id: taskId },
      });
      if (!task) throw new NotFoundException('任务不存在');
      if (task.status !== TaskStatus.ACTIVE)
        throw new BadRequestException('任务已结束');
      if (task.claimedCount >= task.count)
        throw new BadRequestException('任务名额已满');
      throw new BadRequestException('任务领取失败，请重试');
    }

    const orderId = 'order-' + Date.now();

    return {
      success: true,
      message: '任务领取成功',
      orderId,
    };
  }

  /**
   * 取消任务（商家）
   * 只有未被领取的任务才能取消
   */
  async cancelTask(
    taskId: string,
    merchantId: string,
  ): Promise<{ success: boolean; message: string }> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['merchant'],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 验证是否是任务所有者
    if (task.merchantId !== merchantId) {
      throw new BadRequestException('无权取消此任务');
    }

    // 只有进行中且未被领取的任务才能取消
    if (task.status !== TaskStatus.ACTIVE) {
      throw new BadRequestException('只有进行中的任务才能取消');
    }

    if (task.claimedCount > 0) {
      throw new BadRequestException('任务已被领取，无法取消');
    }

    // 使用事务确保原子性
    await this.dataSource.transaction(async (manager) => {
      // 更新任务状态为已取消
      await manager.update(Task, taskId, {
        status: TaskStatus.CANCELLED,
      });

      // 解冻并返还资金到商家账户
      const refundAmount = Number(task.totalDeposit);
      if (refundAmount > 0) {
        await this.merchantsService.unfreezeBalance(merchantId, refundAmount);
        await this.merchantsService.addBalance(
          merchantId,
          refundAmount,
          `取消任务退款 - ${task.taskNumber}`,
        );
      }
    });

    // 发送系统消息通知商家
    try {
      await this.messagesService.create({
        receiverId: merchantId,
        receiverType: MessageUserType.MERCHANT,
        title: '任务已取消',
        content: `您的任务 ${task.taskNumber} 已成功取消，冻结资金 ¥${Number(task.totalDeposit).toFixed(2)} 已返还到您的账户。`,
        type: MessageType.SYSTEM,
      });
    } catch (error) {
      console.error('发送取消任务通知失败:', error);
    }

    return {
      success: true,
      message: '任务已取消，资金已返还',
    };
  }

  async getAvailableCount(taskId: string): Promise<number> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) return 0;
    return task.count - task.claimedCount;
  }

  /**
   * 更新任务的最后接单时间 (用于接单间隔校验)
 *
   */
  async updateReceiptTime(taskId: string): Promise<void> {
    await this.tasksRepository.update(taskId, {
      receiptTime: new Date(),
    });
  }

  /**
   * 修复任务的已领取数量 (claimedCount)
   * 根据实际订单数量重新计算并更新
   */
  async fixClaimedCount(taskId: string): Promise<{ oldCount: number; newCount: number; fixed: boolean }> {
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    // 查询该任务的实际订单数量
    const actualCount = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from('orders', 'order')
      .where('order.taskId = :taskId', { taskId })
      .getRawOne()
      .then(result => parseInt(result.count, 10));

    const oldCount = task.claimedCount;

    // 更新 claimedCount
    if (oldCount !== actualCount) {
      await this.tasksRepository.update(taskId, { claimedCount: actualCount });
      return { oldCount, newCount: actualCount, fixed: true };
    }

    return { oldCount, newCount: actualCount, fixed: false };
  }

  /**
   * 批量修复所有任务的已领取数量
   */
  async fixAllClaimedCounts(): Promise<{
    total: number;
    fixed: number;
    results: Array<{ taskId: string; taskNumber: string; oldCount: number; newCount: number }>
  }> {
    const tasks = await this.tasksRepository.find();
    const results: Array<{
      taskId: string;
      taskNumber: string;
      oldCount: number;
      newCount: number;
    }> = [];
    let fixedCount = 0;

    for (const task of tasks) {
      try {
        const result = await this.fixClaimedCount(task.id);
        if (result.fixed) {
          fixedCount++;
          results.push({
            taskId: task.id,
            taskNumber: task.taskNumber,
            oldCount: result.oldCount,
            newCount: result.newCount,
          });
        }
      } catch (error) {
        console.error(`修复任务 ${task.id} 失败:`, error);
      }
    }

    return { total: tasks.length, fixed: fixedCount, results };
  }

  // ============ Excel批量导入任务 ============

  /**
   * 解析Excel文件并批量创建任务
   * 支持的列: 标题, 关键词, 商品价格, 数量, 平台(淘宝/天猫/京东/拼多多), 额外佣金, 店铺名, 备注
   */
  async batchImportFromExcel(
    merchantId: string,
    fileBuffer: Buffer,
  ): Promise<{
    success: number;
    failed: number;
    errors: { row: number; error: string }[];
    tasks: Task[];
  }> {
    // 解析Excel
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rows.length < 2) {
      throw new BadRequestException('Excel文件为空或缺少数据行');
    }

    // 第一行是表头
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    // 列索引映射
    const columnMap: Record<string, number> = {};
    const expectedColumns = ['标题', '关键词', '商品价格', '数量', '平台', '额外佣金', '店铺名', '备注'];
    headers.forEach((header, index) => {
      const normalizedHeader = String(header).trim();
      if (expectedColumns.includes(normalizedHeader)) {
        columnMap[normalizedHeader] = index;
      }
    });

    // 验证必需列
    const requiredColumns = ['标题', '商品价格', '数量'];
    for (const col of requiredColumns) {
      if (columnMap[col] === undefined) {
        throw new BadRequestException(`Excel缺少必需列: ${col}`);
      }
    }

    // 平台类型映射
    const platformTypeMap: Record<string, TaskType> = {
      '淘宝': TaskType.TAOBAO,
      '天猫': TaskType.TMALL,
      '京东': TaskType.JD,
      '拼多多': TaskType.PDD,
      '抖音': TaskType.DOUYIN,
      '快手': TaskType.KUAISHOU,
    };

    const results: {
      success: number;
      failed: number;
      errors: { row: number; error: string }[];
      tasks: Task[];
    } = {
      success: 0,
      failed: 0,
      errors: [],
      tasks: [],
    };

    // 逐行处理
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // Excel行号（从1开始，加上表头行）

      try {
        const title = String(row[columnMap['标题']] || '').trim();
        const keyword = columnMap['关键词'] !== undefined ? String(row[columnMap['关键词']] || '').trim() : '';
        const goodsPrice = parseFloat(String(row[columnMap['商品价格']] || '0')) || 0;
        const count = parseInt(String(row[columnMap['数量']] || '1')) || 1;
        const platformStr = columnMap['平台'] !== undefined ? String(row[columnMap['平台']] || '').trim() : '';
        const extraCommission = columnMap['额外佣金'] !== undefined ? parseFloat(String(row[columnMap['额外佣金']] || '0')) || 0 : 0;
        const shopName = columnMap['店铺名'] !== undefined ? String(row[columnMap['店铺名']] || '').trim() : '';
        const remark = columnMap['备注'] !== undefined ? String(row[columnMap['备注']] || '').trim() : '';

        // 验证必填字段
        if (!title) {
          throw new Error('标题不能为空');
        }
        if (goodsPrice <= 0) {
          throw new Error('商品价格必须大于0');
        }
        if (count <= 0) {
          throw new Error('数量必须大于0');
        }

        const taskType = platformTypeMap[platformStr];
        if (!taskType) {
          throw new Error(`无效的平台: ${platformStr || '(未指定)'}，支持的平台: 淘宝, 天猫, 京东, 拼多多, 抖音, 快手`);
        }

        // 创建任务DTO
        const createTaskDto: CreateTaskDto = {
          title,
          keyword: keyword || title,
          goodsPrice,
          count,
          taskType,
          extraCommission,
          shopName,
          remark,
        };

        // 调用已有的创建方法
        const task = await this.createAndPay(createTaskDto, merchantId);
        results.tasks.push(task);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: rowNumber,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 生成导入模板
   */
  getImportTemplate(): Buffer {
    const headers = ['标题', '关键词', '商品价格', '数量', '平台', '额外佣金', '店铺名', '备注'];
    const sampleData = [
      ['夏季连衣裙', '连衣裙 夏季', 128, 10, '淘宝', 0, '示例店铺', '示例备注'],
      ['运动鞋男', '运动鞋 透气', 299, 5, '京东', 2, '', ''],
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '任务导入模板');

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * 生成任务编号 (T + 日期YYYYMMDD + 序号)
   * 格式: T20241230001, T20241230002, ...
   */
  private async generateTaskNumber(): Promise<string> {
    // 获取今天的日期 YYYYMMDD 格式
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;

    // 查询今天最大的序号
    const prefix = `T${dateStr}`;
    const lastTask = await this.tasksRepository
      .createQueryBuilder('t')
      .where('t.taskNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('t.taskNumber', 'DESC')
      .getOne();

    let nextSequence = 1; // 从 001 开始

    if (lastTask && lastTask.taskNumber) {
      // 提取序号部分（最后3位数字）
      const lastSequence = parseInt(lastTask.taskNumber.substring(prefix.length));
      if (!isNaN(lastSequence)) {
        nextSequence = lastSequence + 1;
      }
    }

    // 格式化为3位数字（001, 002, 等）
    const sequenceStr = nextSequence.toString().padStart(3, '0');
    return `${prefix}${sequenceStr}`;
  }
}
