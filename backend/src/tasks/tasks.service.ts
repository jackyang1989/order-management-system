import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task, TaskStatus, TaskType, CreateTaskDto, TaskFilterDto } from './task.entity';
import { MerchantsService } from '../merchants/merchants.service';

@Injectable()
export class TasksService implements OnModuleInit {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,
        @Inject(forwardRef(() => MerchantsService))
        private merchantsService: MerchantsService,
        private dataSource: DataSource,
    ) { }

    // 初始化时插入种子数据
    async onModuleInit() {
        const count = await this.tasksRepository.count();
        if (count === 0) {
            await this.seedTasks();
        }
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
                goodsPrice: 128.00,
                baseServiceFee: 5.00,
                count: 50,
                claimedCount: 32,
                status: TaskStatus.ACTIVE,
                remark: '需要实名认证的淘宝账号',
                totalCommission: 5.00,
                totalDeposit: 128.00 + 10,
            },
            {
                taskNumber: 'T20241230002',
                title: '京东下单立返任务',
                taskType: TaskType.JD,
                shopName: '京东自营',
                url: 'https://jd.com/item/2',
                mainImage: '',
                keyword: '空气净化器',
                goodsPrice: 299.00,
                baseServiceFee: 15.00,
                count: 30,
                claimedCount: 18,
                status: TaskStatus.ACTIVE,
                remark: '需要京东Plus会员',
                totalCommission: 15.00,
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
                goodsPrice: 50.00,
                baseServiceFee: 3.00,
                count: 100,
                claimedCount: 45,
                status: TaskStatus.ACTIVE,
                remark: '需要新用户账号',
                totalCommission: 3.00,
                totalDeposit: 60,
            }
        ];

        for (const taskData of seedTasks) {
            const task = this.tasksRepository.create(taskData);
            await this.tasksRepository.save(task);
        }
        console.log('Seed tasks inserted successfully');
    }

    async findAll(filter?: TaskFilterDto): Promise<Task[]> {
        const queryBuilder = this.tasksRepository.createQueryBuilder('task')
            .where('task.status = :status', { status: TaskStatus.ACTIVE });

        if (filter) {
            if (filter.taskType) {
                queryBuilder.andWhere('task.taskType = :taskType', { taskType: filter.taskType });
            }
            if (filter.search) {
                queryBuilder.andWhere(
                    '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.keyword) LIKE LOWER(:search))',
                    { search: `%${filter.search}%` }
                );
            }
            if (filter.minCommission !== undefined) {
                queryBuilder.andWhere('task.totalCommission >= :minCommission', { minCommission: filter.minCommission });
            }
            if (filter.maxCommission !== undefined) {
                queryBuilder.andWhere('task.totalCommission <= :maxCommission', { maxCommission: filter.maxCommission });
            }
        }

        return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
    }

    async findByMerchant(merchantId: string, filter?: TaskFilterDto): Promise<Task[]> {
        const queryBuilder = this.tasksRepository.createQueryBuilder('task')
            .where('task.merchantId = :merchantId', { merchantId });

        if (filter?.status !== undefined) {
            queryBuilder.andWhere('task.status = :status', { status: filter.status });
        }
        if (filter?.taskType) {
            queryBuilder.andWhere('task.taskType = :taskType', { taskType: filter.taskType });
        }

        return queryBuilder.orderBy('task.createdAt', 'DESC').getMany();
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
            // 原版: goods_money = principal * count
            const goodsMoney = goodsPrice * count;

            // 运费 (Postage): 包邮=0, 不包邮=10 (假设标准)
            const postagePerOrder = dto.isFreeShipping ? 0 : 10;
            const totalPostage = postagePerOrder * count;

            // 保证金 (Margin): 默认 0 (某些平台可能需要)
            const marginPerOrder = 0;
            const totalMargin = marginPerOrder * count;

            const totalDeposit = goodsMoney + totalPostage + totalMargin;

            // 2.3 佣金/银锭部分 (Commission / Silver)
            // 基础佣金 (Base Fee): 
            // <50: 5.5, 50-100: 6.5, 100-150: 7.5, 150-200: 8.5, 200-300: 10, >300: 1% + 8
            let baseFeePerOrder = 0;
            if (goodsPrice < 50) baseFeePerOrder = 5.5;
            else if (goodsPrice < 100) baseFeePerOrder = 6.5;
            else if (goodsPrice < 150) baseFeePerOrder = 7.5;
            else if (goodsPrice < 200) baseFeePerOrder = 8.5;
            else if (goodsPrice < 300) baseFeePerOrder = 10;
            else baseFeePerOrder = (goodsPrice * 0.01) + 8;

            // 增值服务费用
            let extraFeePerOrder = 0;

            // 好评类
            if (dto.isPraise) extraFeePerOrder += 0.5; // 文字好评
            if (dto.isImgPraise) extraFeePerOrder += 1.0; // 图文好评
            if (dto.isVideoPraise) extraFeePerOrder += 2.0; // 视频好评

            // 发布类
            if (dto.isTimingPublish) extraFeePerOrder += 1.0; // 定时发布
            if (dto.gender) extraFeePerOrder += 1.0; // 性别限制

            // 限制类
            if (dto.buyLimit && dto.buyLimit > 0) extraFeePerOrder += 0.5; // 购买周期限制

            // 加赏
            const extraCommission = Number(dto.extraCommission || 0);

            const totalCommissionPerOrder = baseFeePerOrder + extraFeePerOrder + extraCommission;
            const totalCommission = totalCommissionPerOrder * count;

            // 3. 余额检查 & 扣款
            // 检查押金 (Balance)
            if (Number(merchant.balance) < totalDeposit) {
                throw new BadRequestException(`余额不足，需 ¥${totalDeposit.toFixed(2)}`);
            }
            // 检查银锭 (Silver)
            if (Number(merchant.silver) < totalCommission) {
                throw new BadRequestException(`银锭不足，需 ${totalCommission.toFixed(2)}锭`);
            }

            // 扣款动作
            await this.merchantsService.freezeBalance(merchantId, totalDeposit);
            await this.merchantsService.deductSilver(merchantId, totalCommission, `发布任务: ${dto.title}`);

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

                baseServiceFee: baseFeePerOrder,
                // Store specific fees for transparency
                praiseFee: dto.isPraise ? 0.5 : 0,
                imgPraiseFee: dto.isImgPraise ? 1.0 : 0,
                videoPraiseFee: dto.isVideoPraise ? 2.0 : 0,
                timingPublishFee: dto.isTimingPublish ? 1.0 : 0,

                extraReward: extraCommission,

                totalDeposit,
                totalCommission,

                claimedCount: 0,
                completedCount: 0
            });

            const savedTask = await queryRunner.manager.save(newTask);
            await queryRunner.commitTransaction();
            return Array.isArray(savedTask) ? savedTask[0] : savedTask;

        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    // 简化版创建（不含支付，保留向后兼容）
    async create(createTaskDto: CreateTaskDto, merchantId?: string): Promise<Task> {
        const goodsMoney = createTaskDto.goodsPrice * createTaskDto.count;
        const baseServiceFee = 5.00;
        const deposit = goodsMoney + (10 * createTaskDto.count);

        const newTask = this.tasksRepository.create({
            taskNumber: 'T' + Date.now(),
            ...createTaskDto,
            goodsMoney,
            baseServiceFee,
            totalDeposit: deposit,
            totalCommission: baseServiceFee,
            claimedCount: 0,
            status: TaskStatus.PENDING_PAY,
            merchantId: merchantId
        } as any);
        const savedTask = await this.tasksRepository.save(newTask);
        return Array.isArray(savedTask) ? savedTask[0] : savedTask;
    }

    async claim(taskId: string, userId: string, buynoId: string): Promise<{ success: boolean; message: string; orderId?: string }> {
        const result = await this.tasksRepository.createQueryBuilder()
            .update(Task)
            .set({ claimedCount: () => "claimedCount + 1" })
            .where("id = :id", { id: taskId })
            .andWhere("status = :status", { status: TaskStatus.ACTIVE })
            .andWhere("claimedCount < count")
            .execute();

        if (result.affected === 0) {
            const task = await this.tasksRepository.findOne({ where: { id: taskId } });
            if (!task) throw new NotFoundException('任务不存在');
            if (task.status !== TaskStatus.ACTIVE) throw new BadRequestException('任务已结束');
            if (task.claimedCount >= task.count) throw new BadRequestException('任务名额已满');
            throw new BadRequestException('任务领取失败，请重试');
        }

        const orderId = 'order-' + Date.now();

        return {
            success: true,
            message: '任务领取成功',
            orderId
        };
    }

    async getAvailableCount(taskId: string): Promise<number> {
        const task = await this.tasksRepository.findOne({ where: { id: taskId } });
        if (!task) return 0;
        return task.count - task.claimedCount;
    }

    /**
     * 更新任务的最后接单时间 (用于接单间隔校验)
     * 对应原版 receipt_time 字段
     */
    async updateReceiptTime(taskId: string): Promise<void> {
        await this.tasksRepository.update(taskId, {
            receiptTime: new Date()
        });
    }
}
