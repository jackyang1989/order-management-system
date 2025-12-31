import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';
import { TaskClaimJob } from './task-claim.processor';

@Injectable()
export class QueueService {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @InjectQueue('task-claim')
        private taskClaimQueue: Queue<TaskClaimJob>,
    ) { }

    /**
     * 将抢单请求加入队列
     * 使用队列保证并发安全，避免超卖
     */
    async addTaskClaimJob(
        taskId: string,
        userId: string,
        buyerAccountId: string,
    ): Promise<Job<TaskClaimJob>> {
        const job = await this.taskClaimQueue.add(
            'claim',
            {
                taskId,
                userId,
                buyerAccountId,
                timestamp: Date.now(),
            },
            {
                // 任务唯一性：同一用户对同一任务只能有一个待处理请求
                jobId: `claim-${taskId}-${userId}`,
                // 移除延迟，立即处理
                delay: 0,
                // 失败重试配置
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                // 超时设置
                removeOnComplete: true,
                removeOnFail: false,
            },
        );

        this.logger.debug(`抢单请求已加入队列: jobId=${job.id}`);
        return job;
    }

    /**
     * 等待抢单结果
     */
    async waitForClaimResult(
        job: Job<TaskClaimJob>,
        timeout: number = 30000,
    ): Promise<{ success: boolean; orderId?: string; error?: string }> {
        const result = await job.waitUntilFinished(
            this.taskClaimQueue.events,
            timeout,
        );
        return result;
    }

    /**
     * 获取队列状态
     */
    async getQueueStatus() {
        const [waiting, active, completed, failed] = await Promise.all([
            this.taskClaimQueue.getWaitingCount(),
            this.taskClaimQueue.getActiveCount(),
            this.taskClaimQueue.getCompletedCount(),
            this.taskClaimQueue.getFailedCount(),
        ]);

        return { waiting, active, completed, failed };
    }

    /**
     * 清理已完成的任务
     */
    async cleanCompletedJobs(grace: number = 3600000) {
        await this.taskClaimQueue.clean(grace, 1000, 'completed');
    }

    /**
     * 暂停队列
     */
    async pauseQueue() {
        await this.taskClaimQueue.pause();
        this.logger.warn('抢单队列已暂停');
    }

    /**
     * 恢复队列
     */
    async resumeQueue() {
        await this.taskClaimQueue.resume();
        this.logger.log('抢单队列已恢复');
    }
}
