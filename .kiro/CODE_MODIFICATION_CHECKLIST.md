# 代码修改强制性检查清单

## 目的
防止引入新的 bug，确保每次代码修改都经过充分验证。

---

## 修改前检查（Pre-Modification）

### 1. 完整理解现有代码
- [ ] 完整读取目标文件（读到最后一行，不截断）
- [ ] 理解文件的整体结构和数据流
- [ ] 找到所有相关的变量定义
- [ ] 理解数据来源（API 返回？props？state？）

### 2. 搜索相关代码
- [ ] 使用 grepSearch 查找变量定义
- [ ] 查找类似的实现作为参考
- [ ] 检查是否有 JSON 解析函数
- [ ] 确认字段的数据类型

### 3. 验证数据结构
- [ ] 确认字段路径（`obj.field` vs `obj.nested.field`）
- [ ] 检查是否需要可选链 `?.`
- [ ] 检查是否需要默认值 `||` 或 `??`
- [ ] 确认数组/对象是否需要解析

---

## 修改中检查（During Modification）

### 4. 代码编写
- [ ] 使用正确的字段路径
- [ ] 添加必要的可选链和默认值
- [ ] 保持代码风格一致
- [ ] 添加必要的类型检查

### 5. 条件渲染
- [ ] 检查条件是否正确（`&&` vs `||`）
- [ ] 确认 falsy 值的处理（0, '', false, null, undefined）
- [ ] 添加必要的空值检查

---

## 修改后检查（Post-Modification）

### 6. 语法验证（强制性）
- [ ] **运行 getDiagnostics 检查语法错误**
- [ ] 确认没有 TypeScript 类型错误
- [ ] 确认没有 ESLint 警告

### 7. 逻辑验证
- [ ] 手动检查变量定义是否存在
- [ ] 验证字段引用路径是否正确
- [ ] 检查条件渲染逻辑
- [ ] 确认 JSON 解析不会出错

### 8. 数据流验证
- [ ] 追踪数据从 API 到 UI 的完整流程
- [ ] 确认 interface 定义与实际使用一致
- [ ] 检查是否有遗漏的字段映射

### 9. 边界情况
- [ ] 数据为空时的处理
- [ ] 数据为 undefined 时的处理
- [ ] 数组为空时的处理
- [ ] JSON 解析失败时的处理

---

## 常见错误模式（必须避免）

### ❌ 错误 1: 假设字段可以直接访问
```typescript
// ❌ 错误：假设 order 有 needCompare 字段
{order.needCompare && <div>...</div>}

// ✅ 正确：确认字段在 order.task 中
{order.task?.needCompare && <div>...</div>}
```

### ❌ 错误 2: 忘记定义辅助变量
```typescript
// ❌ 错误：直接使用 task.xxx，但 task 未定义
{task.needCompare && <div>...</div>}

// ✅ 正确：先定义 task 变量
const task = order.task || {};
{task.needCompare && <div>...</div>}
```

### ❌ 错误 3: 忘记 JSON 解析
```typescript
// ❌ 错误：直接使用 JSON 字符串
{task.praiseList.map(...)}

// ✅ 正确：先解析 JSON
const praiseList = parsePraiseList(task.praiseList);
{praiseList.map(...)}
```

### ❌ 错误 4: 复制代码不检查上下文
```typescript
// ❌ 错误：从其他页面复制代码，但数据结构不同
// 页面 A: task.needCompare
// 页面 B: order.task.needCompare (不同！)

// ✅ 正确：理解当前页面的数据结构后再写代码
```

---

## 验证命令

### 必须运行的命令
```bash
# 1. 语法检查（强制性）
getDiagnostics([修改的文件路径])

# 2. 搜索变量定义
grepSearch("const.*=.*order", "查找数据对象")

# 3. 搜索字段使用
grepSearch("needCompare", "查找字段使用情况")
```

---

## 报告标准

### 修改完成后必须报告

1. **修改内容**
   - 修改了哪些文件
   - 修改了哪些字段
   - 修改的原因

2. **验证结果**
   - getDiagnostics 结果：✅ 无错误 / ❌ 有错误
   - 变量定义检查：✅ 已确认 / ❌ 未找到
   - 字段路径检查：✅ 正确 / ❌ 需要修正

3. **潜在风险**
   - 是否有边界情况未处理
   - 是否需要额外测试
   - 是否影响其他功能

---

## 承诺

作为 AI 助手，我承诺：

1. ✅ 每次修改代码前完整读取文件
2. ✅ 每次修改代码后运行 getDiagnostics
3. ✅ 绝不基于假设修改代码
4. ✅ 发现问题立即报告
5. ✅ 不确定时明确说明

**如果我违反了这些准则，请立即指出！**

---

最后更新：2026-01-14
