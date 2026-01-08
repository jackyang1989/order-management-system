import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus, DeliveryState } from '../orders/order.entity';
import { Task, TaskStatus } from '../tasks/task.entity';
import {
  ReviewTask,
  ReviewTaskStatus,
} from '../review-tasks/review-task.entity';
import {
  Withdrawal,
  WithdrawalStatus,
  WithdrawalType,
  WithdrawalOwnerType,
} from '../withdrawals/withdrawal.entity';
import {
  MerchantWithdrawal,
  MerchantWithdrawalStatus,
  MerchantWithdrawalType,
} from '../merchant-withdrawals/merchant-withdrawal.entity';
import { User } from '../users/user.entity';
import { Merchant } from '../merchants/merchant.entity';
import { OrderLogsService } from '../order-logs/order-logs.service';
import {
  OrderLogAction,
  OrderLogOperatorType,
} from '../order-logs/order-log.entity';
import { MessagesService } from '../messages/messages.service';
import { MessageUserType } from '../messages/message.entity';
import { FinanceRecordsService } from '../finance-records/finance-records.service';

@Injectable()
export class BatchOperationsService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(ReviewTask)
    private reviewTaskRepository: Repository<ReviewTask>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(MerchantWithdrawal)
    private merchantWithdrawalRepository: Repository<MerchantWithdrawal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Merchant)
    private merchantRepository: Repository<Merchant>,
    private orderLogsService: OrderLogsService,
    private messagesService: MessagesService,
    private financeRecordsService: FinanceRecordsService,
  ) { }

  // ============ 批量发货 ============

  /**
   * 批量发货
   */
  async batchShip(
    orderIds: string[],
    deliveryData: { delivery: string; deliveryNum: string }[],
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < orderIds.length; i++) {
      const orderId = orderIds[i];
      const data = deliveryData[i];

      try {
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });
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
          data.delivery,
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
   * 从Excel数据批量发货 (双模式导入)
   * 和 Task::import1 (按任务编号)
   * 业务语义: 支持通过订单ID或任务编号两种方式匹配订单并发货
   * 前置条件: user_task.state = 3 (待发货)
   */
  async batchShipFromExcel(
    data: Array<{
      orderId?: string; // 模式1: 按订单ID匹配 (原版 import)
      taskNumber?: string; // 模式2: 按任务编号匹配 (原版 import1)
      orderNo?: string; // 兼容: 按订单号匹配
      taobaoOrderNo?: string; // 兼容: 按淘宝单号匹配
      delivery: string;
      deliveryNum: string;
    }>,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const row of data) {
      try {
        let order: Order | null = null;

        // 模式1: 按订单ID匹配 (原版 import)
        if (row.orderId) {
          order = await this.orderRepository.findOne({
            where: { id: row.orderId, status: OrderStatus.WAITING_DELIVERY },
          });
          if (!order) {
            failed++;
            errors.push(`订单ID ${row.orderId} 未找到或状态不正确`);
            continue;
          }
        }
        // 模式2: 按任务编号匹配 (原版 import1)
        // 原版使用 task_number，重构版使用 taskTitle 作为对应字段
        else if (row.taskNumber) {
          order = await this.orderRepository.findOne({
            where: {
              taskTitle: row.taskNumber,
              status: OrderStatus.WAITING_DELIVERY,
            },
          });
          if (!order) {
            failed++;
            errors.push(`任务编号 ${row.taskNumber} 未找到或状态不正确`);
            continue;
          }
        }
        // 兼容: 按订单号匹配
        else if (row.orderNo) {
          order = await this.orderRepository.findOne({
            where: { taskTitle: row.orderNo },
          });
        }
        // 兼容: 按平台订单号匹配
        else if (row.taobaoOrderNo) {
          order = await this.orderRepository.findOne({
            where: { platformOrderNumber: row.taobaoOrderNo },
          });
        }

        if (!order) {
          failed++;
          errors.push(
            `订单 ${row.orderId || row.taskNumber || row.orderNo || row.taobaoOrderNo} 未找到`,
          );
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
    operatorId: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const taskId of taskIds) {
      try {
        const task = await this.taskRepository.findOne({
          where: { id: taskId },
        });
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
   * 批量拒绝任务
 *
   * 业务语义: 后台拒绝商家任务，退还押金和银锭
   * 前置条件: seller_task.status = 2 (待审核) -> 重构版 TaskStatus.AUDIT (4)
   * 后置状态: seller_task.status = 4 (已拒绝) -> 重构版 TaskStatus.REJECTED (6)
   * 副作用: 更新 remarks, examine_time, 退还押金(yajin->totalDeposit), 退还银锭(yinding->totalCommission)
   */
  async batchRejectTasks(
    taskIds: string[],
    reason: string,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const taskId of taskIds) {
      try {
        const result = await this.taskRepository.manager.transaction(
          async (transactionalEntityManager) => {
            // 1. 查询任务
            const task = await transactionalEntityManager.findOne(Task, {
              where: { id: taskId },
            });
            if (!task) {
              return { success: false, message: `任务 ${taskId} 不存在` };
            }

            // 2. 验证状态: 必须为 AUDIT (待审核)
            if (task.status !== TaskStatus.AUDIT) {
              return {
                success: false,
                message: `任务 ${taskId} 状态不正确，只有待审核状态才能拒绝`,
              };
            }

            // 3. 查询商家
            const merchant = await transactionalEntityManager.findOne(
              Merchant,
              { where: { id: task.merchantId } },
            );
            if (!merchant) {
              return { success: false, message: `任务 ${taskId} 的商家不存在` };
            }

            // 4. 退还押金 (totalDeposit -> merchant.balance)
            const depositAmount = Number(task.totalDeposit) || 0;
            if (depositAmount > 0) {
              const newBalance = Number(merchant.balance) + depositAmount;
              await transactionalEntityManager
                .createQueryBuilder()
                .update(Merchant)
                .set({ balance: newBalance })
                .where('id = :merchantId', { merchantId: merchant.id })
                .execute();

              // 记录押金退还流水
              await this.financeRecordsService.recordMerchantTaskRefund(
                merchant.id,
                depositAmount,
                newBalance,
                taskId,
                `任务审核拒绝退还押金 - 任务编号${task.taskNumber}`,
              );
            }

            // 5. 退还银锭 (totalCommission -> merchant.silver)
            const silverAmount = Number(task.totalCommission) || 0;
            if (silverAmount > 0) {
              const newSilver = Number(merchant.silver) + silverAmount;
              await transactionalEntityManager
                .createQueryBuilder()
                .update(Merchant)
                .set({ silver: newSilver })
                .where('id = :merchantId', { merchantId: merchant.id })
                .execute();

              // 记录银锭退还流水
              await this.financeRecordsService.recordMerchantTaskSilverRefund(
                merchant.id,
                silverAmount,
                newSilver,
                taskId,
                `任务审核拒绝退还银锭 - 任务编号${task.taskNumber}`,
              );
            }

            // 6. 更新任务状态
            task.status = TaskStatus.REJECTED;
            task.remark = reason || '后台审核拒绝';
            task.examineTime = new Date();
            await transactionalEntityManager.save(task);

            // 7. 发送消息通知商家
            await this.messagesService.sendSystemMessage(
              merchant.id,
              MessageUserType.MERCHANT,
              '任务审核拒绝',
              `您的任务（编号：${task.taskNumber}）审核未通过，原因：${reason || '后台审核拒绝'}。押金和服务费已退还。`,
            );

            return { success: true, message: '成功' };
          },
        );

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(result.message);
        }
      } catch (error) {
        failed++;
        errors.push(`任务 ${taskId} 处理失败: ${error.message}`);
      }
    }

    // 记录日志
    console.log(
      `[AdminLog] 批量拒绝任务 - 管理员${operatorName}操作: 成功${success}个，失败${failed}个`,
    );

    return { success, failed, errors };
  }

  /**
   * 批量审核订单
   */
  async batchApproveOrders(
    orderIds: string[],
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const orderId of orderIds) {
      try {
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });
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
          '批量审核通过',
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
    operatorName: string,
  ): Promise<{ success: number; failed: number; totalAmount: number }> {
    let success = 0;
    let failed = 0;
    let totalAmount = 0;

    for (const orderId of orderIds) {
      try {
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });
        if (
          !order ||
          ![
            OrderStatus.WAITING_REFUND,
            OrderStatus.WAITING_REVIEW_REFUND,
          ].includes(order.status)
        ) {
          failed++;
          continue;
        }

        // 计算返款金额
        const refundAmount =
          Number(order.userPrincipal) + Number(order.commission);
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
    operatorId: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const id of reviewTaskIds) {
      try {
        const reviewTask = await this.reviewTaskRepository.findOne({
          where: { id },
        });
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
          `您有新的追评任务，任务编号：${reviewTask.taskNumber}，请尽快完成。`,
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
    operatorId: string,
  ): Promise<{ success: number; failed: number; totalAmount: number }> {
    let success = 0;
    let failed = 0;
    let totalAmount = 0;

    for (const id of reviewTaskIds) {
      try {
        const reviewTask = await this.reviewTaskRepository.findOne({
          where: { id },
        });
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
    operatorName: string,
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const orderId of orderIds) {
      try {
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });
        if (
          !order ||
          order.status === OrderStatus.COMPLETED ||
          order.status === OrderStatus.CANCELLED
        ) {
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
          `批量取消: ${reason}`,
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
 *
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
    operatorName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 查询订单
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return {
          success: false,
          message: '未找到数据或数据状态不正确！请刷新重试',
        };
      }

      // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
      if (order.status !== OrderStatus.WAITING_REFUND) {
        return {
          success: false,
          message: '未找到数据或数据状态不正确！请刷新重试',
        };
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
          '任务预付款返款',
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
          '任务尾款返款',
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
 *
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
    operatorName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 查询订单
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return { success: false, message: '任务不存在！' };
      }

      // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
      if (order.status !== OrderStatus.WAITING_REFUND) {
        return {
          success: false,
          message: '任务状态不正确，只有待返款才能修改！',
        };
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
        `修改预付金额: ${currentYfPrice} -> ${price}`,
      );

      return { success: true, message: '修改成功！' };
    } catch (error) {
      return { success: false, message: error.message || '修改失败！' };
    }
  }

  /**
   * 修改尾款金额
 *
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
    operatorName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 查询订单
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return { success: false, message: '任务不存在！' };
      }

      // 2. 验证订单状态必须为 WAITING_REFUND (state=5)
      if (order.status !== OrderStatus.WAITING_REFUND) {
        return {
          success: false,
          message: '任务状态不正确，只有待返款才能修改！',
        };
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
        `修改尾款金额: ${currentWkPrice} -> ${price}`,
      );

      return { success: true, message: '修改成功！' };
    } catch (error) {
      return { success: false, message: error.message || '修改失败！' };
    }
  }

  // ============ 修改剩余单数 ============

  /**
   * 修改剩余单数
 *
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
    operatorName: string,
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
        TaskStatus.PENDING_PAY, // 未支付
        TaskStatus.AUDIT, // 待审核
        TaskStatus.COMPLETED, // 已完成
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
      console.log(
        `[AdminLog] 修改剩余单数 - 管理员${operatorName}操作: 任务编号${task.taskNumber}, ${oldValue} -> ${incompleteNum}`,
      );

      return { success: true, message: '修改成功！' };
    } catch (error) {
      return { success: false, message: error.message || '修改失败！' };
    }
  }

  // ============ 任务回退重发货 ============

  /**
   * 任务回退重发货
 *
   * 业务语义: 将待返款(state=5)的订单回退到待收货(state=4)，重新发货
   * 前置条件: user_task.state = 5 (待返款)
   * 后置状态: user_task.state = 4 (待收货)
   *
   * @param orderId 订单ID
   * @param delivery 快递公司
   * @param deliveryNum 快递单号
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async regressionExamine(
    orderId: string,
    delivery: string,
    deliveryNum: string,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 参数验证
      if (!orderId) {
        return { success: false, message: '参数错误！' };
      }
      if (!delivery) {
        return { success: false, message: '请填写快递公司！' };
      }
      if (!deliveryNum) {
        return { success: false, message: '请填写快递单号！' };
      }

      // 2. 查询订单 - 前置条件: state=5 (待返款)
      const order = await this.orderRepository.findOne({
        where: { id: orderId, status: OrderStatus.WAITING_REFUND },
      });

      if (!order) {
        return { success: false, message: '订单不存在！' };
      }

      // 3. 更新数据 - 回退到 state=4 (待收货)
      order.delivery = delivery;
      order.deliveryNum = deliveryNum;
      order.status = OrderStatus.WAITING_RECEIVE; // state = 4
      order.deliveryTime = new Date();

      await this.orderRepository.save(order);

      // 4. 记录日志
      await this.orderLogsService.logStatusChange(
        orderId,
        order.taskTitle,
        OrderLogAction.ADMIN_OPERATE,
        OrderLogOperatorType.ADMIN,
        operatorId,
        operatorName,
        OrderStatus.WAITING_REFUND as any,
        OrderStatus.WAITING_RECEIVE as any,
        '重新发货(回退)',
      );

      return { success: true, message: '发货成功！' };
    } catch (error) {
      return { success: false, message: error.message || '发货失败！' };
    }
  }

  // ============ 修改关键词 ============

  /**
   * 修改订单关键词
 *
   * 业务语义: 后台修改订单的搜索关键词(key)
   * 前置条件: 无状态限制
   *
   * @param orderId 订单ID
   * @param keyword 新的关键词
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async editKeyword(
    orderId: string,
    keyword: string,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // 1. 参数验证
      if (!keyword) {
        return { success: false, message: '请填写关键字！' };
      }
      if (!orderId) {
        return { success: false, message: '参数错误' };
      }

      // 2. 查询订单
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
      });

      if (!order) {
        return { success: false, message: '任务不存在！' };
      }

      // 3. 更新关键词
      order.keyword = keyword.trim();
      await this.orderRepository.save(order);

      // 4. 记录日志
      await this.orderLogsService.logStatusChange(
        orderId,
        order.taskTitle,
        OrderLogAction.ADMIN_OPERATE,
        OrderLogOperatorType.ADMIN,
        operatorId,
        operatorName,
        order.status as any,
        order.status as any,
        `修改订单关键字: ${keyword.trim()}`,
      );

      return { success: true, message: '修改成功！' };
    } catch (error) {
      return { success: false, message: error.message || '修改失败！' };
    }
  }

  // ============ 批量提现审核 ============

  /**
   * 批量审核买手提现申请
   * 
   * 业务语义: 批量审核买手提现申请 (通过/拒绝)
   * 前置条件: state = 0 (已申请)
   * 后置状态: state = 1 (已同意) 或 state = 2 (已拒绝)
   *
   * @param withdrawalIds 提现ID数组
   * @param action 操作: 'approve' | 'reject'
   * @param reason 拒绝原因 (拒绝时必填)
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async batchReviewBuyerWithdrawals(
    withdrawalIds: string[],
    action: 'approve' | 'reject',
    reason: string | undefined,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of withdrawalIds) {
      try {
        const result = await this.withdrawalRepository.manager.transaction(
          async (transactionalEntityManager) => {
            // 1. 查询提现记录
            const withdrawal = await transactionalEntityManager.findOne(
              Withdrawal,
              { where: { id } },
            );

            if (!withdrawal) {
              return { success: false, message: `提现记录 ${id} 不存在` };
            }

            // 2. 验证状态: 必须为 PENDING (0)
            if (withdrawal.status !== WithdrawalStatus.PENDING) {
              return { success: false, message: `提现记录 ${id} 已处理` };
            }

            // 3. 更新审核信息
            withdrawal.reviewedAt = new Date();
            withdrawal.reviewedBy = operatorId;

            if (action === 'approve') {
              // 审核通过: state = 0 -> state = 1
              withdrawal.status = WithdrawalStatus.APPROVED_PENDING_TRANSFER;
            } else {
              // 审核拒绝: state = 0 -> state = 2
              withdrawal.status = WithdrawalStatus.REJECTED;
              withdrawal.remark = reason || '后台拒绝';

              // 退还冻结余额到可用余额
              const ownerId = withdrawal.ownerId || withdrawal.userId;
              if (withdrawal.type === WithdrawalType.BALANCE) {
                await transactionalEntityManager
                  .createQueryBuilder()
                  .update(User)
                  .set({
                    balance: () => `balance + ${withdrawal.amount}`,
                    frozenBalance: () =>
                      `"frozenBalance" - ${withdrawal.amount}`,
                  })
                  .where('id = :userId', { userId: ownerId })
                  .execute();
              } else {
                await transactionalEntityManager
                  .createQueryBuilder()
                  .update(User)
                  .set({
                    silver: () => `silver + ${withdrawal.amount}`,
                    frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`,
                  })
                  .where('id = :userId', { userId: ownerId })
                  .execute();
              }
            }

            await transactionalEntityManager.save(withdrawal);
            return { success: true, message: '成功' };
          },
        );

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(result.message);
        }
      } catch (error) {
        failed++;
        errors.push(`提现 ${id} 处理失败: ${error.message}`);
      }
    }

    // 记录日志
    console.log(
      `[AdminLog] 批量审核买手提现 - 管理员${operatorName}操作: ${action}, 成功${success}个，失败${failed}个`,
    );

    return { success, failed, errors };
  }

  /**
   * 批量审核商家提现申请
   * 
   * 业务语义: 批量审核商家提现申请 (通过/拒绝)
   * 前置条件: state = 0 (已申请)
   * 后置状态: state = 1 (已同意) 或 state = 2 (已拒绝)
   *
   * @param withdrawalIds 提现ID数组
   * @param action 操作: 'approve' | 'reject'
   * @param reason 拒绝原因 (拒绝时必填)
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async batchReviewMerchantWithdrawals(
    withdrawalIds: string[],
    action: 'approve' | 'reject',
    reason: string | undefined,
    operatorId: string,
    operatorName: string,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const id of withdrawalIds) {
      try {
        const result =
          await this.merchantWithdrawalRepository.manager.transaction(
            async (transactionalEntityManager) => {
              // 1. 查询提现记录
              const withdrawal = await transactionalEntityManager.findOne(
                MerchantWithdrawal,
                { where: { id } },
              );

              if (!withdrawal) {
                return { success: false, message: `提现记录 ${id} 不存在` };
              }

              // 2. 验证状态: 必须为 PENDING (0)
              if (withdrawal.status !== MerchantWithdrawalStatus.PENDING) {
                return { success: false, message: `提现记录 ${id} 已处理` };
              }

              // 3. 更新审核信息
              withdrawal.reviewedAt = new Date();
              withdrawal.reviewedBy = operatorId;

              if (action === 'approve') {
                // 审核通过: state = 0 -> state = 1
                withdrawal.status = MerchantWithdrawalStatus.APPROVED_PENDING_TRANSFER;
              } else {
                // 审核拒绝: state = 0 -> state = 2
                withdrawal.status = MerchantWithdrawalStatus.REJECTED;
                withdrawal.remark = reason || '后台拒绝';

                // 退还冻结余额到可用余额
                if (withdrawal.type === MerchantWithdrawalType.BALANCE) {
                  await transactionalEntityManager
                    .createQueryBuilder()
                    .update(Merchant)
                    .set({
                      balance: () => `balance + ${withdrawal.amount}`,
                      frozenBalance: () =>
                        `"frozenBalance" - ${withdrawal.amount}`,
                    })
                    .where('id = :merchantId', {
                      merchantId: withdrawal.merchantId,
                    })
                    .execute();
                } else {
                  await transactionalEntityManager
                    .createQueryBuilder()
                    .update(Merchant)
                    .set({
                      silver: () => `silver + ${withdrawal.amount}`,
                      frozenSilver: () =>
                        `"frozenSilver" - ${withdrawal.amount}`,
                    })
                    .where('id = :merchantId', {
                      merchantId: withdrawal.merchantId,
                    })
                    .execute();
                }
              }

              await transactionalEntityManager.save(withdrawal);
              return { success: true, message: '成功' };
            },
          );

        if (result.success) {
          success++;
        } else {
          failed++;
          errors.push(result.message);
        }
      } catch (error) {
        failed++;
        errors.push(`提现 ${id} 处理失败: ${error.message}`);
      }
    }

    // 记录日志
    console.log(
      `[AdminLog] 批量审核商家提现 - 管理员${operatorName}操作: ${action}, 成功${success}个，失败${failed}个`,
    );

    return { success, failed, errors };
  }

  // ============ 批量确认打款 ============

  /**
   * 批量确认买手提现打款
   * 
   * 业务语义: 批量确认买手提现已打款完成
   * 前置条件: state = 1 (已同意)
   * 后置状态: state = 3 (已返款)
   *
   * @param withdrawalIds 提现ID数组
   * @param paymentNo 打款单号 (可选)
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async batchConfirmBuyerPayment(
    withdrawalIds: string[],
    paymentNo: string | undefined,
    operatorId: string,
    operatorName: string,
  ): Promise<{
    success: number;
    failed: number;
    totalAmount: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (const id of withdrawalIds) {
      try {
        const result = await this.withdrawalRepository.manager.transaction(
          async (transactionalEntityManager) => {
            // 1. 查询提现记录
            const withdrawal = await transactionalEntityManager.findOne(
              Withdrawal,
              { where: { id } },
            );

            if (!withdrawal) {
              return {
                success: false,
                message: `提现记录 ${id} 不存在`,
                amount: 0,
              };
            }

            // 2. 验证状态: 必须为 APPROVED (1)
            if (withdrawal.status !== WithdrawalStatus.APPROVED_PENDING_TRANSFER) {
              return {
                success: false,
                message: `提现记录 ${id} 状态不正确`,
                amount: 0,
              };
            }

            // 3. 更新为已完成: state = 1 -> state = 3
            withdrawal.status = WithdrawalStatus.COMPLETED;
            if (paymentNo) {
              withdrawal.remark =
                (withdrawal.remark || '') + ` 打款单号: ${paymentNo}`;
            }

            // 4. 扣除冻结余额
            const ownerId = withdrawal.ownerId || withdrawal.userId;
            if (withdrawal.type === WithdrawalType.BALANCE) {
              await transactionalEntityManager
                .createQueryBuilder()
                .update(User)
                .set({
                  frozenBalance: () => `"frozenBalance" - ${withdrawal.amount}`,
                })
                .where('id = :userId', { userId: ownerId })
                .execute();

              // 记录提现流水
              await this.financeRecordsService.recordBuyerWithdraw(
                ownerId!,
                withdrawal.id,
                withdrawal.actualAmount,
                0,
              );
            } else {
              await transactionalEntityManager
                .createQueryBuilder()
                .update(User)
                .set({
                  frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`,
                })
                .where('id = :userId', { userId: ownerId })
                .execute();

              // 记录银锭提现流水
              await this.financeRecordsService.recordBuyerSilverWithdraw(
                ownerId!,
                withdrawal.id,
                withdrawal.actualAmount,
                0,
              );
            }

            await transactionalEntityManager.save(withdrawal);
            return {
              success: true,
              message: '成功',
              amount: Number(withdrawal.actualAmount),
            };
          },
        );

        if (result.success) {
          success++;
          totalAmount += result.amount;
        } else {
          failed++;
          errors.push(result.message);
        }
      } catch (error) {
        failed++;
        errors.push(`提现 ${id} 处理失败: ${error.message}`);
      }
    }

    // 记录日志
    console.log(
      `[AdminLog] 批量确认买手打款 - 管理员${operatorName}操作: 成功${success}个，失败${failed}个，总金额${totalAmount}元`,
    );

    return { success, failed, totalAmount, errors };
  }

  /**
   * 批量确认商家提现打款
   * 
   * 业务语义: 批量确认商家提现已打款完成
   * 前置条件: state = 1 (已同意)
   * 后置状态: state = 3 (已返款)
   *
   * @param withdrawalIds 提现ID数组
   * @param paymentNo 打款单号 (可选)
   * @param operatorId 操作员ID
   * @param operatorName 操作员姓名
   */
  async batchConfirmMerchantPayment(
    withdrawalIds: string[],
    paymentNo: string | undefined,
    operatorId: string,
    operatorName: string,
  ): Promise<{
    success: number;
    failed: number;
    totalAmount: number;
    errors: string[];
  }> {
    let success = 0;
    let failed = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    for (const id of withdrawalIds) {
      try {
        const result =
          await this.merchantWithdrawalRepository.manager.transaction(
            async (transactionalEntityManager) => {
              // 1. 查询提现记录
              const withdrawal = await transactionalEntityManager.findOne(
                MerchantWithdrawal,
                { where: { id } },
              );

              if (!withdrawal) {
                return {
                  success: false,
                  message: `提现记录 ${id} 不存在`,
                  amount: 0,
                };
              }

              // 2. 验证状态: 必须为 APPROVED (1)
              if (withdrawal.status !== MerchantWithdrawalStatus.APPROVED_PENDING_TRANSFER) {
                return {
                  success: false,
                  message: `提现记录 ${id} 状态不正确`,
                  amount: 0,
                };
              }

              // 3. 更新为已完成: state = 1 -> state = 3
              withdrawal.status = MerchantWithdrawalStatus.COMPLETED;
              if (paymentNo) {
                withdrawal.remark =
                  (withdrawal.remark || '') + ` 打款单号: ${paymentNo}`;
              }

              // 4. 扣除冻结余额
              if (withdrawal.type === MerchantWithdrawalType.BALANCE) {
                await transactionalEntityManager
                  .createQueryBuilder()
                  .update(Merchant)
                  .set({
                    frozenBalance: () =>
                      `"frozenBalance" - ${withdrawal.amount}`,
                  })
                  .where('id = :merchantId', {
                    merchantId: withdrawal.merchantId,
                  })
                  .execute();

                // 记录提现流水
                await this.financeRecordsService.recordMerchantWithdraw(
                  withdrawal.merchantId,
                  withdrawal.id,
                  withdrawal.actualAmount,
                  0,
                );
              } else {
                await transactionalEntityManager
                  .createQueryBuilder()
                  .update(Merchant)
                  .set({
                    frozenSilver: () => `"frozenSilver" - ${withdrawal.amount}`,
                  })
                  .where('id = :merchantId', {
                    merchantId: withdrawal.merchantId,
                  })
                  .execute();

                // 记录银锭提现流水
                await this.financeRecordsService.recordMerchantSilverWithdraw(
                  withdrawal.merchantId,
                  withdrawal.id,
                  withdrawal.actualAmount,
                  0,
                );
              }

              await transactionalEntityManager.save(withdrawal);
              return {
                success: true,
                message: '成功',
                amount: Number(withdrawal.actualAmount),
              };
            },
          );

        if (result.success) {
          success++;
          totalAmount += result.amount;
        } else {
          failed++;
          errors.push(result.message);
        }
      } catch (error) {
        failed++;
        errors.push(`提现 ${id} 处理失败: ${error.message}`);
      }
    }

    // 记录日志
    console.log(
      `[AdminLog] 批量确认商家打款 - 管理员${operatorName}操作: 成功${success}个，失败${failed}个，总金额${totalAmount}元`,
    );

    return { success, failed, totalAmount, errors };
  }
}
