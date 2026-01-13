import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskDraft, TaskDraftStep } from './task-draft.entity';
import { Task, TaskStatus, TaskTerminal, TaskVersion } from '../tasks/task.entity';
import { User } from '../users/user.entity';
import { AdminConfigService } from '../admin-config/admin-config.service';

@Injectable()
export class TaskDraftsService {
    constructor(
        @InjectRepository(TaskDraft)
        private draftRepository: Repository<TaskDraft>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private configService: AdminConfigService,
    ) { }

    /**
     * 创建新草稿（Step 1开始）
     */
    async createDraft(merchantId: string): Promise<TaskDraft> {
        const draft = this.draftRepository.create({
            merchantId,
            currentStep: TaskDraftStep.STEP1_BASIC,
        });
        return this.draftRepository.save(draft);
    }

    /**
     * 获取商家的草稿列表
     */
    async getDrafts(merchantId: string): Promise<TaskDraft[]> {
        return this.draftRepository.find({
            where: { merchantId, isCompleted: false },
            order: { updatedAt: 'DESC' },
        });
    }

    /**
     * 获取单个草稿
     */
    async getDraft(id: string, merchantId: string): Promise<TaskDraft> {
        const draft = await this.draftRepository.findOne({
            where: { id, merchantId },
        });
        if (!draft) {
            throw new NotFoundException('草稿不存在');
        }
        return draft;
    }

    /**
     * Step 1: 保存基础信息
     */
    async saveStep1(
        id: string,
        merchantId: string,
        data: {
            title: string;
            platform: string;
            shopId?: string;
            goodsPrice: number;
            goodsLink: string;
            goodsImage?: string;
            totalCount: number;
            terminal: number;
            version: number;
        },
    ): Promise<TaskDraft> {
        const draft = await this.getDraft(id, merchantId);

        Object.assign(draft, data);
        draft.currentStep = TaskDraftStep.STEP2_ADVANCED;

        return this.draftRepository.save(draft);
    }

    /**
     * Step 2: 保存高级设置
     */
    async saveStep2(
        id: string,
        merchantId: string,
        data: {
            commission: number;
            praiseType?: number;
            praiseFee?: number;
            praiseContent?: string;
            praiseImages?: string;
            praiseVideo?: string;
            isPresale?: boolean;
            yfPrice?: number;
            wkPrice?: number;
            isTiming?: boolean;
            timingPublishTime?: Date;
            taskTimeLimit?: number;
            unionInterval?: number;
            cycle?: number;
            isFreeShipping?: boolean;
            postage?: number;
            deliveryRequirement?: string;
            keywords?: string;
            addReward?: number;
            memo?: string;
        },
    ): Promise<TaskDraft> {
        const draft = await this.getDraft(id, merchantId);

        if (draft.currentStep < TaskDraftStep.STEP1_BASIC) {
            throw new BadRequestException('请先完成第一步');
        }

        Object.assign(draft, data);
        draft.currentStep = TaskDraftStep.STEP3_PREVIEW;

        // 计算费用
        await this.calculateFees(draft);

        return this.draftRepository.save(draft);
    }

    /**
     * Step 3: 预览确认（计算费用）
     */
    async previewStep3(id: string, merchantId: string): Promise<TaskDraft> {
        const draft = await this.getDraft(id, merchantId);

        if (draft.currentStep < TaskDraftStep.STEP2_ADVANCED) {
            throw new BadRequestException('请先完成前两步');
        }

        // 重新计算费用
        await this.calculateFees(draft);
        draft.currentStep = TaskDraftStep.STEP4_PAYMENT;

        return this.draftRepository.save(draft);
    }

    /**
     * Step 4: 支付并创建任务
     */
    async payAndCreate(id: string, merchantId: string): Promise<Task> {
        const draft = await this.getDraft(id, merchantId);

        if (draft.currentStep < TaskDraftStep.STEP3_PREVIEW) {
            throw new BadRequestException('请先完成前三步');
        }

        // 检查商家余额
        const merchant = await this.userRepository.findOne({ where: { id: merchantId } });
        if (!merchant) {
            throw new NotFoundException('商家不存在');
        }

        if (merchant.balance < draft.calculatedTotalAmount) {
            throw new BadRequestException('余额不足，请先充值');
        }

        // 扣除商家余额
        merchant.balance = Number(merchant.balance) - Number(draft.calculatedTotalAmount);
        await this.userRepository.save(merchant);

        // 创建正式任务
        const task = this.taskRepository.create({
            merchantId,
            title: draft.title,
            platform: draft.platform,
            shopId: draft.shopId,
            goodsPrice: draft.goodsPrice,
            goodsLink: draft.goodsLink,
            goodsImage: draft.goodsImage,
            totalCount: draft.totalCount,
            terminal: draft.terminal as TaskTerminal,
            version: draft.version as TaskVersion,
            commission: draft.commission,
            praiseType: draft.praiseType,
            praiseFee: draft.praiseFee,
            praiseContent: draft.praiseContent,
            praiseImages: draft.praiseImages,
            praiseVideo: draft.praiseVideo,
            isPresale: draft.isPresale,
            yfPrice: draft.yfPrice,
            wkPrice: draft.wkPrice,
            isTiming: draft.isTiming,
            timingPublishTime: draft.timingPublishTime,
            taskTimeLimit: draft.taskTimeLimit,
            unionInterval: draft.unionInterval,
            cycle: draft.cycle,
            isFreeShipping: draft.isFreeShipping,
            postage: draft.postage,
            deliveryRequirement: draft.deliveryRequirement,
            addReward: draft.addReward,
            memo: draft.memo,
            margin: draft.calculatedMargin,
            totalAmount: draft.calculatedTotalAmount,
            status: draft.isTiming ? TaskStatus.PENDING : TaskStatus.ACTIVE,
            startTime: draft.isTiming ? draft.timingPublishTime : new Date(),
        });

        const savedTask = await this.taskRepository.save(task);

        // 标记草稿为已完成
        draft.isCompleted = true;
        draft.taskId = savedTask.id;
        await this.draftRepository.save(draft);

        return savedTask;
    }

    /**
     * 计算任务费用（核心费用计算逻辑）
     */
    private async calculateFees(draft: TaskDraft): Promise<void> {
        // 使用 AdminConfigService 获取配置
        const getConfig = (key: string, defaultValue: number): number => {
            return this.configService.getNumberValue(key, defaultValue);
        };

        const totalCount = draft.totalCount || 1;
        const goodsPrice = draft.goodsPrice || 0;
        const commission = draft.commission || 0;

        // 1. 基础服务费（按平台类型和终端类型）
        let baseFeeRate = getConfig('base_fee_rate', 0.1);
        if (draft.terminal === TaskTerminal.BENLI_YONGHUO) {
            baseFeeRate = getConfig('benli_fee_rate', 0.15);
        }
        const baseFee = goodsPrice * baseFeeRate * totalCount;

        // 2. 好评费
        let praiseFee = 0;
        if (draft.praiseType) {
            const textPraiseRate = getConfig('text_praise_fee', 1);
            const imagePraiseRate = getConfig('image_praise_fee', 2);
            const videoPraiseRate = getConfig('video_praise_fee', 5);

            switch (draft.praiseType) {
                case 1: // 文字好评
                    praiseFee = textPraiseRate * totalCount;
                    break;
                case 2: // 图片好评
                    praiseFee = imagePraiseRate * totalCount;
                    break;
                case 3: // 视频好评
                    praiseFee = videoPraiseRate * totalCount;
                    break;
            }
        }
        if (draft.praiseFee) {
            praiseFee += draft.praiseFee * totalCount;
        }

        // 3. 定时发布费
        let timingFee = 0;
        if (draft.isTiming) {
            const timingPublishFee = getConfig('timing_publish_fee', 0.5);
            const timingPayFee = getConfig('timing_pay_fee', 0.3);
            timingFee = (timingPublishFee + timingPayFee) * totalCount;
        }

        // 4. 循环时间费
        if (draft.cycle && draft.cycle > 1) {
            const cycleFee = getConfig('cycle_fee', 0.2);
            timingFee += cycleFee * draft.cycle * totalCount;
        }

        // 5. 额外加赏
        const addRewardTotal = (draft.addReward || 0) * totalCount;

        // 6. 保证金（商品本金 + 运费）
        const postage = draft.isFreeShipping ? 0 : (draft.postage || 0);
        const margin = (goodsPrice + postage) * totalCount;

        // 7. 佣金总额
        const commissionTotal = commission * totalCount;

        // 计算总费用
        const totalAmount = baseFee + praiseFee + timingFee + addRewardTotal + margin + commissionTotal;

        // 保存计算结果
        draft.calculatedBaseFee = baseFee;
        draft.calculatedPraiseFee = praiseFee;
        draft.calculatedTimingFee = timingFee;
        draft.calculatedMargin = margin;
        draft.calculatedTotalAmount = totalAmount;
    }

    /**
     * 删除草稿
     */
    async deleteDraft(id: string, merchantId: string): Promise<void> {
        const draft = await this.getDraft(id, merchantId);
        await this.draftRepository.remove(draft);
    }
}
