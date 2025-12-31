import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ReviewTasksService } from './review-tasks.service';
import { CreateReviewTaskDto, SubmitReviewDto, ReviewTaskStatus } from './review-task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('review-tasks')
@UseGuards(JwtAuthGuard)
export class ReviewTasksController {
    constructor(private reviewTasksService: ReviewTasksService) { }

    // ============ 商家端 ============

    @Get('merchant')
    async findMerchantTasks(@Request() req, @Query('status') status?: string) {
        const statusNum = status ? parseInt(status) : undefined;
        const tasks = await this.reviewTasksService.findByMerchant(req.user.userId, statusNum);
        return { success: true, data: tasks };
    }

    @Get('merchant/stats')
    async getMerchantStats(@Request() req) {
        const stats = await this.reviewTasksService.getMerchantStats(req.user.userId);
        return { success: true, data: stats };
    }

    @Post()
    async create(@Body() dto: CreateReviewTaskDto, @Request() req) {
        try {
            const task = await this.reviewTasksService.create(req.user.userId, dto);
            return { success: true, message: '追评任务创建成功', data: task };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    @Post(':id/review')
    async review(
        @Param('id') id: string,
        @Body() body: { approved: boolean; reason?: string },
        @Request() req
    ) {
        try {
            const task = await this.reviewTasksService.review(
                id, req.user.userId, body.approved, body.reason
            );
            return {
                success: true,
                message: body.approved ? '追评审核通过' : '追评已驳回',
                data: task
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    // ============ 买手端 ============

    @Get('user')
    async findUserTasks(@Request() req, @Query('status') status?: string) {
        const statusNum = status ? parseInt(status) : undefined;
        const tasks = await this.reviewTasksService.findByUser(req.user.userId, statusNum);
        return { success: true, data: tasks };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const task = await this.reviewTasksService.findOne(id);
        if (!task) {
            return { success: false, message: '追评任务不存在' };
        }
        return { success: true, data: task };
    }

    @Post(':id/submit')
    async submit(@Param('id') id: string, @Body() dto: SubmitReviewDto, @Request() req) {
        try {
            const task = await this.reviewTasksService.submitReview(id, req.user.userId, dto);
            return { success: true, message: '追评提交成功', data: task };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    @Post(':id/reject')
    async reject(@Param('id') id: string, @Body() body: { reason?: string }, @Request() req) {
        try {
            const task = await this.reviewTasksService.reject(id, req.user.userId, body.reason);
            return { success: true, message: '已拒绝追评', data: task };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}
