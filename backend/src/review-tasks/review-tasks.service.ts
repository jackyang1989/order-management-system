import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReviewTask, ReviewTaskStatus, CreateReviewTaskDto, SubmitReviewDto } from './review-task.entity';
import { UsersService } from '../users/users.service';
import { MerchantsService } from '../merchants/merchants.service';
import { FinanceRecordsService } from '../finance-records/finance-records.service';
import { FundType, FundAction } from '../users/fund-record.entity';

@Injectable()
export class ReviewTasksService {
    constructor(
        @InjectRepository(ReviewTask)
        private reviewTasksRepository: Repository<ReviewTask>,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
        @Inject(forwardRef(() => MerchantsService))
        private merchantsService: MerchantsService,
        private financeRecordsService: FinanceRecordsService,
    ) { }

    /**
     * 商家创建追评任务
     */
    async create(merchantId: string, dto: CreateReviewTaskDto): Promise<ReviewTask> {
        // 设置默认截止时间（7天后）
        const deadline = dto.deadline
            ? new Date(dto.deadline)
            : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const reviewTask = this.reviewTasksRepository.create({
            orderId: dto.orderId,
            taskId: '', // 需要从订单获取
            merchantId,
            userId: '', // 需要从订单获取
            content: dto.content,
            images: dto.images || [],
            commission: dto.commission,
            deposit: dto.deposit || 0,
            status: ReviewTaskStatus.PENDING,
            deadline,
        });

        return this.reviewTasksRepository.save(reviewTask);
    }

    /**
     * 获取商家的追评任务列表
     */
    async findByMerchant(merchantId: string, status?: ReviewTaskStatus): Promise<ReviewTask[]> {
        const query = this.reviewTasksRepository.createQueryBuilder('rt')
            .where('rt.merchantId = :merchantId', { merchantId });

        if (status !== undefined) {
            query.andWhere('rt.status = :status', { status });
        }

        return query.orderBy('rt.createdAt', 'DESC').getMany();
    }

    /**
     * 获取买手的追评任务列表
     */
    async findByUser(userId: string, status?: ReviewTaskStatus): Promise<ReviewTask[]> {
        const query = this.reviewTasksRepository.createQueryBuilder('rt')
            .where('rt.userId = :userId', { userId });

        if (status !== undefined) {
            query.andWhere('rt.status = :status', { status });
        }

        return query.orderBy('rt.createdAt', 'DESC').getMany();
    }

    async findOne(id: string): Promise<ReviewTask | null> {
        return this.reviewTasksRepository.findOne({ where: { id } });
    }

    /**
     * 买手提交追评
     */
    async submitReview(id: string, userId: string, dto: SubmitReviewDto): Promise<ReviewTask> {
        const task = await this.reviewTasksRepository.findOne({ where: { id, userId } });
        if (!task) {
            throw new NotFoundException('追评任务不存在');
        }
        if (task.status !== ReviewTaskStatus.PENDING) {
            throw new BadRequestException('该任务已处理');
        }

        task.submittedContent = dto.content;
        task.submittedImages = dto.images || [];
        task.submittedAt = new Date();
        task.status = ReviewTaskStatus.SUBMITTED;

        return this.reviewTasksRepository.save(task);
    }

    /**
     * 买手拒绝追评
     */
    async reject(id: string, userId: string, reason?: string): Promise<ReviewTask> {
        const task = await this.reviewTasksRepository.findOne({ where: { id, userId } });
        if (!task) {
            throw new NotFoundException('追评任务不存在');
        }
        if (task.status !== ReviewTaskStatus.PENDING) {
            throw new BadRequestException('该任务已处理');
        }

        task.status = ReviewTaskStatus.REJECTED;
        task.rejectReason = reason || '买手拒绝';

        // 退还商家押金
        if (task.deposit && task.deposit > 0) {
            await this.merchantsService.addBalance(
                task.merchantId,
                task.deposit,
                `追评任务被拒绝，退还押金 - 订单${task.orderId}`
            );
        }

        // 退还商家佣金（银锭）
        if (task.commission && task.commission > 0) {
            await this.merchantsService.addSilver(
                task.merchantId,
                task.commission,
                `追评任务被拒绝，退还佣金 - 订单${task.orderId}`
            );
        }

        return this.reviewTasksRepository.save(task);
    }

    /**
     * 商家审核追评
     */
    async review(id: string, merchantId: string, approved: boolean, reason?: string): Promise<ReviewTask> {
        const task = await this.reviewTasksRepository.findOne({ where: { id, merchantId } });
        if (!task) {
            throw new NotFoundException('追评任务不存在');
        }
        if (task.status !== ReviewTaskStatus.SUBMITTED) {
            throw new BadRequestException('该任务不是待审核状态');
        }

        if (approved) {
            task.status = ReviewTaskStatus.APPROVED;

            // 释放佣金给买手
            if (task.commission && task.commission > 0 && task.userId) {
                // 获取当前用户信息以计算余额
                const user = await this.usersService.findOne(task.userId);
                if (user) {
                    const newSilver = Number(user.silver || 0) + task.commission;

                    // 记录财务流水 - 追评佣金
                    await this.financeRecordsService.recordBuyerTaskCommission(
                        task.userId,
                        task.commission,
                        newSilver,
                        task.orderId,
                        `追评任务完成 - 订单${task.orderId}`
                    );

                    // 更新用户银锭
                    await this.usersService.addFundRecord(
                        task.userId,
                        FundType.SILVER,
                        FundAction.IN,
                        task.commission,
                        `追评佣金 - 订单${task.orderId}`,
                        { orderId: task.orderId }
                    );
                }
            }

            // 释放押金回商家（因为买手完成了任务，押金不需要赔付）
            if (task.deposit && task.deposit > 0) {
                await this.merchantsService.unfreezeBalance(task.merchantId, task.deposit);
            }
        } else {
            task.status = ReviewTaskStatus.PENDING; // 驳回后重新让买手提交
            task.rejectReason = reason || '审核不通过';
        }

        return this.reviewTasksRepository.save(task);
    }

    /**
     * 完成追评任务（自动或手动）
     */
    async complete(id: string): Promise<ReviewTask> {
        const task = await this.reviewTasksRepository.findOne({ where: { id } });
        if (!task) {
            throw new NotFoundException('追评任务不存在');
        }

        task.status = ReviewTaskStatus.COMPLETED;
        return this.reviewTasksRepository.save(task);
    }

    /**
     * 获取统计
     */
    async getMerchantStats(merchantId: string): Promise<{
        pending: number;
        submitted: number;
        completed: number;
        rejected: number;
    }> {
        const pending = await this.reviewTasksRepository.count({
            where: { merchantId, status: ReviewTaskStatus.PENDING }
        });
        const submitted = await this.reviewTasksRepository.count({
            where: { merchantId, status: ReviewTaskStatus.SUBMITTED }
        });
        const completed = await this.reviewTasksRepository.count({
            where: { merchantId, status: ReviewTaskStatus.COMPLETED }
        });
        const rejected = await this.reviewTasksRepository.count({
            where: { merchantId, status: ReviewTaskStatus.REJECTED }
        });

        return { pending, submitted, completed, rejected };
    }
}
