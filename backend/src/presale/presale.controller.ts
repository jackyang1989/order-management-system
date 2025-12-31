import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { PresaleService } from './presale.service';
import { Order } from '../orders/order.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('presale')
@UseGuards(JwtAuthGuard)
export class PresaleController {
    constructor(private readonly presaleService: PresaleService) { }

    /**
     * 买手：获取我的预售订单
     */
    @Get('my-orders')
    async getMyPresaleOrders(@Request() req): Promise<Order[]> {
        return this.presaleService.getPresaleOrders(req.user.id);
    }

    /**
     * 买手：领取预售任务
     */
    @Post('claim')
    async claimPresaleTask(
        @Request() req,
        @Body() data: { taskId: string; buyerAccountId: string },
    ): Promise<Order> {
        return this.presaleService.claimPresaleTask(
            data.taskId,
            req.user.id,
            data.buyerAccountId,
        );
    }

    /**
     * 买手：提交预付款凭证
     */
    @Post('submit-yf/:orderId')
    async submitYfPayment(
        @Param('orderId') orderId: string,
        @Request() req,
        @Body() data: { yfScreenshot: string; orderNo?: string },
    ): Promise<Order> {
        return this.presaleService.submitYfPayment(orderId, req.user.id, data);
    }

    /**
     * 买手：提交尾款凭证
     */
    @Post('submit-wk/:orderId')
    async submitWkPayment(
        @Param('orderId') orderId: string,
        @Request() req,
        @Body() data: { wkScreenshot: string },
    ): Promise<Order> {
        return this.presaleService.submitWkPayment(orderId, req.user.id, data);
    }

    /**
     * 商家：获取待处理的预售订单
     */
    @Get('merchant/pending')
    async getPendingPresaleOrders(@Request() req): Promise<Order[]> {
        return this.presaleService.getPendingPresaleOrders(req.user.id);
    }

    /**
     * 商家：确认预付款
     */
    @Post('merchant/confirm-yf/:orderId')
    async confirmYfPayment(
        @Param('orderId') orderId: string,
        @Request() req,
        @Body() data: { approved: boolean; remarks?: string },
    ): Promise<Order> {
        return this.presaleService.confirmYfPayment(
            orderId,
            req.user.id,
            data.approved,
            data.remarks,
        );
    }

    /**
     * 商家：确认尾款
     */
    @Post('merchant/confirm-wk/:orderId')
    async confirmWkPayment(
        @Param('orderId') orderId: string,
        @Request() req,
        @Body() data: { approved: boolean; remarks?: string },
    ): Promise<Order> {
        return this.presaleService.confirmWkPayment(
            orderId,
            req.user.id,
            data.approved,
            data.remarks,
        );
    }

    /**
     * 商家：预售统计
     */
    @Get('merchant/stats')
    async getPresaleStats(@Request() req) {
        return this.presaleService.getPresaleStats(req.user.id);
    }
}
