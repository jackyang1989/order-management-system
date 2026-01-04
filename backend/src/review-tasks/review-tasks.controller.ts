import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewTasksService } from './review-tasks.service';
import {
  CreateReviewTaskDto,
  PayReviewTaskDto,
  SubmitReviewDto,
  RejectReviewDto,
  ConfirmReviewDto,
  CancelReviewDto,
  ReviewTaskFilterDto,
  ReviewTaskStatus,
  AdminReviewExamineDto,
  AdminBatchRefundDto,
} from './review-task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('review-tasks')
@UseGuards(JwtAuthGuard)
export class ReviewTasksController {
  constructor(private reviewTasksService: ReviewTasksService) {}

  // ============================================================
  // 商家端接口
  // ============================================================

  /**
   * 获取可追评的订单列表
   */
  @Get('merchant/reviewable-orders')
  async getReviewableOrders(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const result = await this.reviewTasksService.getReviewableOrders(
        req.user.userId,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 15,
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 检查订单是否可追评
   */
  @Get('merchant/check/:orderId')
  async checkReviewable(@Param('orderId') orderId: string, @Request() req) {
    const result = await this.reviewTasksService.checkReviewable(
      orderId,
      req.user.userId,
    );
    return { success: true, data: result };
  }

  /**
   * 创建追评任务
   * 第一步: 创建任务, 状态为未支付
   */
  @Post('merchant/create')
  async createReviewTask(@Body() dto: CreateReviewTaskDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.createReviewTask(
        req.user.userId,
        dto,
      );
      return { success: true, message: '追评任务创建成功，请支付', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 支付追评任务
   * 第二步: 支付任务费用
   */
  @Post('merchant/pay')
  async payReviewTask(@Body() dto: PayReviewTaskDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.payReviewTask(
        req.user.userId,
        dto,
      );
      return { success: true, message: '支付成功', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 商家取消追评任务
   */
  @Post('merchant/cancel')
  async cancelReviewTask(@Body() dto: CancelReviewDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.cancelReviewTask(
        req.user.userId,
        dto,
      );
      return { success: true, message: '取消成功，费用已退还', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 商家确认追评完成
   */
  @Post('merchant/confirm')
  async confirmReview(@Body() dto: ConfirmReviewDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.confirmReview(
        req.user.userId,
        dto,
      );
      return {
        success: true,
        message: '确认完成，佣金已发放给买手',
        data: task,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 商家追评任务列表
   */
  @Get('merchant/list')
  async getMerchantTasks(
    @Request() req,
    @Query('state') state?: string,
    @Query('taskNumber') taskNumber?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: ReviewTaskFilterDto = {
      state: state !== undefined ? parseInt(state) : undefined,
      taskNumber,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
    };
    const result = await this.reviewTasksService.findByMerchant(
      req.user.userId,
      filter,
    );
    return { success: true, data: result };
  }

  /**
   * 商家追评统计
   */
  @Get('merchant/stats')
  async getMerchantStats(@Request() req) {
    const stats = await this.reviewTasksService.getStats(req.user.userId);
    return { success: true, data: stats };
  }

  // ============================================================
  // 买手端接口
  // ============================================================

  /**
   * 买手追评任务列表
   */
  @Get('user/list')
  async getUserTasks(
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
   * 买手待处理的追评任务 (state=2 已审核)
   */
  @Get('user/pending')
  async getUserPendingTasks(@Request() req) {
    const filter: ReviewTaskFilterDto = {
      state: ReviewTaskStatus.APPROVED,
      page: 1,
      limit: 100,
    };
    const result = await this.reviewTasksService.findByUser(
      req.user.userId,
      filter,
    );
    return { success: true, data: result };
  }

  /**
   * 买手提交追评截图
   */
  @Post('user/submit')
  async submitReview(@Body() dto: SubmitReviewDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.submitReview(
        req.user.userId,
        dto,
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
   * 买手拒绝追评
   */
  @Post('user/reject')
  async rejectReview(@Body() dto: RejectReviewDto, @Request() req) {
    try {
      const task = await this.reviewTasksService.rejectByBuyer(
        req.user.userId,
        dto,
      );
      return { success: true, message: '已拒绝追评任务', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 管理端接口
  // ============================================================

  /**
   * 管理端追评任务列表
   */
  @Get('admin/list')
  async getAdminTasks(
    @Query('state') state?: string,
    @Query('taskNumber') taskNumber?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filter: ReviewTaskFilterDto = {
      state: state !== undefined ? parseInt(state) : undefined,
      taskNumber,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 15,
    };
    const result = await this.reviewTasksService.findAll(filter);
    return { success: true, data: result };
  }

  /**
   * 管理端追评统计
   */
  @Get('admin/stats')
  async getAdminStats() {
    const stats = await this.reviewTasksService.getStats();
    return { success: true, data: stats };
  }

  /**
   * 管理员审核追评
   */
  @Post('admin/examine')
  async adminExamine(@Body() dto: AdminReviewExamineDto) {
    try {
      const task = await this.reviewTasksService.adminExamine(
        dto.reviewTaskId,
        dto.state,
        dto.remarks,
      );
      const message =
        dto.state === ReviewTaskStatus.APPROVED
          ? '审核通过，已通知买手'
          : '已拒绝';
      return { success: true, message, data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 管理员批量审核
   */
  @Post('admin/batch-examine')
  async adminBatchExamine(@Body() body: { reviewTaskIds: string[] }) {
    try {
      const result = await this.reviewTasksService.adminBatchExamine(
        body.reviewTaskIds,
      );
      return {
        success: true,
        message: `批量审核完成: ${result.success}个成功, ${result.failed}个失败`,
        data: result,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 管理员返款
   */
  @Post('admin/refund/:id')
  async adminRefund(@Param('id') id: string) {
    try {
      const task = await this.reviewTasksService.adminRefund(id);
      return { success: true, message: '返款成功', data: task };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * 管理员批量返款
   */
  @Post('admin/batch-refund')
  async adminBatchRefund(@Body() dto: AdminBatchRefundDto) {
    try {
      const result = await this.reviewTasksService.adminBatchRefund(
        dto.reviewTaskIds,
      );
      return {
        success: true,
        message: `批量返款完成: ${result.success}个成功, ${result.failed}个失败`,
        data: result,
      };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // ============================================================
  // 公共接口
  // ============================================================

  /**
   * 获取追评任务详情
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const task = await this.reviewTasksService.findOne(id);
    if (!task) {
      return { success: false, message: '追评任务不存在' };
    }
    return { success: true, data: task };
  }

  /**
   * 获取追评任务详情（含好评内容要求）
   */
  @Get(':id/detail')
  async findOneWithPraises(@Param('id') id: string) {
    const result = await this.reviewTasksService.findOneWithPraises(id);
    if (!result) {
      return { success: false, message: '追评任务不存在' };
    }
    return { success: true, data: result };
  }
}
