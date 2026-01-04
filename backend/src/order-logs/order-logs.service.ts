import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  OrderLog,
  OrderLogAction,
  OrderLogOperatorType,
  CreateOrderLogDto,
  OrderLogFilterDto,
} from './order-log.entity';

@Injectable()
export class OrderLogsService {
  constructor(
    @InjectRepository(OrderLog)
    private logRepository: Repository<OrderLog>,
  ) {}

  /**
   * 创建订单日志
   */
  async create(dto: CreateOrderLogDto): Promise<OrderLog> {
    const log = this.logRepository.create(dto);
    return this.logRepository.save(log);
  }

  /**
   * 记录订单创建
   */
  async logOrderCreated(
    orderId: string,
    orderNo: string,
    buyerId: string,
    buyerName: string,
    extra?: Record<string, any>,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: OrderLogAction.CREATE,
      operatorType: OrderLogOperatorType.BUYER,
      operatorId: buyerId,
      operatorName: buyerName,
      content: '创建订单',
      extra,
    });
  }

  /**
   * 记录订单状态变更
   */
  async logStatusChange(
    orderId: string,
    orderNo: string,
    action: OrderLogAction,
    operatorType: OrderLogOperatorType,
    operatorId: string,
    operatorName: string,
    oldStatus: number,
    newStatus: number,
    content?: string,
    extra?: Record<string, any>,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action,
      operatorType,
      operatorId,
      operatorName,
      oldStatus,
      newStatus,
      content: content || this.getActionDescription(action),
      extra,
    });
  }

  /**
   * 记录发货
   */
  async logShipped(
    orderId: string,
    orderNo: string,
    merchantId: string,
    merchantName: string,
    trackingNumber: string,
    deliveryCompany: string,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: OrderLogAction.SHIP,
      operatorType: OrderLogOperatorType.MERCHANT,
      operatorId: merchantId,
      operatorName: merchantName,
      content: `商家发货，快递公司：${deliveryCompany}，单号：${trackingNumber}`,
      extra: { trackingNumber, deliveryCompany },
    });
  }

  /**
   * 记录确认收货
   */
  async logConfirmReceipt(
    orderId: string,
    orderNo: string,
    buyerId: string,
    buyerName: string,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: OrderLogAction.CONFIRM_RECEIPT,
      operatorType: OrderLogOperatorType.BUYER,
      operatorId: buyerId,
      operatorName: buyerName,
      content: '买手确认收货',
    });
  }

  /**
   * 记录退款申请
   */
  async logRefundRequest(
    orderId: string,
    orderNo: string,
    buyerId: string,
    buyerName: string,
    reason: string,
    amount: number,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: OrderLogAction.REFUND_REQUEST,
      operatorType: OrderLogOperatorType.BUYER,
      operatorId: buyerId,
      operatorName: buyerName,
      content: `申请退款，金额：${amount}元，原因：${reason}`,
      extra: { reason, amount },
    });
  }

  /**
   * 记录退款处理
   */
  async logRefundProcess(
    orderId: string,
    orderNo: string,
    adminId: string,
    adminName: string,
    approved: boolean,
    remark?: string,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: approved
        ? OrderLogAction.REFUND_APPROVE
        : OrderLogAction.REFUND_REJECT,
      operatorType: OrderLogOperatorType.ADMIN,
      operatorId: adminId,
      operatorName: adminName,
      content: approved
        ? `同意退款${remark ? '：' + remark : ''}`
        : `拒绝退款${remark ? '：' + remark : ''}`,
      extra: { approved, remark },
    });
  }

  /**
   * 记录管理员操作
   */
  async logAdminOperate(
    orderId: string,
    orderNo: string,
    adminId: string,
    adminName: string,
    content: string,
    extra?: Record<string, any>,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action: OrderLogAction.ADMIN_OPERATE,
      operatorType: OrderLogOperatorType.ADMIN,
      operatorId: adminId,
      operatorName: adminName,
      content,
      extra,
    });
  }

  /**
   * 记录系统操作
   */
  async logSystemOperate(
    orderId: string,
    orderNo: string,
    action: OrderLogAction,
    content: string,
    extra?: Record<string, any>,
  ): Promise<OrderLog> {
    return this.create({
      orderId,
      orderNo,
      action,
      operatorType: OrderLogOperatorType.SYSTEM,
      content,
      extra,
    });
  }

  /**
   * 获取订单日志列表
   */
  async findByOrder(
    orderId: string,
    filter?: OrderLogFilterDto,
  ): Promise<OrderLog[]> {
    const queryBuilder = this.logRepository
      .createQueryBuilder('l')
      .where('l.orderId = :orderId', { orderId });

    if (filter?.action) {
      queryBuilder.andWhere('l.action = :action', { action: filter.action });
    }

    return queryBuilder.orderBy('l.createdAt', 'ASC').getMany();
  }

  /**
   * 获取订单最新日志
   */
  async findLatestByOrder(orderId: string): Promise<OrderLog | null> {
    return this.logRepository.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取操作描述
   */
  private getActionDescription(action: OrderLogAction): string {
    const descriptions: Record<OrderLogAction, string> = {
      [OrderLogAction.CREATE]: '创建订单',
      [OrderLogAction.ACCEPT]: '接单',
      [OrderLogAction.SUBMIT]: '提交订单',
      [OrderLogAction.SHIP]: '发货',
      [OrderLogAction.CONFIRM_RECEIPT]: '确认收货',
      [OrderLogAction.COMPLETE]: '订单完成',
      [OrderLogAction.CANCEL]: '取消订单',
      [OrderLogAction.REFUND_REQUEST]: '申请退款',
      [OrderLogAction.REFUND_APPROVE]: '同意退款',
      [OrderLogAction.REFUND_REJECT]: '拒绝退款',
      [OrderLogAction.REFUND_COMPLETE]: '退款完成',
      [OrderLogAction.UPDATE_INFO]: '更新信息',
      [OrderLogAction.UPLOAD_PROOF]: '上传凭证',
      [OrderLogAction.ADMIN_OPERATE]: '管理员操作',
      [OrderLogAction.REMARK]: '添加备注',
    };
    return descriptions[action] || action;
  }

  /**
   * 获取订单操作时间线
   */
  async getOrderTimeline(orderId: string): Promise<
    {
      action: string;
      content: string;
      operatorName: string;
      createdAt: Date;
    }[]
  > {
    const logs = await this.findByOrder(orderId);
    return logs.map((log) => ({
      action: log.action,
      content: log.content || this.getActionDescription(log.action),
      operatorName: log.operatorName || '系统',
      createdAt: log.createdAt,
    }));
  }
}
