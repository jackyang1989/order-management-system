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
     * Excel导入发货 (双模式导入)
     * 对应原版接口: Task::import (按ID) 和 Task::import1 (按任务编号)
     * 业务语义: 支持通过订单ID或任务编号两种方式匹配订单并发货
     * 前置条件: user_task.state = 3 (待发货)
     */
    @Post('ship/import')
    @UseGuards(JwtAuthGuard)
    async batchShipFromExcel(
        @Body() body: {
            data: Array<{
                orderId?: string;       // 模式1: 按订单ID匹配
                taskNumber?: string;    // 模式2: 按任务编号匹配
                orderNo?: string;       // 兼容: 按订单号匹配
                taobaoOrderNo?: string; // 兼容: 按淘宝单号匹配
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

    /**
     * 预售返款（预付款/尾款）
     * 对应原版接口: Task::returnys
     * 业务语义: 对预售订单(is_ys=1)进行预付款或尾款返款操作
     * 前置条件: user_task.state = 5 (待返款), is_ys = 1
     * 后置状态: user_task.state = 6 (待确认返款)
     */
    @Post('presale-refund')
    @UseGuards(JwtAuthGuard)
    async presaleRefund(
        @Body() body: { orderId: string; type: 1 | 2 },
        @Request() req
    ) {
        const result = await this.batchService.presaleRefund(
            body.orderId,
            body.type,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: result.success,
            message: result.message,
            data: result
        };
    }

    /**
     * 修改预付金额
     * 对应原版接口: Task::return_price1
     * 业务语义: 后台修改预售订单的预付款金额(yf_price)
     * 前置条件: user_task.state = 5 (待返款)
     * 限制: 浮动不能超过 ±500元
     */
    @Post('update-yf-price')
    @UseGuards(JwtAuthGuard)
    async updateYfPrice(
        @Body() body: { orderId: string; price: number },
        @Request() req
    ) {
        const result = await this.batchService.updateYfPrice(
            body.orderId,
            body.price,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: result.success,
            message: result.message,
            data: result
        };
    }

    /**
     * 修改尾款金额
     * 对应原版接口: Task::return_price2
     * 业务语义: 后台修改预售订单的尾款金额(wk_price)
     * 前置条件: user_task.state = 5 (待返款)
     * 限制: 浮动不能超过 ±100元
     */
    @Post('update-wk-price')
    @UseGuards(JwtAuthGuard)
    async updateWkPrice(
        @Body() body: { orderId: string; price: number },
        @Request() req
    ) {
        const result = await this.batchService.updateWkPrice(
            body.orderId,
            body.price,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: result.success,
            message: result.message,
            data: result
        };
    }

    /**
     * 修改剩余单数
     * 对应原版接口: Task::incomplete_num
     * 业务语义: 后台修改商家任务的剩余单数(incomplete_num)
     * 前置条件: seller_task.status = 3(已通过), 4(已拒绝), 5(已取消)
     * 禁止状态: status = 1(未支付), 2(待审核), 6(已完成)
     */
    @Post('update-incomplete-num')
    @UseGuards(JwtAuthGuard)
    async updateIncompleteNum(
        @Body() body: { taskId: string; incompleteNum: number },
        @Request() req
    ) {
        const result = await this.batchService.updateIncompleteNum(
            body.taskId,
            body.incompleteNum,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: result.success,
            message: result.message,
            data: result
        };
    }

    /**
     * 任务回退重发货
     * 对应原版接口: Task::regression_examine
     * 业务语义: 将待返款(state=5)的订单回退到待收货(state=4)，重新发货
     * 前置条件: user_task.state = 5 (待返款)
     * 后置状态: user_task.state = 4 (待收货)
     */
    @Post('regression-examine')
    @UseGuards(JwtAuthGuard)
    async regressionExamine(
        @Body() body: { orderId: string; delivery: string; deliveryNum: string },
        @Request() req
    ) {
        const result = await this.batchService.regressionExamine(
            body.orderId,
            body.delivery,
            body.deliveryNum,
            req.user.userId,
            req.user.username || '管理员'
        );
        return {
            success: result.success,
            message: result.message,
            data: result
        };
    }
}
