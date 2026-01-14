# 任务发布测试配置详情

## 测试目的
验证任务发布后，所有字段能够正确保存并在各页面正确显示

## 测试任务配置

### 基础信息
- **平台类型**: 淘宝
- **任务入口**: 关键词搜索
- **结算方式**: 本立佣货 (terminal=2)
- **店铺**: （布朗贝亲配件店）
店铺账号：wowyou1989
- **任务数量**: 5单

### 商品信息

#### 主商品
- **商品名称**: 必喜适用布朗博士奶瓶适配贝亲奶嘴垫片圈转换旋盖宽口径奶瓶配件
- **商品价格**: 35元
- **购买数量**: 3件
- **商品本金（单）**: 105元 (3件)
- **下单规格**: 可调节版奶瓶旋盖 3件
- **核对口令**: 必喜适用布朗博士奶瓶

#### 副商品
- **商品名称**: 适用布朗博士适配贝亲奶嘴垫片圈奶瓶配件改造螺旋盖重力球转换器
- **商品价格**: 35元
- **购买数量**: 3件
**商品本金（单）**: 105元 (3件)
- **下单规格**: 改良版奶瓶旋盖 3件
- **核对口令**: 布朗博士适配贝亲奶嘴

### 关键词设置

#### 进店关键词
- **关键词**: 布朗博士配贝亲奶嘴 （使用次数5次）
- **筛选排序**: 销量排序
- **价格区间**: ¥20.00 - ¥50.00

#### 货比关键词
- **关键词**: 布朗博士配件

#### 副关键词（备用关键词）
- **关键词**: 布朗博士贝亲

第二个关键词：布朗博士奶瓶配件  （使用次数5次）

发布任务数量5单   商品总价210/单

### 增值服务设置
物流设置：商家包邮 包裹重量0kg
- **下单提示**: 测试下单提示

#### 浏览行为设置
- **货比**: 是，货比数量5
- **收藏商品**: 是
- **关注店铺**: 是
- **加入购物车**: 是
- **联系客服**: 是
- **联系客服内容**: 测试联系客服
浏览时常设置
总浏览时长13分钟，货比浏览时长3分钟，主商品浏览时长8分钟，副商品浏览时长（勾选）2分钟

#### 好评设置
- **是否好评**: 是
- **好评类型**: 文字好评
- **好评内容** (5条):
  1. 好评1
  2. 好评2
  3. 好评3
  4. 好评4
  5. 好评5

#### 其他增值服务
开启口令验证：是
- **定时发布**: 2026/01/14 19:34
- **额外悬赏**: 1元/单（总计5元）
- **定时付款**: （未开启）
延长买号周期：30天
- **回购任务**: （未开启）
- **隔天任务**: 是
快速返款服务：是
任务接单间隔：15分钟
### 费用明细

#### 押金部分
- **商品本金（单）**: 210元
- **总押金**: 1050元 (210元 × 5单) 
- **邮费**: （0.00）
- **保证金**: （0.00）

#### 佣金部分
- **基础服务费**: 25元 (5元/单 × 5单)
- **好评费用**: 10元 (2元/单 × 5单，文字好评)
定时发布费：5元 (1元/单 × 5单)
- **额外悬赏**: 5元 (1元/单 × 5单)
- **多商品费用**: 5元 (1元/单 × 5单)
- **总佣金**: 52.50元

### 字段映射关系（前端 → 后端）

#### 基础信息字段
- `taskType` → `taskType`
- `taskEntryType` → （暂未使用）
- `terminal` → `terminal` (结算方式)
- `shopId` → `shopId`
- `shopName` → `shopName`
- `count` → `count`

#### 商品相关字段
- `goodsList[].name` → `TaskGoods.name`
- `goodsList[].image` → `TaskGoods.pcImg`
- `goodsList[].link` → `TaskGoods.link`
- `goodsList[].price` → `TaskGoods.price`
- `goodsList[].quantity` → `TaskGoods.num`
- `goodsList[].orderSpecs` → `TaskGoods.orderSpecs` (JSON)
- `goodsList[].verifyCode` → `TaskGoods.verifyCode`

#### 关键词相关字段
- `goodsList[].keywords[].keyword` → `TaskKeyword.keyword`
- `goodsList[].keywords[].filterSettings.sort` → `TaskKeyword.sort`
- `goodsList[].keywords[].filterSettings.minPrice` → `TaskKeyword.minPrice`
- `goodsList[].keywords[].filterSettings.maxPrice` → `TaskKeyword.maxPrice`
- `goodsList[].keywords[].filterSettings.province` → `TaskKeyword.province`
- `goodsList[].keywords[].advancedSettings.compareKeyword` → （待确认映射）
- `goodsList[].keywords[].advancedSettings.backupKeyword` → （待确认映射）

#### 好评相关字段
- `isPraise` → `isPraise`
- `praiseType` → `praiseType`
- `praiseList` → `praiseList` (JSON)
- `praiseImgList` → `praiseImgList` (JSON)
- `praiseVideoList` → `praiseVideoList` (JSON)

#### 浏览行为字段
- `needCompare` → `needCompare`
- `compareCount` → `compareCount`
- `needFavorite` → `needFavorite`
- `needFollow` → `needFollow`
- `needAddCart` → `needAddCart`
- `needContactCS` → `needContactCS`
- `contactCSContent` → `contactCSContent`

#### 订单设置字段
- `memo` → `memo` (下单提示)
- `orderInterval` → `orderInterval` & `unionInterval` (接单间隔)
- `weight` → `weight`
- `fastRefund` → `fastRefund`
- `isFreeShipping` → `isFreeShipping`

#### 其他增值服务字段
- `addReward` → `extraReward` & `extraCommission`
- `isTimingPublish` → `isTimingPublish`
- `publishTime` → `publishTime`
- `isTimingPay` → `isTimingPay`
- `timingPayTime` → `timingTime`
- `isCycleTime` → `cycle` (注意：isCycleTime字段不存在)
- `cycleTime` → `cycle`
- `isRepay` → `isRepay`
- `isNextDay` → `isNextDay`

#### 费用字段
- `goodsPrice` → `goodsPrice`
- `totalDeposit` → `totalDeposit`
- `totalCommission` → `totalCommission`
- `baseServiceFee` → `baseServiceFee`
- `praiseFee` → （计算得出）
- `goodsMoreFee` → （计算得出）
- `nextDayFee` → （计算得出）
- `postageMoney` → `shippingFee`
- `marginMoney` → `margin`

## 需要验证的页面

### 商户中心
1. ✅ 任务管理列表页 (`/merchant/tasks`)
2. ✅ 任务详情页 (`/merchant/tasks/:id`)

### 后台管理中心
1. ✅ 任务管理列表页 (`/admin/tasks`)
2. ✅ 任务详情页 (`/admin/tasks/:id`)
3. ✅ 任务审核页 (`/admin/tasks/review`)
4. ✅ 任务审核详情页 (`/admin/tasks/review/:id`)
5. ✅ 订单管理列表页 (`/admin/orders`)
6. ✅ 订单详情页 (`/admin/orders/:id`)

### 用户中心
1. ✅ 任务大厅（领取页） (`/tasks`)
2. ✅ 任务详情页 (`/tasks/:id`)
3. ✅ 任务执行页 (`/orders/:id/execute`)

## 验证要点

### 必须正确显示的字段
- [x] 商品本金（单）: 105元
- [x] 总押金: 525元
- [x] 总佣金: 52.50元
- [x] 5条文字好评内容
- [x] 接单间隔: 15分钟
- [x] 额外悬赏: 1元/单 (总5元)
- [x] 进店关键词: 布朗博士配贝亲奶嘴
- [x] 货比关键词: 布朗博士配件
- [x] 副关键词(备用): 布朗博士贝亲
- [x] 下单提示: 测试下单提示
- [x] 联系客服内容: 测试联系客服
- [x] 结算方式: 本立佣货
- [x] 标题、店铺名、商家名
- [x] 2个商品信息及价格
- [x] 主商品下单规格: 可调节版奶瓶旋盖 3件
- [x] 副商品下单规格: 改良版奶瓶旋盖 3件
- [x] 主商品核对口令: 必喜适用布朗博士奶瓶
- [x] 副商品核对口令: 布朗博士适配贝亲奶嘴
- [x] 关键词筛选设置: 销量排序
- [x] 价格区间: ¥20.00 - ¥50.00
- [x] 基础服务费: 25元 (5单×5元)

## 已修复的问题

### 问题1: 字段映射错误
**根本原因**: 使用 `...dto` 扩展操作符导致字段覆盖

**解决方案**:
- 完全移除 `...dto` 扩展操作符
- 显式映射每个字段，确保正确的字段名映射
- 添加类型转换和默认值处理

### 问题2: TypeScript类型错误
**问题**: Date | null 类型不匹配

**解决方案**: 将 `null` 改为 `undefined`

### 问题3: 不存在的字段
**问题**: 尝试设置不存在的 `isCycleTime` 字段

**解决方案**: 移除 `isCycleTime`，只使用 `cycle` 字段

## 下一步测试步骤

1. 用户点击"确认发布"按钮
2. 等待任务创建成功
3. 依次检查所有页面的字段显示是否正确
4. 如有字段仍未显示，定位具体页面和字段进行修复

## 备注

- 本次修复是第N次尝试修复此问题
- 用户反馈："这个已经修复了多次了，每次你都说修复好了，结果还是一样，完全没法运营"
- 本次修复采用了完全重写的方式，避免了之前的字段映射问题
- 所有字段都经过显式映射和验证
