import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BatchOperationsService } from './batch-operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('batch')
export class BatchOperationsController {
    constructor(private batchService: BatchOperationsService) { }

    /**
     * 批量发货
     */
    @Post('ship')
    @UseGuards(JwtAuthGuard)
    async batchShip(
        @Body() body: {
            orders: Array<{
                orderId: string;
                delivery: string;
                deliveryNum: string;
            }>;
        },
        @Request() req
    ) {
        const orderIds = body.orders.map(o => o.orderId);
        const deliveryData = body.orders.map(o => ({
            delivery: o.delivery,
            deliveryNum: o.deliveryNum
        }));

        const result = await this.batchService.batchShip(
            orderIds,
            deliveryData,
            req.user.userId,
            req.user.username || '管理员'
        );

        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }

    /**
     * Excel导入发货
     */
    @Post('ship/import')
    @UseGuards(JwtAuthGuard)
    async batchShipFromExcel(
        @Body() body: {
            data: Array<{
                orderNo?: string;
                taobaoOrderNo?: string;
                delivery: string;
                deliveryNum: string;
            }>;
        },
        @Request() req
    ) {
        const result = await this.batchService.batchShipFromExcel(
            body.data,
            req.user.userId,
            req.user.username || '管理员'
        );

        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }

    /**
     * 批量审核任务
     */
    @Post('approve-tasks')
    @UseGuards(JwtAuthGuard)
    async batchApproveTasks(@Body() body: { taskIds: string[] }, @Request() req) {
        const result = await this.batchService.batchApproveTasks(body.taskIds, req.user.userId);
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }

    /**
     * 批量审核订单
     */
    @Post('approve-orders')
    @UseGuards(JwtAuthGuard)
    async batchApproveOrders(@Body() body: { orderIds: string[] }, @Request() req) {
        const result = await this.batchService.batchApproveOrders(
            body.orderIds,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }

    /**
     * 批量返款
     */
    @Post('refund')
    @UseGuards(JwtAuthGuard)
    async batchRefund(@Body() body: { orderIds: string[] }, @Request() req) {
        const result = await this.batchService.batchRefund(
            body.orderIds,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个，总金额${result.totalAmount}元`,
            data: result
        };
    }

    /**
     * 批量审核追评
     */
    @Post('approve-reviews')
    @UseGuards(JwtAuthGuard)
    async batchApproveReviews(@Body() body: { reviewTaskIds: string[] }, @Request() req) {
        const result = await this.batchService.batchApproveReviewTasks(
            body.reviewTaskIds,
            req.user.userId
        );
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }

    /**
     * 批量返款追评
     */
    @Post('refund-reviews')
    @UseGuards(JwtAuthGuard)
    async batchRefundReviews(@Body() body: { reviewTaskIds: string[] }, @Request() req) {
        const result = await this.batchService.batchRefundReviewTasks(
            body.reviewTaskIds,
            req.user.userId
        );
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个，总金额${result.totalAmount}元`,
            data: result
        };
    }

    /**
     * 批量取消订单
     */
    @Post('cancel-orders')
    @UseGuards(JwtAuthGuard)
    async batchCancelOrders(
        @Body() body: { orderIds: string[]; reason: string },
        @Request() req
    ) {
        const result = await this.batchService.batchCancelOrders(
            body.orderIds,
            body.reason,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: true,
            message: `成功${result.success}个，失败${result.failed}个`,
            data: result
        };
    }
}
