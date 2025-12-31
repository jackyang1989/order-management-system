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
    async createAndPay(createTaskDto: CreateTaskDto, merchantId: string): Promise<Task> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. 获取商户信息
            const merchant = await this.merchantsService.findOne(merchantId);
            if (!merchant) {
                throw new BadRequestException('商户不存在');
            }

            // 2. 计算费用
            const count = createTaskDto.count || 1;
            const goodsMoney = (createTaskDto.goodsPrice || 0) * count;

            // 基础服务费
            const baseServiceFee = 5.0;
            const praiseFee = createTaskDto.praiseFee || 0;
            const timingPublishFee = createTaskDto.isTimingPublish ? 1.0 : 0;
            const timingPayFee = createTaskDto.isTimingPay ? 1.0 : 0;
            const cycleTimeFee = createTaskDto.isCycleTime ? 1.0 : 0;
            const addReward = createTaskDto.addReward || 0;

            // 押金 = 商品本金 + 保证金 + 运费
            const marginUnit = createTaskDto.isFreeShipping === 1 ? 0 : 10;
            const postageUnit = createTaskDto.isFreeShipping === 1 ? 0 : 10;
            const totalDeposit = goodsMoney + (marginUnit * count) + (postageUnit * count);

            // 佣金 = 服务费 + 增值费
            const totalCommission = (baseServiceFee + praiseFee + timingPublishFee + timingPayFee + cycleTimeFee + addReward) * count;

            // 3. 验证余额
            if (Number(merchant.balance) < totalDeposit) {
                throw new BadRequestException(`余额不足，需要 ¥${totalDeposit.toFixed(2)}，当前余额 ¥${merchant.balance}`);
            }
            if (Number(merchant.silver) < totalCommission) {
                throw new BadRequestException(`银锭不足，需要 ${totalCommission.toFixed(2)}，当前银锭 ${merchant.silver}`);
            }

            // 4. 冻结押金
            await this.merchantsService.freezeBalance(merchantId, totalDeposit);

            // 5. 扣除银锭
            await this.merchantsService.deductSilver(merchantId, totalCommission, `发布任务佣金`);

            // 6. 创建任务
            const newTask = this.tasksRepository.create({
                taskNumber: 'T' + Date.now(),
                title: createTaskDto.title,
                taskType: createTaskDto.taskType,
                shopName: createTaskDto.shopName,
                url: createTaskDto.url,
                mainImage: createTaskDto.mainImage || '',
                keyword: createTaskDto.keyword || '',
                taoWord: createTaskDto.taoWord,
                goodsPrice: createTaskDto.goodsPrice,
                goodsMoney,
                count,
                claimedCount: 0,
                baseServiceFee,
                praiseFee,
                isPraise: createTaskDto.isPraise,
                isTimingPublish: createTaskDto.isTimingPublish,
                publishTime: createTaskDto.publishTime ? new Date(createTaskDto.publishTime) : undefined,
                totalDeposit,
                totalCommission,
                status: TaskStatus.ACTIVE, // 支付成功，直接发布
                merchantId,
            });

            const savedTask = await queryRunner.manager.save(newTask);

            await queryRunner.commitTransaction();
            return savedTask;

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
        });
        return this.tasksRepository.save(newTask);
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
}
