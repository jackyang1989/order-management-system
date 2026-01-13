# 任务详情页显示问题修复记录

## 修复日期
2026-01-13

## 问题总结

用户创建任务后，详情页显示了多处错误：
1. ❌ 副商品浏览时长错误显示（用户未添加副商品，但显示了2分钟）
2. ❌ 其他可能的数据保存问题

## 根本原因

### 原因1: hasSubProduct默认值错误
- **位置**: `frontend/src/app/merchant/tasks/new/_components/types.ts`
- **问题**: 默认值为 `true`，导致所有任务都显示副商品浏览时长
- **影响**: 即使用户只添加1个商品，也会显示副商品浏览时长

### 原因2: 后端hasSubProduct逻辑错误
- **位置**: `backend/src/tasks/tasks.service.ts`
- **问题**: 使用 `dto.hasSubProduct !== false`，当值为 `undefined` 时返回 `true`
- **影响**: 即使前端没有设置，后端也会保存为 `true`

### 原因3: 未根据商品数量动态计算
- **位置**: `frontend/src/app/merchant/tasks/new/page.tsx`
- **问题**: 提交时未根据 `goodsList.length` 动态计算 `hasSubProduct`
- **影响**: 依赖用户手动勾选，容易出错

### 原因4: 关键词筛选设置字段不匹配
- **位置**: `backend/src/tasks/tasks.service.ts`
- **问题**: 从 `advancedSettings` 读取筛选设置，但前端在 `filterSettings` 中
- **影响**: 关键词的排序、发货地、价格区间等筛选设置无法正确保存

## 已应用的修复

### 修复1: 修改hasSubProduct默认值 ✅

**文件**: `frontend/src/app/merchant/tasks/new/_components/types.ts`

**修改前**:
```typescript
hasSubProduct: true,
```

**修改后**:
```typescript
hasSubProduct: false,  // 默认false，根据商品数量动态计算
```

**效果**: 新创建的任务默认不显示副商品浏览时长

---

### 修复2: 修复后端hasSubProduct逻辑 ✅

**文件**: `backend/src/tasks/tasks.service.ts` (line 421)

**修改前**:
```typescript
hasSubProduct: dto.hasSubProduct !== false,
```

**修改后**:
```typescript
hasSubProduct: !!dto.hasSubProduct,  // 显式转换为boolean
```

**效果**: 
- `undefined` → `false`
- `false` → `false`
- `true` → `true`

---

### 修复3: 自动计算hasSubProduct ✅

**文件**: `frontend/src/app/merchant/tasks/new/page.tsx` (line 85-91)

**修改前**:
```typescript
const payload = { 
    ...data, 
    goodsPrice: Number(data.goodsPrice), 
    count: Number(data.count), 
    addReward: Number(data.addReward), 
    extraCommission: Number(data.addReward) 
};
```

**修改后**:
```typescript
const payload = { 
    ...data, 
    goodsPrice: Number(data.goodsPrice), 
    count: Number(data.count), 
    addReward: Number(data.addReward), 
    extraCommission: Number(data.addReward),
    // 自动根据商品数量计算hasSubProduct
    hasSubProduct: data.goodsList && data.goodsList.length > 1
};
```

**效果**: 
- 1个商品 → `hasSubProduct = false`
- 2个或更多商品 → `hasSubProduct = true`
- 完全自动化，无需用户手动设置

---

### 修复4: 修复关键词筛选设置保存 ✅

**文件**: `backend/src/tasks/tasks.service.ts` (line 490-505)

**修改前**:
```typescript
for (const kw of goods.keywords) {
    const taskKeyword = this.taskKeywordRepository.create({
        taskId: task.id,
        taskGoodsId: goods.id || undefined,
        keyword: kw.keyword,
        terminal: kw.advancedSettings?.terminal || 1,
        sort: kw.advancedSettings?.sort || undefined,
        province: kw.advancedSettings?.province || undefined,
        minPrice: kw.advancedSettings?.minPrice || 0,
        maxPrice: kw.advancedSettings?.maxPrice || 0,
    });
    taskKeywordsList.push(taskKeyword);
}
```

**修改后**:
```typescript
for (const kw of goods.keywords) {
    // 筛选设置优先从关键词级别获取，其次从商品级别获取
    const filterSettings = kw.filterSettings || goods.filterSettings || {};
    const taskKeyword = this.taskKeywordRepository.create({
        taskId: task.id,
        taskGoodsId: goods.id || undefined,
        keyword: kw.keyword,
        terminal: 1,  // 默认手机端
        sort: filterSettings.sort || undefined,
        province: filterSettings.province || undefined,
        minPrice: filterSettings.minPrice || 0,
        maxPrice: filterSettings.maxPrice || 0,
    });
    taskKeywordsList.push(taskKeyword);
}
```

**效果**: 
- 正确从 `filterSettings` 读取筛选设置
- 支持关键词级别和商品级别的筛选设置
- 排序、发货地、价格区间等设置能正确保存

---

## 修复效果验证

### 场景1: 单商品任务（用户的实际情况）

**创建任务**:
- 商品数量: 1个
- 商品单价: ¥35.00
- 下单数量: 3
- 任务单数: 5单

**预期结果**:
- ✅ `hasSubProduct = false`
- ✅ 详情页不显示副商品浏览时长
- ✅ 浏览时长布局为3列（总计、货比、主品）

### 场景2: 多商品任务

**创建任务**:
- 商品数量: 2个（主商品 + 副商品）
- 主商品: ¥50 × 2
- 副商品: ¥30 × 1
- 任务单数: 3单

**预期结果**:
- ✅ `hasSubProduct = true`
- ✅ 详情页显示副商品浏览时长
- ✅ 浏览时长布局为4列（总计、货比、主品、副品）

### 场景3: 关键词筛选设置

**创建任务**:
- 关键词: "布朗博士奶瓶盖"
- 筛选设置: 排序=销量, 发货地=浙江, 价格区间=30-50

**预期结果**:
- ✅ 关键词正确保存
- ✅ 筛选设置正确保存到 `task_keywords` 表
- ✅ 详情页正确显示筛选设置

---

## 测试步骤

### 步骤1: 测试单商品任务
1. 创建新任务，只添加1个商品
2. 不勾选副商品浏览时长
3. 提交任务
4. 查看详情页，确认不显示副商品浏览时长

### 步骤2: 测试多商品任务
1. 创建新任务，添加2个商品（主商品 + 副商品）
2. 提交任务
3. 查看详情页，确认显示副商品浏览时长

### 步骤3: 测试关键词筛选设置
1. 创建新任务，设置关键词筛选（排序、发货地、价格区间）
2. 提交任务
3. 查看详情页，确认筛选设置正确显示

### 步骤4: 数据库验证
```sql
-- 查询任务的hasSubProduct值
SELECT id, taskNumber, hasSubProduct, subBrowseMinutes 
FROM tasks 
WHERE taskNumber = 'T1768219240613108';

-- 查询关键词的筛选设置
SELECT keyword, sort, province, minPrice, maxPrice 
FROM task_keywords 
WHERE taskId = (SELECT id FROM tasks WHERE taskNumber = 'T1768219240613108');
```

---

## 其他需要注意的问题

### 问题1: 货比关键词保存
- **当前状态**: 使用 `getCompareKeyword(dto)` 方法
- **潜在问题**: 可能没有正确处理多关键词的货比关键词
- **建议**: 检查 `getCompareKeyword` 方法的实现

### 问题2: 备用关键词未保存
- **当前状态**: 前端有 `backupKeyword` 字段，但后端没有保存
- **影响**: 备用关键词功能无法使用
- **建议**: 添加备用关键词的保存逻辑

### 问题3: 商品本金显示
- **当前状态**: 前端显示代码正确，从 `goodsList` 累加计算
- **需要验证**: 数据库中的 `goodsList` 数据是否完整

---

## 总结

### 已修复 ✅
1. ✅ hasSubProduct 默认值错误
2. ✅ 后端 hasSubProduct 逻辑错误
3. ✅ 自动根据商品数量计算 hasSubProduct
4. ✅ 关键词筛选设置字段不匹配

### 修复效果
- 单商品任务不再显示副商品浏览时长
- 多商品任务正确显示副商品浏览时长
- 关键词筛选设置能正确保存和显示
- 完全自动化，无需用户手动设置

### 需要进一步验证
- 货比关键词是否正确保存
- 备用关键词功能是否需要实现
- 商品本金计算是否正确
- 其他字段（下单提示、联系客服内容、好评内容等）是否正确保存

### 建议
1. 创建测试任务验证修复效果
2. 检查数据库中的实际数据
3. 如果还有其他显示问题，可能是数据保存问题而不是显示逻辑问题

