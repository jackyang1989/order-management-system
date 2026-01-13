# 任务全链路一致性审计报告

**日期**: 2026年1月13日  
**审计范围**: 商家发布→用户执行→管理审核全链路字段一致性  
**基于**: TASK_DETAIL_PAGES_AUDIT.md 发现的缺失字段扩展审计

---

## 执行摘要

通过对任务全链路的深度审计，发现**字段一致性问题严重**，存在"发布有但展示缺失"、"展示有但不生效"、"映射不一致"等多种问题。**关键业务字段在执行链路中缺失**，影响用户体验和业务完整性。

**问题严重程度**: 🔴 高风险  
**影响范围**: 全链路 (发布→详情→执行→审核)  
**修复优先级**: P0 (立即修复)

---

## 1. 全链路字段矩阵

### 1.1 字段覆盖矩阵

| 字段 | 发布表单 | 商家详情 | 管理详情 | 任务领取 | 订单执行 | 确认收货 | 状态 |
|------|---------|---------|---------|---------|---------|---------|------|
| **基础字段** |
| `taskType` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| `terminal` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| `shopName` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 完整 |
| `goodsList` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| `keywords` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| **浏览行为** |
| `needCompare` | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | 执行不生效 |
| `compareCount` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `needContactCS` | ✅ | ✅ | ✅ | ✅ | ⚠️ | ❌ | 执行不生效 |
| `contactCSContent` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `needFavorite` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| `needFollow` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| `needAddCart` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| **验证字段** |
| `isPasswordEnabled` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | **严重不一致** |
| `checkPassword` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | **严重不一致** |
| **订单设置** |
| `memo` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | 部分缺失 |
| `weight` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `fastRefund` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `orderInterval` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | 部分缺失 |
| **商品规格** |
| `orderSpecs` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `verifyCode` | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | **严重不一致** |
| **费用明细** |
| `baseServiceFee` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | 展示不完整 |
| `praiseFee` | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | 展示不完整 |
| `timingPublishFee` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |
| `goodsMoreFee` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | **严重缺失** |

### 1.2 问题统计

- **完整字段**: 3个 (13%)
- **部分缺失**: 8个 (35%)  
- **严重缺失**: 8个 (35%)
- **严重不一致**: 4个 (17%)

---

## 2. 缺口清单

### 2.1 P0级别 - 严重缺失 (立即修复)

#### 2.1.1 货比功能不完整
```typescript
// 发布时设置
compareCount: number; // 3家商品

// 问题：所有详情页和执行页都不显示具体数量
// 影响：买手不知道要货比几家商品
// 位置：所有详情页、执行页
```

#### 2.1.2 联系客服内容缺失
```typescript
// 发布时设置
contactCSContent: string; // "请问有现货吗？"

// 问题：执行页不显示具体要说的内容
// 影响：买手不知道要发什么消息给客服
// 位置：订单执行页Step1
```

#### 2.1.3 验证口令显示不一致
```typescript
// 发布时设置
isPasswordEnabled: boolean;
checkPassword: string; // "夏季新款"

// 问题：详情页不显示，执行页突然出现验证要求
// 影响：买手无法提前知道需要验证口令
// 位置：所有详情页
```

#### 2.1.4 订单规格配置完全缺失
```typescript
// 发布时设置
orderSpecs: Array<{
  specName: string;   // "颜色"
  specValue: string;  // "红色"
  quantity: number;   // 2
}>;

// 问题：所有页面都不显示具体要下什么规格
// 影响：买手不知道要选择什么规格和数量
// 位置：所有详情页、执行页
```

### 2.2 P1级别 - 功能不完整 (重要修复)

#### 2.2.1 包裹重量信息缺失
```typescript
// 发布时设置
weight: number; // 2.5kg

// 问题：所有页面都不显示包裹重量
// 影响：买手和物流无法知道包裹重量
```

#### 2.2.2 快速返款服务不显示
```typescript
// 发布时设置
fastRefund: boolean; // true (0.6%费率)

// 问题：所有页面都不显示是否有快速返款服务
// 影响：买手不知道可以使用快速返款
```

#### 2.2.3 费用明细不透明
```typescript
// 发布时计算
baseServiceFee: 5.0;      // 基础服务费
praiseFee: 2.0;           // 好评费
timingPublishFee: 1.0;    // 定时发布费
goodsMoreFee: 2.0;        // 多商品费

// 问题：只显示总费用，不显示明细
// 影响：商家和管理员无法了解费用构成
```

### 2.3 P2级别 - 映射不一致 (优化修复)

#### 2.3.1 字段命名不统一
```typescript
// 前端表单
addReward: number;

// 后端API响应  
extraCommission: number;

// 问题：同一个字段在不同地方使用不同名称
```

#### 2.3.2 枚举值漂移
```typescript
// 前端定义
isFreeShipping: number; // 1=包邮, 2=不包邮

// 后端定义
isFreeShipping: boolean; // true=包邮, false=不包邮

// 问题：前后端类型不一致
```

---

## 3. 业务影响分析

### 3.1 用户体验影响

#### 买手端影响
- **货比功能**: 不知道要比较几家商品 → 可能货比不足或过度
- **联系客服**: 不知道要说什么 → 可能发错消息或不发消息  
- **验证口令**: 详情页看不到 → 执行时突然要求验证，体验差
- **订单规格**: 不知道要下什么规格 → 可能下错规格

#### 商家端影响
- **费用不透明**: 不知道费用构成 → 对计费规则不信任
- **功能缺失**: 设置的功能在详情页看不到 → 怀疑功能是否生效

#### 管理端影响
- **审核不完整**: 看不到完整的任务设置 → 无法准确审核
- **费用核查**: 无法查看费用明细 → 难以处理费用争议

### 3.2 业务风险评估

| 风险类型 | 风险等级 | 影响范围 | 潜在损失 |
|---------|---------|---------|---------|
| 任务执行错误 | 🔴 高 | 所有买手 | 订单失败、退款 |
| 用户体验差 | 🟡 中 | 买手、商家 | 用户流失 |
| 客服工单增加 | 🟡 中 | 客服团队 | 运营成本 |
| 平台信任度下降 | 🔴 高 | 全平台 | 品牌损失 |

---

## 4. 最小修复方案

### 4.1 共享规范层 (Shared Spec)

#### 4.1.1 创建统一字段规范
```typescript
// frontend/src/shared/taskSpec.ts
export interface TaskFieldSpec {
  // 浏览行为
  compareCount: {
    key: 'compareCount';
    label: '货比数量';
    type: 'number';
    required: boolean;
    displayWhen: (task: Task) => task.needCompare;
    format: (value: number) => `${value}家商品`;
  };
  
  contactCSContent: {
    key: 'contactCSContent';
    label: '联系客服内容';
    type: 'string';
    required: boolean;
    displayWhen: (task: Task) => task.needContactCS;
    format: (value: string) => value;
  };
  
  // 验证字段
  checkPassword: {
    key: 'checkPassword';
    label: '验证口令';
    type: 'string';
    required: boolean;
    displayWhen: (task: Task) => task.isPasswordEnabled;
    format: (value: string) => `"${value}"`;
  };
  
  // 订单设置
  orderSpecs: {
    key: 'orderSpecs';
    label: '下单规格';
    type: 'array';
    required: boolean;
    displayWhen: (task: Task) => task.orderSpecs?.length > 0;
    format: (specs: OrderSpec[]) => specs.map(s => `${s.specName}:${s.specValue}×${s.quantity}`).join(', ');
  };
}
```

#### 4.1.2 创建统一格式化器
```typescript
// frontend/src/shared/formatters.ts
export class TaskFieldFormatter {
  static formatCompareCount(task: Task): string {
    if (!task.needCompare) return '';
    return `货比 ${task.compareCount || 3}家商品`;
  }
  
  static formatContactCS(task: Task): string {
    if (!task.needContactCS) return '';
    return task.contactCSContent || '请联系客服咨询';
  }
  
  static formatVerifyCode(task: Task): string {
    if (!task.isPasswordEnabled) return '';
    return `验证口令: "${task.checkPassword}"`;
  }
  
  static formatOrderSpecs(task: Task): string[] {
    if (!task.orderSpecs?.length) return [];
    return task.orderSpecs.map(spec => 
      `${spec.specName}: ${spec.specValue} ×${spec.quantity}`
    );
  }
}
```

### 4.2 组件标准化

#### 4.2.1 创建字段显示组件
```typescript
// frontend/src/components/task/TaskFieldDisplay.tsx
interface TaskFieldDisplayProps {
  task: Task;
  field: keyof TaskFieldSpec;
  variant?: 'detail' | 'execute' | 'admin';
}

export function TaskFieldDisplay({ task, field, variant }: TaskFieldDisplayProps) {
  const spec = TaskFieldSpec[field];
  
  if (!spec.displayWhen(task)) {
    return null;
  }
  
  const value = task[field];
  const formattedValue = spec.format(value);
  
  return (
    <div className={cn('task-field', `task-field--${field}`, `variant--${variant}`)}>
      <span className="task-field__label">{spec.label}:</span>
      <span className="task-field__value">{formattedValue}</span>
    </div>
  );
}
```

#### 4.2.2 创建浏览行为组件
```typescript
// frontend/src/components/task/BrowseBehaviorDisplay.tsx
export function BrowseBehaviorDisplay({ task }: { task: Task }) {
  return (
    <div className="browse-behavior">
      <h3>浏览要求</h3>
      
      {task.needCompare && (
        <div className="browse-item">
          <Badge color="green">货比</Badge>
          <span>{TaskFieldFormatter.formatCompareCount(task)}</span>
        </div>
      )}
      
      {task.needContactCS && (
        <div className="browse-item">
          <Badge color="green">联系客服</Badge>
          <span>{TaskFieldFormatter.formatContactCS(task)}</span>
        </div>
      )}
      
      {/* 其他浏览行为... */}
    </div>
  );
}
```

### 4.3 页面修复方案

#### 4.3.1 商家详情页修复
```typescript
// frontend/src/app/merchant/tasks/[id]/page.tsx
// 在浏览要求部分添加缺失字段

<div className="browse-requirements">
  <BrowseBehaviorDisplay task={task} />
  
  {/* 新增：验证口令显示 */}
  {task.isPasswordEnabled && (
    <div className="verify-code-section">
      <h4>验证口令</h4>
      <TaskFieldDisplay task={task} field="checkPassword" variant="detail" />
    </div>
  )}
  
  {/* 新增：订单规格显示 */}
  {task.orderSpecs?.length > 0 && (
    <div className="order-specs-section">
      <h4>下单规格</h4>
      <TaskFieldDisplay task={task} field="orderSpecs" variant="detail" />
    </div>
  )}
</div>
```

#### 4.3.2 订单执行页修复
```typescript
// frontend/src/app/orders/[id]/execute/page.tsx
// Step1 浏览行为部分

{task.needCompare && (
  <div className="compare-requirement">
    <h4>货比要求</h4>
    <p>{TaskFieldFormatter.formatCompareCount(task)}</p>
    <p className="text-sm text-gray-600">
      请在搜索结果中浏览对比 {task.compareCount || 3} 家不同店铺的同类商品
    </p>
  </div>
)}

{task.needContactCS && (
  <div className="contact-cs-requirement">
    <h4>联系客服要求</h4>
    <p>请发送以下内容给客服：</p>
    <div className="cs-content">
      "{task.contactCSContent || '请问有现货吗？'}"
    </div>
  </div>
)}
```

### 4.4 后端DTO一致性修复

#### 4.4.1 统一字段命名
```typescript
// backend/src/tasks/dto/task-response.dto.ts
export class TaskResponseDto {
  // 统一使用 addReward，废弃 extraCommission
  @ApiProperty({ description: '额外加赏' })
  addReward: number;
  
  // 统一使用 boolean 类型
  @ApiProperty({ description: '是否包邮' })
  isFreeShipping: boolean;
  
  // 新增缺失字段
  @ApiProperty({ description: '货比数量' })
  compareCount?: number;
  
  @ApiProperty({ description: '联系客服内容' })
  contactCSContent?: string;
  
  @ApiProperty({ description: '下单规格配置' })
  orderSpecs?: OrderSpecDto[];
}
```

---

## 5. CI门禁方案

### 5.1 静态分析规则

#### 5.1.1 字段引用检查
```typescript
// scripts/field-consistency-check.ts
interface FieldRule {
  field: string;
  requiredPages: string[];
  displayCondition?: string;
}

const CRITICAL_FIELDS: FieldRule[] = [
  {
    field: 'compareCount',
    requiredPages: [
      'merchant/tasks/[id]',
      'tasks/[id]',
      'admin/tasks',
      'orders/[id]/execute'
    ],
    displayCondition: 'task.needCompare'
  },
  {
    field: 'contactCSContent', 
    requiredPages: [
      'merchant/tasks/[id]',
      'tasks/[id]',
      'orders/[id]/execute'
    ],
    displayCondition: 'task.needContactCS'
  },
  {
    field: 'checkPassword',
    requiredPages: [
      'merchant/tasks/[id]',
      'tasks/[id]',
      'admin/tasks'
    ],
    displayCondition: 'task.isPasswordEnabled'
  }
];

export function checkFieldConsistency() {
  const errors: string[] = [];
  
  for (const rule of CRITICAL_FIELDS) {
    for (const page of rule.requiredPages) {
      const pageContent = readPageFile(page);
      
      if (!pageContent.includes(rule.field)) {
        errors.push(`❌ 字段 ${rule.field} 在页面 ${page} 中未被引用`);
      }
      
      if (rule.displayCondition && !pageContent.includes(rule.displayCondition)) {
        errors.push(`⚠️  字段 ${rule.field} 在页面 ${page} 中缺少显示条件 ${rule.displayCondition}`);
      }
    }
  }
  
  return errors;
}
```

#### 5.1.2 类型一致性检查
```typescript
// scripts/type-consistency-check.ts
export function checkTypeConsistency() {
  const frontendTypes = parseFrontendTypes();
  const backendTypes = parseBackendTypes();
  const errors: string[] = [];
  
  for (const [field, frontendType] of Object.entries(frontendTypes)) {
    const backendType = backendTypes[field];
    
    if (!backendType) {
      errors.push(`❌ 字段 ${field} 在后端类型定义中缺失`);
      continue;
    }
    
    if (frontendType !== backendType) {
      errors.push(`❌ 字段 ${field} 类型不一致: 前端=${frontendType}, 后端=${backendType}`);
    }
  }
  
  return errors;
}
```

### 5.2 GitHub Actions集成

```yaml
# .github/workflows/field-consistency.yml
name: Field Consistency Check

on:
  pull_request:
    paths:
      - 'frontend/src/app/**/*.tsx'
      - 'backend/src/**/*.ts'

jobs:
  check-consistency:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run field consistency check
        run: |
          npm run check:field-consistency
          
      - name: Run type consistency check  
        run: |
          npm run check:type-consistency
          
      - name: Comment PR if issues found
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            const errors = require('./consistency-check-results.json');
            const comment = `
            ## 🚨 字段一致性检查失败
            
            发现以下问题：
            
            ${errors.map(error => `- ${error}`).join('\n')}
            
            请修复后重新提交。
            `;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

---

## 6. 实施计划

### Phase 1: 紧急修复 (1-2天)
1. **P0字段显示修复**
   - 在所有详情页添加 `compareCount`、`contactCSContent`、`checkPassword`、`orderSpecs` 显示
   - 修复订单执行页的字段引用和生效逻辑

### Phase 2: 标准化重构 (3-5天)  
1. **创建共享规范层**
   - 实现 `TaskFieldSpec` 和 `TaskFieldFormatter`
   - 创建标准化显示组件
2. **页面组件化改造**
   - 使用标准组件替换硬编码显示
   - 统一字段显示逻辑

### Phase 3: CI门禁建设 (2-3天)
1. **静态分析工具**
   - 实现字段引用检查
   - 实现类型一致性检查
2. **GitHub Actions集成**
   - 配置自动检查流程
   - 配置PR评论反馈

### Phase 4: 全面测试 (2-3天)
1. **端到端测试**
   - 测试完整任务发布→执行→审核流程
   - 验证所有字段在各个环节的显示和生效
2. **回归测试**
   - 确保修复不影响现有功能
   - 性能测试

---

## 7. 成功指标

### 7.1 技术指标
- **字段覆盖率**: 从 65% 提升到 95%+
- **类型一致性**: 100% 前后端类型匹配
- **CI检查通过率**: 100% PR通过字段一致性检查

### 7.2 业务指标  
- **任务执行成功率**: 提升 15%+
- **客服工单量**: 减少 30%+
- **用户满意度**: 提升 20%+

### 7.3 维护指标
- **新功能开发**: 自动通过一致性检查
- **Bug修复时间**: 减少 50%+
- **代码审查效率**: 提升 40%+

---

## 8. 风险评估与缓解

### 8.1 技术风险
- **修改范围大**: 通过分阶段实施，先修复关键字段
- **回归风险**: 完善测试覆盖，增加E2E测试
- **性能影响**: 使用组件缓存，避免重复计算

### 8.2 业务风险
- **用户体验变化**: 提前通知用户，准备帮助文档
- **数据迁移**: 确保历史数据兼容性
- **功能中断**: 使用特性开关，支持渐进式发布

---

## 结论

任务全链路存在严重的字段一致性问题，**8个关键字段完全缺失**，**4个字段严重不一致**。这些问题直接影响用户体验和业务完整性，需要立即修复。

通过实施**共享规范层**、**组件标准化**和**CI门禁**的综合方案，可以从根本上解决一致性问题，并建立长期的质量保障机制。

**建议立即启动Phase 1紧急修复**，优先解决影响用户体验的关键字段缺失问题。

---

## 附录A: 详细字段映射表

### A.1 前后端字段映射对照

| 前端字段 | 后端Entity | 后端DTO | API响应 | 类型一致性 | 问题 |
|---------|-----------|---------|---------|-----------|------|
| `addReward` | `extraReward` | `addReward` | `extraCommission` | ❌ | 三处命名不一致 |
| `isFreeShipping` | `isFreeShipping: boolean` | `isFreeShipping: boolean` | `isFreeShipping: number` | ❌ | 前端用number，后端用boolean |
| `compareCount` | `compareCount: number` | ❌ 缺失 | ❌ 缺失 | ❌ | DTO和API响应缺失 |
| `contactCSContent` | `contactCSContent: string` | ❌ 缺失 | ❌ 缺失 | ❌ | DTO和API响应缺失 |
| `checkPassword` | `checkPassword: string` | `checkPassword: string` | `checkPassword: string` | ✅ | 一致 |
| `weight` | `weight: number` | ❌ 缺失 | ❌ 缺失 | ❌ | DTO和API响应缺失 |
| `fastRefund` | `fastRefund: boolean` | ❌ 缺失 | ❌ 缺失 | ❌ | DTO和API响应缺失 |
| `orderSpecs` | `orderSpecs: OrderSpec[]` | ❌ 缺失 | ❌ 缺失 | ❌ | DTO和API响应缺失 |

### A.2 枚举值映射对照

| 枚举类型 | 前端定义 | 后端定义 | 一致性 | 问题 |
|---------|---------|---------|--------|------|
| 平台类型 | `PlatformType` | `TaskType` | ✅ | 命名不同但值一致 |
| 任务状态 | `TaskStatus` | `TaskStatus` | ✅ | 一致 |
| 结算方式 | `terminal: number` | `TaskTerminal` | ✅ | 一致 |
| 包邮状态 | `1=包邮, 2=不包邮` | `true=包邮, false=不包邮` | ❌ | 类型和值都不一致 |

---

## 附录B: 代码示例

### B.1 当前问题代码示例

#### 问题1: 货比数量不显示
```typescript
// ❌ 当前代码 - 只显示"货比"，不显示数量
<Badge variant="soft" color="green">货比</Badge>

// ✅ 修复后代码 - 显示具体数量
<Badge variant="soft" color="green">
  货比 {task.compareCount || 3}家商品
</Badge>
```

#### 问题2: 联系客服内容缺失
```typescript
// ❌ 当前代码 - 只显示"联系客服"
<Badge variant="soft" color="green">联系客服</Badge>

// ✅ 修复后代码 - 显示具体内容
<div className="contact-cs-requirement">
  <Badge variant="soft" color="green">联系客服</Badge>
  <div className="cs-content">
    发送内容: "{task.contactCSContent || '请问有现货吗？'}"
  </div>
</div>
```

#### 问题3: 验证口令不显示
```typescript
// ❌ 当前代码 - 详情页完全不显示
// 无相关代码

// ✅ 修复后代码 - 显示验证要求
{task.isPasswordEnabled && (
  <div className="verify-code-section">
    <h4>验证口令</h4>
    <div className="verify-code-content">
      需要在商品详情页找到口令: <strong>"{task.checkPassword}"</strong>
    </div>
  </div>
)}
```

### B.2 标准化组件示例

#### 浏览行为标准组件
```typescript
// frontend/src/components/task/BrowseBehaviorSection.tsx
interface BrowseBehaviorSectionProps {
  task: Task;
  variant: 'detail' | 'execute' | 'admin';
}

export function BrowseBehaviorSection({ task, variant }: BrowseBehaviorSectionProps) {
  const behaviors = [
    {
      key: 'compare',
      enabled: task.needCompare,
      label: '货比',
      detail: task.compareCount ? `${task.compareCount}家商品` : '3家商品',
      instruction: variant === 'execute' ? `请在搜索结果中浏览对比 ${task.compareCount || 3} 家不同店铺的同类商品` : undefined
    },
    {
      key: 'contactCS',
      enabled: task.needContactCS,
      label: '联系客服',
      detail: task.contactCSContent || '请问有现货吗？',
      instruction: variant === 'execute' ? `请发送以下内容给客服: "${task.contactCSContent || '请问有现货吗？'}"` : undefined
    },
    {
      key: 'favorite',
      enabled: task.needFavorite,
      label: '收藏商品',
      instruction: variant === 'execute' ? '请点击商品页面的收藏按钮' : undefined
    },
    {
      key: 'follow',
      enabled: task.needFollow,
      label: '关注店铺',
      instruction: variant === 'execute' ? '请点击店铺页面的关注按钮' : undefined
    },
    {
      key: 'addCart',
      enabled: task.needAddCart,
      label: '加入购物车',
      instruction: variant === 'execute' ? '请将商品加入购物车' : undefined
    }
  ];

  const enabledBehaviors = behaviors.filter(b => b.enabled);

  if (enabledBehaviors.length === 0) {
    return null;
  }

  return (
    <div className="browse-behavior-section">
      <h3 className="section-title">浏览要求</h3>
      
      <div className="behavior-list">
        {enabledBehaviors.map(behavior => (
          <div key={behavior.key} className="behavior-item">
            <div className="behavior-header">
              <Badge variant="soft" color="green">{behavior.label}</Badge>
              {behavior.detail && (
                <span className="behavior-detail">{behavior.detail}</span>
              )}
            </div>
            
            {behavior.instruction && variant === 'execute' && (
              <div className="behavior-instruction">
                {behavior.instruction}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 订单规格显示组件
```typescript
// frontend/src/components/task/OrderSpecsSection.tsx
interface OrderSpecsSectionProps {
  task: Task;
  variant: 'detail' | 'execute';
}

export function OrderSpecsSection({ task, variant }: OrderSpecsSectionProps) {
  if (!task.orderSpecs?.length) {
    return null;
  }

  return (
    <div className="order-specs-section">
      <h3 className="section-title">下单规格要求</h3>
      
      <div className="specs-list">
        {task.orderSpecs.map((spec, index) => (
          <div key={index} className="spec-item">
            <div className="spec-name">{spec.specName}:</div>
            <div className="spec-value">{spec.specValue}</div>
            <div className="spec-quantity">×{spec.quantity}</div>
          </div>
        ))}
      </div>
      
      {variant === 'execute' && (
        <div className="spec-instruction">
          <p className="text-sm text-amber-600">
            ⚠️ 请严格按照上述规格下单，规格错误可能导致审核不通过
          </p>
        </div>
      )}
    </div>
  );
}
```

### B.3 CI检查脚本示例

#### 字段引用检查脚本
```typescript
// scripts/check-field-references.ts
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FieldCheck {
  field: string;
  requiredFiles: string[];
  displayCondition?: string;
}

const CRITICAL_FIELDS: FieldCheck[] = [
  {
    field: 'compareCount',
    requiredFiles: [
      'frontend/src/app/merchant/tasks/[id]/page.tsx',
      'frontend/src/app/tasks/[id]/page.tsx',
      'frontend/src/app/admin/tasks/page.tsx',
      'frontend/src/app/orders/[id]/execute/page.tsx'
    ],
    displayCondition: 'task.needCompare'
  },
  {
    field: 'contactCSContent',
    requiredFiles: [
      'frontend/src/app/merchant/tasks/[id]/page.tsx',
      'frontend/src/app/tasks/[id]/page.tsx',
      'frontend/src/app/orders/[id]/execute/page.tsx'
    ],
    displayCondition: 'task.needContactCS'
  },
  {
    field: 'checkPassword',
    requiredFiles: [
      'frontend/src/app/merchant/tasks/[id]/page.tsx',
      'frontend/src/app/tasks/[id]/page.tsx',
      'frontend/src/app/admin/tasks/page.tsx'
    ],
    displayCondition: 'task.isPasswordEnabled'
  },
  {
    field: 'orderSpecs',
    requiredFiles: [
      'frontend/src/app/merchant/tasks/[id]/page.tsx',
      'frontend/src/app/tasks/[id]/page.tsx',
      'frontend/src/app/admin/tasks/page.tsx',
      'frontend/src/app/orders/[id]/execute/page.tsx'
    ]
  }
];

function checkFieldReferences(): string[] {
  const errors: string[] = [];
  
  for (const check of CRITICAL_FIELDS) {
    for (const filePath of check.requiredFiles) {
      if (!fs.existsSync(filePath)) {
        errors.push(`❌ 文件不存在: ${filePath}`);
        continue;
      }
      
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // 检查字段是否被引用
      if (!content.includes(check.field)) {
        errors.push(`❌ 字段 ${check.field} 在文件 ${filePath} 中未被引用`);
      }
      
      // 检查显示条件
      if (check.displayCondition && !content.includes(check.displayCondition)) {
        errors.push(`⚠️  字段 ${check.field} 在文件 ${filePath} 中缺少显示条件 ${check.displayCondition}`);
      }
    }
  }
  
  return errors;
}

function main() {
  console.log('🔍 检查关键字段引用...\n');
  
  const errors = checkFieldReferences();
  
  if (errors.length === 0) {
    console.log('✅ 所有关键字段引用检查通过');
    process.exit(0);
  } else {
    console.log('🚨 发现以下问题:\n');
    errors.forEach(error => console.log(error));
    console.log(`\n总计 ${errors.length} 个问题需要修复`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

---

## 附录C: 测试用例

### C.1 端到端测试用例

#### 测试用例1: 货比功能完整性
```typescript
// e2e/task-compare-flow.spec.ts
describe('货比功能完整性测试', () => {
  test('商家发布带货比的任务', async ({ page }) => {
    // 1. 商家发布任务，设置货比3家商品
    await page.goto('/merchant/tasks/new');
    await page.check('[data-testid="needCompare"]');
    await page.selectOption('[data-testid="compareCount"]', '3');
    await page.click('[data-testid="submit"]');
    
    const taskId = await page.getAttribute('[data-testid="taskId"]', 'value');
    
    // 2. 检查商家详情页显示货比数量
    await page.goto(`/merchant/tasks/${taskId}`);
    await expect(page.locator('[data-testid="compareCount"]')).toContainText('3家商品');
    
    // 3. 检查买手详情页显示货比数量
    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator('[data-testid="compareCount"]')).toContainText('3家商品');
    
    // 4. 检查订单执行页显示货比要求
    await page.goto(`/orders/${taskId}/execute`);
    await expect(page.locator('[data-testid="compareInstruction"]')).toContainText('请在搜索结果中浏览对比 3 家不同店铺');
  });
});
```

#### 测试用例2: 联系客服内容显示
```typescript
describe('联系客服内容显示测试', () => {
  test('商家设置联系客服内容后各页面正确显示', async ({ page }) => {
    const csContent = '请问这款商品有现货吗？什么时候发货？';
    
    // 1. 商家发布任务，设置联系客服内容
    await page.goto('/merchant/tasks/new');
    await page.check('[data-testid="needContactCS"]');
    await page.fill('[data-testid="contactCSContent"]', csContent);
    await page.click('[data-testid="submit"]');
    
    const taskId = await page.getAttribute('[data-testid="taskId"]', 'value');
    
    // 2. 检查商家详情页显示联系客服内容
    await page.goto(`/merchant/tasks/${taskId}`);
    await expect(page.locator('[data-testid="contactCSContent"]')).toContainText(csContent);
    
    // 3. 检查买手详情页显示联系客服内容
    await page.goto(`/tasks/${taskId}`);
    await expect(page.locator('[data-testid="contactCSContent"]')).toContainText(csContent);
    
    // 4. 检查订单执行页显示具体要发送的内容
    await page.goto(`/orders/${taskId}/execute`);
    await expect(page.locator('[data-testid="csInstruction"]')).toContainText(`请发送以下内容给客服: "${csContent}"`);
  });
});
```

### C.2 单元测试用例

#### TaskFieldFormatter测试
```typescript
// src/shared/__tests__/formatters.test.ts
import { TaskFieldFormatter } from '../formatters';

describe('TaskFieldFormatter', () => {
  describe('formatCompareCount', () => {
    it('should format compare count correctly', () => {
      const task = { needCompare: true, compareCount: 3 };
      expect(TaskFieldFormatter.formatCompareCount(task)).toBe('货比 3家商品');
    });
    
    it('should use default count when not specified', () => {
      const task = { needCompare: true };
      expect(TaskFieldFormatter.formatCompareCount(task)).toBe('货比 3家商品');
    });
    
    it('should return empty string when compare not needed', () => {
      const task = { needCompare: false, compareCount: 3 };
      expect(TaskFieldFormatter.formatCompareCount(task)).toBe('');
    });
  });
  
  describe('formatContactCS', () => {
    it('should format contact CS content correctly', () => {
      const task = { needContactCS: true, contactCSContent: '请问有现货吗？' };
      expect(TaskFieldFormatter.formatContactCS(task)).toBe('请问有现货吗？');
    });
    
    it('should use default content when not specified', () => {
      const task = { needContactCS: true };
      expect(TaskFieldFormatter.formatContactCS(task)).toBe('请联系客服咨询');
    });
    
    it('should return empty string when contact CS not needed', () => {
      const task = { needContactCS: false, contactCSContent: '测试内容' };
      expect(TaskFieldFormatter.formatContactCS(task)).toBe('');
    });
  });
});
```

---

## 附录D: 实施检查清单

### D.1 Phase 1 检查清单 (紧急修复)

#### 商家详情页修复
- [ ] 添加 `compareCount` 显示 (当 `needCompare=true` 时)
- [ ] 添加 `contactCSContent` 显示 (当 `needContactCS=true` 时)  
- [ ] 添加 `checkPassword` 显示 (当 `isPasswordEnabled=true` 时)
- [ ] 添加 `orderSpecs` 显示 (当 `orderSpecs.length > 0` 时)
- [ ] 添加 `weight` 显示 (当 `weight > 0` 时)
- [ ] 添加 `fastRefund` 显示 (当 `fastRefund=true` 时)

#### 买手详情页修复  
- [ ] 添加 `compareCount` 显示
- [ ] 添加 `contactCSContent` 显示
- [ ] 添加 `checkPassword` 显示
- [ ] 添加 `orderSpecs` 显示
- [ ] 添加任务信息中的 `weight` 和 `fastRefund`

#### 管理详情页修复
- [ ] 添加所有缺失字段显示
- [ ] 添加费用明细展示
- [ ] 确保审核时能看到完整信息

#### 订单执行页修复
- [ ] Step1 添加货比具体要求说明
- [ ] Step1 添加联系客服具体内容
- [ ] Step2 添加订单规格验证
- [ ] Step2 添加验证口令检查

### D.2 Phase 2 检查清单 (标准化重构)

#### 共享规范层
- [ ] 创建 `TaskFieldSpec` 接口
- [ ] 实现 `TaskFieldFormatter` 类
- [ ] 创建字段显示条件函数
- [ ] 添加字段格式化函数

#### 标准组件
- [ ] 创建 `TaskFieldDisplay` 组件
- [ ] 创建 `BrowseBehaviorSection` 组件  
- [ ] 创建 `OrderSpecsSection` 组件
- [ ] 创建 `VerifyCodeSection` 组件

#### 页面重构
- [ ] 商家详情页使用标准组件
- [ ] 买手详情页使用标准组件
- [ ] 管理详情页使用标准组件
- [ ] 订单执行页使用标准组件

### D.3 Phase 3 检查清单 (CI门禁)

#### 静态分析工具
- [ ] 实现字段引用检查脚本
- [ ] 实现类型一致性检查脚本
- [ ] 实现枚举值一致性检查
- [ ] 添加检查结果报告生成

#### GitHub Actions
- [ ] 配置字段一致性检查工作流
- [ ] 配置PR评论反馈
- [ ] 配置检查失败时的阻断机制
- [ ] 添加检查结果徽章

### D.4 Phase 4 检查清单 (测试验证)

#### 端到端测试
- [ ] 货比功能完整流程测试
- [ ] 联系客服内容显示测试
- [ ] 验证口令功能测试
- [ ] 订单规格配置测试
- [ ] 费用明细显示测试

#### 单元测试
- [ ] TaskFieldFormatter 测试
- [ ] 标准组件测试
- [ ] 字段显示条件测试
- [ ] 格式化函数测试

#### 回归测试
- [ ] 现有功能不受影响
- [ ] 性能无明显下降
- [ ] 兼容性测试通过
- [ ] 用户体验测试通过

---

**审计完成时间**: 2026年1月13日  
**审计人员**: Kiro AI Assistant  
**下次审计**: 修复完成后进行验收审计