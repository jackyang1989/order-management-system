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

    // ============ 预售返款 ============

    /**
     * 预售返款（预付款/尾款）
     * 对应原版接口: Task::returnys
     * 业务语义: 对预售订单(is_ys=1)进行预付款或尾款返款操作
     * 前置条件: user_task.state = 5 (待返款), is_ys = 1
     * 后置状态: user_task.state = 6 (待确认返款)
     *
     * @param orderId 订单ID
     * @param type 返款类型: 1=预付款返款, 2=尾款返款
     * @param operatorId 操作员ID
     * @param operatorName 操作员姓名
     */
    async presaleRefund(
        orderId: string,
        type: 1 | 2,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 查询订单
            const order = await this.orderRepository.findOne({ where: { id: orderId } });

            if (!order) {
                return { success: false, message: '未找到数据或数据状态不正确！请刷新重试' };
            }

            // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
            if (order.status !== OrderStatus.WAITING_REFUND) {
                return { success: false, message: '未找到数据或数据状态不正确！请刷新重试' };
            }

            // 3. 验证是否为预售订单
            if (!order.isPresale) {
                return { success: false, message: '该任务不是预售任务！' };
            }

            // 4. 根据类型执行返款
            if (type === 1) {
                // 预付款返款
                if (order.okYf) {
                    return { success: false, message: '任务状态不对!' };
                }

                order.okYf = true;
                order.platformRefundTime = new Date();
                order.status = OrderStatus.WAITING_REVIEW_REFUND; // state = 6

                await this.orderRepository.save(order);

                // 记录日志
                await this.orderLogsService.logStatusChange(
                    orderId,
                    order.taskTitle,
                    OrderLogAction.ADMIN_OPERATE,
                    OrderLogOperatorType.ADMIN,
                    operatorId,
                    operatorName,
                    OrderStatus.WAITING_REFUND as any,
                    OrderStatus.WAITING_REVIEW_REFUND as any,
                    '任务预付款返款'
                );

            } else if (type === 2) {
                // 尾款返款
                if (order.okWk) {
                    return { success: false, message: '任务状态不对!' };
                }

                order.okWk = true;
                order.platformRefundTime = new Date();
                order.status = OrderStatus.WAITING_REVIEW_REFUND; // state = 6

                await this.orderRepository.save(order);

                // 记录日志
                await this.orderLogsService.logStatusChange(
                    orderId,
                    order.taskTitle,
                    OrderLogAction.ADMIN_OPERATE,
                    OrderLogOperatorType.ADMIN,
                    operatorId,
                    operatorName,
                    OrderStatus.WAITING_REFUND as any,
                    OrderStatus.WAITING_REVIEW_REFUND as any,
                    '任务尾款返款'
                );
            }

            return { success: true, message: '返款成功！' };

        } catch (error) {
            return { success: false, message: error.message || '操作失败' };
        }
    }

    // ============ 修改预售金额 ============

    /**
     * 修改预付金额
     * 对应原版接口: Task::return_price1
     * 业务语义: 后台修改预售订单的预付款金额(yf_price)
     * 前置条件: user_task.state = 5 (待返款)
     * 限制: 浮动不能超过 ±500元
     *
     * @param orderId 订单ID
     * @param price 新的预付款金额
     * @param operatorId 操作员ID
     * @param operatorName 操作员姓名
     */
    async updateYfPrice(
        orderId: string,
        price: number,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 查询订单
            const order = await this.orderRepository.findOne({ where: { id: orderId } });

            if (!order) {
                return { success: false, message: '任务不存在！' };
            }

            // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
            if (order.status !== OrderStatus.WAITING_REFUND) {
                return { success: false, message: '任务状态不正确，只有待返款才能修改！' };
            }

            // 3. 验证浮动范围 ±500元
            const currentYfPrice = Number(order.yfPrice) || 0;
            if (currentYfPrice - 500 > price || currentYfPrice + 500 < price) {
                return { success: false, message: '返款金额上下浮动不能超过500元！' };
            }

            // 4. 更新预付款金额
            order.yfPrice = price;
            await this.orderRepository.save(order);

            // 5. 记录日志
            await this.orderLogsService.logStatusChange(
                orderId,
                order.taskTitle,
                OrderLogAction.ADMIN_OPERATE,
                OrderLogOperatorType.ADMIN,
                operatorId,
                operatorName,
                order.status as any,
                order.status as any,
                `修改预付金额: ${currentYfPrice} -> ${price}`
            );

            return { success: true, message: '修改成功！' };

        } catch (error) {
            return { success: false, message: error.message || '修改失败！' };
        }
    }

    /**
     * 修改尾款金额
     * 对应原版接口: Task::return_price2
     * 业务语义: 后台修改预售订单的尾款金额(wk_price)
     * 前置条件: user_task.state = 5 (待返款)
     * 限制: 浮动不能超过 ±100元
     *
     * @param orderId 订单ID
     * @param price 新的尾款金额
     * @param operatorId 操作员ID
     * @param operatorName 操作员姓名
     */
    async updateWkPrice(
        orderId: string,
        price: number,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 查询订单
            const order = await this.orderRepository.findOne({ where: { id: orderId } });

            if (!order) {
                return { success: false, message: '任务不存在！' };
            }

            // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
            if (order.status !== OrderStatus.WAITING_REFUND) {
                return { success: false, message: '任务状态不正确，只有待返款才能修改！' };
            }

            // 3. 验证浮动范围 ±100元
            const currentWkPrice = Number(order.wkPrice) || 0;
            if (currentWkPrice - 100 > price || currentWkPrice + 100 < price) {
                return { success: false, message: '尾款金额上下浮动不能超过100元！' };
            }

            // 4. 更新尾款金额
            order.wkPrice = price;
            await this.orderRepository.save(order);

            // 5. 记录日志
            await this.orderLogsService.logStatusChange(
                orderId,
                order.taskTitle,
                OrderLogAction.ADMIN_OPERATE,
                OrderLogOperatorType.ADMIN,
                operatorId,
                operatorName,
                order.status as any,
                order.status as any,
                `修改尾款金额: ${currentWkPrice} -> ${price}`
            );

            return { success: true, message: '修改成功！' };

        } catch (error) {
            return { success: false, message: error.message || '修改失败！' };
        }
    }

    // ============ 修改剩余单数 ============

    /**
     * 修改剩余单数
     * 对应原版接口: Task::incomplete_num
     * 业务语义: 后台修改商家任务的剩余单数(incomplete_num)
     * 前置条件: seller_task.status = 3(已通过), 4(已拒绝), 5(已取消)
     * 禁止状态: status = 1(未支付), 2(待审核), 6(已完成)
     *
     * @param taskId 任务ID
     * @param incompleteNum 新的剩余单数
     * @param operatorId 操作员ID
     * @param operatorName 操作员姓名
     */
    async updateIncompleteNum(
        taskId: string,
        incompleteNum: number,
        operatorId: string,
        operatorName: string
    ): Promise<{ success: boolean; message: string }> {
        try {
            // 1. 参数验证
            if (!taskId) {
                return { success: false, message: '参数错误' };
            }

            // 2. 查询任务
            const task = await this.taskRepository.findOne({ where: { id: taskId } });

            if (!task) {
                return { success: false, message: '任务不存在！' };
            }

            // 3. 验证任务状态
            // 原版逻辑: if(($seller_task['status']==1||$seller_task['status']==2||$seller_task['status']==6))
            //          return $this->error('任务状态不正确');
            // 禁止: status=1(未支付), status=2(待审核), status=6(已完成)
            // 重构版对应: PENDING_PAY(0), AUDIT(4), COMPLETED(2)
            const forbiddenStatuses = [
                TaskStatus.PENDING_PAY,   // 未支付
                TaskStatus.AUDIT,         // 待审核
                TaskStatus.COMPLETED      // 已完成
            ];
            if (forbiddenStatuses.includes(task.status)) {
                return { success: false, message: '任务状态不正确' };
            }

            // 4. 更新剩余单数
            // 原版: incomplete_num -> 重构版: count - claimedCount (可用单数)
            // 但根据契约，incomplete_num 是独立字段，对应重构版的 incompleteCount
            const oldValue = task.count - task.claimedCount;

            // 计算新的 claimedCount，保持 count 不变
            // 新剩余单数 = count - claimedCount, 所以 claimedCount = count - incompleteNum
            const newClaimedCount = task.count - incompleteNum;

            // 验证范围
            if (newClaimedCount < 0 || newClaimedCount > task.count) {
                return { success: false, message: '剩余单数超出有效范围！' };
            }

            task.claimedCount = newClaimedCount;
            await this.taskRepository.save(task);

            // 5. 记录日志 (使用通用日志方式)
            // 原版: admin_log("修改剩余单数", "管理员{$this->admin_info['user_name']}操作:任务编号{$seller_task['task_number']}");
            console.log(`[AdminLog] 修改剩余单数 - 管理员${operatorName}操作: 任务编号${task.taskNumber}, ${oldValue} -> ${incompleteNum}`);

            return { success: true, message: '修改成功！' };

        } catch (error) {
            return { success: false, message: error.message || '修改失败！' };
        }
    }
}
