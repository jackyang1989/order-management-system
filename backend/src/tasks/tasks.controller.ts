import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Inject, forwardRef } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, ClaimTaskDto, TaskFilterDto } from './task.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdersService } from '../orders/orders.service';

@Controller('tasks')
export class TasksController {
    constructor(
        private tasksService: TasksService,
        @Inject(forwardRef(() => OrdersService))
        private ordersService: OrdersService
    ) { }

    @Get()
    async findAll(@Query() filter: TaskFilterDto) {
        const tasks = await this.tasksService.findAll(filter);
        return {
            success: true,
            data: tasks
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        const task = await this.tasksService.findOne(id);
        if (!task) {
            return {
                success: false,
                message: '任务不存在'
            };
        }
        return {
            success: true,
            data: task
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
        try {
            // 使用 createAndPay 完成支付闭环
            const task = await this.tasksService.createAndPay(createTaskDto, req.user.userId);
            return {
                success: true,
                message: '任务发布成功',
                data: task
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || '任务发布失败'
            };
        }
    }

    // 获取商户自己的任务列表
    @UseGuards(JwtAuthGuard)
    @Get('merchant')
    async findMerchantTasks(@Query() filter: TaskFilterDto, @Request() req) {
        const tasks = await this.tasksService.findByMerchant(req.user.userId, filter);
        return {
            success: true,
            data: tasks
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/claim')
    async claim(@Param('id') id: string, @Body() claimDto: { buynoId: string; buynoAccount?: string }, @Request() req) {
        // 先调用 TasksService 验证和更新任务
        const claimResult = await this.tasksService.claim(id, req.user.userId, claimDto.buynoId);

        if (claimResult.success) {
            // 创建订单
            const order = await this.ordersService.create(req.user.userId, {
                taskId: id,
                buynoId: claimDto.buynoId,
                buynoAccount: claimDto.buynoAccount || claimDto.buynoId
            });

            return {
                success: true,
                message: '任务领取成功',
                orderId: order.id,
                data: order
            };
        }

        return claimResult;
    }
}
