# 任务字段显示快速参考表

## 各页面字段显示对比

### 浏览要求相关字段

| 字段 | 商家详情 | 管理详情 | 买手详情 | 执行页 | 商家订单 | 管理订单 |
|------|--------|--------|--------|-------|--------|--------|
| needCompare | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| compareCount | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| needFavorite | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| needFollow | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| needAddCart | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| needContactCS | ✅ L411 | ✅ L901 | ✅ L281 | ✅ L250 | ❌ | ❌ |
| contactCSContent | ✅ L411 | ❌ | ❌ | ✅ L250 | ❌ | ❌ |
| totalBrowseMinutes | ✅ L440 | ✅ L920 | ✅ L300 | ✅ L250 | ❌ | ❌ |
| compareBrowseMinutes | ✅ L440 | ✅ L920 | ✅ L300 | ✅ L250 | ❌ | ❌ |
| mainBrowseMinutes | ✅ L440 | ✅ L920 | ✅ L300 | ✅ L250 | ❌ | ❌ |
| subBrowseMinutes | ✅ L440 | ✅ L920 | ✅ L300 | ✅ L250 | ❌ | ❌ |
| hasSubProduct | ✅ L440 | ✅ L920 | ✅ L300 | ✅ L250 | ❌ | ❌ |

### 下单提示相关字段

| 字段 | 商家详情 | 管理详情 | 买手详情 | 执行页 | 商家订单 | 管理订单 |
|------|--------|--------|--------|-------|--------|--------|
| memo | ✅ L621 | ✅ L1151 | ✅ L411 | ❌ | ❌ | ❌ |

### 好评内容相关字段

| 字段 | 商家详情 | 管理详情 | 买手详情 | 执行页 | 商家订单 | 管理订单 |
|------|--------|--------|--------|-------|--------|--------|
| isPraise | ✅ L551 | ✅ L1101 | ✅ L331 | ❌ | ❌ | ❌ |
| praiseList | ✅ L551 | ✅ L1151 | ✅ L331 | ❌ | ❌ | ✅ L450 |
| isImgPraise | ✅ L551 | ✅ L1101 | ✅ L331 | ❌ | ❌ | ❌ |
| praiseImgList | ✅ L551 | ✅ L1151 | ❌ | ❌ | ❌ | ❌ |
| isVideoPraise | ✅ L551 | ✅ L1101 | ✅ L331 | ❌ | ❌ | ❌ |
| praiseVideoList | ✅ L551 | ✅ L1151 | ❌ | ❌ | ❌ | ❌ |

### 增值服务相关字段

| 字段 | 商家详情 | 管理详情 | 买手详情 | 执行页 | 商家订单 | 管理订单 |
|------|--------|--------|--------|-------|--------|--------|
| weight | ✅ L481 | ✅ L1051 | ✅ L361 | ❌ | ❌ | ❌ |
| fastRefund | ✅ L481 | ✅ L1051 | ✅ L361 | ❌ | ❌ | ❌ |
| addReward | ✅ L481 | ✅ L1001 | ✅ L361 | ❌ | ✅ L150 | ✅ L350 |
| unionInterval | ✅ L481 | ✅ L1051 | ❌ | ❌ | ❌ | ❌ |
| isPasswordEnabled | ✅ L481 | ✅ L1051 | ✅ L361 | ✅ L450 | ❌ | ❌ |
| checkPassword | ✅ L481 | ✅ L1051 | ✅ L361 | ✅ L450 | ❌ | ❌ |

## 执行页缺失字段清单

需要在 `frontend/src/app/orders/[id]/execute/page.tsx` 中补充：

1. **包裹重量** (weight)
   - 应在第二步显示
   - 当前位置: 行 80 (状态定义)
   - 建议位置: 第二步温馨提示区域

2. **快速返款** (fastRefund)
   - 应在第二步显示
   - 当前位置: 行 80 (状态定义)
   - 建议位置: 第二步温馨提示区域

3. **额外赏金** (addReward)
   - 应在第二步显示
   - 当前位置: 行 80 (状态定义)
   - 建议位置: 第二步温馨提示区域

4. **好评内容** (praiseList, praiseImgList, praiseVideoList)
   - 应在第二步显示
   - 当前位置: 行 80 (状态定义)
   - 建议位置: 第二步温馨提示区域

5. **下单提示** (memo)
   - 应在第二步显示
   - 当前位置: 行 80 (状态定义)
   - 建议位置: 第二步温馨提示区域

## 订单页缺失字段清单

### 商家订单页 (`frontend/src/app/merchant/orders/page.tsx`)

需要在订单详情模态框中补充：

1. **浏览要求** (needCompare, needFavorite, needFollow, needAddCart, needContactCS)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

2. **浏览时长** (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

3. **增值服务** (weight, fastRefund, unionInterval, isPasswordEnabled, checkPassword)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

### 管理订单页 (`frontend/src/app/admin/orders/page.tsx`)

需要在订单详情模态框中补充：

1. **浏览要求** (needCompare, needFavorite, needFollow, needAddCart, needContactCS)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

2. **浏览时长** (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

3. **增值服务** (weight, fastRefund, unionInterval, isPasswordEnabled, checkPassword)
   - 应在订单详情中显示
   - 建议位置: 订单详情模态框中

4. **好评图片** (praiseImages)
   - 应在订单详情中显示
   - 当前仅显示文本内容
   - 建议位置: 评价信息部分

## 字段显示完整性评分

| 页面 | 完整性 | 主要缺失 |
|------|-------|--------|
| 商家任务详情 | 95% | 无 |
| 管理任务详情 | 90% | contactCSContent |
| 买手任务详情 | 80% | contactCSContent, praiseImgList, praiseVideoList, unionInterval |
| 执行页 | 70% | weight, fastRefund, addReward, praiseList, memo |
| 商家订单页 | 60% | 浏览要求, 增值服务, 好评详情 |
| 管理订单页 | 65% | 浏览要求, 增值服务, 好评图片 |
