import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
    PaymentCallback,
    PaymentOrder,
    PaymentChannel,
    PaymentType,
    CallbackStatus,
    CreatePaymentOrderDto,
    PaymentCallbackFilterDto,
} from './payment.entity';

@Injectable()
export class PaymentsService {
    constructor(
        @InjectRepository(PaymentCallback)
        private callbackRepository: Repository<PaymentCallback>,
        @InjectRepository(PaymentOrder)
        private orderRepository: Repository<PaymentOrder>,
    ) { }

    // ============ 支付订单管理 ============

    /**
     * 生成订单号
     */
    private generateOrderNo(): string {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `PAY${dateStr}${random}`;
    }

    /**
     * 创建支付订单
     */
    async createOrder(dto: CreatePaymentOrderDto): Promise<PaymentOrder> {
        const orderNo = this.generateOrderNo();
        const expireAt = new Date();
        expireAt.setMinutes(expireAt.getMinutes() + 30);  // 30分钟过期

        const order = this.orderRepository.create({
            orderNo,
            ...dto,
            status: 0,
            expireAt,
        });

        // 调用第三方支付获取支付链接（模拟）
        order.payUrl = await this.getPayUrl(order);

        return this.orderRepository.save(order);
    }

    /**
     * 获取支付链接（模拟）
     */
    private async getPayUrl(order: PaymentOrder): Promise<string> {
        // 实际项目中对接支付宝、微信等支付接口
        switch (order.channel) {
            case PaymentChannel.ALIPAY:
                return `https://alipay.com/pay?order=${order.orderNo}&amount=${order.amount}`;
            case PaymentChannel.WECHAT:
                return `https://wx.qq.com/pay?order=${order.orderNo}&amount=${order.amount}`;
            default:
                return '';
        }
    }

    /**
     * 获取支付订单
     */
    async getOrder(orderNo: string): Promise<PaymentOrder | null> {
        return this.orderRepository.findOne({ where: { orderNo } });
    }

    /**
     * 获取用户支付订单列表
     */
    async getUserOrders(
        userId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<{ data: PaymentOrder[]; total: number }> {
        const [data, total] = await this.orderRepository.findAndCount({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total };
    }

    /**
     * 更新订单状态（内部使用）
     */
    async updateOrderStatus(orderNo: string, status: number, tradeNo?: string): Promise<PaymentOrder | null> {
        const order = await this.getOrder(orderNo);
        if (!order) return null;

        order.status = status;
        if (tradeNo) order.tradeNo = tradeNo;
        if (status === 1) order.paidAt = new Date();

        return this.orderRepository.save(order);
    }

    /**
     * 取消过期订单
     */
    async cancelExpiredOrders(): Promise<number> {
        const result = await this.orderRepository.update(
            {
                status: 0,
                expireAt: LessThan(new Date())
            },
            { status: 2 }
        );
        return result.affected || 0;
    }

    // ============ 支付回调管理 ============

    /**
     * 处理支付回调
     */
    async handleCallback(
        channel: PaymentChannel,
        type: PaymentType,
        rawData: Record<string, any>,
        ip?: string
    ): Promise<{
        success: boolean;
        message: string;
        callback?: PaymentCallback;
    }> {
        // 从回调数据中提取关键信息（根据渠道不同而不同）
        const { outTradeNo, tradeNo, amount, signature } = this.extractCallbackData(channel, rawData);

        // 检查是否重复回调
        const existingCallback = await this.callbackRepository.findOne({
            where: { outTradeNo, tradeNo, status: CallbackStatus.SUCCESS }
        });

        if (existingCallback) {
            // 记录重复回调
            await this.callbackRepository.save(this.callbackRepository.create({
                outTradeNo,
                tradeNo,
                channel,
                type,
                amount,
                status: CallbackStatus.DUPLICATE,
                rawData,
                signature,
                ip,
            }));

            return { success: true, message: '重复回调已忽略' };
        }

        // 验证签名
        const signatureValid = await this.verifySignature(channel, rawData, signature);

        // 创建回调记录
        const callback = this.callbackRepository.create({
            outTradeNo,
            tradeNo,
            channel,
            type,
            amount,
            status: CallbackStatus.PENDING,
            rawData,
            signature,
            signatureValid,
            ip,
        });

        if (!signatureValid) {
            callback.status = CallbackStatus.FAILED;
            callback.errorMsg = '签名验证失败';
            await this.callbackRepository.save(callback);
            return { success: false, message: '签名验证失败', callback };
        }

        try {
            // 更新支付订单状态
            const order = await this.updateOrderStatus(outTradeNo, 1, tradeNo);
            if (order) {
                callback.relatedId = order.relatedId;
            }

            callback.status = CallbackStatus.SUCCESS;
            callback.processedAt = new Date();
            await this.callbackRepository.save(callback);

            return { success: true, message: '处理成功', callback };
        } catch (error) {
            callback.status = CallbackStatus.FAILED;
            callback.errorMsg = error.message;
            await this.callbackRepository.save(callback);
            return { success: false, message: error.message, callback };
        }
    }

    /**
     * 提取回调数据
     */
    private extractCallbackData(channel: PaymentChannel, rawData: Record<string, any>): {
        outTradeNo: string;
        tradeNo: string;
        amount: number;
        signature: string;
    } {
        // 根据不同渠道解析数据
        switch (channel) {
            case PaymentChannel.ALIPAY:
                return {
                    outTradeNo: rawData.out_trade_no,
                    tradeNo: rawData.trade_no,
                    amount: parseFloat(rawData.total_amount),
                    signature: rawData.sign,
                };
            case PaymentChannel.WECHAT:
                return {
                    outTradeNo: rawData.out_trade_no,
                    tradeNo: rawData.transaction_id,
                    amount: rawData.total_fee / 100,
                    signature: rawData.sign,
                };
            default:
                return {
                    outTradeNo: rawData.orderNo || '',
                    tradeNo: rawData.tradeNo || '',
                    amount: rawData.amount || 0,
                    signature: rawData.sign || '',
                };
        }
    }

    /**
     * 验证签名（模拟）
     */
    private async verifySignature(channel: PaymentChannel, rawData: Record<string, any>, signature: string): Promise<boolean> {
        // 实际项目中根据渠道使用对应的签名验证方式
        // 这里模拟返回true
        return true;
    }

    /**
     * 获取回调日志
     */
    async getCallbackLogs(filter?: PaymentCallbackFilterDto): Promise<{
        data: PaymentCallback[];
        total: number;
    }> {
        const page = filter?.page || 1;
        const limit = filter?.limit || 20;

        const queryBuilder = this.callbackRepository.createQueryBuilder('c');

        if (filter?.channel) {
            queryBuilder.andWhere('c.channel = :channel', { channel: filter.channel });
        }
        if (filter?.status !== undefined) {
            queryBuilder.andWhere('c.status = :status', { status: filter.status });
        }

        const total = await queryBuilder.getCount();
        const data = await queryBuilder
            .orderBy('c.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany();

        return { data, total };
    }

    /**
     * 获取支付统计
     */
    async getPaymentStats(): Promise<{
        todayAmount: number;
        todayCount: number;
        totalAmount: number;
        totalCount: number;
        byChannel: Record<string, { amount: number; count: number }>;
    }> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 今日统计
        const todayStats = await this.orderRepository
            .createQueryBuilder('o')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(o.amount), 0)', 'amount')
            .where('o.status = 1')
            .andWhere('o.paidAt >= :today', { today })
            .getRawOne();

        // 总计
        const totalStats = await this.orderRepository
            .createQueryBuilder('o')
            .select('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(o.amount), 0)', 'amount')
            .where('o.status = 1')
            .getRawOne();

        // 按渠道统计
        const channelStats = await this.orderRepository
            .createQueryBuilder('o')
            .select('o.channel', 'channel')
            .addSelect('COUNT(*)', 'count')
            .addSelect('COALESCE(SUM(o.amount), 0)', 'amount')
            .where('o.status = 1')
            .groupBy('o.channel')
            .getRawMany();

        const byChannel: Record<string, { amount: number; count: number }> = {};
        for (const row of channelStats) {
            byChannel[row.channel] = {
                amount: parseFloat(row.amount),
                count: parseInt(row.count, 10),
            };
        }

        return {
            todayAmount: parseFloat(todayStats.amount),
            todayCount: parseInt(todayStats.count, 10),
            totalAmount: parseFloat(totalStats.amount),
            totalCount: parseInt(totalStats.count, 10),
            byChannel,
        };
    }
}
