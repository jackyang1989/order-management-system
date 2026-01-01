import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order, OrderStatus } from '../orders/order.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import * as ExcelJS from 'exceljs';

export interface ExportColumn {
    header: string;
    key: string;
    width?: number;
}

@Injectable()
export class ExcelService {

    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
    ) { }

    // ============ 导出功能 ============

    /**
     * 导出订单列表
     */
    async exportOrders(
        filter: {
            status?: OrderStatus;
            startDate?: Date;
            endDate?: Date;
            merchantId?: string;
        }
    ): Promise<Buffer> {
        const queryBuilder = this.orderRepository.createQueryBuilder('o');

        if (filter.status) {
            queryBuilder.andWhere('o.status = :status', { status: filter.status });
        }
        if (filter.startDate && filter.endDate) {
            queryBuilder.andWhere('o.createdAt BETWEEN :startDate AND :endDate', {
                startDate: filter.startDate,
                endDate: filter.endDate
            });
        }
        if (filter.merchantId) {
            queryBuilder.andWhere('o.taskId IN (SELECT id FROM tasks WHERE merchantId = :merchantId)', {
                merchantId: filter.merchantId
            });
        }

        const orders = await queryBuilder.orderBy('o.createdAt', 'DESC').getMany();

        const columns: ExportColumn[] = [
            { header: '订单ID', key: 'id', width: 20 },
            { header: '任务标题', key: 'taskTitle', width: 30 },
            { header: '平台', key: 'platform', width: 10 },
            { header: '商品名称', key: 'productName', width: 30 },
            { header: '商品价格', key: 'productPrice', width: 12 },
            { header: '佣金', key: 'commission', width: 12 },
            { header: '买号', key: 'buynoAccount', width: 20 },
            { header: '淘宝订单号', key: 'taobaoOrderNumber', width: 25 },
            { header: '快递公司', key: 'delivery', width: 15 },
            { header: '快递单号', key: 'deliveryNum', width: 20 },
            { header: '收货人', key: 'addressName', width: 12 },
            { header: '收货电话', key: 'addressPhone', width: 15 },
            { header: '收货地址', key: 'address', width: 40 },
            { header: '状态', key: 'status', width: 15 },
            { header: '创建时间', key: 'createdAt', width: 20 },
        ];

        const data = orders.map(order => ({
            ...order,
            createdAt: order.createdAt?.toISOString?.() || '',
            status: this.getOrderStatusText(order.status),
        }));

        return this.generateExcel(columns, data, '订单列表');
    }

    /**
     * 导出任务列表
     */
    async exportTasks(
        filter: {
            status?: TaskStatus;
            merchantId?: string;
            startDate?: Date;
            endDate?: Date;
        }
    ): Promise<Buffer> {
        const queryBuilder = this.taskRepository.createQueryBuilder('t');

        if (filter.status !== undefined) {
            queryBuilder.andWhere('t.status = :status', { status: filter.status });
        }
        if (filter.merchantId) {
            queryBuilder.andWhere('t.merchantId = :merchantId', { merchantId: filter.merchantId });
        }
        if (filter.startDate && filter.endDate) {
            queryBuilder.andWhere('t.createdAt BETWEEN :startDate AND :endDate', {
                startDate: filter.startDate,
                endDate: filter.endDate
            });
        }

        const tasks = await queryBuilder.orderBy('t.createdAt', 'DESC').getMany();

        const columns: ExportColumn[] = [
            { header: '任务编号', key: 'taskNumber', width: 15 },
            { header: '商品标题', key: 'title', width: 40 },
            { header: '店铺名称', key: 'shopName', width: 20 },
            { header: '商品价格', key: 'goodsPrice', width: 12 },
            { header: '任务单数', key: 'count', width: 10 },
            { header: '已领取', key: 'claimedCount', width: 10 },
            { header: '已完成', key: 'completedCount', width: 10 },
            { header: '佣金', key: 'totalCommission', width: 12 },
            { header: '状态', key: 'status', width: 12 },
            { header: '创建时间', key: 'createdAt', width: 20 },
        ];

        const data = tasks.map(task => ({
            ...task,
            createdAt: task.createdAt?.toISOString?.() || '',
            status: this.getTaskStatusText(task.status),
        }));

        return this.generateExcel(columns, data, '任务列表');
    }

    /**
     * 导出发货模板
     */
    async exportDeliveryTemplate(orderIds?: string[]): Promise<Buffer> {
        let orders: Order[];

        if (orderIds && orderIds.length > 0) {
            orders = await this.orderRepository.find({
                where: { id: In(orderIds) }
            });
        } else {
            orders = await this.orderRepository.find({
                where: { status: OrderStatus.WAITING_DELIVERY },
                take: 100
            });
        }

        const columns: ExportColumn[] = [
            { header: '订单ID', key: 'id', width: 40 },
            { header: '淘宝订单号', key: 'taobaoOrderNumber', width: 25 },
            { header: '收货人', key: 'addressName', width: 12 },
            { header: '收货电话', key: 'addressPhone', width: 15 },
            { header: '收货地址', key: 'address', width: 50 },
            { header: '快递公司', key: 'delivery', width: 15 },
            { header: '快递单号', key: 'deliveryNum', width: 20 },
        ];

        return this.generateExcel(columns, orders, '发货模板');
    }

    // ============ 导入功能 ============

    /**
     * 解析发货Excel
     */
    async parseDeliveryExcel(buffer: Buffer): Promise<Array<{
        orderId?: string;
        taobaoOrderNo?: string;
        delivery: string;
        deliveryNum: string;
    }>> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
            throw new Error('Excel文件为空');
        }

        const results: Array<{
            orderId?: string;
            taobaoOrderNo?: string;
            delivery: string;
            deliveryNum: string;
        }> = [];

        // 获取表头
        const headerRow = worksheet.getRow(1);
        const headers: Record<number, string> = {};
        headerRow.eachCell((cell, colNumber) => {
            headers[colNumber] = String(cell.value || '').trim();
        });

        // 找到列索引
        let orderIdCol = 0;
        let taobaoOrderNoCol = 0;
        let deliveryCol = 0;
        let deliveryNumCol = 0;

        for (const [colNum, header] of Object.entries(headers)) {
            const col = parseInt(colNum);
            if (header.includes('订单ID') || header === 'id') orderIdCol = col;
            if (header.includes('淘宝订单号') || header.includes('taobao')) taobaoOrderNoCol = col;
            if (header.includes('快递公司') || header === 'delivery') deliveryCol = col;
            if (header.includes('快递单号') || header === 'deliveryNum') deliveryNumCol = col;
        }

        if (!deliveryCol || !deliveryNumCol) {
            throw new Error('Excel格式不正确，缺少快递公司或快递单号列');
        }

        // 解析数据行
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // 跳过表头

            const orderId = orderIdCol ? String(row.getCell(orderIdCol).value || '').trim() : undefined;
            const taobaoOrderNo = taobaoOrderNoCol ? String(row.getCell(taobaoOrderNoCol).value || '').trim() : undefined;
            const delivery = String(row.getCell(deliveryCol).value || '').trim();
            const deliveryNum = String(row.getCell(deliveryNumCol).value || '').trim();

            if ((orderId || taobaoOrderNo) && delivery && deliveryNum) {
                results.push({
                    orderId: orderId || undefined,
                    taobaoOrderNo: taobaoOrderNo || undefined,
                    delivery,
                    deliveryNum,
                });
            }
        });

        return results;
    }

    // ============ 工具方法 ============

    /**
     * 生成Excel文件
     */
    private async generateExcel(
        columns: ExportColumn[],
        data: any[],
        sheetName: string
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = '订单管理系统';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet(sheetName);

        // 设置列
        worksheet.columns = columns.map(col => ({
            header: col.header,
            key: col.key,
            width: col.width || 15,
        }));

        // 设置表头样式
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // 添加数据
        data.forEach(item => {
            const row: Record<string, any> = {};
            columns.forEach(col => {
                row[col.key] = item[col.key] ?? '';
            });
            worksheet.addRow(row);
        });

        // 生成buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * 获取订单状态文本
     */
    private getOrderStatusText(status: OrderStatus): string {
        const statusMap: Record<OrderStatus, string> = {
            [OrderStatus.PENDING]: '进行中',
            [OrderStatus.SUBMITTED]: '待审核',
            [OrderStatus.APPROVED]: '已审核',
            [OrderStatus.REJECTED]: '已拒绝',
            [OrderStatus.WAITING_DELIVERY]: '待发货',
            [OrderStatus.WAITING_RECEIVE]: '待收货',
            [OrderStatus.WAITING_REFUND]: '待返款',
            [OrderStatus.WAITING_REVIEW_REFUND]: '待好评返款',
            [OrderStatus.COMPLETED]: '已完成',
            [OrderStatus.CANCELLED]: '已取消',
            [OrderStatus.REFUNDED]: '已退款',
        };
        return statusMap[status] || status;
    }

    /**
     * 获取任务状态文本
     */
    private getTaskStatusText(status: number): string {
        const statusMap: Record<number, string> = {
            [TaskStatus.PENDING_PAY]: '待支付',
            [TaskStatus.ACTIVE]: '进行中',
            [TaskStatus.COMPLETED]: '已完成',
            [TaskStatus.CANCELLED]: '已取消',
            [TaskStatus.AUDIT]: '待审核',
            [TaskStatus.PAUSED]: '已暂停',
        };
        return statusMap[status] || String(status);
    }
}
