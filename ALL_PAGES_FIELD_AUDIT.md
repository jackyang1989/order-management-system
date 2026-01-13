# 任务详情显示全面审计报告

## 审计日期
2026-01-13

## 审计范围

本次审计覆盖所有显示任务信息的页面：

1. **商家中心任务详情页** (`frontend/src/app/merchant/tasks/[id]/page.tsx`)
2. **管理后台任务详情弹窗** (`frontend/src/app/admin/tasks/page.tsx`)
3. **买手任务详情页** (`frontend/src/app/tasks/[id]/page.tsx`)
4. **买手任务执行页** (`frontend/src/app/orders/[id]/execute/page.tsx`)
5. **商家订单审核页** (`frontend/src/app/merchant/orders/page.tsx`)
6. **管理后台订单页** (`frontend/src/app/admin/orders/page.tsx`)

---

## 字段显示对照表

### 基础信息字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| taskNumber | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| title/productName | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| shopName | ✅ | ✅ | ✅ | ✅ | - | - |
| taskType/platform | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| count (任务单数) | ✅ | ✅ | ✅ | ✅ | - | - |
| terminal (结算方式) | ✅ | ✅ | ✅ | ✅ | - | - |
| status | ✅ | ✅ | ✅ | - | ✅ | ✅ |
| createdAt | ✅ | ✅ | - | ✅ | ✅ | ✅ |

### 商品信息字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| goodsList (多商品) | ✅ | ✅ | ✅ | ✅ | - | - |
| goodsPrice | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| orderSpecs (下单规格) | ✅ | ✅ | ✅ | ✅ | - | - |
| verifyCode (核对口令) | ✅ | ✅ | ✅ | ✅ | - | - |
| mainImage | ✅ | ✅ | ✅ | ✅ | - | - |

### 关键词字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| keywords (多关键词) | ✅ | ✅ | ✅ | ✅ | - | - |
| keyword (单关键词) | ✅ | ✅ | ✅ | ✅ | - | - |
| sort (排序) | ✅ | ✅ | ✅ | ❌ | - | - |
| province (发货地) | ✅ | ✅ | ✅ | ❌ | - | - |
| minPrice/maxPrice | ✅ | ✅ | ✅ | ❌ | - | - |

### 浏览要求字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| totalBrowseMinutes | ✅ | ✅ | ✅ | ✅ | - | - |
| compareBrowseMinutes | ✅ | ✅ | ✅ | ✅ | - | - |
| mainBrowseMinutes | ✅ | ✅ | ✅ | ✅ | - | - |
| subBrowseMinutes | ✅ | ✅ | ✅ | ✅ | - | - |
| hasSubProduct | ✅ | ✅ | ✅ | ✅ | - | - |
| needCompare | ✅ | ✅ | ✅ | ✅ | - | - |
| compareCount | ✅ | ✅ | ✅ | ✅ | - | - |
| needFavorite | ✅ | ✅ | ✅ | ✅ | - | - |
| needFollow | ✅ | ✅ | ✅ | ✅ | - | - |
| needAddCart | ✅ | ✅ | ✅ | ✅ | - | - |
| needContactCS | ✅ | ✅ | ✅ | ✅ | - | - |
| contactCSContent | ✅ | ✅ | ✅ | ✅ | - | - |

### 好评设置字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| isPraise | ✅ | ✅ | ✅ | ✅ | - | - |
| praiseList | ✅ | ✅ | ✅ | ❌ | - | ✅ |
| isImgPraise | ✅ | ✅ | ✅ | ❌ | - | - |
| praiseImgList | ✅ | ✅ | ❌ | ❌ | - | - |
| isVideoPraise | ✅ | ✅ | ✅ | ✅ | - | - |
| praiseVideoList | ✅ | ✅ | ❌ | ❌ | - | - |

### 增值服务字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| memo (下单提示) | ✅ | ✅ | ✅ | ✅ | - | - |
| isFreeShipping | ✅ | ✅ | ✅ | ✅ | - | - |
| isPasswordEnabled | ✅ | ✅ | ✅ | ✅ | - | - |
| checkPassword | ✅ | ✅ | ✅ | ✅ | - | - |
| weight (包裹重量) | ✅ | ✅ | ✅ | ✅ | - | - |
| fastRefund | ✅ | ✅ | ✅ | ✅ | - | - |
| unionInterval | ✅ | ✅ | ❌ | ❌ | - | - |
| orderInterval | ❌ | ❌ | ❌ | ❌ | - | - |
| addReward/extraCommission | ✅ | ✅ | ✅ | ❌ | - | - |
| isTimingPublish | ✅ | ✅ | ❌ | ❌ | - | - |
| publishTime | ✅ | ✅ | ❌ | ❌ | - | - |
| isTimingPay | ✅ | ✅ | ❌ | ❌ | - | - |
| timingTime | ✅ | ✅ | ❌ | ❌ | - | - |
| isRepay | ✅ | ✅ | ✅ | ❌ | - | - |
| isNextDay | ✅ | ✅ | ✅ | ❌ | - | - |
| cycle | ✅ | ✅ | ❌ | ❌ | - | - |

### 费用字段

| 字段名 | 商家任务详情 | 管理后台任务 | 买手任务详情 | 买手执行页 | 商家订单审核 | 管理后台订单 |
|--------|------------|------------|------------|----------|------------|------------|
| totalDeposit | ✅ | ✅ | - | - | - | ✅ |
| totalCommission | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| baseServiceFee | ✅ | ❌ | - | - | - | - |
| praiseFee | ✅ | ❌ | - | - | - | - |
| imgPraiseFee | ✅ | ❌ | - | - | - | - |
| videoPraiseFee | ✅ | ❌ | - | - | - | - |
| shippingFee | ✅ | ❌ | - | - | - | - |
| margin | ✅ | ❌ | - | - | - | - |

---

## 问题汇总

### P0 - 严重问题（已修复）

1. ✅ **hasSubProduct 默认值错误**
   - 问题：默认值为 `true`，导致单商品任务也显示副商品浏览时长
   - 修复：改为 `false`
   - 影响页面：所有页面

2. ✅ **后端 hasSubProduct 逻辑错误**
   - 问题：使用 `!== false` 判断，`undefined` 时返回 `true`
   - 修复：改为 `!!dto.hasSubProduct`
   - 影响：数据保存

3. ✅ **未自动计算 hasSubProduct**
   - 问题：依赖用户手动设置
   - 修复：提交时自动计算 `goodsList.length > 1`
   - 影响：所有新创建的任务

4. ✅ **关键词筛选设置字段不匹配**
   - 问题：后端从 `advancedSettings` 读取，前端在 `filterSettings`
   - 修复：从 `filterSettings` 读取
   - 影响：关键词的排序、发货地、价格区间

### P1 - ��要缺失（需要添加）

5. ❌ **买手任务详情页缺少部分增值服务显示**
   - 缺失字段：
     - `unionInterval` (接单间隔)
     - `isTimingPublish` + `publishTime` (定时发布)
     - `isTimingPay` + `timingTime` (定时付款)
     - `cycle` (延长周期)
   - 影响：买手无法看到这些信息
   - 建议：添加"任务设置"卡片显示这些字段

6. ❌ **买手执行页缺少关键词筛选设置显示**
   - 缺失字段：
     - `sort` (排序方式)
     - `province` (发货地)
     - `minPrice/maxPrice` (价格区间)
   - 影响：买手不知道如何筛选商品
   - 建议：在关键词显示区域添加筛选设置提示

7. ❌ **买手执行页缺少好评内容显示**
   - 缺失字段：
     - `praiseList` (好评文字内容)
     - `praiseImgList` (好评图片)
     - `praiseVideoList` (好评视频)
   - 影响：买手不知道要写什么好评
   - 建议：添加"好评内容"卡片显示具体内容

8. ❌ **买手执行页缺少额外赏金显示**
   - 缺失字段：`addReward/extraCommission`
   - 影响：买手不知道有额外赏金
   - 建议：在任务信息中显示

9. ❌ **管理后台任务详情缺少费用明细**
   - 缺失字段：
     - `baseServiceFee` (基础服务费)
     - `praiseFee` (好评费)
     - `imgPraiseFee` (图片好评费)
     - `videoPraiseFee` (视频好评费)
     - `shippingFee` (运费)
     - `margin` (保证金)
   - 影响：管理员无法查看详细费用
   - 建议：添加费用明细卡片

### P2 - 一般优化

10. ⚠️ **订单页面不显示任务详细信息**
    - 问题：商家订单审核页和管理后台订单页只显示订单信息，不显示任务详情
    - 建议：添加"查看任务详情"按钮，链接到任务详情页

11. ⚠️ **好评图片和视频在买手任务详情页不显示**
    - 问题：只显示文字好评预览
    - 建议：添加图片和视频的预览

---

## 修复建议

### 立即修复（P0 - 已完成）

✅ 所有 P0 问题已修复

### 近期修复（P1 - 建议本周完成）

#### 修复5: 买手任务详情页添加增值服务

**文件**: `frontend/src/app/tasks/[id]/page.tsx`

**位置**: 在"任务信息"卡片后添加

```typescript
{/* 任务设置 */}
{(task.unionInterval || task.isTimingPublish || task.isTimingPay || task.cycle) && (
    <div className="mx-0 my-2.5 border-b border-slate-200 bg-white p-4">
        <div className="mb-3 text-sm font-bold text-slate-800">任务设置</div>
        <div className="space-y-2 text-xs">
            {task.unionInterval && task.unionInterval > 0 && (
                <div className="flex justify-between">
                    <span className="text-slate-500">接单间隔</span>
                    <span className="text-slate-700">{task.unionInterval}分钟</span>
                </div>
            )}
            {task.isTimingPublish && task.publishTime && (
                <div className="flex justify-between">
                    <span className="text-slate-500">定时发布</span>
                    <span className="text-slate-700">{new Date(task.publishTime).toLocaleString('zh-CN')}</span>
                </div>
            )}
            {task.isTimingPay && task.timingTime && (
                <div className="flex justify-between">
                    <span className="text-slate-500">定时付款</span>
                    <span className="text-slate-700">{new Date(task.timingTime).toLocaleString('zh-CN')}</span>
                </div>
            )}
            {task.cycle && task.cycle > 0 && (
                <div className="flex justify-between">
                    <span className="text-slate-500">延长周期</span>
                    <span className="text-slate-700">{task.cycle}天</span>
                </div>
            )}
        </div>
    </div>
)}
```

#### 修复6: 买手执行页添加关键词筛选设置

**文件**: `frontend/src/app/orders/[id]/execute/page.tsx`

**位置**: 在关键词显示区域添加筛选提示

需要在商品信息中显示每个商品的关键词筛选设置

#### 修复7: 买手执行页添加好评内容显示

**文件**: `frontend/src/app/orders/[id]/execute/page.tsx`

**位置**: 添加好评内容卡片

需要显示具体的好评文字、图片、视频内容

#### 修复8: 买手执行页添加额外赏金显示

**文件**: `frontend/src/app/orders/[id]/execute/page.tsx`

**位置**: 在任务信息中添加

```typescript
{(task.addReward || task.extraCommission) && (task.addReward || task.extraCommission) > 0 && (
    <div className="flex justify-between">
        <span className="text-slate-500">额外赏金</span>
        <span className="text-warning-500 font-medium">+¥{task.addReward || task.extraCommission}/单</span>
    </div>
)}
```

#### 修复9: 管理后台任务详情添加费用明细

**文件**: `frontend/src/app/admin/tasks/page.tsx`

**位置**: 在Modal中添加费用明细卡片

---

## 测试清单

### 测试场景1: 单商品任务
- [ ] 创建只有1个商品的任务
- [ ] 不勾选副商品浏览时长
- [ ] 检查所有6个页面是否正确显示（不显示副商品浏览时长）

### 测试场景2: 多商品任务
- [ ] 创建有2个商品的任务（主商品 + 副商品）
- [ ] 检查所有6个页面是否正确显示（显示副商品浏览时长）

### 测试场景3: 完整增值服务
- [ ] 创建任务，填写所有增值服务
- [ ] 检查所有6个页面是否正确显示所有字段

### 测试场景4: 多关键词和筛选设置
- [ ] 创建任务，添加多个关键词
- [ ] 设置排序、发货地、价格区间
- [ ] 检查所有6个页面是否正确显示

### 测试场景5: 好评内容
- [ ] 创建任务，添加文字、图片、视频好评
- [ ] 检查所有6个页面是否正确显示

---

## 总结

### 已修复 ✅
1. ✅ hasSubProduct 默认值和逻辑
2. ✅ 自动计算 hasSubProduct
3. ✅ 关键词筛选设置字段匹配

### 需要修复 ❌
1. ❌ 买手任务详情页缺少部分增值服务
2. ❌ 买手执行页缺少关键词筛选设置
3. ❌ 买手执行页缺少好评内容
4. ❌ 买手执行页缺少额外赏金
5. ❌ 管理后台任务详情缺少费用明细

### 优化建议 ⚠️
1. ⚠️ 订单页面添加任务详情链接
2. ⚠️ 买手任务详情页添加好评图片和视频预览

### 修复优先级
- **P0 (已完成)**: hasSubProduct 相关问题
- **P1 (本周完成)**: 买手执行页和任务详情页的缺失字段
- **P2 (下周完成)**: 管理后台费用明细和其他优化

### 影响评估
- **高影响**: P0 问题影响所有任务的显示
- **中影响**: P1 问题影响买手执行任务的体验
- **低影响**: P2 问题影响管理员查看详情的便利性

