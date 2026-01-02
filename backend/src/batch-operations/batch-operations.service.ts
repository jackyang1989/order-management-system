import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus, DeliveryState } from '../orders/order.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import { ReviewTask, ReviewTaskStatus } from '../review-tasks/review-task.entity';
import { OrderLogsService } from '../order-logs/order-logs.service';
import { OrderLogAction, OrderLogOperatorType } from '../order-logs/order-log.entity';
import { MessagesService } from '../messages/messages.service';
import { MessageUserType } from '../messages/message.entity';

@Injectable()
export class BatchOperationsService {
    constructor(
        @InjectRepository(Order)
        private orderRepository: Repository<Order>,
        @InjectRepository(Task)
        private taskRepository: Repository<Task>,
        @InjectRepository(ReviewTask)
        private reviewTaskRepository: Repository<ReviewTask>,
        private orderLogsService: OrderLogsService,
        private messagesService: MessagesService,
    ) { }

    // ============ 批量发货 ============

    /**
     * 批量发货
     */
    async batchShip(
        orderIds: string[],
        deliveryData: { delivery: string; deliveryNum: string }[],
        operatorId: string,
        operatorName: string
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (let i = 0; i < orderIds.length; i++) {
            const orderId = orderIds[i];
            const data = deliveryData[i];

            try {
                const order = await this.orderRepository.findOne({ where: { id: orderId } });
                if (!order) {
                    failed++;
                    errors.push(`订单 ${orderId} 不存在`);
                    continue;
                }

                if (order.status !== OrderStatus.WAITING_DELIVERY) {
                    failed++;
                    errors.push(`订单 ${orderId} 状态不正确`);
                    continue;
                }

                // 更新发货信息
                order.delivery = data.delivery;
                order.deliveryNum = data.deliveryNum;
                order.deliveryState = DeliveryState.SHIPPED;
                order.deliveryTime = new Date();
                order.status = OrderStatus.WAITING_RECEIVE;

                await this.orderRepository.save(order);

                // 记录日志
                await this.orderLogsService.logShipped(
                    orderId,
                    order.taskTitle,
                    operatorId,
                    operatorName,
                    data.deliveryNum,
                    data.delivery
                );

                success++;
            } catch (error) {
                failed++;
                errors.push(`订单 ${orderId} 发货失败: ${error.message}`);
            }
        }

        return { success, failed, errors };
    }

    /**
     * 从Excel数据批量发货
     */
    async batchShipFromExcel(
        data: Array<{
            orderNo?: string;
            taobaoOrderNo?: string;
            delivery: string;
            deliveryNum: string;
        }>,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: number; failed: number; errors: string[] }> {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const row of data) {
            try {
                let order: Order | null = null;

                // 根据订单号或淘宝单号查找
                if (row.orderNo) {
                    order = await this.orderRepository.findOne({
                        where: { taskTitle: row.orderNo }
                    });
                } else if (row.taobaoOrderNo) {
                    order = await this.orderRepository.findOne({
                        where: { taobaoOrderNumber: row.taobaoOrderNo }
                    });
                }

                if (!order) {
                    failed++;
                    errors.push(`订单 ${row.orderNo || row.taobaoOrderNo} 未找到`);
                    continue;
                }

                // 更新发货信息
                order.delivery = row.delivery;
                order.deliveryNum = row.deliveryNum;
                order.deliveryState = DeliveryState.SHIPPED;
                order.deliveryTime = new Date();
                if (order.status === OrderStatus.WAITING_DELIVERY) {
                    order.status = OrderStatus.WAITING_RECEIVE;
                }

                await this.orderRepository.save(order);
                success++;
            } catch (error) {
                failed++;
                errors.push(`处理失败: ${error.message}`);
            }
        }

        return { success, failed, errors };
    }

    // ============ 批量审核 ============

    /**
     * 批量审核任务
     */
    async batchApproveTasks(
        taskIds: string[],
        operatorId: string
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const taskId of taskIds) {
            try {
                const task = await this.taskRepository.findOne({ where: { id: taskId } });
                if (!task || task.status !== TaskStatus.AUDIT) {
                    failed++;
                    continue;
                }

                task.status = TaskStatus.ACTIVE;
                task.examineTime = new Date();
                await this.taskRepository.save(task);

                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * 批量审核订单
     */
    async batchApproveOrders(
        orderIds: string[],
        operatorId: string,
        operatorName: string
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const orderId of orderIds) {
            try {
                const order = await this.orderRepository.findOne({ where: { id: orderId } });
                if (!order || order.status !== OrderStatus.SUBMITTED) {
                    failed++;
                    continue;
                }

                order.status = OrderStatus.APPROVED;
                await this.orderRepository.save(order);

                // 记录日志
                await this.orderLogsService.logStatusChange(
                    orderId,
                    order.taskTitle,
                    OrderLogAction.ADMIN_OPERATE,
                    OrderLogOperatorType.ADMIN,
                    operatorId,
                    operatorName,
                    OrderStatus.SUBMITTED as any,
                    OrderStatus.APPROVED as any,
                    '批量审核通过'
                );

                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }

    // ============ 批量返款 ============

    /**
     * 批量返款
     */
    async batchRefund(
        orderIds: string[],
        operatorId: string,
        operatorName: string
    ): Promise<{ success: number; failed: number; totalAmount: number }> {
        let success = 0;
        let failed = 0;
        let totalAmount = 0;

        for (const orderId of orderIds) {
            try {
                const order = await this.orderRepository.findOne({ where: { id: orderId } });
                if (!order || ![OrderStatus.WAITING_REFUND, OrderStatus.WAITING_REVIEW_REFUND].includes(order.status)) {
                    failed++;
                    continue;
                }

                // 计算返款金额
                const refundAmount = Number(order.userPrincipal) + Number(order.commission);
                order.refundAmount = refundAmount;
                order.refundTime = new Date();
                order.status = OrderStatus.COMPLETED;
                order.completedAt = new Date();

                await this.orderRepository.save(order);

                // TODO: 实际调用财务模块进行返款

                totalAmount += refundAmount;
                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed, totalAmount };
    }

    // ============ 批量追评审核 ============

    /**
     * 批量审核追评任务
     */
    async batchApproveReviewTasks(
        reviewTaskIds: string[],
        operatorId: string
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const id of reviewTaskIds) {
            try {
                const reviewTask = await this.reviewTaskRepository.findOne({ where: { id } });
                if (!reviewTask || reviewTask.state !== ReviewTaskStatus.PAID) {
                    failed++;
                    continue;
                }

                reviewTask.state = ReviewTaskStatus.APPROVED;
                reviewTask.examineTime = new Date();
                reviewTask.remarks = `批量审核通过 - ${operatorId}`;
                await this.reviewTaskRepository.save(reviewTask);

                // 发送消息通知买手
                await this.messagesService.sendSystemMessage(
                    reviewTask.userId,
                    MessageUserType.BUYER,
                    '追评审核通过',
                    `您有新的追评任务，任务编号：${reviewTask.taskNumber}，请尽快完成。`
                );

                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }

    /**
     * 批量返款追评任务
     */
    async batchRefundReviewTasks(
        reviewTaskIds: string[],
        operatorId: string
    ): Promise<{ success: number; failed: number; totalAmount: number }> {
        let success = 0;
        let failed = 0;
        let totalAmount = 0;

        for (const id of reviewTaskIds) {
            try {
                const reviewTask = await this.reviewTaskRepository.findOne({ where: { id } });
                if (!reviewTask || reviewTask.state !== ReviewTaskStatus.UPLOADED) {
                    failed++;
                    continue;
                }

                reviewTask.state = ReviewTaskStatus.COMPLETED;
                reviewTask.confirmTime = new Date();
                reviewTask.remarks = `管理员批量返款 - ${operatorId}`;
                await this.reviewTaskRepository.save(reviewTask);

                // TODO: 实际调用财务模块进行返款

                totalAmount += Number(reviewTask.userMoney);
                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed, totalAmount };
    }

    // ============ 批量取消 ============

    /**
     * 批量取消订单
     */
    async batchCancelOrders(
        orderIds: string[],
        reason: string,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: number; failed: number }> {
        let success = 0;
        let failed = 0;

        for (const orderId of orderIds) {
            try {
                const order = await this.orderRepository.findOne({ where: { id: orderId } });
                if (!order || order.status === OrderStatus.COMPLETED || order.status === OrderStatus.CANCELLED) {
                    failed++;
                    continue;
                }

                order.status = OrderStatus.CANCELLED;
                order.cancelRemarks = reason;
                order.cancelTime = new Date();
                await this.orderRepository.save(order);

                // 记录日志
                await this.orderLogsService.logStatusChange(
                    orderId,
                    order.taskTitle,
                    OrderLogAction.CANCEL,
                    OrderLogOperatorType.ADMIN,
                    operatorId,
                    operatorName,
                    order.status as any,
                    OrderStatus.CANCELLED as any,
                    `批量取消: ${reason}`
                );

                success++;
            } catch {
                failed++;
            }
        }

        return { success, failed };
    }
}
