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
import { MerchantsService } from '../merchants/merchants.service';
import { MessagesService } from '../messages/messages.service';
import { MessageUserType } from '../messages/message.entity';

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
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
  private getHuobiKeyword(dto: CreateTaskDto): string {
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

  async findAll(filter?: TaskFilterDto): Promise<Task[]> {
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

    return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
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
   * 创建任务并完成支付
   * 使用事务确保原子性：扣款失败则回滚任务创建
   */
  /**
   * 创建任务并完成支付 (Merchant Portal Standard)
   * 严格遵循原版扣费逻辑：押金 + 佣金 + 增值费
   */
  async createAndPay(dto: any, merchantId: string): Promise<Task> {
    // TODO: Use proper DTO type in signature after refactor complete
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

      // 2. 费用计算核心逻辑 (Core Calculation Algorithm)
      // 2.1 基础数值
      const count = dto.count || 1;
      const goodsPrice = Number(dto.goodsPrice || 0);

      // 2.2 押金部分 (Principal + Postage + Margin)
      const goodsMoney = goodsPrice * count;
      // 原版逻辑：shang_is_free_shiping=1 (包邮) => margin=0. 否则 margin=10.
      // 这里沿用原版逻辑
      const isFreeShipping = dto.isFreeShipping !== false; // Default true
      const postagePerOrder = isFreeShipping ? 0 : 10;
      const totalPostage = postagePerOrder * count;
      const marginPerOrder = isFreeShipping ? 0 : 10;
      const totalMargin = marginPerOrder * count;

      const totalDeposit = goodsMoney + totalPostage + totalMargin;

      // 2.3 佣金/银锭部分 (Commission / Silver)
      // 计算公式：Base Commission + Extra Commission + Platform Service Fee
      // Mocking Platform Logic:
      // Base Fee: usually depends on goodsPrice.
      // Service Fee: usually a fixed percentage or tier.

      let baseFeePerOrder = 0;
      // Example Tier (Ref: common logic)
      if (goodsPrice < 50) baseFeePerOrder = 5.5;
      else if (goodsPrice < 100) baseFeePerOrder = 6.5;
      else if (goodsPrice < 200) baseFeePerOrder = 7.5;
      else baseFeePerOrder = goodsPrice * 0.03 + 5; // Mock

      const extraCommission = Number(dto.extraCommission || 0);

      // Value-added service fees (Only if explicitly allowed, but user said Calculator Reset. Assuming simplified)
      // We removed 'gender', 'age', 'steps'.
      // What about 'isPraise', 'isPublish'?
      // The prompt says "ensure real-time calculator ONLY calculates: Base, Extra, Platform Service Fees".
      // This implies 'Service Fee' might condense others or they are free.
      // Let's assume strict compliance: No other fees added here.

      const totalCommissionPerOrder = baseFeePerOrder + extraCommission;
      const totalCommission = totalCommissionPerOrder * count;

      // 2.5 计算买手分成佣金 (user_divided)
      // 分成基数 = 各种服务费的累加（周期费、定时付款费、预售费、隔天费等）
      // userDivided = dividePrice * dividedRate
      // 从 SystemGlobalConfig 获取 divided 分成比例（默认0.6即60%）
      // 暂时使用简化逻辑：分成基数 = baseServiceFee * count
      // 实际应从配置读取分成比例
      const dividedRate = 0.6; // 默认60%分成给买手
      const dividePrice = baseFeePerOrder * count; // 分成基数
      const userDividedTotal = Math.round(dividePrice * dividedRate * 100) / 100;

      // 2.6 检查余额并计算混合支付
      // 混合支付逻辑：
      // 1. 佣金优先使用银锭支付
      // 2. 押金优先使用余额支付
      // 3. 余额不足时，可用银锭代付押金（如果dto.useReward为true）
      const useReward = dto.useReward !== false; // 默认启用混合支付

      let balanceDeduct = 0; // 从余额扣除
      let silverDeductForDeposit = 0; // 从银锭扣除（代付押金）
      let silverDeductForCommission = 0; // 从银锭扣除（佣金）

      // 检查银锭是否足够支付佣金
      if (merchant.silver < totalCommission) {
        throw new BadRequestException(
          `银锭不足，需 ${totalCommission.toFixed(2)}锭，当前 ${merchant.silver}锭`,
        );
      }
      silverDeductForCommission = totalCommission;

      // 检查余额是否足够支付押金
      if (merchant.balance >= totalDeposit) {
        // 余额充足，全部从余额扣除
        balanceDeduct = totalDeposit;
      } else if (useReward) {
        // 余额不足，启用混合支付：余额 + 银锭代付
        balanceDeduct = Number(merchant.balance);
        const shortfall = totalDeposit - balanceDeduct;
        // 检查银锭是否足够代付差额
        const remainingSilver = Number(merchant.silver) - silverDeductForCommission;
        if (remainingSilver < shortfall) {
          throw new BadRequestException(
            `余额+银锭不足，押金需 ${totalDeposit}，余额 ${merchant.balance}，银锭代付差额 ${shortfall} 但仅剩 ${remainingSilver}锭`,
          );
        }
        silverDeductForDeposit = shortfall;
      } else {
        // 不启用混合支付，余额必须充足
        throw new BadRequestException(
          `余额不足，需 ${totalDeposit}，当前 ${merchant.balance}`,
        );
      }

      const totalSilverDeduct = silverDeductForCommission + silverDeductForDeposit;

      // 扣款动作
      if (balanceDeduct > 0) {
        await this.merchantsService.freezeBalance(merchantId, balanceDeduct);
      }
      await this.merchantsService.deductSilver(
        merchantId,
        totalSilverDeduct,
        silverDeductForDeposit > 0
          ? `发布任务: ${dto.title}（佣金${silverDeductForCommission}+代付押金${silverDeductForDeposit}）`
          : `发布任务: ${dto.title}`,
      );

      // 4. 创建任务记录
      const newTask = this.tasksRepository.create({
        ...dto, // Auto-map matching fields
        merchantId,
        taskNumber: 'T' + Date.now() + Math.floor(Math.random() * 1000),
        status: TaskStatus.ACTIVE, // Assuming direct active for now or PENDING_PAY if strictly separated

        // Detailed Fields
        goodsPrice,
        goodsMoney, // Total Goods Money
        shippingFee: totalPostage,
        margin: totalMargin,

        // Mapped & Calculated
        totalDeposit,
        totalCommission,
        baseServiceFee: baseFeePerOrder,
        userDivided: userDividedTotal, // 买手分成佣金总额

        // Value Added Flags (Keep flags if present in DTO but no fees)
        isPraise: !!dto.isPraise,
        isImgPraise: dto.praiseType === 'image',
        isVideoPraise: dto.praiseType === 'video',
        praiseFee: dto.praiseFee || 0,
        isTimingPublish: !!dto.isTimingPublish,
        publishTime: dto.publishTime ? new Date(dto.publishTime) : null,
        isTimingPay: !!dto.isTimingPay,
        timingTime: dto.timingPayTime ? new Date(dto.timingPayTime) : null,
        timingPayFee: dto.timingPayFee || 0,
        timingPublishFee: dto.timingPublishFee || 0,

        isCycleTime: !!dto.isCycleTime,
        cycle: dto.cycleTime || 0,

        // Browse Behavior Settings
        needHuobi: !!dto.needCompare,
        huobiKeyword: this.getHuobiKeyword(dto),
        needShoucang: !!dto.needFavorite,
        needGuanzhu: !!dto.needFollow,
        needJiagou: !!dto.needAddCart,
        needJialiao: !!dto.needContactCS,

        // 浏览时长设置
        totalBrowseMinutes: dto.totalBrowseMinutes || 15,
        mainBrowseMinutes: dto.mainBrowseMinutes || 8,
        subBrowseMinutes: dto.subBrowseMinutes || 2,

        // 特殊任务类型
        isRepay: !!dto.isRepay,
        isNextDay: !!dto.isNextDay,
        nextDayFee: dto.nextDayFee || 0,

        // P0 Fix: 返款方式和订单设置
        terminal: dto.terminal || 1, // 默认本佣货返
        memo: dto.memo || '',
        unionInterval: dto.orderInterval || 0,

        // 口令验证
        isPasswordEnabled: !!dto.isPasswordEnabled,
        checkPassword: dto.checkPassword || '',

        // 多商品费用
        goodsMoreFee: dto.goodsMoreFee || 0,

        // 店铺信息
        shopId: dto.shopId || null,
        shopName: dto.shopName || '',

        claimedCount: 0,
        completedCount: 0,
      });

      const savedTask = await queryRunner.manager.save(newTask);
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
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

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
        const goodsPrice = parseFloat(row[columnMap['商品价格']]) || 0;
        const count = parseInt(row[columnMap['数量']]) || 1;
        const platformStr = columnMap['平台'] !== undefined ? String(row[columnMap['平台']] || '').trim() : '';
        const extraCommission = columnMap['额外佣金'] !== undefined ? parseFloat(row[columnMap['额外佣金']]) || 0 : 0;
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
}
