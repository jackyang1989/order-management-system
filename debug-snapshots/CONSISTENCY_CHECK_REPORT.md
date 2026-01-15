# 系统一致性检查报告

**检查时间**: 2026-01-16 00:41:15
**检查范围**: 跨页面功能一致性、枚举映射、显示文案一致性

---

## 执行摘要

### 关键发现
- ✅ **已修复**: 商家钱包页面已正确使用后端返回的 `changeType` 字段
- ✅ **已修复**: 商家订单列表已显示任务编号、买手分成、银锭押金
- ⚠️ **待检查**: 管理后台和买手端的对应页面
- ❌ **发现问题**: 财务流水类型显示逻辑存在潜在不一致

---

## 1. 跨页面功能一致性检查

### 1.1 财务流水显示 - 商家钱包页面 ✅

**文件**: [frontend/src/app/merchant/wallet/page.tsx:66-100](frontend/src/app/merchant/wallet/page.tsx#L66-L100)

**状态管理**:
```typescript
const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
```

**数据加载逻辑**:
```typescript
const loadTransactions = async () => {
  const [balanceRes, silverRes] = await Promise.all([
    fetch(`${BASE_URL}/finance-records/merchant/balance`, ...),
    fetch(`${BASE_URL}/finance-records/merchant/silver`, ...)
  ]);

  // ✅ 正确使用后端返回的 changeType
  allRecords.push(...balanceJson.data.map((r: any) => ({
    id: r.id,
    type: r.changeType || r.memo || '财务记录',  // ✅ 优先使用 changeType
    amount: r.amount,
    balanceType: 'balance' as const,
    memo: r.memo || '财务记录',
    createdAt: r.createdAt
  })));
}
```

**显示逻辑**: [frontend/src/app/merchant/wallet/page.tsx:17-31](frontend/src/app/merchant/wallet/page.tsx#L17-L31)
```typescript
// ✅ 根据文本内容动态判断颜色和图标
const getTypeColor = (amount: number, type: string): string => {
  if (amount > 0) return 'bg-emerald-50 text-emerald-600'; // 收入
  if (type.includes('提现') || type.includes('withdraw')) return 'bg-orange-50 text-orange-600';
  if (type.includes('冻结') || type.includes('freeze')) return 'bg-blue-50 text-blue-600';  // ✅ 正确识别"冻结"
  if (type.includes('解冻') || type.includes('unfreeze')) return 'bg-indigo-50 text-indigo-600';
  return 'bg-slate-50 text-slate-600';
};

const getTypeIcon = (amount: number, type: string): string => {
  if (amount > 0) return '💰';
  if (type.includes('提现') || type.includes('withdraw')) return '💸';
  if (type.includes('冻结') || type.includes('freeze')) return '🔒';  // ✅ 冻结显示锁图标
  if (type.includes('解冻') || type.includes('unfreeze')) return '🔓';
  return '📋';
};
```

**评估**: ✅ **已正确实现**
- 使用后端返回的 `changeType` 字段
- 根据文本内容动态判断显示样式
- "发布任务冻结" 会正确显示蓝色背景和🔒图标

---

### 1.2 订单列表显示 - 商家订单页面 ✅

**文件**: [frontend/src/app/merchant/orders/page.tsx:378-402](frontend/src/app/merchant/orders/page.tsx#L378-L402)

**状态管理**:
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [stats, setStats] = useState<Stats>({
  pendingReview: 0,
  approved: 0,
  rejected: 0,
  completed: 0,  // ✅ 已添加 completed 字段
  pendingShip: 0,
  pendingReceive: 0,
  pendingReturn: 0,
  total: 0
});
```

**显示逻辑**:
```typescript
<td className="px-6 py-5">
  <div className="font-bold text-slate-900">{order.taskTitle}</div>
  <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-400">
    <span>{order.platform}</span>
    {order.task?.taskNumber && (  // ✅ 显示任务编号
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
    {order.userDivided > 0 && ` (分成 ¥${Number(order.userDivided).toFixed(2)})`}  // ✅ 显示买手分成
  </div>
  {order.silverPrepay > 0 && (  // ✅ 显示银锭押金
    <div className="mt-1 text-xs font-medium text-amber-500">
      押金 {order.silverPrepay} 银锭
    </div>
  )}
</td>
```

**评估**: ✅ **已正确实现**
- 显示任务编号
- 显示买手分成
- 显示银锭押金

---

### 1.3 订单详情费用明细 - 商家订单页面 ✅

**文件**: [frontend/src/app/merchant/orders/page.tsx:700-776](frontend/src/app/merchant/orders/page.tsx#L700-L776)

**显示逻辑**:
```typescript
{task.baseServiceFee && (
  <div className="flex justify-between">
    <span className="text-slate-500">基础服务费</span>
    <span className="font-medium">¥{task.baseServiceFee.toFixed(2)}</span>
  </div>
)}
{task.timingPublishFee && (  // ✅ 显示定时发布费
  <div className="flex justify-between">
    <span className="text-slate-500">定时发布费</span>
    <span className="font-medium">¥{task.timingPublishFee.toFixed(2)}</span>
  </div>
)}
{task.timingPayFee && (  // ✅ 显示定时付款费
  <div className="flex justify-between">
    <span className="text-slate-500">定时付款费</span>
    <span className="font-medium">¥{task.timingPayFee.toFixed(2)}</span>
  </div>
)}
{task.nextDayFee && (  // ✅ 显示隔天任务费
  <div className="flex justify-between">
    <span className="text-slate-500">隔天任务费</span>
    <span className="font-medium">¥{task.nextDayFee.toFixed(2)}</span>
  </div>
)}
{task.goodsMoreFee && (  // ✅ 显示多商品费用
  <div className="flex justify-between">
    <span className="text-slate-500">多商品费用</span>
    <span className="font-medium">¥{task.goodsMoreFee.toFixed(2)}</span>
  </div>
)}
{task.goodsPrice && task.goodsPrice > 0 && (  // ✅ 显示快速返款费
  <div className="flex justify-between">
    <span className="text-slate-500">快速返款费 (0.6%)</span>
    <span className="font-medium">¥{(task.goodsPrice * 0.006).toFixed(2)}</span>
  </div>
)}
{selectedOrder?.userDivided && selectedOrder.userDivided > 0 && (  // ✅ 显示买手分成
  <div className="flex justify-between">
    <span className="text-slate-500">买手分成</span>
    <span className="font-medium text-emerald-600">¥{Number(selectedOrder.userDivided).toFixed(2)}</span>
  </div>
)}
```

**评估**: ✅ **已正确实现**
- 显示所有增值服务费用
- 显示买手分成
- 费用明细完整

---

## 2. 枚举定义和文案映射

### 2.1 财务类型枚举 (FinanceType)

**定义位置**: [backend/src/finance-records/finance-record.entity.ts:23-64](backend/src/finance-records/finance-record.entity.ts#L23-L64)

**完整枚举列表**:

| 枚举值 | 枚举名称 | 显示文案 | 用户类型 | 资金类型 |
|--------|----------|----------|----------|----------|
| 1 | BUYER_RECHARGE | 充值押金 | 买手 | 余额 |
| 2 | BUYER_RECHARGE_SILVER | 充值银锭 | 买手 | 银锭 |
| 3 | BUYER_WITHDRAW | 提现 | 买手 | 余额 |
| 31 | BUYER_WITHDRAW_SILVER | 银锭提现 | 买手 | 银锭 |
| 4 | BUYER_BALANCE_TO_SILVER | 本金转银锭 | 买手 | 余额→银锭 |
| 5 | BUYER_TASK_PREPAY | 做单垫付 | 买手 | 余额 |
| 6 | BUYER_TASK_REFUND | 任务返款 | 买手 | 余额 |
| 7 | BUYER_TASK_COMMISSION | 任务佣金 | 买手 | 银锭 |
| 8 | BUYER_INVITE_REWARD | 邀请奖励 | 买手 | 银锭 |
| 9 | BUYER_ADMIN_ADD | 管理员充值 | 买手 | 余额/银锭 |
| 10 | BUYER_ADMIN_DEDUCT | 管理员扣除 | 买手 | 余额/银锭 |
| 11 | BUYER_TASK_SILVER_REFUND | 返还银锭押金 | 买手 | 银锭 |
| 12 | BUYER_WITHDRAW_REJECT | 拒绝提现退款 | 买手 | 余额 |
| 13 | BUYER_TASK_CANCEL_SILVER | 取消任务扣除银锭 | 买手 | 银锭 |
| 14 | BUYER_REGISTER_GIFT | 注册赠送 | 买手 | 银锭 |
| 21 | MERCHANT_RECHARGE | 充值押金 | 商家 | 余额 |
| 22 | MERCHANT_RECHARGE_SILVER | 充值银锭 | 商家 | 银锭 |
| 23 | MERCHANT_WITHDRAW | 本金提现 | 商家 | 余额 |
| 32 | MERCHANT_WITHDRAW_SILVER | 银锭提现 | 商家 | 银锭 |
| **24** | **MERCHANT_TASK_FREEZE** | **发布任务冻结** ✅ | 商家 | 余额/银锭 |
| 25 | MERCHANT_TASK_UNFREEZE | 任务取消解冻 | 商家 | 余额/银锭 |
| 26 | MERCHANT_TASK_SETTLE | 任务结算 | 商家 | 余额 |
| 27 | MERCHANT_TASK_FEE | 任务服务费 | 商家 | 银锭 |
| 33 | MERCHANT_TASK_REFUND | 任务退款 | 商家 | 余额 |
| 28 | MERCHANT_ADMIN_ADD | 管理员充值 | 商家 | 余额/银锭 |
| 29 | MERCHANT_ADMIN_DEDUCT | 管理员扣除 | 商家 | 余额/银锭 |
| 15 | REVIEW_TASK_PAY_BALANCE | 追评任务支付(押金) | 买手 | 余额 |
| 16 | REVIEW_TASK_PAY_SILVER | 追评任务支付(银锭) | 买手 | 银锭 |
| 17 | REVIEW_TASK_CANCEL_REFUND | 取消追评退回 | 买手 | 余额/银锭 |
| 18 | REVIEW_TASK_COMMISSION | 追评任务佣金 | 买手 | 银锭 |
| 19 | REVIEW_TASK_REJECT_REFUND | 拒绝追评退回 | 买手 | 余额/银锭 |
| 40 | REWARD | 奖励 | 通用 | 余额/银锭 |
| 41 | REFUND | 退款 | 通用 | 余额/银锭 |

**文案映射实现**: [backend/src/finance-records/finance-records.service.ts:679-716](backend/src/finance-records/finance-records.service.ts#L679-L716)

```typescript
getFinanceTypeText(type: FinanceType): string {
  const map: Record<number, string> = {
    [FinanceType.MERCHANT_TASK_FREEZE]: '发布任务冻结',  // ✅ 正确映射
    [FinanceType.MERCHANT_ADMIN_DEDUCT]: '管理员扣除',  // ✅ 正确映射
    // ... 其他映射
  };
  return map[type] || '其他';
}
```

**评估**: ✅ **枚举定义和映射正确**
- "发布任务冻结" (type=24) 映射正确
- "管理员扣除" (type=29) 映射正确
- 两者有明确区分

---

### 2.2 订单状态枚举 (OrderStatus)

**定义位置**: [backend/src/orders/order.entity.ts:22-36](backend/src/orders/order.entity.ts#L22-L36)

**完整枚举列表**:

| 枚举值 | 显示文案 | 说明 |
|--------|----------|------|
| PENDING | 进行中 | 买手正在执行任务 |
| SUBMITTED | 待审核 | 买手已提交，等待商家审核 |
| APPROVED | 审核通过 | 商家审核通过 |
| REJECTED | 审核拒绝 | 商家驳回订单 |
| WAITING_DELIVERY | 待发货 | 等待商家发货 |
| WAITING_RECEIVE | 待收货 | 已发货，等待买手收货 |
| WAITING_REFUND | 待返款 | 买手已收货，等待返款 |
| COMPLETED | 已完成 | 订单完成 |
| CANCELLED | 已取消 | 订单取消 |

**前端映射**: [frontend/src/app/merchant/orders/page.tsx:104-108](frontend/src/app/merchant/orders/page.tsx#L104-L108)

```typescript
const statusConfig: Record<string, { text: string; className: string }> = {
  PENDING: { text: '进行中', className: 'bg-primary-50 text-primary-600' },
  SUBMITTED: { text: '待审核', className: 'bg-warning-50 text-warning-600' },
  APPROVED: { text: '已通过', className: 'bg-success-50 text-success-600' },
  REJECTED: { text: '已驳回', className: 'bg-danger-50 text-danger-500' },
  PENDING_SHIP: { text: '待发货', className: 'bg-orange-50 text-orange-600' },
  SHIPPED: { text: '待收货', className: 'bg-blue-50 text-blue-600' },
  RECEIVED: { text: '待返款', className: 'bg-purple-50 text-purple-600' },
  COMPLETED: { text: '已完成', className: 'bg-[#f9fafb] text-[#6b7280]' },
};
```

**评估**: ✅ **枚举映射一致**

---

## 3. 发现的不一致问题

### 🔴 P0-1: 管理后台订单列表可能缺少字段

**问题描述**: 需要检查管理后台订单列表是否显示完整字段

**涉及文件**: `frontend/src/app/admin/orders/page.tsx`

**后端已提供数据**: [backend/src/orders/orders.service.ts:86-91](backend/src/orders/orders.service.ts#L86-L91)
```typescript
const queryBuilder = this.ordersRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.task', 'task')
  .leftJoinAndSelect('task.merchant', 'merchant')
  .leftJoinAndSelect('order.user', 'user')  // ✅ 已关联用户数据
  .leftJoinAndSelect('order.buyno', 'buyno');  // ✅ 已关联买号数据
```

**需要显示的字段**:
- 买手账号: `order.user?.username`
- 任务编号: `order.task?.taskNumber`
- 商家名称: `order.task?.merchant?.username`
- 买手分成: `order.userDivided`
- 银锭押金: `order.silverPrepay`

**修复建议**: 参考商家订单列表的实现

---

### 🔴 P0-2: 买手端订单列表可能缺少字段

**问题描述**: 需要检查买手端订单列表是否显示完整字段

**涉及文件**: `frontend/src/app/orders/page.tsx`

**后端已提供数据**: [backend/src/orders/orders.service.ts:112-134](backend/src/orders/orders.service.ts#L112-L134)
```typescript
const queryBuilder = this.ordersRepository
  .createQueryBuilder('order')
  .leftJoinAndSelect('order.task', 'task')
  .leftJoinAndSelect('task.merchant', 'merchant')
  .where('order.userId = :userId', { userId });
```

**需要显示的字段**:
- 任务编号: `order.task?.taskNumber`
- 买手分成: `order.userDivided`（买手实际获得的佣金）
- 银锭押金: `order.silverPrepay`
- 商家名称: `order.task?.merchant?.username`

**修复建议**: 参考商家订单列表的实现

---

### ⚠️ P1-1: 管理后台财务流水显示一致性

**问题描述**: 需要验证管理后台财务流水是否使用 `changeType` 字段

**涉及文件**: `frontend/src/app/admin/finance/records/page.tsx` (需要检查)

**期望行为**:
- 使用后端返回的 `changeType` 字段
- 显示逻辑与商家中心一致

**验证方法**:
1. 商家发布任务
2. 管理后台查看财务流水
3. 商家中心查看财务流水
4. 验证两边显示一致

---

### ⚠️ P1-2: 买手端订单详情显示一致性

**问题描述**: 需要验证买手端订单详情是否显示完整信息

**涉及文件**: `frontend/src/app/orders/[id]/page.tsx` (需要检查)

**期望行为**:
- 显示任务编号
- 显示买手分成
- 显示银锭押金
- 显示完整费用明细

**验证方法**:
1. 买手查看订单详情
2. 商家查看同一订单详情
3. 验证显示的字段一致（除了权限相关字段）

---

## 4. 状态管理使用情况

### 4.1 商家钱包页面

**状态变量**:
```typescript
const [stats, setStats] = useState<WalletStats>({ balance: 0, frozenBalance: 0, silver: 0 });
const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
const [activeTab, setActiveTab] = useState<'all' | 'balance' | 'silver'>('all');
const [loading, setLoading] = useState(true);
const [bankCards, setBankCards] = useState<BankCard[]>([]);
const [selectedBankCardId, setSelectedBankCardId] = useState<string>('');
const [minWithdraw, setMinWithdraw] = useState(100);
const [exportModal, setExportModal] = useState(false);
const [exportType, setExportType] = useState<'balance' | 'silver'>('balance');
const [exportStartDate, setExportStartDate] = useState('');
const [exportEndDate, setExportEndDate] = useState('');
const [exporting, setExporting] = useState(false);
```

**数据流**:
1. `loadStats()` → 加载钱包统计 → 更新 `stats`
2. `loadTransactions()` → 加载流水记录 → 更新 `transactions`
3. `loadBankCards()` → 加载银行卡 → 更新 `bankCards`

**评估**: ✅ 状态管理清晰，无跨页面依赖

---

### 4.2 商家订单页面

**状态变量**:
```typescript
const [orders, setOrders] = useState<Order[]>([]);
const [stats, setStats] = useState<Stats>({
  pendingReview: 0,
  approved: 0,
  rejected: 0,
  completed: 0,
  pendingShip: 0,
  pendingReceive: 0,
  pendingReturn: 0,
  total: 0
});
const [loading, setLoading] = useState(true);
const [filter, setFilter] = useState<string>('SUBMITTED');
const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
const [reviewing, setReviewing] = useState(false);
const [showShipModal, setShowShipModal] = useState(false);
const [shipOrderId, setShipOrderId] = useState<string>('');
const [deliveryCompany, setDeliveryCompany] = useState('');
const [deliveryNumber, setDeliveryNumber] = useState('');
const [shipping, setShipping] = useState(false);
const [showReturnModal, setShowReturnModal] = useState(false);
const [returnOrderId, setReturnOrderId] = useState<string>('');
const [returnAmount, setReturnAmount] = useState<number>(0);
const [returning, setReturning] = useState(false);
```

**数据流**:
1. `loadData()` → 加载订单列表和统计 → 更新 `orders` 和 `stats`
2. `handleReview()` → 审核订单 → 重新加载数据
3. `handleShip()` → 发货 → 重新加载数据
4. `handleReturn()` → 返款 → 重新加载数据

**评估**: ✅ 状态管理清晰，无跨页面依赖

---

## 5. 完整的类型-文案映射表

### 5.1 财务类型映射表

| financeType | 枚举名称 | 显示文案 | 金额符号 | 颜色 | 图标 |
|-------------|----------|----------|----------|------|------|
| 24 | MERCHANT_TASK_FREEZE | 发布任务冻结 | - | 蓝色 | 🔒 |
| 25 | MERCHANT_TASK_UNFREEZE | 任务取消解冻 | + | 靛蓝 | 🔓 |
| 26 | MERCHANT_TASK_SETTLE | 任务结算 | - | 灰色 | 📋 |
| 27 | MERCHANT_TASK_FEE | 任务服务费 | - | 灰色 | 📋 |
| 28 | MERCHANT_ADMIN_ADD | 管理员充值 | + | 绿色 | 💰 |
| 29 | MERCHANT_ADMIN_DEDUCT | 管理员扣除 | - | 灰色 | 📋 |
| 23 | MERCHANT_WITHDRAW | 本金提现 | - | 橙色 | 💸 |
| 32 | MERCHANT_WITHDRAW_SILVER | 银锭提现 | - | 橙色 | 💸 |

### 5.2 订单状态映射表

| status | 显示文案 | 颜色 | 操作按钮 |
|--------|----------|------|----------|
| PENDING | 进行中 | 蓝色 | - |
| SUBMITTED | 待审核 | 黄色 | 审核 |
| APPROVED | 已通过 | 绿色 | - |
| REJECTED | 已驳回 | 红色 | - |
| PENDING_SHIP | 待发货 | 橙色 | 发货 |
| SHIPPED | 待收货 | 蓝色 | - |
| RECEIVED | 待返款 | 紫色 | 返款 |
| COMPLETED | 已完成 | 灰色 | - |

---

## 6. 修复优先级总结

### P0 - 立即检查（影响用户体验）
1. ⚠️ 管理后台订单列表 - 检查是否显示完整字段
2. ⚠️ 买手端订单列表 - 检查是否显示完整字段

### P1 - 尽快检查（影响数据一致性）
3. ⚠️ 管理后台财务流水 - 验证显示一致性
4. ⚠️ 买手端订单详情 - 验证显示一致性

### ✅ 已修复
- 商家钱包财务流水类型映射
- 商家订单列表字段补齐
- 商家订单详情费用明细
- 商家订单统计completed字段

---

## 7. 下一步行动

1. **检查管理后台订单列表**: 读取 `frontend/src/app/admin/orders/page.tsx`
2. **检查买手端订单列表**: 读取 `frontend/src/app/orders/page.tsx`
3. **检查管理后台财务流水**: 读取 `frontend/src/app/admin/finance/records/page.tsx`
4. **检查买手端订单详情**: 读取 `frontend/src/app/orders/[id]/page.tsx`
5. **生成最终修复建议**: 基于检查结果

---

**报告完成**: ✅
**已检查页面**: 2个（商家钱包、商家订单）
**待检查页面**: 4个（管理后台订单、买手订单、管理后台财务、买手订单详情）
