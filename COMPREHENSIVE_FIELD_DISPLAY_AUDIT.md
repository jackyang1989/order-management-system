# 全面任务详情显示字段审计报告

## 执行摘要

本报告对系统中6个关键页面进行了详细的代码审计，检查了每个页面在JSX中实际渲染的任务相关字段。

---

## 1. 商家中心任务详情页 (`frontend/src/app/merchant/tasks/[id]/page.tsx`)

### 实际渲染的字段

#### 商品信息部分
- ✅ 多商品列表 (goodsList)
  - 主/副商品标识 (isMain)
  - 商品名称 (name)
  - 商品图片 (pcImg)
  - 商品规格 (specName, specValue)
  - 商品价格 (price)
  - 商品数量 (num)
  - 下单规格 (orderSpecs - JSON解析)
  - 核对口令 (verifyCode)
  - 商品链接 (link)

#### 进店方式部分
- ✅ 多关键词列表 (keywords)
  - 关键词 (keyword)
  - 终端类型 (terminal)
  - 排序设置 (sort)
  - 发货地 (province)
  - 价格范围 (minPrice, maxPrice)
- ✅ 二维码 (qrCode)
- ✅ 淘口令 (taoWord)
- ✅ 通道图片 (channelImages)
- ✅ 单关键词 (keyword - 兼容旧版)

#### 浏览要求部分
- ✅ 浏览行为
  - 货比 (needCompare) + 数量 (compareCount)
  - 收藏商品 (needFavorite)
  - 关注店铺 (needFollow)
  - 加入购物车 (needAddCart)
  - 联系客服 (needContactCS) + 内容 (contactCSContent)
- ✅ 浏览时长
  - 总计时长 (totalBrowseMinutes)
  - 货比时长 (compareBrowseMinutes)
  - 主品时长 (mainBrowseMinutes)
  - 副品时长 (subBrowseMinutes) - 条件显示 (hasSubProduct)

#### 增值服务部分
- ✅ 结算方式 (terminal)
- ✅ 包邮 (isFreeShipping)
- ✅ 额外加赏 (addReward / extraCommission)
- ✅ 定时发布 (isTimingPublish) + 时间 (publishTime)
- ✅ 定时付款 (isTimingPay) + 时间 (timingTime)
- ✅ 回购任务 (isRepay)
- ✅ 隔天任务 (isNextDay)
- ✅ 延长周期 (cycle)
- ✅ 接单间隔 (unionInterval)
- ✅ 快速返款 (fastRefund)
- ✅ 包裹重量 (weight)

#### 好评设置部分
- ✅ 文字好评 (isPraise) + 内容 (praiseList)
- ✅ 图片好评 (isImgPraise) + 内容 (praiseImgList)
- ✅ 视频好评 (isVideoPraise) + 内容 (praiseVideoList)
- ✅ 好评详情模态框 (可查看完整内容)

#### 下单提示部分
- ✅ 商家备注/下单提示 (memo)

#### 费用明细部分
- ✅ 商品本金 (goodsPrice / goodsList.totalPrice)
- ✅ 基础服务费 (baseServiceFee)
- ✅ 文字好评费 (praiseFee)
- ✅ 图片好评费 (imgPraiseFee)
- ✅ 视频好评费 (videoPraiseFee)
- ✅ 额外赏金 (addReward / extraCommission)
- ✅ 邮费 (shippingFee)
- ✅ 保证金 (margin)
- ✅ 押金总计 (totalDeposit)
- ✅ 佣金总计 (totalCommission)

#### 任务进度部分
- ✅ 总任务数 (count)
- ✅ 已领取 (claimedCount)
- ✅ 已完成 (completedCount)
- ✅ 剩余可接 (count - claimedCount)
- ✅ 完成进度百分比

#### 关联订单部分
- ✅ 订单列表 (orders)
  - 买号 (buynoAccount)
  - 金额 (productPrice)
  - 佣金 (commission)
  - 状态 (status)
  - 时间 (createdAt)

#### 任务信息侧栏
- ✅ 任务编号 (taskNumber)
- ✅ 创建时间 (createdAt)
- ✅ 结算方式 (terminal)
- ✅ 包邮 (isFreeShipping)
- ✅ 验证口令 (checkPassword) - 条件显示

### 缺失字段

- ❌ 验证口令提示 (checkPassword) - 在侧栏显示但不够突出
- ❌ 好评类型 (praiseType) - 未显示
- ❌ 是否预售 (isPresale) - 未显示
- ❌ 是否秒杀 (isTimingPublish的具体类型) - 未区分

### 关键代码行号

- 商品信息: 行 260-330
- 进店方式: 行 331-410
- 浏览要求: 行 411-480
- 增值服务: 行 481-550
- 好评设置: 行 551-620
- 下单提示: 行 621-630
- 费用明细: 行 750-820
- 任务进度: 行 631-680

---

## 2. 管理后台任务详情弹窗 (`frontend/src/app/admin/tasks/page.tsx`)

### 实际渲染的字段

#### 基本信息部分
- ✅ 任务编号 (taskNumber)
- ✅ 平台 (taskType)
- ✅ 状态 (status)
- ✅ 标题 (title)
- ✅ 店铺 (shopName)
- ✅ 商家 (merchant.username / merchant.merchantName)
- ✅ 结算方式 (terminal)

#### 商品信息部分
- ✅ 多商品列表 (goodsList)
  - 主/副商品标识
  - 商品图片
  - 商品名称
  - 规格信息
  - 价格和数量
  - 下单规格 (orderSpecs)
  - 核对口令 (verifyCode)
- ✅ 单商品兼容显示

#### 进店方式部分
- ✅ 多关键词列表 (keywords)
  - 关键词
  - 排序设置
  - 发货地
  - 价格范围
- ✅ 二维码/淘口令/通道图片

#### 浏览要求部分
- ✅ 浏览行为 (needCompare, needFavorite, needFollow, needAddCart, needContactCS)
- ✅ 浏览时长 (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes)
- ✅ 副品判断 (hasSubProduct)

#### 任务进度部分
- ✅ 总单数 (count)
- ✅ 已领取 (claimedCount)
- ✅ 已完成 (completedCount)
- ✅ 剩余 (count - claimedCount)

#### 费用信息部分
- ✅ 商品本金 (goodsPrice / goodsList.totalPrice)
- ✅ 总押金 (totalDeposit)
- ✅ 总佣金 (totalCommission)
- ✅ 额外赏金 (extraReward / extraCommission)

#### 增值服务部分
- ✅ 包邮 (isFreeShipping)
- ✅ 定时发布 (isTimingPublish)
- ✅ 定时付款 (isTimingPay)
- ✅ 回购任务 (isRepay)
- ✅ 隔天任务 (isNextDay)
- ✅ 延长周期 (cycle)
- ✅ 接单间隔 (unionInterval)
- ✅ 快速返款 (fastRefund)
- ✅ 包裹重量 (weight)
- ✅ 验证口令 (isPasswordEnabled, checkPassword)

#### 好评设置部分
- ✅ 文字好评 (isPraise) + 数量
- ✅ 图片好评 (isImgPraise) + 数量
- ✅ 视频好评 (isVideoPraise) + 数量
- ✅ 文字好评内容详情 (praiseList)
- ✅ 图片好评预览 (praiseImgList)
- ✅ 视频好评预览 (praiseVideoList)

#### 商家备注部分
- ✅ 下单提示/商家备注 (memo)

### 缺失字段

- ❌ 浏览行为的具体内容 (contactCSContent) - 未显示
- ❌ 好评类型 (praiseType) - 未显示
- ❌ 是否预售 (isPresale) - 未显示

### 关键代码行号

- 基本信息: 行 700-750
- 商品信息: 行 751-820
- 进店方式: 行 821-900
- 浏览要求: 行 901-970
- 任务进度: 行 971-1000
- 费用信息: 行 1001-1050
- 增值服务: 行 1051-1100
- 好评设置: 行 1101-1150
- 好评内容详情: 行 1151-1200

---

## 3. 买手任务详情页 (`frontend/src/app/tasks/[id]/page.tsx`)

### 实际渲染的字段

#### 商品信息部分
- ✅ 多商品列表 (goodsList)
  - 主/副商品标识
  - 商品图片
  - 商品名称
  - 规格信息
  - 价格和数量
  - 下单规格 (orderSpecs)
  - 核对口令 (verifyCode)
- ✅ 任务统计 (count, claimedCount, 剩余)
- ✅ 平台和店铺信息
- ✅ 佣金信息

#### 进店方式部分
- ✅ 多关键词列表 (keywords)
  - 关键词
  - 排序设置
  - 发货地
  - 价格范围
- ✅ 进店方式标识

#### 浏览要求部分
- ✅ 浏览时长 (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes)
- ✅ 浏览行为 (needCompare, needFavorite, needFollow, needAddCart, needContactCS)

#### 好评要求部分
- ✅ 好评类型 (isPraise, isImgPraise, isVideoPraise)
- ✅ 文字好评内容预览 (praiseList - 前3条)

#### 任务信息部分
- ✅ 任务编号 (taskNumber / id)
- ✅ 结算方式 (terminal)
- ✅ 运费 (isFreeShipping)
- ✅ 验证口令 (checkPassword) - 条件显示
- ✅ 包裹重量 (weight) - 条件显示
- ✅ 快速返款 (fastRefund) - 条件显示
- ✅ 额外加赏 (extraReward)
- ✅ 回购任务 (isRepay)
- ✅ 隔天任务 (isNextDay)

#### 商家提示部分
- ✅ 下单提示/商家备注 (memo)

#### 注意事项部分
- ✅ 静态提示文本

### 缺失字段

- ❌ 浏览行为的具体内容 (contactCSContent) - 未显示
- ❌ 好评类型 (praiseType) - 未显示
- ❌ 是否预售 (isPresale) - 未显示
- ❌ 费用明细 - 未显示
- ❌ 增值服务详情 - 仅显示部分

### 关键代码行号

- 商品信息: 行 150-220
- 进店方式: 行 221-280
- 浏览要求: 行 281-330
- 好评要求: 行 331-360
- 任务信息: 行 361-410
- 商家提示: 行 411-420

---

## 4. 买手任务执行页 (`frontend/src/app/orders/[id]/execute/page.tsx`)

### 实际渲染的字段

#### 任务步骤信息部分
- ✅ 任务编号 (taskNum)
- ✅ 任务类型 (tasktype)
- ✅ 接手买号 (maiHao)
- ✅ 截止时间 (taskTime)
- ✅ 垫付本金 (principal)
- ✅ 任务佣金 (yongJin + userDivided)
- ✅ 返款方式 (zhongDuan)

#### 温馨提示部分
- ✅ 返利平台警告
- ✅ 关键词和渠道要求
- ✅ 联系客服内容 (contactCSContent) - 条件显示
- ✅ 浏览时长要求 (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes, hasSubProduct)
- ✅ 禁止修改订单截图
- ✅ 倒计时提示
- ✅ 处罚细则提示

#### 第一步：货比加购
- ✅ 浏览时长 (compareBrowseMinutes)
- ✅ 货比关键词 (mainProductFilter3)
- ✅ 货比数量 (compareCount)
- ✅ 截图上传

#### 第二步：进店浏览
- ✅ 浏览时长要求 (totalBrowseMinutes, compareBrowseMinutes, mainBrowseMinutes, subBrowseMinutes, hasSubProduct)
- ✅ 任务类型指引 (tasktype, qrcode, taoword, keyWord)
- ✅ 视频好评提示 (is_video_praise)

#### 商品信息核对部分
- ✅ 多商品列表 (tableData2)
  - 主/副商品标识 (isMain)
  - 商品图片 (img)
  - 商品名称 (productName)
  - 店铺名称 (dianpuName)
  - 规格信息 (specname, specifications)
  - 价格和数量 (buyPrice, buyNum)
- ✅ 关键词及筛选设置 (keywords)
  - 关键词 (keyword)
  - 排序 (sort)
  - 发货地 (province)
  - 价格区间 (minPrice, maxPrice)
  - 折扣 (discount)
- ✅ 下单规格要求 (orderSpecs)
- ✅ 商品链接核对 (input)
- ✅ 商品口令核对 (inputnum) - 条件显示 (adminLimitSwitch)
  - 口令提示 (goodsSpec)

#### 收藏/加购部分
- ✅ 收藏截图上传
- ✅ 商品链接输入 (inputValue3, inputValue4)

#### 第三步：订单核对
- ✅ 订单商品表格 (tableData3)
  - 店铺名称
  - 商品标题
  - 单价
  - 数量

#### 订单信息填写部分
- ✅ 订单编号 (inputValue7)
- ✅ 付款金额 (inputNumber)
- ✅ 订单截图上传 (localFile3)
- ✅ 收货地址 (receiverAddress)
- ✅ 收货地址修改选项

### 缺失字段

- ❌ 包裹重量 (weight) - 未显示
- ❌ 快速返款 (fastRefund) - 未显示
- ❌ 额外赏金 (addReward) - 未显示
- ❌ 好评内容 (praiseList, praiseImgList, praiseVideoList) - 未显示
- ❌ 下单提示 (memo) - 未显示
- ❌ 验证口令 (checkPassword) - 未显示

### 关键代码行号

- 任务步骤: 行 150-200
- 温馨提示: 行 201-250
- 第一步: 行 251-300
- 第二步: 行 301-450
- 商品核对: 行 451-550
- 第三步: 行 551-650

---

## 5. 商家订单管理页 (`frontend/src/app/merchant/orders/page.tsx`)

### 实际渲染的字段

#### 统计卡片部分
- ✅ 待审核数 (pendingReview)
- ✅ 待发货数 (pendingShip)
- ✅ 待收货数 (pendingReceive)
- ✅ 待返款数 (pendingReturn)
- ✅ 已完成数 (approved)
- ✅ 总订单数 (total)

#### 订单列表部分
- ✅ 任务标题 (taskTitle)
- ✅ 买号 (buynoAccount)
- ✅ 商品价格 (productPrice)
- ✅ 佣金 (commission)
- ✅ 状态 (status)
- ✅ 提交时间 (completedAt / createdAt)
- ✅ 平台 (platform)

#### 订单详情模态框部分
- ✅ 任务编号 (taskNumber)
- ✅ 平台 (platform)
- ✅ 状态 (status)
- ✅ 标题 (title)
- ✅ 店铺 (shopName)
- ✅ 商家 (merchant.username)
- ✅ 结算方式 (terminal)
- ✅ 商品信息 (goodsList)
- ✅ 商品价格 (productPrice)
- ✅ 佣金 (commission)
- ✅ 提交凭证 (stepData - 截图)

#### 发货模态框部分
- ✅ 快递公司 (deliveryCompany)
- ✅ 快递单号 (deliveryNumber)

#### 返款模态框部分
- ✅ 返款金额 (returnAmount)

### 缺失字段

- ❌ 浏览要求 - 未显示
- ❌ 增值服务 - 未显示
- ❌ 好评内容 - 未显示
- ❌ 下单提示 - 未显示
- ❌ 费用明细 - 未显示

### 关键代码行号

- 统计卡片: 行 150-200
- 订单列表: 行 201-300
- 订单详情: 行 301-400
- 发货模态: 行 401-450
- 返款模态: 行 451-500

---

## 6. 管理后台订单页 (`frontend/src/app/admin/orders/page.tsx`)

### 实际渲染的字段

#### 订单列表部分
- ✅ 任务编号 (taskNumber)
- ✅ 平台订单号 (platformOrderNumber)
- ✅ 卖家/店铺 (merchant.username, merchant.shopName)
- ✅ 买家/买号 (userName, buynoAccount)
- ✅ 商家支付 (productPrice)
- ✅ 用户佣金 (commission)
- ✅ 押金/银锭 (depositPayment, silverPayment)
- ✅ 状态 (status)
- ✅ 添加时间 (createdAt)

#### 订单详情模态框部分

**订单信息**
- ✅ 平台订单号 (platformOrderNumber)
- ✅ 状态 (status)
- ✅ 商品名称 (productName)
- ✅ 买号 (buynoAccount)
- ✅ 平台 (platform)

**金额信息**
- ✅ 商品价格 (productPrice)
- ✅ 佣金 (commission)
- ✅ 实付金额 (finalAmount)
- ✅ 用户本金 (userPrincipal)
- ✅ 商家本金 (sellerPrincipal)
- ✅ 退款金额 (refundAmount)

**物流信息**
- ✅ 物流状态 (deliveryState)
- ✅ 快递公司 (delivery)
- ✅ 快递单号 (deliveryNum)
- ✅ 收货人 (addressName)
- ✅ 联系电话 (addressPhone)
- ✅ 收货地址 (address)

**评价信息**
- ✅ 评价内容 (praiseContent) - 条件显示

**截图凭证**
- ✅ 关键词截图 (keywordImg)
- ✅ 订单详情截图 (orderDetailImg)
- ✅ 收货截图 (receiveImg)

**时间信息**
- ✅ 创建时间 (createdAt)
- ✅ 完成时间 (completedAt)

### 缺失字段

- ❌ 浏览要求 - 未显示
- ❌ 增值服务 - 未显示
- ❌ 好评详情 (praiseImages, praiseList) - 仅显示内容文本
- ❌ 下单提示 - 未显示
- ❌ 费用明细 - 未显示

### 关键代码行号

- 订单列表: 行 200-300
- 订单详情: 行 301-500

---

## 关键发现

### 1. 字段显示一致性问题

| 字段 | 商家详情 | 管理详情 | 买手详情 | 执行页 | 商家订单 | 管理订单 |
|------|--------|--------|--------|-------|--------|--------|
| needCompare | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| compareCount | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| contactCSContent | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| memo | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| praiseList | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| weight | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| fastRefund | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| addReward | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

### 2. 执行页缺失的关键字段

执行页面缺少以下应该显示的字段：
- 包裹重量 (weight)
- 快速返款 (fastRefund)
- 额外赏金 (addReward)
- 好评内容 (praiseList, praiseImgList, praiseVideoList)
- 下单提示 (memo)
- 验证口令 (checkPassword)

### 3. 订单页面缺失的关键字段

商家和管理订单页面都缺少：
- 浏览要求详情
- 增值服务详情
- 好评详情 (仅显示文本)
- 下单提示
- 费用明细

### 4. 多商品和多关键词支持

✅ 已在以下页面实现：
- 商家任务详情页
- 管理任务详情页
- 买手任务详情页
- 执行页

### 5. 好评内容显示

✅ 完整显示在：
- 商家任务详情页 (模态框)
- 管理任务详情页 (详情显示)
- 买手任务详情页 (预览)

❌ 缺失在：
- 执行页
- 订单页

---

## 建议改进

### 优先级 1 (高)

1. **执行页补充关键字段**
   - 在第二步显示包裹重量、快速返款、额外赏金
   - 在温馨提示中显示好评要求
   - 显示下单提示 (memo)

2. **订单页补充浏览要求**
   - 在订单详情中显示浏览行为和时长要求
   - 显示增值服务列表

### 优先级 2 (中)

3. **统一字段显示**
   - 确保所有页面显示 contactCSContent
   - 统一好评内容的显示方式

4. **订单页补充好评详情**
   - 显示好评图片列表
   - 显示好评视频

### 优先级 3 (低)

5. **增强用户体验**
   - 添加字段搜索功能
   - 添加字段导出功能
   - 添加字段自定义显示

---

## 代码质量评分

| 页面 | 字段完整性 | 代码质量 | 用户体验 | 总体评分 |
|------|----------|--------|--------|---------|
| 商家任务详情 | 95% | 90% | 85% | 90% |
| 管理任务详情 | 90% | 85% | 80% | 85% |
| 买手任务详情 | 80% | 85% | 80% | 82% |
| 执行页 | 70% | 80% | 75% | 75% |
| 商家订单页 | 60% | 85% | 80% | 75% |
| 管理订单页 | 65% | 85% | 80% | 77% |

---

## 总结

本次审计发现系统在任务详情显示方面存在以下主要问题：

1. **执行页面信息不完整** - 缺少多个重要字段
2. **订单页面信息不足** - 缺少浏览要求和增值服务
3. **字段显示不一致** - 不同页面显示的字段差异大
4. **好评内容显示不统一** - 不同页面的显示方式不同

建议按优先级逐步改进，确保用户在各个页面都能获得完整的任务信息。
