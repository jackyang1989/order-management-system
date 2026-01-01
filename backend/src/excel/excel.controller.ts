import { Controller, Get, Post, Query, Res, Body, UseGuards, UseInterceptors, UploadedFile, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as express from 'express';
import { ExcelService } from './excel.service';
import { BatchOperationsService } from '../batch-operations/batch-operations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '../orders/order.entity';
import { TaskStatus } from '../tasks/task.entity';

@Controller('excel')
export class ExcelController {
    constructor(
        private excelService: ExcelService,
        private batchService: BatchOperationsService,
    ) { }

    // ============ 导出接口 ============

    /**
     * 导出订单
     */
    @Get('export/orders')
    @UseGuards(JwtAuthGuard)
    async exportOrders(
        @Res() res: express.Response,
        @Query('status') status?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('merchantId') merchantId?: string,
    ) {
        const buffer = await this.excelService.exportOrders({
            status: status as OrderStatus,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            merchantId,
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
        res.send(buffer);
    }

    /**
     * 导出任务
     */
    @Get('export/tasks')
    @UseGuards(JwtAuthGuard)
    async exportTasks(
        @Res() res: express.Response,
        @Query('status') status?: string,
        @Query('merchantId') merchantId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const buffer = await this.excelService.exportTasks({
            status: status ? parseInt(status, 10) as TaskStatus : undefined,
            merchantId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=tasks_${Date.now()}.xlsx`);
        res.send(buffer);
    }

    /**
     * 导出发货模板
     */
    @Get('export/delivery-template')
    @UseGuards(JwtAuthGuard)
    async exportDeliveryTemplate(
        @Res() res: express.Response,
        @Query('orderIds') orderIds?: string,
    ) {
        const ids = orderIds ? orderIds.split(',') : undefined;
        const buffer = await this.excelService.exportDeliveryTemplate(ids);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=delivery_template_${Date.now()}.xlsx`);
        res.send(buffer);
    }

    // ============ 导入接口 ============

    /**
     * 导入发货信息
     */
    @Post('import/delivery')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file'))
    async importDelivery(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any
    ) {
        if (!file) {
            return { success: false, message: '请上传Excel文件' };
        }

        try {
            // 解析Excel
            const data = await this.excelService.parseDeliveryExcel(file.buffer);

            if (data.length === 0) {
                return { success: false, message: 'Excel中没有有效数据' };
            }

            // 批量发货
            const result = await this.batchService.batchShipFromExcel(
                data,
                req.user.userId,
                req.user.username || '管理员'
            );

            return {
                success: true,
                message: `导入完成：成功${result.success}个，失败${result.failed}个`,
                data: result
            };
        } catch (error: any) {
            return { success: false, message: `导入失败: ${error.message}` };
        }
    }
}
