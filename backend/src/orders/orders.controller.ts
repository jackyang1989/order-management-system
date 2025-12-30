import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, SubmitStepDto, OrderFilterDto } from './order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    @Get()
    async findAll(@Request() req, @Query() filter: OrderFilterDto) {
        const orders = await this.ordersService.findAll(req.user.userId, filter);
        return {
            success: true,
            data: orders
        };
    }

    @Get('stats')
    async getStats(@Request() req) {
        const stats = await this.ordersService.getStats(req.user.userId);
        return {
            success: true,
            data: stats
        };
    }

    @Get(':id')
    async findOne(@Param('id') id: string, @Request() req) {
        const order = await this.ordersService.findOne(id);
        if (!order) {
            return {
                success: false,
                message: '订单不存在'
            };
        }
        if (order.userId !== req.user.userId) {
            return {
                success: false,
                message: '无权访问此订单'
            };
        }
        return {
            success: true,
            data: order
        };
    }

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
        try {
            const order = await this.ordersService.create(req.user.userId, createOrderDto);
            return {
                success: true,
                message: '订单创建成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/submit-step')
    async submitStep(@Param('id') id: string, @Body() submitStepDto: SubmitStepDto, @Request() req) {
        try {
            const order = await this.ordersService.submitStep(id, req.user.userId, submitStepDto);
            return {
                success: true,
                message: order.currentStep > order.totalSteps ? '任务已完成，等待审核' : '步骤提交成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}
