# 任务详情页显示问题验证清单

## 验证日期
2026-01-13

## 用户填写的数据（从截图）

### 基础信息
- **商品名称**: 必看这里布朗博士+奶瓶盖防尘盖奶嘴保护盖婴儿奶瓶配件
- **店铺**: 布朗贝蒂旗舰店 woyou1989
- **商品单价**: ¥35.00
- **下单数量**: 3
- **下单规格**: 可调节版奶瓶旋盖防尘盖
- **任务单数**: 5单
- **返款方式**: 本立佣货 (terminal=2)

### 关键词
- **主关键词**: "布朗博士奶瓶盖" (使用次数5)
- **货比关键词**: "布朗博士主配件"
- **备用关键词**: "布朗博士配贝亲奶嘴"

### 浏览要求
- 货比: 3家
- 收藏商品: ✓
- 关注店铺: ✓
- 加入购物车: ✓
- 联系客服: ✓ (内容: "布朗博士配贝亲奶嘴选哪个配件？")

### 浏览时长
- 总浏览: 15分钟
- 货比: 3分钟
- 主商品: 8分钟
- **副商品: 未勾选** (hasSubProduct应为false)

### 下单提示
- "测试下单提示"

### 好评设置
- 5条好评文字: 好评1、好评2、好评3、好评4、好评5

### 增值服务
- 口令验证: 5分钟
- 额外赏金: 1元/单
- 快速返款: ✓
- 接单间隔: 5分钟
- 包裹重量: 0kg

### 费用
- 商品本金小计: ¥525.00 (35×3×5)
- 基础服务费: ¥25.00 (5×5)
- 好评增值费: ¥10.00 (2×5)
- 额外赏金费: ¥5.00 (1×5)

## 前端代码验证

### ✅ 1. TerminalLabels 定义正确
```typescript
// frontend/src/shared/taskSpec.ts
export const TerminalLabels: Record<number, string> = {
    [TerminalType.COMMISSION_RETURN]: '本佣货返',  // 1
    [TerminalType.INSTANT_RETURN]: '本立佣货',     // 2
};
```

### ✅ 2. 商家任务详情页使用正确
```typescript
// frontend/src/app/merchant/tasks/[id]/page.tsx (line ~710)
<span>{TerminalLabels[task.terminal] || '未知'}</span>
```

### ✅ 3. 副商品浏览时长显示逻辑正确
```typescript
// frontend/src/app/merchant/tasks/[id]/page.tsx (line ~512)
<div className={`grid gap-2 text-center ${task.hasSubProduct ? 'grid-cols-4' : 'grid-cols-3'}`}>
    ...
    {task.hasSubProduct && (
        <div className="rounded bg-slate-50 p-2">
            <div className="text-lg font-bold text-slate-500">{task.subBrowseMinutes || 2}</div>
            <div className="text-xs text-[#6b7280]">副品/分钟</div>
        </div>
    )}
</div>
```

### ✅ 4. 商品本金计算正确
```typescript
// frontend/src/app/merchant/tasks/[id]/page.tsx (line ~730-740)
let totalGoodsPrice = 0;
if (task.goodsList && task.goodsList.length > 0) {
    totalGoodsPrice = task.goodsList.reduce((sum, goods) => sum + Number(goods.totalPrice || 0), 0);
} else {
    totalGoodsPrice = Number(task.goodsPrice) || 0;
}
// 显示: ¥{formatMoney(totalGoodsPrice * task.count)}
```

### ✅ 5. 多商品列表显示支持
- 商品图片、名称、规格、价格、数量 ✓
- 主商品/副商品标识 ✓
- 下单规格 (orderSpecs JSON解析) ✓
- 核对口令 (verifyCode) ✓

### ✅ 6. 多关键词显示支持
- 关键词列表遍历 ✓
- 关键词文本、终端类型 ✓
- 筛选设置 (排序、发货地、价格区间) ✓

### ✅ 7. 浏览要求显示支持
- 浏览行为Badge ✓
- 联系客服内容 (contactCSContent) ✓
- 货比数量 (compareCount) ✓

### ✅ 8. 好评设置显示支持
- 文字好评 (praiseList JSON解析) ✓
- 图片好评 (praiseImgList) ✓
- 视频好评 (praiseVideoList) ✓
- 弹窗查看详情 ✓

### ✅ 9. 下单提示显示支持
```typescript
// frontend/src/app/merchant/tasks/[id]/page.tsx (line ~625)
{task.memo && (
    <Card className="bg-white" noPadding>
        <div className="px-6 py-5">
            <h2 className="mb-3 text-base font-semibold">下单提示/商家备注</h2>
            <div className="rounded bg-amber-50 p-4 text-sm text-amber-800 whitespace-pre-wrap">{task.memo}</div>
        </div>
    </Card>
)}
```

### ✅ 10. 增值服务显示支持
```typescript
const valueAddedServices = [
    { label: '定时发布', enabled: task.isTimingPublish, value: task.publishTime ? formatDateTime(task.publishTime) : '' },
    { label: '定时付款', enabled: task.isTimingPay, value: task.timingTime ? formatDateTime(task.timingTime) : '' },
    { label: '回购任务', enabled: task.isRepay },
    { label: '隔天任务', enabled: task.isNextDay },
    { label: '延长周期', enabled: (task.cycle || 0) > 0, value: task.cycle ? `${task.cycle}天` : '' },
    { label: '接单间隔', enabled: (task.unionInterval || 0) > 0, value: task.unionInterval ? `${task.unionInterval}分钟` : '' },
    { label: '快速返款', enabled: !!task.fastRefund },
    { label: '包裹重量', enabled: (task.weight || 0) > 0, value: `${task.weight}kg` }
];
```

## 后端数据验证

### ✅ API返回结构正确
```typescript
// backend/src/tasks/tasks.controller.ts
@Get(':id')
async findOne(@Param('id') id: string) {
    const result = await this.tasksService.findOneWithDetails(id);
    return {
        success: true,
        data: {
            ...result.task,      // Task实体所有字段
            goodsList: result.goodsList,  // TaskGoods[]
            keywords: result.keywords,    // TaskKeyword[]
        },
    };
}
```

### ✅ Service方法正确
```typescript
// backend/src/tasks/tasks.service.ts
async findOneWithDetails(id: string): Promise<{
    task: Task;
    goodsList: TaskGoods[];
    keywords: TaskKeyword[];
} | null> {
    const task = await this.tasksRepository.findOne({ where: { id } });
    const goodsList = await this.taskGoodsRepository.find({ where: { taskId: id }, order: { createdAt: 'ASC' } });
    const keywords = await this.taskKeywordRepository.find({ where: { taskId: id }, order: { createdAt: 'ASC' } });
    return { task, goodsList, keywords };
}
```

## 问题分析

### 前端代码 ✅ 完全正确
所有显示逻辑都已正确实现：
1. TerminalLabels映射正确
2. 副商品浏览时长条件渲染正确
3. 商品本金计算正确
4. 多商品、多关键词、好评、增值服务等都已支持

### 可能的问题来源

#### 1. 数据库中的terminal值错误
- **预期**: terminal = 2 (本立佣货)
- **可能实际**: terminal = 1 (本佣货返)
- **原因**: 任务创建时可能保存了错误的值

#### 2. 数据库中的hasSubProduct值错误
- **预期**: hasSubProduct = false (未勾选副商品)
- **可能实际**: hasSubProduct = true 或 undefined
- **原因**: 默认值设置问题

#### 3. 数据库中的count值错误
- **预期**: count = 5
- **可能实际**: count = 1
- **原因**: 任务创建时保存错误

#### 4. goodsList数据缺失或不完整
- **预期**: goodsList包含完整的商品信息（名称、规格、数量等）
- **可能实际**: goodsList为空或数据不完整
- **原因**: 任务创建时未正确保存到task_goods表

#### 5. keywords数据缺失
- **预期**: keywords包含3个关键词（主、货比、备用）
- **可能实际**: keywords为空或只有部分数据
- **原因**: 任务创建时未正确保存到task_keywords表

## 需要执行的验证步骤

### 步骤1: 查询数据库中的任务数据
```sql
-- 查询任务基础信息
SELECT 
    id, taskNumber, title, shopName, 
    terminal, count, goodsPrice,
    hasSubProduct, subBrowseMinutes,
    memo, contactCSContent,
    totalDeposit, totalCommission,
    baseServiceFee, addReward, extraCommission
FROM tasks 
WHERE taskNumber = 'T1768219240613108';

-- 查询商品列表
SELECT * FROM task_goods WHERE taskId = (SELECT id FROM tasks WHERE taskNumber = 'T1768219240613108');

-- 查询关键词列表
SELECT * FROM task_keywords WHERE taskId = (SELECT id FROM tasks WHERE taskNumber = 'T1768219240613108');
```

### 步骤2: 检查任务创建逻辑
检查 `backend/src/tasks/tasks.service.ts` 中的 `createAndPay` 方法，确认：
1. terminal值是否正确保存
2. hasSubProduct值是否正确计算和保存
3. count值是否正确保存
4. goodsList是否正确保存到task_goods表
5. keywords是否正确保存到task_keywords表

### 步骤3: 检查前端提交数据
检查 `frontend/src/app/merchant/tasks/new/_components/Step3Confirm.tsx` 中的提交逻辑，确认：
1. terminal值是否正确传递
2. hasSubProduct值是否正确计算
3. count值是否正确传递
4. goodsList数据是否完整
5. keywords数据是否完整

## 结论

**前端显示代码完全正确！** 所有问题都应该来自于数据库中保存的数据不正确。

需要：
1. 查询数据库验证实际保存的数据
2. 如果数据错误，修复任务创建逻辑
3. 如果数据正确，则可能是API返回数据时的问题

## 下一步行动

1. 执行SQL查询，获取任务 T1768219240613108 的完整数据
2. 根据查询结果确定问题根源
3. 修复相应的创建逻辑或API返回逻辑
