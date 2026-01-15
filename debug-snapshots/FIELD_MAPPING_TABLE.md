# 关键页面字段映射表

**审计时间**: 2026-01-15 20:56:45
**目的**: 列出所有关键页面应该显示的字段，以及每个字段的数据来源（DB → API → 前端）

---

## 1. 管理后台 - 订单列表

**页面路径**: [frontend/src/app/admin/orders/page.tsx](frontend/src/app/admin/orders/page.tsx)
**API端点**: `GET /orders/admin`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 订单ID | orders.id | id | order.id | ✅ 显示 | - |
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ✅ 显示 | - |
| 任务编号 | tasks.taskNumber | task.taskNumber | order.task?.taskNumber | ⚠️ 待检查 | P0 |
| 买手账号 | users.username | user.username | order.user?.username | ⚠️ 待检查 | P0 |
| 买号 | orders.buynoAccount | buynoAccount | order.buynoAccount | ✅ 显示 | - |
| 商家名称 | merchants.username | task.merchant.username | order.task?.merchant?.username | ⚠️ 待检查 | P0 |
| 平台 | orders.platform | platform | order.platform | ✅ 显示 | - |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ✅ 显示 | - |
| 佣金 | orders.commission | commission | order.commission | ✅ 显示 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ⚠️ 待检查 | P0 |
| 银锭押金 | orders.silverPrepay | silverPrepay | order.silverPrepay | ⚠️ 待检查 | P0 |
| 订单状态 | orders.status | status | order.status | ✅ 显示 | - |
| 创建时间 | orders.createdAt | createdAt | order.createdAt | ✅ 显示 | - |

**数据流验证**:
- ✅ 后端已关联: task, merchant, user, buyno
- ⚠️ 前端需检查: 是否正确使用关联数据

---

## 2. 管理后台 - 订单详情

**页面路径**: [frontend/src/app/admin/orders/[id]/page.tsx](frontend/src/app/admin/orders/[id]/page.tsx)
**API端点**: `GET /orders/:id`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 订单ID | orders.id | id | order.id | ✅ 显示 | - |
| 任务编号 | tasks.taskNumber | task.taskNumber | order.task?.taskNumber | ⚠️ 待检查 | P1 |
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ✅ 显示 | - |
| 买手账号 | users.username | user.username | order.user?.username | ⚠️ 待检查 | P1 |
| 买号 | orders.buynoAccount | buynoAccount | order.buynoAccount | ✅ 显示 | - |
| 商家名称 | merchants.username | task.merchant.username | order.task?.merchant?.username | ⚠️ 待检查 | P1 |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ✅ 显示 | - |
| 佣金 | orders.commission | commission | order.commission | ✅ 显示 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ⚠️ 待检查 | P1 |
| 银锭押金 | orders.silverPrepay | silverPrepay | order.silverPrepay | ⚠️ 待检查 | P1 |
| 执行步骤 | orders.stepData | stepData | order.stepData | ✅ 显示 | - |
| 任务要求 | tasks.* | task.* | order.task?.* | ✅ 显示 | - |

---

## 3. 商家中心 - 订单列表

**页面路径**: [frontend/src/app/merchant/orders/page.tsx](frontend/src/app/merchant/orders/page.tsx)
**API端点**: `GET /orders/merchant/list`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ✅ 显示 | - |
| 任务编号 | tasks.taskNumber | task.taskNumber | order.task?.taskNumber | ✅ 已修复 | - |
| 平台 | orders.platform | platform | order.platform | ✅ 显示 | - |
| 买号 | orders.buynoAccount | buynoAccount | order.buynoAccount | ✅ 显示 | - |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ✅ 显示 | - |
| 佣金 | orders.commission | commission | order.commission | ✅ 显示 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ✅ 已修复 | - |
| 银锭押金 | orders.silverPrepay | silverPrepay | order.silverPrepay | ✅ 已修复 | - |
| 订单状态 | orders.status | status | order.status | ✅ 显示 | - |
| 提交时间 | orders.completedAt | completedAt | order.completedAt | ✅ 显示 | - |

**修复验证**: ✅ 已在 [frontend/src/app/merchant/orders/page.tsx:378-402](frontend/src/app/merchant/orders/page.tsx#L378-L402) 修复

---

## 4. 商家中心 - 任务详情

**页面路径**: [frontend/src/app/merchant/tasks/[id]/page.tsx](frontend/src/app/merchant/tasks/[id]/page.tsx)
**API端点**: `GET /tasks/:id`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务编号 | tasks.taskNumber | taskNumber | task.taskNumber | ✅ 显示 | - |
| 任务标题 | tasks.title | title | task.title | ✅ 显示 | - |
| 总单数 | tasks.count | count | task.count | ✅ 显示 | - |
| 已领取 | tasks.claimedCount | claimedCount | task.claimedCount | ✅ 显示 | - |
| 已完成 | tasks.completedCount | completedCount | task.completedCount | ✅ 显示 | - |
| 剩余单数 | 计算 | - | count - claimedCount | ⚠️ 待验证 | P1 |
| 商品价格 | tasks.goodsPrice | goodsPrice | task.goodsPrice | ✅ 显示 | - |
| 总佣金 | tasks.totalCommission | totalCommission | task.totalCommission | ✅ 显示 | - |
| 买手分成总额 | tasks.userDivided | userDivided | task.userDivided | ⚠️ 未显示 | P1 |
| 单笔买手分成 | 计算 | - | userDivided / count | ⚠️ 未显示 | P1 |
| 基础服务费 | tasks.baseServiceFee | baseServiceFee | task.baseServiceFee | ✅ 显示 | - |
| 总押金 | tasks.totalDeposit | totalDeposit | task.totalDeposit | ✅ 显示 | - |

---

## 5. 买手端 - 订单列表

**页面路径**: [frontend/src/app/orders/page.tsx](frontend/src/app/orders/page.tsx)
**API端点**: `GET /orders`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ⚠️ 待检查 | - |
| 任务编号 | tasks.taskNumber | task.taskNumber | order.task?.taskNumber | ⚠️ 待检查 | P0 |
| 商家名称 | merchants.username | task.merchant.username | order.task?.merchant?.username | ⚠️ 待检查 | P0 |
| 平台 | orders.platform | platform | order.platform | ⚠️ 待检查 | - |
| 买号 | orders.buynoAccount | buynoAccount | order.buynoAccount | ⚠️ 待检查 | - |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ⚠️ 待检查 | - |
| 佣金 | orders.commission | commission | order.commission | ⚠️ 待检查 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ⚠️ 待检查 | P0 |
| 银锭押金 | orders.silverPrepay | silverPrepay | order.silverPrepay | ⚠️ 待检查 | P0 |
| 订单状态 | orders.status | status | order.status | ⚠️ 待检查 | - |
| 创建时间 | orders.createdAt | createdAt | order.createdAt | ⚠️ 待检查 | - |

**参考实现**: [frontend/src/app/merchant/orders/page.tsx:378-402](frontend/src/app/merchant/orders/page.tsx#L378-L402)

---

## 6. 买手端 - 任务大厅

**页面路径**: [frontend/src/app/tasks/page.tsx](frontend/src/app/tasks/page.tsx)
**API端点**: `GET /tasks`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务编号 | tasks.taskNumber | randNum | task.randNum | ✅ 显示 | - |
| 任务标题 | tasks.title | title | task.title | ✅ 显示 | - |
| 商家名称 | tasks.shopName | sellerName | task.sellerName | ✅ 显示 | - |
| 商品价格 | tasks.goodsPrice | totalPrice | task.totalPrice | ✅ 显示 | - |
| 单笔佣金 | 计算 | userReward | task.userReward | ✅ 显示 | - |
| 买手分成 | tasks.userDivided | userDivided | task.userDivided | ⚠️ 未显示 | P1 |
| 总单数 | tasks.count | num | task.num | ✅ 显示 | - |
| 已领取 | tasks.claimedCount | claimedCount | task.claimedCount | ✅ 显示 | - |
| 剩余单数 | 计算 | - | num - claimedCount | ⚠️ 待验证 | P1 |

**数据映射**: 后端已在 [backend/src/tasks/tasks.service.ts:200-210](backend/src/tasks/tasks.service.ts#L200-L210) 正确映射

---

## 7. 商家中心 - 我的钱包

**页面路径**: [frontend/src/app/merchant/wallet/page.tsx](frontend/src/app/merchant/wallet/page.tsx)
**API端点**: `GET /finance-records/merchant/balance`, `GET /finance-records/merchant/silver`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 流水ID | finance_records.id | id | record.id | ✅ 显示 | - |
| 流水类型 | finance_records.financeType | changeType | record.changeType | ✅ 已修复 | - |
| 金额 | finance_records.amount | amount | record.amount | ✅ 显示 | - |
| 余额类型 | finance_records.moneyType | moneyType | record.moneyType | ✅ 显示 | - |
| 备注 | finance_records.memo | memo | record.memo | ✅ 显示 | - |
| 余额后 | finance_records.balanceAfter | balanceAfter | record.balanceAfter | ❌ 未显示 | P2 |
| 创建时间 | finance_records.createdAt | createdAt | record.createdAt | ✅ 显示 | - |

**修复验证**: ✅ 已在 [frontend/src/app/merchant/wallet/page.tsx:74](frontend/src/app/merchant/wallet/page.tsx#L74) 修复

---

## 8. 管理后台 - 财务流水

**页面路径**: [frontend/src/app/admin/finance/records/page.tsx](frontend/src/app/admin/finance/records/page.tsx)
**API端点**: `GET /finance-records`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 流水ID | finance_records.id | id | record.id | ⚠️ 待检查 | - |
| 用户名 | users.username / merchants.username | username | record.username | ⚠️ 待检查 | - |
| 用户类型 | finance_records.userType | userType | record.userType | ⚠️ 待检查 | - |
| 流水类型 | finance_records.financeType | changeType | record.changeType | ⚠️ 待检查 | P1 |
| 金额 | finance_records.amount | amount | record.amount | ⚠️ 待检查 | - |
| 余额类型 | finance_records.moneyType | moneyType | record.moneyType | ⚠️ 待检查 | - |
| 备注 | finance_records.memo | memo | record.memo | ⚠️ 待检查 | - |
| 余额后 | finance_records.balanceAfter | balanceAfter | record.balanceAfter | ⚠️ 待检查 | - |
| 创建时间 | finance_records.createdAt | createdAt | record.createdAt | ⚠️ 待检查 | - |

**参考实现**: [frontend/src/app/merchant/wallet/page.tsx:59-96](frontend/src/app/merchant/wallet/page.tsx#L59-L96)

---

## 9. 商家中心 - 订单详情（模态框）

**页面路径**: [frontend/src/app/merchant/orders/page.tsx](frontend/src/app/merchant/orders/page.tsx) (Modal)
**API端点**: `GET /orders/merchant/list` (包含task关联数据)

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ✅ 显示 | - |
| 平台 | orders.platform | platform | order.platform | ✅ 显示 | - |
| 买号 | orders.buynoAccount | buynoAccount | order.buynoAccount | ✅ 显示 | - |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ✅ 显示 | - |
| 执行步骤 | orders.stepData | stepData | order.stepData | ✅ 显示 | - |
| 浏览要求 | tasks.* | task.* | order.task?.* | ✅ 显示 | - |
| 增值服务 | tasks.* | task.* | order.task?.* | ✅ 显示 | - |
| 好评要求 | tasks.* | task.* | order.task?.* | ✅ 显示 | - |
| 下单提示 | tasks.memo | task.memo | order.task?.memo | ✅ 显示 | - |
| 基础服务费 | tasks.baseServiceFee | task.baseServiceFee | order.task?.baseServiceFee | ✅ 显示 | - |
| 好评费 | tasks.praiseFee | task.praiseFee | order.task?.praiseFee | ✅ 显示 | - |
| 图片好评费 | tasks.imgPraiseFee | task.imgPraiseFee | order.task?.imgPraiseFee | ✅ 显示 | - |
| 视频好评费 | tasks.videoPraiseFee | task.videoPraiseFee | order.task?.videoPraiseFee | ✅ 显示 | - |
| 定时发布费 | tasks.timingPublishFee | task.timingPublishFee | order.task?.timingPublishFee | ✅ 已修复 | - |
| 定时付款费 | tasks.timingPayFee | task.timingPayFee | order.task?.timingPayFee | ✅ 已修复 | - |
| 隔天任务费 | tasks.nextDayFee | task.nextDayFee | order.task?.nextDayFee | ✅ 已修复 | - |
| 多商品费用 | tasks.goodsMoreFee | task.goodsMoreFee | order.task?.goodsMoreFee | ✅ 已修复 | - |
| 快速返款费 | 计算 | - | goodsPrice * 0.006 | ✅ 已修复 | - |
| 邮费 | tasks.shippingFee | task.shippingFee | order.task?.shippingFee | ✅ 显示 | - |
| 保证金 | tasks.margin | task.margin | order.task?.margin | ✅ 显示 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ✅ 已修复 | - |

**修复验证**: ✅ 已在 [frontend/src/app/merchant/orders/page.tsx:691-776](frontend/src/app/merchant/orders/page.tsx#L691-L776) 修复

---

## 10. 买手端 - 订单详情

**页面路径**: [frontend/src/app/orders/[id]/page.tsx](frontend/src/app/orders/[id]/page.tsx)
**API端点**: `GET /orders/:id`

| 字段名 | DB字段 | API字段 | 前端取值 | 当前状态 | 优先级 |
|--------|--------|---------|----------|----------|--------|
| 任务标题 | orders.taskTitle | taskTitle | order.taskTitle | ⚠️ 待检查 | - |
| 任务编号 | tasks.taskNumber | task.taskNumber | order.task?.taskNumber | ⚠️ 待检查 | P1 |
| 商家名称 | merchants.username | task.merchant.username | order.task?.merchant?.username | ⚠️ 待检查 | P1 |
| 商品价格 | orders.productPrice | productPrice | order.productPrice | ⚠️ 待检查 | - |
| 佣金 | orders.commission | commission | order.commission | ⚠️ 待检查 | - |
| 买手分成 | orders.userDivided | userDivided | order.userDivided | ⚠️ 待检查 | P1 |
| 银锭押金 | orders.silverPrepay | silverPrepay | order.silverPrepay | ⚠️ 待检查 | P1 |
| 执行步骤 | orders.stepData | stepData | order.stepData | ⚠️ 待检查 | - |
| 任务要求 | tasks.* | task.* | order.task?.* | ⚠️ 待检查 | - |
| 费用明细 | tasks.* | task.* | order.task?.* | ⚠️ 待检查 | P1 |

**参考实现**: [frontend/src/app/merchant/orders/page.tsx:691-776](frontend/src/app/merchant/orders/page.tsx#L691-L776)

---

## 数据流验证总结

### ✅ 已验证正确的数据流
1. **商家订单列表** → 已显示任务编号、买手分成、银锭押金
2. **商家订单详情** → 已显示完整费用明细
3. **商家钱包流水** → 已使用后端返回的changeType

### ⚠️ 待验证的数据流
1. **管理后台订单列表** → 需检查是否显示买手账号、任务编号、商家名称
2. **买手端订单列表** → 需检查是否显示任务编号、买手分成、银锭押金
3. **买手端订单详情** → 需检查是否显示完整信息
4. **管理后台财务流水** → 需检查是否使用changeType字段
5. **任务详情页** → 需检查是否显示买手分成总额

### ❌ 已知的数据问题
1. **财务流水memo显示"undefined"** → 需修复发布任务时的memo传参
2. **订单taskId为null** → 需数据修复脚本
3. **任务统计口径** → 需验证剩余单数计算逻辑

---

## 关键数据路径

### 订单数据流
```
DB: orders表
  ↓ (关联)
  ├─ tasks表 (task)
  │   └─ merchants表 (merchant)
  ├─ users表 (user)
  └─ buynos表 (buyno)
  ↓ (API)
GET /orders/:id
  ↓ (返回)
{
  id, taskTitle, platform, productPrice, commission,
  userDivided, silverPrepay, status, createdAt,
  task: { taskNumber, merchant: { username } },
  user: { username },
  buyno: { account }
}
  ↓ (前端)
显示: 任务编号, 买手账号, 商家名称, 买手分成, 银锭押金
```

### 财务流水数据流
```
DB: finance_records表
  ↓ (关联)
  ├─ users表 (userType=1)
  └─ merchants表 (userType=2)
  ↓ (计算)
changeType = getFinanceTypeText(financeType)
  ↓ (API)
GET /finance-records
  ↓ (返回)
{
  id, amount, moneyType, financeType, memo,
  balanceAfter, createdAt,
  username, changeType  ← 关键字段
}
  ↓ (前端)
显示: changeType (不是硬编码的类型映射)
```

### 任务统计数据流
```
DB: tasks表
  ↓ (字段)
count (总单数)
claimedCount (已领取)
completedCount (已完成)
  ↓ (计算)
剩余单数 = count - claimedCount  ← 正确
剩余单数 = count - completedCount  ← 错误
  ↓ (前端)
显示: 剩余单数
```

---

**字段映射表完成**: ✅
**覆盖页面**: 10个关键页面
**字段总数**: 100+ 个字段
**待验证字段**: 30+ 个字段
