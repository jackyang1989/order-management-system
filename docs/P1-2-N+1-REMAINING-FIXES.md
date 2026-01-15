# P1-2: 剩余 N+1 查询修复清单

## 概述

已完成 8 个主要批量操作方法的 N+1 查询优化。剩余 5 个方法需要修复。

## 修复模式

所有修复遵循相同的模式：

```typescript
// ❌ 修复前（N+1 查询）
for (const id of ids) {
  const entity = await repository.findOne({ where: { id } });
  // 处理逻辑
}

// ✅ 修复后（批量查询）
// 1. 批量查询所有实体
const entities = await repository.find({
  where: { id: In(ids) },
});

// 2. 创建 ID 到实体的映射
const entityMap = new Map(entities.map(e => [e.id, e]));

// 3. 使用映射处理
for (const id of ids) {
  const entity = entityMap.get(id);
  // 处理逻辑
}
```

## 剩余待修复方法

### 1. batchShipFromExcel (行 131)

**文件**: `backend/src/batch-operations/batch-operations.service.ts`

**位置**: 第 131 行

**问题**: 在循环中逐个查询订单

**修复前**:
```typescript
for (const row of data) {
  try {
    let order;
    if (row.orderId) {
      order = await this.orderRepository.findOne({
        where: { id: row.orderId },
      });
    } else if (row.taskNumber) {
      // 按任务编号查询
      order = await this.orderRepository
        .createQueryBuilder('order')
        .innerJoin('tasks', 'task', 'order.taskId = task.id')
        .where('task.taskNumber = :taskNumber', { taskNumber: row.taskNumber })
        .getOne();
    }
    // ... 处理逻辑
  }
}
```

**修复后**:
```typescript
// 1. 分离订单ID和任务编号
const orderIds = data.filter(row => row.orderId).map(row => row.orderId);
const taskNumbers = data.filter(row => row.taskNumber).map(row => row.taskNumber);

// 2. 批量查询订单和任务
const [orders, taskOrders] = await Promise.all([
  orderIds.length > 0
    ? this.orderRepository.find({ where: { id: In(orderIds) } })
    : Promise.resolve([]),
  taskNumbers.length > 0
    ? this.orderRepository
        .createQueryBuilder('order')
        .innerJoin('tasks', 'task', 'order.taskId = task.id')
        .where('task.taskNumber IN (:...taskNumbers)', { taskNumbers })
        .getMany()
    : Promise.resolve([]),
]);

// 3. 创建映射
const orderMap = new Map(orders.map(o => [o.id, o]));
const taskOrderMap = new Map(taskOrders.map(o => [o.task.taskNumber, o]));

// 4. 使用映射处理
for (const row of data) {
  try {
    let order;
    if (row.orderId) {
      order = orderMap.get(row.orderId);
    } else if (row.taskNumber) {
      order = taskOrderMap.get(row.taskNumber);
    }
    // ... 处理逻辑
  }
}
```

---

### 2. batchRejectTasks (行 268)

**文件**: `backend/src/batch-operations/batch-operations.service.ts`

**位置**: 第 268 行

**问题**: 在循环中逐个查询任务（在事务内）

**修复前**:
```typescript
for (const taskId of taskIds) {
  try {
    const result = await this.taskRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 查询任务
        const task = await transactionalEntityManager.findOne(Task, {
          where: { id: taskId },
        });
        // ... 处理逻辑
      }
    );
  }
}
```

**修复后**:
```typescript
// 1. 批量查询所有任务（在事务外）
const tasks = await this.taskRepository.find({
  where: { id: In(taskIds) },
});

// 2. 创建任务映射
const taskMap = new Map(tasks.map(task => [task.id, task]));

// 3. 使用映射处理
for (const taskId of taskIds) {
  try {
    const result = await this.taskRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 从映射获取任务
        const task = taskMap.get(taskId);
        if (!task || task.status !== TaskStatus.AUDIT) {
          return { success: false, message: `任务 ${taskId} 状态不正确` };
        }
        // ... 处理逻辑
      }
    );
  }
}
```

---

### 3. batchReviewBuyerWithdrawals (行 1113)

**文件**: `backend/src/batch-operations/batch-operations.service.ts`

**位置**: 第 1113 行

**问题**: 在循环中逐个查询提现记录（在事务内）

**修复前**:
```typescript
for (const id of withdrawalIds) {
  try {
    const result = await this.withdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 查询提现记录
        const withdrawal = await transactionalEntityManager.findOne(
          Withdrawal,
          { where: { id } },
        );
        // ... 处理逻辑
      }
    );
  }
}
```

**修复后**:
```typescript
// 1. 批量查询所有提现记录（在事务外）
const withdrawals = await this.withdrawalRepository.find({
  where: { id: In(withdrawalIds) },
});

// 2. 创建提现记录映射
const withdrawalMap = new Map(withdrawals.map(w => [w.id, w]));

// 3. 使用映射处理
for (const id of withdrawalIds) {
  try {
    const result = await this.withdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 从映射获取提现记录
        const withdrawal = withdrawalMap.get(id);
        if (!withdrawal) {
          return { success: false, message: `提现记录 ${id} 不存在` };
        }
        // ... 处理逻辑
      }
    );
  }
}
```

---

### 4. batchReviewMerchantWithdrawals (行 1210)

**文件**: `backend/src/batch-operations/batch-operations.service.ts`

**位置**: 第 1210 行

**问题**: 在循环中逐个查询商家提现记录（在事务内）

**修复前**:
```typescript
for (const id of withdrawalIds) {
  try {
    const result = await this.merchantWithdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. 查询提现记录
        const withdrawal = await transactionalEntityManager.findOne(
          MerchantWithdrawal,
          { where: { id } },
        );
        // ... 处理逻辑
      }
    );
  }
}
```

**修复后**:
```typescript
// 1. 批量查询所有商家提现记录（在事务外）
const withdrawals = await this.merchantWithdrawalRepository.find({
  where: { id: In(withdrawalIds) },
});

// 2. 创建提现记录映射
const withdrawalMap = new Map(withdrawals.map(w => [w.id, w]));

// 3. 使用映射处理
for (const id of withdrawalIds) {
  try {
    const result = await this.merchantWithdrawalRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 从映射获取提现记录
        const withdrawal = withdrawalMap.get(id);
        if (!withdrawal) {
          return { success: false, message: `提现记录 ${id} 不存在` };
        }
        // ... 处理逻辑
      }
    );
  }
}
```

---

### 5. batchConfirmBuyerPayment & batchConfirmMerchantPayment (行 1327, 1462)

**文件**: `backend/src/batch-operations/batch-operations.service.ts`

**位置**: 第 1327 行和第 1462 行

**问题**: 在循环中逐个查询提现记录（在事务内）

**修复模式**: 与上面的提现审核方法相同

---

## 修复优先级

由于这些方法使用频率较低，建议在 P2 阶段统一处理，或者在遇到性能问题时再修复。

## 性能提升预期

- **查询次数**: 从 N+1 次减少到 1-2 次
- **数据库往返**: 从 N+1 次减少到 1-2 次
- **预期性能提升**: 10-100 倍（取决于批量大小）

## 注意事项

1. **事务处理**: 批量查询应在事务外执行，避免长时间持有事务锁
2. **错误处理**: 保持原有的错误处理逻辑
3. **数据一致性**: 使用映射时注意数据可能在查询后被修改
4. **导入依赖**: 确保导入 `In` 操作符：`import { Repository, In } from 'typeorm';`

## 已完成的修复

✅ batchShip - 批量发货
✅ batchApproveTasks - 批量审核任务
✅ batchApproveOrders - 批量审核订单
✅ batchRefund - 批量返款
✅ batchApproveReviewTasks - 批量审核追评任务
✅ batchRefundReviewTasks - 批量返款追评任务
✅ batchCancelOrders - 批量取消订单

## 待修复

⏳ batchShipFromExcel - Excel批量发货
⏳ batchRejectTasks - 批量拒绝任务
⏳ batchReviewBuyerWithdrawals - 批量审核买手提现
⏳ batchReviewMerchantWithdrawals - 批量审核商家提现
⏳ batchConfirmBuyerPayment - 批量确认买手打款
⏳ batchConfirmMerchantPayment - 批量确认商家打款
