import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { TaskDraftsService } from './task-drafts.service';
import { TaskDraft } from './task-draft.entity';
import { Task } from '../tasks/task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DingdanxiaService, GoodsInfoResult } from '../dingdanxia/dingdanxia.service';

@Controller('task-drafts')
@UseGuards(JwtAuthGuard)
export class TaskDraftsController {
    constructor(
        private readonly draftsService: TaskDraftsService,
        private readonly dingdanxiaService: DingdanxiaService,
    ) { }

    /**
     * 解析商品链接/淘口令，自动获取商品信息
     * 用于发布任务时自动填充
     */
    @Post('parse-goods')
    async parseGoodsLink(
        @Body('link') link: string,
    ): Promise<GoodsInfoResult> {
        return this.dingdanxiaService.getGoodsInfo(link);
    }

    /**
     * 创建新草稿
     */
    @Post()
    async create(@Request() req): Promise<TaskDraft> {
        return this.draftsService.createDraft(req.user.id);
    }

    /**
     * 获取我的草稿列表
     */
    @Get()
    async findAll(@Request() req): Promise<TaskDraft[]> {
        return this.draftsService.getDrafts(req.user.id);
    }

    /**
     * 获取单个草稿
     */
    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req): Promise<TaskDraft> {
        return this.draftsService.getDraft(id, req.user.id);
    }

    /**
     * Step 1: 保存基础信息
     */
    @Put(':id/step1')
    async saveStep1(
        @Param('id') id: string,
        @Request() req,
        @Body() data: {
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
        return this.draftsService.saveStep1(id, req.user.id, data);
    }

    /**
     * Step 2: 保存高级设置
     */
    @Put(':id/step2')
    async saveStep2(
        @Param('id') id: string,
        @Request() req,
        @Body() data: {
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
        return this.draftsService.saveStep2(id, req.user.id, data);
    }

    /**
     * Step 3: 预览确认
     */
    @Post(':id/step3')
    async previewStep3(
        @Param('id') id: string,
        @Request() req,
    ): Promise<TaskDraft> {
        return this.draftsService.previewStep3(id, req.user.id);
    }

    /**
     * Step 4: 支付并创建任务
     */
    @Post(':id/pay')
    async payAndCreate(
        @Param('id') id: string,
        @Request() req,
    ): Promise<Task> {
        return this.draftsService.payAndCreate(id, req.user.id);
    }

    /**
     * 删除草稿
     */
    @Delete(':id')
    async delete(@Param('id') id: string, @Request() req): Promise<{ success: boolean }> {
        await this.draftsService.deleteDraft(id, req.user.id);
        return { success: true };
    }
}
