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
    async create(@Body() createTaskDto: CreateTaskDto) {
        const task = await this.tasksService.create(createTaskDto);
        return {
            success: true,
            message: '任务创建成功',
            data: task
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
