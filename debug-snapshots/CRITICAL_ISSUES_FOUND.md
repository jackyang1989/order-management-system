# 🔴 生产级全栈审计 - 关键问题清单

**审计时间**: 2026-01-15 19:23:24
**审计范围**: 订单管理系统 - 字段显示/枚举映射/统计口径/费用明细一致性

---

## ✅ 已确认的关键问题

### 🔴 P0-1: 商家钱包页面 - 财务流水类型映射错误

**问题文件**: [frontend/src/app/merchant/wallet/page.tsx:65](frontend/src/app/merchant/wallet/page.tsx#L65)

**错误代码**:
```typescript
setTransactions(json.data.map((r: any) => ({
  id: r.id,
  type: r.amount > 0 ? 'deposit' : (r.type === 3 ? 'withdraw' : 'deduct'), // ❌ 错误
  amount: r.amount,
  balanceType: r.moneyType === 1 ? 'balance' : 'silver',
  memo: r.memo || '财务记录',
  createdAt: r.createdAt
})))
```

**根因**:
1. **前端硬编码类型映射**: 使用 `r.type === 3` 判断提现，但后端返回的是 `financeType` 枚举
2. **忽略后端提供的文本**: 后端已返回 `changeType` 字段（文本描述），前端未使用
3. **简化逻辑导致错误**: 所有负数金额且不是提现的记录都被映射为 `'deduct'`（扣除）

**实际影响**:
- ❌ "发布任务冻结" (financeType=24, amount<0) → 显示为 "扣除" 图标 📤
- ❌ "任务结算" (financeType=26, amount<0) → 显示为 "扣除" 图标 📤
- ❌ "任务服务费" (financeType=27, amount<0) → 显示为 "扣除" 图标 📤
- ✅ 应该显示各自的正确类型和图标

**复现步骤**:
1. 商家发布任务（扣除押金+银锭）
2. 访问商家中心 → 我的钱包
3. 查看"资金流水"列表
4. 观察"发布任务冻结"记录显示为"扣除"图标和颜色

**修复方案**:
```typescript
// ✅ 正确做法：直接使用后端返回的 changeType
setTransactions(json.data.map((r: any) => ({
  id: r.id,
  type: r.changeType || r.memo, // 使用后端返回的文本
  amount: r.amount,
  balanceType: r.moneyType === 1 ? 'balance' : 'silver',
  memo: r.memo || '财务记录',
  createdAt: r.createdAt
})))
```

**验证方式**:
- [ ] 商家发布任务后，查看钱包流水
- [ ] 验证"发布任务冻结"显示正确的文本和图标
- [ ] 验证"任务结算"显示正确的文本和图标
- [ ] 验证所有流水类型与后端枚举一致

---

### ⚠️ P0-2: 商家订单列表 - 缺少关键字段显示

**问题文件**: [frontend/src/app/merchant/orders/page.tsx:378-385](frontend/src/app/merchant/orders/page.tsx#L378-L385)

**当前代码**:
```typescript
<td className="px-6 py-5">
  <div className="font-bold text-slate-900">{order.taskTitle}</div>
  <div className="mt-1 text-xs font-medium text-slate-400">{order.platform}</div>
</td>
<td className="px-6 py-5 text-sm font-medium text-slate-500">{order.buynoAccount}</td>
<td className="px-6 py-5">
  <div className="font-bold text-slate-900">¥{Number(order.productPrice).toFixed(2)}</div>
  <div className="mt-1 text-xs font-bold text-emerald-500">佣金 ¥{Number(order.commission).toFixed(2)}</div>
</td>
```

**缺失字段**:
1. ❌ **任务编号**: `order.task?.taskNumber` - 未显示
2. ❌ **商家名称**: `order.task?.merchant?.username` - 未显示（虽然是商家自己的订单，但应显示店铺名）
3. ❌ **买手分成**: `order.userDivided` - 未显示（买手实际获得的分成佣金）
4. ❌ **银锭押金**: `order.silverPrepay` - 未显示（接单时冻结的银锭）

**后端已返回数据**:
- ✅ [orders.service.ts:702-706](backend/src/orders/orders.service.ts#L702-L706) 已关联 `task` 和 `merchant`
- ✅ Order实体包含 `userDivided` 和 `silverPrepay` 字段

**修复方案**:
```typescript
<td className="px-6 py-5">
  <div className="font-bold text-slate-900">{order.taskTitle}</div>
  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
    <span>{order.platform}</span>
    {order.task?.taskNumber && (
      <>
        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
        <span>#{order.task.taskNumber}</span>
      </>
    )}
  </div>
</td>
<td className="px-6 py-5">
  <div className="font-bold text-slate-900">¥{Number(order.productPrice).toFixed(2)}</div>
  <div className="mt-1 text-xs font-bold text-emerald-500">
    佣金 ¥{Number(order.commission).toFixed(2)}
    {order.userDivided > 0 && ` (分成 ¥${Number(order.userDivided).toFixed(2)})`}
  </div>
  {order.silverPrepay > 0 && (
    <div className="mt-1 text-xs font-medium text-amber-500">
      押金 {order.silverPrepay} 银锭
    </div>
  )}
</td>
```

---

### ⚠️ P1-1: 统计卡片口径不一致

**问题文件**: [frontend/src/app/merchant/orders/page.tsx:294-301](frontend/src/app/merchant/orders/page.tsx#L294-L301)

**当前代码**:
```typescript
const statCards = [
  { label: '待审核', value: stats.pendingReview, colorClass: 'text-warning-500', filterKey: 'SUBMITTED' },
  { label: '待发货', value: stats.pendingShip, colorClass: 'text-orange-500', filterKey: 'PENDING_SHIP' },
  { label: '待收货', value: stats.pendingReceive, colorClass: 'text-blue-500', filterKey: 'SHIPPED' },
  { label: '待返款', value: stats.pendingReturn, colorClass: 'text-purple-500', filterKey: 'RECEIVED' },
  { label: '已完成', value: stats.approved, colorClass: 'text-success-600', filterKey: 'COMPLETED' },
  { label: '总订单', value: stats.total, colorClass: 'text-[#6b7280]', filterKey: '' },
];
```

**问题**:
1. ❌ **"已完成"使用 `stats.approved`**: 应该使用 `stats.completed` 或明确定义口径
2. ❌ **后端返回字段不匹配**: [orders.service.ts:952-990](backend/src/orders/orders.service.ts#L952-L990) 返回的是 `approved`，但语义是"审核通过"，不是"已完成"

**口径混淆**:
- `APPROVED` = 审核通过（但可能还未发货/收货/返款）
- `COMPLETED` = 已完成（整个流程结束）
- 前端显示"已完成"但用的是"审核通过"数据

**修复方案**:
1. **后端**: 添加 `completed` 字段到统计接口
2. **前端**: 使用正确的字段或明确标签为"审核通过"

---

### ⚠️ P1-2: 订单详情模态框 - 费用明细不完整

**问题文件**: [frontend/src/app/merchant/orders/page.tsx:691-740](frontend/src/app/merchant/orders/page.tsx#L691-L740)

**当前显示**:
```typescript
{task.baseServiceFee && (
  <div className="flex justify-between">
    <span className="text-slate-500">基础服务费</span>
    <span className="font-medium">¥{task.baseServiceFee.toFixed(2)}</span>
  </div>
)}
```

**缺失费用项**:
1. ❌ **定时发布费**: `task.timingPublishFee`
2. ❌ **定时付款费**: `task.timingPayFee`
3. ❌ **隔天任务费**: `task.nextDayFee`
4. ❌ **多商品费用**: `task.goodsMoreFee`
5. ❌ **快速返款费**: 按 `task.goodsPrice * 0.006` 计算
6. ❌ **买手分成**: `order.userDivided` - 应显示买手实际获得的分成

**后端已计算**:
- ✅ [tasks.service.ts:362-392](backend/src/tasks/tasks.service.ts#L362-L392) 已计算所有费用
- ✅ Task实体包含所有费用字段

**修复方案**:
添加完整的费用明细显示，确保与发布任务时的费用计算一致。

---

## 📋 修复优先级

### P0 - 立即修复（影响用户理解和信任）
1. ✅ **商家钱包 - 财务流水类型映射** - 5分钟
2. ✅ **订单列表 - 补齐关键字段** - 10分钟

### P1 - 尽快修复（影响数据准确性）
3. ⚠️ **统计卡片 - 口径统一** - 15分钟（需后端配合）
4. ⚠️ **订单详情 - 费用明细完整** - 10分钟

---

## 🔧 第一批修复文件清单

| 文件 | 修复内容 | 行数 | 优先级 |
|------|----------|------|--------|
| [frontend/src/app/merchant/wallet/page.tsx](frontend/src/app/merchant/wallet/page.tsx#L65) | 修复财务流水类型映射 | 65 | P0 |
| [frontend/src/app/merchant/wallet/page.tsx](frontend/src/app/merchant/wallet/page.tsx#L17-L24) | 移除硬编码的类型映射表 | 17-24 | P0 |
| [frontend/src/app/merchant/orders/page.tsx](frontend/src/app/merchant/orders/page.tsx#L378-L385) | 补齐订单列表字段 | 378-385 | P0 |
| [frontend/src/app/merchant/orders/page.tsx](frontend/src/app/merchant/orders/page.tsx#L691-L740) | 补齐费用明细 | 691-740 | P1 |
| [backend/src/orders/orders.service.ts](backend/src/orders/orders.service.ts#L952-L990) | 添加completed统计字段 | 952-990 | P1 |

---

## ✅ 验收标准

### 功能验收
- [ ] 商家发布任务后，钱包流水显示"发布任务冻结"（不是"扣除"）
- [ ] 订单列表显示任务编号、买手分成、银锭押金
- [ ] 订单详情显示完整费用明细（包含所有增值服务费用）
- [ ] 统计卡片"已完成"数量准确（与实际完成订单数一致）

### 跨端一致性
- [ ] 管理后台和商家中心的财务流水类型显示一致
- [ ] 订单详情的费用明细与发布任务时的费用计算一致

---

## 🎯 下一步行动

1. **立即修复P0问题** - 商家钱包财务流水类型映射
2. **补齐订单列表字段** - 任务编号、分成、押金
3. **验证修复效果** - 手动测试关键流程
4. **添加防复发测试** - Contract Test + E2E Test

---

**审计完成**: ✅
**问题定位**: ✅
**修复方案**: ✅
**待执行修复**: 2个P0问题
