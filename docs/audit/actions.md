# 接口语义锁 (Actions Semantic Lock)

> **版本**: v1.0
> **冻结日期**: 2026-01-04
> **约束级别**: LOCKED - 接口语义不可修改，任何变更必须先更新此文档

---

## 总览

本文档定义所有后台管理接口的业务语义，作为重构版实现的接口行为参考标准。

---

## 1. 任务管理接口

### 1.1 任务审核通过

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::examineAgree` |
| **重构版接口** | `POST /batch/approve-tasks` |
| **业务语义** | 后台审核通过商家任务，使任务可被买手领取 |
| **前置条件** | seller_task.status = 2 (待审核) |
| **后置状态** | seller_task.status = 3 (已通过) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 examine_time |

### 1.2 任务审核拒绝

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::examineRefuse` |
| **重构版接口** | `POST /batch/reject-tasks` |
| **业务语义** | 后台拒绝商家任务，退还商家费用 |
| **前置条件** | seller_task.status = 2 (待审核) |
| **后置状态** | seller_task.status = 4 (已拒绝) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 remarks, examine_time, 退还押金/银锭 |

---

## 2. 订单管理接口

### 2.1 订单审核通过

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::orderExamine` (通过) |
| **重构版接口** | `POST /batch/approve-orders` |
| **业务语义** | 后台审核买手订单，确认返款金额 |
| **前置条件** | user_task.state = 5 (待返款) |
| **后置状态** | user_task.state = 6 (待确认返款) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 seller_principal, platform_refund_time |

### 2.2 订单返款

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::orderRefund` |
| **重构版接口** | `POST /batch/refund` |
| **业务语义** | 后台执行返款，将本金+佣金返还给买手 |
| **前置条件** | user_task.state = 6 (待确认返款) |
| **后置状态** | user_task.state = 1 (已完成) |
| **触发角色** | 后台管理员 |
| **副作用** | 买手余额增加, 更新 complete_time, is_zp 相关处理 |

### 2.3 订单发货

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::orderShip` / `Task::batchShip` |
| **重构版接口** | `POST /orders/:id/ship` / `POST /batch/ship` |
| **业务语义** | 为订单录入快递信息并发货 |
| **前置条件** | user_task.state = 3 (待发货) |
| **后置状态** | user_task.state = 4 (待收货), delivery_state = 2 |
| **触发角色** | 后台管理员 / 商家 |
| **副作用** | 更新 delivery, delivery_num, delivery_time |

### 2.4 Excel导入发货

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::importShip` |
| **重构版接口** | `POST /batch/ship/import` |
| **业务语义** | 通过Excel批量导入快递单号发货 |
| **匹配逻辑** | 优先按 table_order_id(淘宝订单号) 匹配，其次按 task_number(任务编号-rand_num) 匹配 |
| **前置条件** | user_task.state = 3 (待发货) |
| **后置状态** | user_task.state = 4 (待收货), delivery_state = 2 |

### 2.5 订单取消

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::orderCancel` |
| **重构版接口** | `POST /batch/cancel-orders` |
| **业务语义** | 后台取消订单，恢复任务剩余单数 |
| **前置条件** | user_task.state in [0, 3] |
| **后置状态** | user_task.state = 2 (已取消) |
| **触发角色** | 后台管理员 |
| **副作用** | seller_task.incomplete_num += 1, 更新 cancel_time, cancel_remarks |

---

## 3. 追评管理接口

### 3.1 追评审核通过

| 属性 | 值 |
|------|-----|
| **原版接口** | `Review::examineAgree` |
| **重构版接口** | `POST /batch/approve-reviews` |
| **业务语义** | 后台审核通过追评任务 |
| **前置条件** | review_task.state = 1 (已支付) |
| **后置状态** | review_task.state = 2 (已审核) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 examine_time |

### 3.2 追评返款

| 属性 | 值 |
|------|-----|
| **原版接口** | `Review::refund` |
| **重构版接口** | `POST /batch/refund-reviews` |
| **业务语义** | 后台确认追评完成，返还买手追评佣金 |
| **前置条件** | review_task.state = 3 (已上传) |
| **后置状态** | review_task.state = 4 (已返款) |
| **触发角色** | 后台管理员 |
| **副作用** | 买手银锭增加 user_money, 更新 confirm_time |

---

## 4. 提现管理接口

### 4.1 提现审核通过

| 属性 | 值 |
|------|-----|
| **原版接口** | `Finance::cashAgree` |
| **重构版接口** | `POST /batch/review-buyer-withdrawals` (action=approve) / `POST /batch/review-merchant-withdrawals` (action=approve) |
| **业务语义** | 后台审核通过提现申请 |
| **前置条件** | state = 0 (已申请) |
| **后置状态** | state = 1 (已同意) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 examine_time |
| **备注** | ✅ Implemented in P0-10 (batch operations) |

### 4.2 提现审核拒绝

| 属性 | 值 |
|------|-----|
| **原版接口** | `Finance::cashRefuse` |
| **重构版接口** | `POST /batch/review-buyer-withdrawals` (action=reject) / `POST /batch/review-merchant-withdrawals` (action=reject) |
| **业务语义** | 后台拒绝提现申请，退还金额到账户 |
| **前置条件** | state = 0 (已申请) |
| **后置状态** | state = 2 (已拒绝) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 memo(拒绝原因), examine_time, 用户余额/银锭增加 |
| **备注** | ✅ Implemented in P0-10 (batch operations) |

### 4.3 提现打款

| 属性 | 值 |
|------|-----|
| **原版接口** | `Finance::cashPay` |
| **重构版接口** | `POST /batch/confirm-buyer-payment` / `POST /batch/confirm-merchant-payment` |
| **业务语义** | 后台确认已完成打款 |
| **前置条件** | state = 1 (已同意) |
| **后置状态** | state = 3 (已返款) |
| **触发角色** | 后台管理员 |
| **副作用** | 更新 memo(打款单号) |
| **备注** | ✅ Implemented in P0-11 (batch operations) |

---

## 5. 后台编辑接口

### 5.1 修改任务剩余单数

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::editIncompleteNum` |
| **重构版接口** | `POST /batch/update-incomplete-num` |
| **业务语义** | 后台修改任务剩余可领取单数 |
| **可修改条件** | seller_task.status = 3 (已通过) |
| **目标字段** | seller_task.incomplete_num |
| **限制** | 无限制 |
| **备注** | ✅ Implemented in P0-04 (batch operations) |

### 5.2 修改预付款/尾款

| 属性 | 值 |
|------|-----|
| **原版接口** | `Task::editYfWk` |
| **重构版接口** | `POST /batch/update-yf-price` (预付款) / `POST /batch/update-wk-price` (尾款) |
| **业务语义** | 后台修改预售订单的预付款和尾款金额 |
| **可修改条件** | seller_task.is_ys = 1 |
| **目标字段** | seller_task.yf_price, seller_task.wk_price |
| **限制** | 预付款 ±500元, 尾款 ±100元 |
| **备注** | ✅ Implemented in P0-02/P0-03 (batch operations) |

---

## 接口实现约束

1. **语义一致性**：重构版接口必须保持与原版完全相同的业务语义
2. **状态转换一致**：接口触发的状态转换必须与原版一致
3. **副作用一致**：所有副作用（余额变动、字段更新等）必须与原版一致
4. **权限一致**：接口的触发角色限制必须与原版一致
5. **禁止合并接口**：不得将多个原版接口合并为一个
6. **禁止拆分接口**：不得将一个原版接口拆分为多个
