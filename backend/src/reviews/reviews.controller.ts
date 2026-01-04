import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewTasksService } from '../review-tasks/review-tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  SubmitReviewDto,
  RejectReviewDto,
  ReviewTaskFilterDto,
} from '../review-tasks/review-task.entity';

/**
 * 追评路由别名控制器
 * 对齐旧版 PHP: zhuipin() / zhuidetail() / refuse_zhuipin()
 * 实际业务逻辑委托给 ReviewTasksService
 */
@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewTasksService: ReviewTasksService) {}

  /**
   * 获取追评任务列表
   * 对齐旧版: zhuipin()
   */
  @Get()
  async list(
    @Request() req,
    @Query('state') state?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: ReviewTaskFilterDto = {
      state: state !== undefined ? parseInt(state) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
    };
    const result = await this.reviewTasksService.findByUser(
      req.user.userId,
      filter,
    );
    return { success: true, data: result };
  }

  /**
   * 获取追评任务详情
   * 对齐旧版: zhuidetail()
   */
  @Get(':id')
  async detail(@Param('id') id: string, @Request() req) {
    const result = await this.reviewTasksService.findOneWithPraises(id);
    if (!result) {
      return { success: false, message: '追评任务不存在' };
    }
    // 验证任务属于当前用户
    if (result.task && result.task.userId !== req.user.userId) {
      return { success: false, message: '无权查看此追评任务' };
    }
    return { success: true, data: result };
  }

  /**
   * 提交追评
   * 对齐旧版: 提交追评截图
   */
  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Body() dto: { images?: string[]; reviewImage?: string; reviewImages?: string[] },
    @Request() req,
  ) {
    try {
      // 兼容多种传参格式
      let images: string[] = [];
      if (dto.images && dto.images.length > 0) {
        images = dto.images;
      } else if (dto.reviewImages && dto.reviewImages.length > 0) {
        images = dto.reviewImages;
      } else if (dto.reviewImage) {
        images = [dto.reviewImage];
      }

      const submitDto: SubmitReviewDto = {
        reviewTaskId: id,
        images,
      };
      const task = await this.reviewTasksService.submitReview(
        req.user.userId,
        submitDto,
      );
      return {
        success: true,
        message: '追评提交成功，等待商家确认',
        data: task,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 拒绝追评
   * 对齐旧版: refuse_zhuipin()
   */
  @Post(':id/refuse')
  async refuse(
    @Param('id') id: string,
    @Body() dto: { reason?: string },
    @Request() req,
  ) {
    try {
      const rejectDto: RejectReviewDto = {
        reviewTaskId: id,
        reason: dto.reason,
      };
      const task = await this.reviewTasksService.rejectByBuyer(
        req.user.userId,
        rejectDto,
      );
      return { success: true, message: '已拒绝追评任务', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
