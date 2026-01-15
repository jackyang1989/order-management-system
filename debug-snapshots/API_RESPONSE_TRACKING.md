# API响应追踪报告

**审计时间**: 2026-01-15 20:51:08
**目的**: 追踪所有API端点应返回的字段，标注DB有值但API未返回的字段

---

## 1. GET /tasks/:id - 任务详情

### 后端实现
- 文件: [backend/src/tasks/tasks.service.ts:249-275](backend/src/tasks/tasks.service.ts#L249-L275)
- 方法: `findOneWithDetails(id: string)`

### 应返回的字段（基于Task实体）

| 字段名 | DB字段 | API是否返回 | 前端是否使用 | 问题 |
|--------|--------|-------------|--------------|------|
| id | ✅ | ✅ | ✅ | - |
| taskNumber | ✅ | ✅ | ✅ | - |
| status | ✅ | ✅ | ✅ | - |
| count | ✅ | ✅ | ✅ | - |
| claimedCount | ✅ | ✅ | ✅ | - |
| completedCount | ✅ | ✅ | ✅ | - |
| totalCommission | ✅ | ✅ | ✅ | - |
| userDivided | ✅ | ✅ | ⚠️ | 前端未显示 |
| baseServiceFee | ✅ | ✅ | ✅ | - |
| goodsPrice | ✅ | ✅ | ✅ | - |
| totalDeposit | ✅ | ✅ | ✅ | - |
| merchantId | ✅ | ✅ | ❌ | 前端不需要 |
| title | ✅ | ✅ | ✅ | - |
| taskType | ✅ | ✅ | ✅ | - |
| merchant | ✅ (关联) | ✅ | ⚠️ | 前端未使用merchant.username |
| goodsList | ✅ (关联) | ✅ | ✅ | - |
| keywords | ✅ (关联) | ✅ | ✅ | - |

### 黄金样本验证
- **Task ID**: `61150ffc-48a5-4617-b6e0-a3995221796f`
- **DB数据**: userDivided=3.30, claimedCount=0, count=1
- **API应返回**: 所有字段 + merchant关联 + goodsList关联
- **前端期望**: 显示买手分成、已领取/总数、商家名称

---

## 2. GET /orders/:id - 订单详情

### 后端实现
- 文件: [backend/src/orders/orders.service.ts:167-172](backend/src/orders/orders.service.ts#L167-L172)
- 方法: `findOne(id: string)`

### 应返回的字段（基于Order实体）

| 字段名 | DB字段 | API是否返回 | 前端是否使用 | 问题 |
|--------|--------|-------------|--------------|------|
| id | ✅ | ✅ | ✅ | - |
| taskId | ✅ | ✅ | ✅ | - |
| userId | ✅ | ✅ | ❌ | 前端不需要 |
| buynoId | ✅ | ✅ | ✅ | - |
| buynoAccount | ✅ | ✅ | ✅ | - |
| taskTitle | ✅ | ✅ | ✅ | - |
| platform | ✅ | ✅ | ✅ | - |
| productPrice | ✅ | ✅ | ✅ | - |
| commission | ✅ | ✅ | ✅ | - |
| userDivided | ✅ | ✅ | ⚠️ | 前端未显示 |
| silverPrepay | ✅ | ✅ | ⚠️ | 前端未显示 |
| status | ✅ | ✅ | ✅ | - |
| createdAt | ✅ | ✅ | ✅ | - |
| completedAt | ✅ | ✅ | ✅ | - |
| task | ✅ (关联) | ✅ | ✅ | - |
| task.merchant | ✅ (关联) | ✅ | ⚠️ | 前端未使用 |
| task.taskNumber | ✅ (关联) | ✅ | ⚠️ | 前端未显示 |

### 黄金样本验证
- **Order ID**: `83dd6230-ffbe-41eb-adef-8f396aba6772`
- **DB数据**: userDivided=0.00, silverPrepay=0.00, taskId=null
- **问题**: taskId为null导致无法关联task数据

---

## 3. GET /orders - 订单列表（商家端）

### 后端实现
- 文件: [backend/src/orders/orders.service.ts:690-716](backend/src/orders/orders.service.ts#L690-L716)
- 方法: `findByMerchant(merchantId: string, filter?: { status?: OrderStatus })`

### 应返回的字段

| 字段名 | DB字段 | API是否返回 | 前端是否使用 | 问题 |
|--------|--------|-------------|--------------|------|
| id | ✅ | ✅ | ✅ | - |
| taskTitle | ✅ | ✅ | ✅ | - |
| platform | ✅ | ✅ | ✅ | - |
| buynoAccount | ✅ | ✅ | ✅ | - |
| productPrice | ✅ | ✅ | ✅ | - |
| commission | ✅ | ✅ | ✅ | - |
| userDivided | ✅ | ✅ | ✅ | ✅ 已修复 |
| silverPrepay | ✅ | ✅ | ✅ | ✅ 已修复 |
| status | ✅ | ✅ | ✅ | - |
| createdAt | ✅ | ✅ | ✅ | - |
| task | ✅ (关联) | ✅ | ✅ | - |
| task.taskNumber | ✅ (关联) | ✅ | ✅ | ✅ 已修复 |
| task.merchant | ✅ (关联) | ✅ | ⚠️ | 前端未使用 |

### 代码验证
```typescript
// backend/src/orders/orders.service.ts:702-706
const queryBuilder = this.ordersRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.task', 'task')
  .leftJoinAndSelect('task.merchant', 'merchant')
  .where('order.taskId IN (:...taskIds)', { taskIds });
```
✅ **已正确关联task和merchant**

---

## 4. GET /finance-records/merchant/balance - 商家余额流水

### 后端实现
- 文件: [backend/src/finance-records/finance-records.service.ts:163-178](backend/src/finance-records/finance-records.service.ts#L163-L178)
- 方法: `findMerchantBalanceRecords(merchantId: string, filter?: FinanceRecordFilterDto)`

### 应返回的字段

| 字段名 | DB字段 | API是否返回 | 前端是否使用 | 问题 |
|--------|--------|-------------|--------------|------|
| id | ✅ | ✅ | ✅ | - |
| userId | ✅ | ✅ | ❌ | 前端不需要 |
| userType | ✅ | ✅ | ❌ | 前端不需要 |
| moneyType | ✅ | ✅ | ✅ | - |
| financeType | ✅ | ✅ | ❌ | 前端不需要（有changeType） |
| amount | ✅ | ✅ | ✅ | - |
| balanceAfter | ✅ | ✅ | ❌ | 前端未使用 |
| memo | ✅ | ✅ | ✅ | - |
| relatedId | ✅ | ✅ | ❌ | 前端未使用 |
| createdAt | ✅ | ✅ | ✅ | - |
| **changeType** | ❌ (计算) | ✅ | ✅ | ✅ 已修复 |

### 代码验证
```typescript
// backend/src/finance-records/finance-records.service.ts:115
changeType: this.getFinanceTypeText(entity.financeType),
```
✅ **后端已返回changeType字段**

### 黄金样本验证
- **Finance Record ID**: `c79d8d11-215c-42fd-ad35-40fb22de8e05`
- **DB数据**: financeType=24, amount=-5.50, memo="发布任务: undefined"
- **问题**: memo显示"undefined"，说明任务标题未正确传递

---

## 5. GET /orders/merchant/stats - 商家订单统计

### 后端实现
- 文件: [backend/src/orders/orders.service.ts:953-996](backend/src/orders/orders.service.ts#L953-L996)
- 方法: `getMerchantStats(merchantId: string)`

### 应返回的字段

| 字段名 | 计算逻辑 | API是否返回 | 前端是否使用 | 问题 |
|--------|----------|-------------|--------------|------|
| pendingReview | status=SUBMITTED | ✅ | ✅ | - |
| approved | status=APPROVED | ✅ | ⚠️ | 前端误用为"已完成" |
| rejected | status=REJECTED | ✅ | ✅ | - |
| **completed** | status=COMPLETED | ✅ | ✅ | ✅ 已修复 |
| total | 所有订单 | ✅ | ✅ | - |

### 代码验证
```typescript
// backend/src/orders/orders.service.ts:984-988
const completed = await this.ordersRepository
  .createQueryBuilder('order')
  .where('order.taskId IN (:...taskIds)', { taskIds })
  .andWhere('order.status = :status', { status: OrderStatus.COMPLETED })
  .getCount();
```
✅ **已添加completed字段**

---

## 6. GET /tasks - 任务列表（买手端）

### 后端实现
- 文件: [backend/src/tasks/tasks.service.ts:168-211](backend/src/tasks/tasks.service.ts#L168-L211)
- 方法: `findAll(filter?: TaskFilterDto)`

### 应返回的字段

| 字段名 | DB字段 | API是否返回 | 前端是否使用 | 问题 |
|--------|--------|-------------|--------------|------|
| id | ✅ | ✅ | ✅ | - |
| taskNumber | ✅ | ✅ | ✅ | - |
| title | ✅ | ✅ | ✅ | - |
| taskType | ✅ | ✅ | ✅ | - |
| goodsPrice | ✅ | ✅ | ✅ | - |
| totalCommission | ✅ | ✅ | ✅ | - |
| userDivided | ✅ | ✅ | ⚠️ | 前端未显示 |
| count | ✅ | ✅ | ✅ | - |
| claimedCount | ✅ | ✅ | ✅ | - |
| shopName | ✅ | ✅ | ✅ | - |
| **randNum** | ❌ (映射) | ✅ | ✅ | 映射自taskNumber |
| **sellerName** | ❌ (映射) | ✅ | ✅ | 映射自shopName |
| **userReward** | ❌ (计算) | ✅ | ✅ | 单笔佣金 = totalCommission/count |

### 代码验证
```typescript
// backend/src/tasks/tasks.service.ts:200-210
return tasks.map(task => ({
  ...task,
  randNum: task.taskNumber,
  sellerName: task.shopName || '未知商家',
  totalPrice: Number(task.goodsPrice) || 0,
  userReward: task.count > 0 ? Number((task.totalCommission / task.count).toFixed(2)) : 0,
  userDivided: Number(task.userDivided) || 0,
  num: task.count || 1,
  progress: '0',
}));
```
✅ **已正确映射字段**

---

## 关键发现

### ✅ 已修复的问题
1. **商家订单列表** - 已显示任务编号、买手分成、银锭押金
2. **商家钱包流水** - 已使用后端返回的changeType字段
3. **商家订单统计** - 已添加completed字段

### ⚠️ 待验证的问题
1. **财务流水memo显示"undefined"** - 需检查发布任务时是否正确传递标题
2. **订单taskId为null** - 旧数据问题，需数据修复
3. **买手分成未显示** - 前端已获取但未在列表显示

### ❌ 未修复的问题
1. **管理后台订单列表** - 需检查是否显示完整字段
2. **买手端订单列表** - 需检查是否显示完整字段
3. **任务详情页** - 需检查是否显示买手分成

---

## 下一步行动

1. ✅ 验证商家端修复效果
2. ⚠️ 检查管理后台订单列表
3. ⚠️ 检查买手端订单列表
4. ⚠️ 修复财务流水memo显示"undefined"问题
5. ⚠️ 添加数据修复脚本（修复taskId为null的订单）
