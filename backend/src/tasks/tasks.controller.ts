import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Inject,
  forwardRef,
  Res,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ClaimTaskDto, TaskFilterDto } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';

@Controller('tasks')
export class TasksController {
  constructor(
    private tasksService: TasksService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  @Get()
  async findAll(@Query() filter: TaskFilterDto) {
    const tasks = await this.tasksService.findAll(filter);
    return {
      success: true,
      data: tasks,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.tasksService.findOneWithDetails(id);
    if (!result) {
      return {
        success: false,
        message: '任务不存在',
      };
    }
    return {
      success: true,
      data: {
        ...result.task,
        goodsList: result.goodsList,
        keywords: result.keywords,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    try {
      // 使用 createAndPay 完成支付闭环
      const task = await this.tasksService.createAndPay(
        createTaskDto,
        req.user.userId,
      );
      return {
        success: true,
        message: '任务发布成功',
        data: task,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || '任务发布失败',
      };
    }
  }

  // 获取商户自己的任务列表
  @UseGuards(JwtAuthGuard)
  @Get('merchant')
  async findMerchantTasks(@Query() filter: TaskFilterDto, @Request() req) {
    const tasks = await this.tasksService.findByMerchant(
      req.user.userId,
      filter,
    );
    return {
      success: true,
      data: tasks,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/claim')
  async claim(
    @Param('id') id: string,
    @Body() claimDto: { buynoId: string; buynoAccount?: string },
    @Request() req,
  ) {
    // 先调用 TasksService 验证和更新任务
    const claimResult = await this.tasksService.claim(
      id,
      req.user.userId,
      claimDto.buynoId,
    );

    if (claimResult.success) {
      // 创建订单
      const order = await this.ordersService.create(req.user.userId, {
        taskId: id,
        buynoId: claimDto.buynoId,
        buynoAccount: claimDto.buynoAccount || claimDto.buynoId,
      });

      return {
        success: true,
        message: '任务领取成功',
        orderId: order.id,
        data: order,
      };
    }

    return claimResult;
  }

  // ============ 商家端批量导入 ============

  /**
   * 下载导入模板
   */
  @Get('import/template')
  async downloadTemplate(@Res() res: Response) {
    const buffer = this.tasksService.getImportTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=task_import_template.xlsx');
    res.send(buffer);
  }

  /**
   * 批量导入任务
   */
  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async batchImport(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      return {
        success: false,
        message: '请上传Excel文件',
      };
    }

    try {
      const result = await this.tasksService.batchImportFromExcel(
        req.user.userId,
        file.buffer,
      );
      return {
        success: true,
        message: `导入完成：成功${result.success}条，失败${result.failed}条`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
