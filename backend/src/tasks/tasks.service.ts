import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Task, TaskStatus, TaskType, CreateTaskDto, ClaimTaskDto, TaskFilterDto } from './task.entity';

@Injectable()
export class TasksService implements OnModuleInit {
    constructor(
        @InjectRepository(Task)
        private tasksRepository: Repository<Task>,
    ) { }

    // 初始化时插入种子数据
    async onModuleInit() {
        const count = await this.tasksRepository.count();
        if (count === 0) {
            await this.seedTasks();
        }
    }

    private async seedTasks() {
        const seedTasks = [
            {
                taskNumber: 'T20241230001',
                title: '淘宝浏览收藏任务',
                description: '浏览商品并收藏到购物车',
                platform: TaskType.TAOBAO,
                productName: '2024新款夏季连衣裙',
                productImage: '',
                productPrice: 128.00,
                commission: 5.00,
                requirements: '需要实名认证的淘宝账号，账号等级>=2',
                steps: [
                    { step: 1, title: '搜索商品', description: '打开淘宝APP，搜索指定关键词', requireScreenshot: true },
                    { step: 2, title: '浏览商品', description: '浏览商品详情页至少30秒', requireScreenshot: true },
                    { step: 3, title: '收藏商品', description: '点击收藏按钮', requireScreenshot: true }
                ],
                totalCount: 50,
                claimedCount: 32,
                status: TaskStatus.ACTIVE,
                sellerPhone: '13912345678',
            },
            {
                taskNumber: 'T20241230002',
                title: '京东下单立返任务',
                description: '下单购买指定商品，确认收货后返还本金+佣金',
                platform: TaskType.JD,
                productName: '家用空气净化器',
                productImage: '',
                productPrice: 299.00,
                commission: 15.00,
                requirements: '需要京东Plus会员账号，信用分>=650',
                steps: [
                    { step: 1, title: '搜索商品', description: '打开京东APP，搜索指定商品', requireScreenshot: true },
                    { step: 2, title: '下单购买', description: '使用指定收货地址下单', requireScreenshot: true },
                    { step: 3, title: '确认收货', description: '收到货物后确认收货', requireScreenshot: true }
                ],
                totalCount: 30,
                claimedCount: 18,
                status: TaskStatus.ACTIVE,
                sellerPhone: '13887654321',
            },
            {
                taskNumber: 'T20241230003',
                title: '拼多多助力任务',
                description: '帮助商家店铺增加销量',
                platform: TaskType.PDD,
                productName: '新鲜水果礼盒',
                productImage: '',
                productPrice: 59.90,
                commission: 3.00,
                requirements: '拼多多账号需绑定银行卡',
                steps: [
                    { step: 1, title: '进入店铺', description: '通过分享链接进入店铺', requireScreenshot: true },
                    { step: 2, title: '浏览商品', description: '浏览至少3个商品', requireScreenshot: true }
                ],
                totalCount: 100,
                claimedCount: 67,
                status: TaskStatus.ACTIVE,
                sellerPhone: '13666778899',
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
            if (filter.platform) {
                queryBuilder.andWhere('task.platform = :platform', { platform: filter.platform });
            }
            if (filter.search) {
                queryBuilder.andWhere(
                    '(LOWER(task.title) LIKE LOWER(:search) OR LOWER(task.productName) LIKE LOWER(:search))',
                    { search: `%${filter.search}%` }
                );
            }
            if (filter.minCommission !== undefined) {
                queryBuilder.andWhere('task.commission >= :minCommission', { minCommission: filter.minCommission });
            }
            if (filter.maxCommission !== undefined) {
                queryBuilder.andWhere('task.commission <= :maxCommission', { maxCommission: filter.maxCommission });
            }
        }

        return queryBuilder.getMany();
    }

    async findOne(id: string): Promise<Task | null> {
        return this.tasksRepository.findOne({ where: { id } });
    }

    async create(createTaskDto: CreateTaskDto): Promise<Task> {
        const newTask = this.tasksRepository.create({
            taskNumber: 'T' + Date.now(),
            ...createTaskDto,
            claimedCount: 0,
            status: TaskStatus.ACTIVE,
            sellerPhone: '13800000000',
        });
        return this.tasksRepository.save(newTask);
    }

    async claim(taskId: string, userId: string, buynoId: string): Promise<{ success: boolean; message: string; orderId?: string }> {
        // 使用原子更新防止超卖 (Race Condition Fix)
        const result = await this.tasksRepository.createQueryBuilder()
            .update(Task)
            .set({ claimedCount: () => "claimedCount + 1" })
            .where("id = :id", { id: taskId })
            .andWhere("status = :status", { status: TaskStatus.ACTIVE })
            .andWhere("claimedCount < totalCount") // 核心：数据库层原子校验库存
            .execute();

        if (result.affected === 0) {
            // 更新失败，可能是库存不足或任务不活跃
            const task = await this.tasksRepository.findOne({ where: { id: taskId } });
            if (!task) throw new NotFoundException('任务不存在');
            if (task.status !== TaskStatus.ACTIVE) throw new BadRequestException('任务已结束');
            if (task.claimedCount >= task.totalCount) throw new BadRequestException('任务名额已满');
            throw new BadRequestException('任务领取失败，请重试');
        }

        // 生成订单ID (实际订单由 Controller 通过 OrdersService 创建)
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
        return task.totalCount - task.claimedCount;
    }
}
