import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, SubmitStepDto, OrderFilterDto } from './order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private ordersService: OrdersService) { }

    // ============ 管理员端订单管理 ============

    @Get('admin/list')
    @UseGuards(RolesGuard)
    @Roles('admin')
    async adminFindAll(@Query() query: any) {
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 20;
        const status = query.status;

        const result = await this.ordersService.findAllAdmin({ page, limit, status });
        return {
            success: true,
            data: result.data,
            total: result.total,
            page,
            limit
        };
    }

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

    // ============ 商家端订单审核 ============

    @Get('merchant/list')
    async findMerchantOrders(@Request() req, @Query('status') status?: string) {
        const filter = status ? { status: status as any } : undefined;
        const orders = await this.ordersService.findByMerchant(req.user.userId, filter);
        return {
            success: true,
            data: orders
        };
    }

    @Get('merchant/stats')
    async getMerchantStats(@Request() req) {
        const stats = await this.ordersService.getMerchantStats(req.user.userId);
        return {
            success: true,
            data: stats
        };
    }

    @Post(':id/review')
    async review(
        @Param('id') id: string,
        @Body() body: { approved: boolean; rejectReason?: string },
        @Request() req
    ) {
        try {
            const order = await this.ordersService.review(
                id,
                req.user.userId,
                body.approved,
                body.rejectReason
            );
            return {
                success: true,
                message: body.approved ? '订单审核通过' : '订单已驳回',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // ============ 发货管理 ============

    @Post(':id/ship')
    async shipOrder(
        @Param('id') id: string,
        @Body() body: { delivery: string; deliveryNum: string },
        @Request() req
    ) {
        try {
            const order = await this.ordersService.shipOrder(
                id,
                req.user.userId,
                body.delivery,
                body.deliveryNum
            );
            return {
                success: true,
                message: '发货成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/confirm-receipt')
    async confirmReceipt(@Param('id') id: string, @Request() req) {
        try {
            const order = await this.ordersService.confirmReceipt(id, req.user.userId);
            return {
                success: true,
                message: '确认收货成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/taobao-order')
    async updateTaobaoOrderNumber(
        @Param('id') id: string,
        @Body() body: { taobaoOrderNumber: string },
        @Request() req
    ) {
        try {
            const order = await this.ordersService.updateTaobaoOrderNumber(
                id,
                req.user.userId,
                body.taobaoOrderNumber
            );
            return {
                success: true,
                message: '淘宝订单号更新成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/address')
    async updateAddress(
        @Param('id') id: string,
        @Body() body: { addressName: string; addressPhone: string; address: string },
        @Request() req
    ) {
        try {
            const order = await this.ordersService.updateAddress(id, req.user.userId, body);
            return {
                success: true,
                message: '收货地址更新成功',
                data: order
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    @Post(':id/cancel')
    async cancelOrder(@Param('id') id: string, @Request() req) {
        try {
            const order = await this.ordersService.cancelOrder(id, req.user.userId);
            return {
                success: true,
                message: '订单已取消',
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

