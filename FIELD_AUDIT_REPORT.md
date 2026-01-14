# 字段显示全面审计报告

基于 TASK_TEST_CONFIG.md 中的字段要求（基础信息至增值服务设置），对所有相关页面进行审计。

## 审计标准字段清单

### 基础信息
- 平台类型 (taskType)
- 任务入口 (taskEntryType)
- 结算方式 (terminal)
- 店铺 (shopName/shopAccount)
- 任务数量 (count)

### 商品信息
- 商品名称 (name)
- 商品价格 (price)
- 购买数量 (num)
- 商品本金（单）(totalPrice)
- 下单规格 (orderSpecs)
- 核对口令 (verifyCode)

### 关键词设置
- 进店关键词 (keyword)
- 筛选排序 (sort)
- 价格区间 (minPrice/maxPrice)
- 发货地 (province)
- 货比关键词 (compareKeyword)
- 副关键词/备用关键词 (backupKeyword)

### 增值服务设置
- 物流设置：包邮 (isFreeShipping)、包裹重量 (weight)
- 下单提示 (memo)
- 浏览行为：货比 (needCompare/compareCount)、收藏商品 (needFavorite)、关注店铺 (needFollow)、加入购物车 (needAddCart)、联系客服 (needContactCS/contactCSContent)
- 浏览时长：总浏览时长 (totalBrowseMinutes)、货比浏览时长 (compareBrowseMinutes)、主商品浏览时长 (mainBrowseMinutes)、副商品浏览时长 (subBrowseMinutes)
- 好评设置：是否好评 (isPraise)、好评类型 (praiseType)、好评内容 (praiseList)、图片好评 (isImgPraise/praiseImgList)、视频好评 (isVideoPraise/praiseVideoList)
- 其他：口令验证 (isPasswordEnabled/checkPassword)、定时发布 (isTimingPublish/publishTime)、额外悬赏 (extraReward/addReward)、定时付款 (isTimingPay/timingTime)、延长周期 (cycle)、回购任务 (isRepay)、隔天任务 (isNextDay)、快速返款 (fastRefund)、接单间隔 (unionInterval)

### 费用明细
- 商品本金（单）(goodsPrice)
- 总押金 (totalDeposit)
- 邮费 (shippingFee)
- 保证金 (margin)
- 基础服务费 (baseServiceFee)
- 好评费用 (praiseFee/imgPraiseFee/videoPraiseFee)
- 额外悬赏 (extraReward)
- 总佣金 (totalCommission)

---

## 页面审计结果

### 1. 商户中心 - 任务管理列表页 (`/merchant/tasks`)

| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | taskNumber |
| 商品信息/标题 | ✅ | title |
| 商品价格 | ✅ | goodsPrice |
| 平台类型 | ✅ | taskType (图标+名称) |
| 佣金 | ✅ | totalCommission |
| 进度 | ✅ | claimedCount/count |
| 状态 | ✅ | status |
| 发布时间 | ✅ | createdAt |

**列表页显示完整**，适合列表展示的字段都已显示。

---

### 2. 商户中心 - 任务详情页 (`/merchant/tasks/[id]`)

#### 基础信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 平台类型 | ✅ | PlatformLabels[taskType] |
| 结算方式 | ✅ | TerminalLabels[terminal] |
| 店铺名称 | ✅ | shopName |
| 任务数量 | ✅ | count |
| 任务编号 | ✅ | taskNumber |

#### 商品信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品名称 | ✅ | goodsList[].name |
| 商品价格 | ✅ | goodsList[].price |
| 购买数量 | ✅ | goodsList[].num |
| 商品本金（单）| ✅ | goodsList[].totalPrice |
| 下单规格 | ✅ | goodsList[].orderSpecs (JSON解析显示) |
| 核对口令 | ✅ | goodsList[].verifyCode |
| 商品图片 | ✅ | goodsList[].pcImg |
| 商品链接 | ✅ | goodsList[].link |

#### 关键词设置
| 字段 | 状态 | 说明 |
|------|------|------|
| 进店关键词 | ✅ | keywords[].keyword |
| 筛选排序 | ✅ | keywords[].sort |
| 价格区间 | ✅ | keywords[].minPrice/maxPrice |
| 发货地 | ✅ | keywords[].province |
| 货比关键词 | ❌ | **缺失** - 需要添加 compareKeyword 显示 |
| 副关键词 | ❌ | **缺失** - 需要添加 backupKeyword 显示 |

#### 浏览要求
| 字段 | 状态 | 说明 |
|------|------|------|
| 货比 | ✅ | needCompare + compareCount |
| 收藏商品 | ✅ | needFavorite |
| 关注店铺 | ✅ | needFollow |
| 加入购物车 | ✅ | needAddCart |
| 联系客服 | ✅ | needContactCS + contactCSContent |
| 总浏览时长 | ✅ | totalBrowseMinutes |
| 货比浏览时长 | ✅ | compareBrowseMinutes |
| 主商品浏览时长 | ✅ | mainBrowseMinutes |
| 副商品浏览时长 | ✅ | subBrowseMinutes (条件显示) |

#### 增值服务
| 字段 | 状态 | 说明 |
|------|------|------|
| 包邮 | ✅ | isFreeShipping |
| 包裹重量 | ✅ | weight |
| 额外加赏 | ✅ | addReward/extraCommission |
| 定时发布 | ✅ | isTimingPublish + publishTime |
| 定时付款 | ✅ | isTimingPay + timingTime |
| 回购任务 | ✅ | isRepay |
| 隔天任务 | ✅ | isNextDay |
| 延长周期 | ✅ | cycle |
| 接单间隔 | ✅ | unionInterval |
| 快速返款 | ✅ | fastRefund |
| 验证口令 | ✅ | isPasswordEnabled + checkPassword |

#### 好评设置
| 字段 | 状态 | 说明 |
|------|------|------|
| 好评类型 | ✅ | praiseType |
| 文字好评 | ✅ | isPraise + praiseList |
| 图片好评 | ✅ | isImgPraise + praiseImgList |
| 视频好评 | ✅ | isVideoPraise + praiseVideoList |

#### 下单提示
| 字段 | 状态 | 说明 |
|------|------|------|
| 下单提示/商家备注 | ✅ | memo |

#### 费用明细
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品本金 | ✅ | 从goodsList计算 |
| 基础服务费 | ✅ | baseServiceFee |
| 文字好评费 | ✅ | praiseFee |
| 图片好评费 | ✅ | imgPraiseFee |
| 视频好评费 | ✅ | videoPraiseFee |
| 额外赏金 | ✅ | addReward/extraCommission |
| 邮费 | ✅ | shippingFee |
| 保证金 | ✅ | margin |
| 押金总计 | ✅ | totalDeposit |
| 佣金总计 | ✅ | totalCommission |

**缺失字段**: 货比关键词、副关键词/备用关键词

---

### 3. 后台管理中心 - 任务管理列表页 (`/admin/tasks`)

| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | taskNumber |
| 商家 | ✅ | merchant.username + shopName |
| 平台 | ✅ | taskType (图标) |
| 返款方式 | ✅ | terminal |
| 商品售价 | ✅ | goodsPrice |
| 已接/完成 | ✅ | claimedCount/completedCount/count |
| 邮费 | ✅ | isFreeShipping |
| 状态 | ✅ | status |
| 发布时间 | ✅ | createdAt |

**列表页显示完整**

---

### 4. 后台管理中心 - 任务详情弹窗 (`/admin/tasks` Modal)

#### 基础信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | taskNumber |
| 平台 | ✅ | PlatformLabels[taskType] |
| 状态 | ✅ | TaskStatusLabels[status] |
| 标题 | ✅ | title |
| 店铺 | ✅ | shopName |
| 商家 | ✅ | merchant.username |
| 结算方式 | ✅ | terminalLabels[terminal] |

#### 商品信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品名称 | ✅ | goodsList[].name |
| 商品价格 | ✅ | goodsList[].price |
| 购买数量 | ✅ | goodsList[].num |
| 下单规格 | ✅ | goodsList[].orderSpecs |
| 核对口令 | ✅ | goodsList[].verifyCode |
| 规格 | ✅ | goodsList[].specName/specValue |

#### 关键词设置
| 字段 | 状态 | 说明 |
|------|------|------|
| 进店关键词 | ✅ | keywords[].keyword |
| 筛选排序 | ✅ | keywords[].sort |
| 价格区间 | ✅ | keywords[].minPrice/maxPrice |
| 发货地 | ✅ | keywords[].province |
| 货比关键词 | ❌ | **缺失** |
| 副关键词 | ❌ | **缺失** |

#### 浏览要求
| 字段 | 状态 | 说明 |
|------|------|------|
| 货比 | ✅ | needCompare + compareCount |
| 收藏商品 | ✅ | needFavorite |
| 关注店铺 | ✅ | needFollow |
| 加入购物车 | ✅ | needAddCart |
| 联系客服 | ✅ | needContactCS + contactCSContent |
| 浏览时长 | ✅ | 全部4个时长字段 |

#### 增值服务
| 字段 | 状态 | 说明 |
|------|------|------|
| 包邮 | ✅ | isFreeShipping |
| 包裹重量 | ✅ | weight |
| 快速返款 | ✅ | fastRefund |
| 验证口令 | ✅ | isPasswordEnabled + checkPassword |
| 定时发布 | ✅ | isTimingPublish + publishTime |
| 定时付款 | ✅ | isTimingPay + timingTime |
| 回购任务 | ✅ | isRepay |
| 隔天任务 | ✅ | isNextDay |
| 延长周期 | ✅ | cycle |
| 接单间隔 | ✅ | unionInterval |

#### 好评设置
| 字段 | 状态 | 说明 |
|------|------|------|
| 文字好评 | ✅ | isPraise + praiseList (含内容显示) |
| 图片好评 | ✅ | isImgPraise + praiseImgList |
| 视频好评 | ✅ | isVideoPraise + praiseVideoList |

#### 费用信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品本金（单）| ✅ | 从goodsList计算 |
| 总押金 | ✅ | totalDeposit |
| 总佣金 | ✅ | totalCommission |
| 额外赏金 | ✅ | extraReward/extraCommission |
| 基础服务费 | ✅ | baseServiceFee |
| 好评费 | ✅ | praiseFee/imgPraiseFee/videoPraiseFee |
| 邮费 | ✅ | shippingFee |
| 保证金 | ✅ | margin |

#### 下单提示
| 字段 | 状态 | 说明 |
|------|------|------|
| 商家备注 | ✅ | memo |

**缺失字段**: 货比关键词、副关键词/备用关键词

---

### 5. 后台管理中心 - 订单管理页 (`/admin/orders`)

列表显示字段完整，详情弹窗包含：
- 订单信息 ✅
- 金额信息 ✅
- 物流信息 ✅
- 浏览要求 ✅ (从task对象读取)
- 增值服务 ✅ (从task对象读取)
- 好评设置 ✅ (从task对象读取)

**缺失字段**: 货比关键词、副关键词/备用关键词（需要从task关联数据中获取）

---

### 6. 用户中心 - 任务大厅/领取页 (`/tasks`)

| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | randNum |
| 平台图标 | ✅ | taskType |
| 垫付本金 | ✅ | totalPrice |
| 预计佣金 | ✅ | userReward + userDivided |

**列表页显示完整**，适合任务领取场景。

---

### 7. 用户中心 - 任务详情页 (`/tasks/[id]`)

#### 商品信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品名称 | ✅ | goodsList[].name |
| 商品价格 | ✅ | goodsList[].price |
| 购买数量 | ✅ | goodsList[].num |
| 下单规格 | ✅ | goodsList[].orderSpecs |
| 核对口令 | ✅ | goodsList[].verifyCode |
| 任务统计 | ✅ | count/claimedCount/剩余 |

#### 进店方式
| 字段 | 状态 | 说明 |
|------|------|------|
| 关键词 | ✅ | keywords[].keyword |
| 筛选排序 | ✅ | keywords[].sort |
| 价格区间 | ✅ | keywords[].minPrice/maxPrice |
| 发货地 | ✅ | keywords[].province |
| 货比关键词 | ❌ | **缺失** |
| 副关键词 | ❌ | **缺失** |

#### 浏览要求
| 字段 | 状态 | 说明 |
|------|------|------|
| 浏览时长 | ✅ | 全部4个时长字段 |
| 浏览行为 | ✅ | 货比/收藏/关注/加购/客服 |

#### 好评要求
| 字段 | 状态 | 说明 |
|------|------|------|
| 文字好评 | ✅ | isPraise |
| 图片好评 | ✅ | isImgPraise |
| 视频好评 | ✅ | isVideoPraise |

#### 任务信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | taskNumber |
| 结算方式 | ✅ | terminal |
| 运费 | ✅ | isFreeShipping |
| 验证口令 | ✅ | isPasswordEnabled + checkPassword |
| 包裹重量 | ✅ | weight |
| 快速返款 | ✅ | fastRefund |
| 额外加赏 | ✅ | extraReward |
| 回购任务 | ✅ | isRepay |
| 隔天任务 | ✅ | isNextDay |
| 接单间隔 | ✅ | unionInterval |
| 定时发布 | ✅ | isTimingPublish + publishTime |
| 定时付款 | ✅ | isTimingPay + timingTime |
| 延长周期 | ✅ | cycle |

#### 商家提示
| 字段 | 状态 | 说明 |
|------|------|------|
| 商家提示 | ✅ | memo |

**缺失字段**: 货比关键词、副关键词/备用关键词

---

### 8. 用户中心 - 任务执行页 (`/orders/[id]/execute`)

#### 任务信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 任务编号 | ✅ | taskNum |
| 任务类型 | ✅ | tasktype |
| 接手买号 | ✅ | maiHao |
| 截止时间 | ✅ | taskTime |
| 垫付本金 | ✅ | principal |
| 任务佣金 | ✅ | yongJin + userDivided |
| 返款方式 | ✅ | zhongDuan |
| 邮费 | ✅ | isFreeShipping |

#### 商品信息
| 字段 | 状态 | 说明 |
|------|------|------|
| 商品名称 | ✅ | productName |
| 店铺名称 | ✅ | dianpuName |
| 商品价格 | ✅ | buyPrice |
| 购买数量 | ✅ | buyNum |
| 规格 | ✅ | specname/specifications |
| 关键词 | ✅ | keywords[].keyword |
| 筛选设置 | ✅ | keywords[].sort/province/minPrice/maxPrice |

#### 浏览要求
| 字段 | 状态 | 说明 |
|------|------|------|
| 货比数量 | ✅ | compareCount |
| 浏览时长 | ✅ | 全部4个时长字段 |
| 联系客服内容 | ✅ | contactCSContent |

#### 增值服务提示
| 字段 | 状态 | 说明 |
|------|------|------|
| 包裹重量 | ✅ | weight |
| 快速返款 | ✅ | fastRefund |
| 好评要求 | ✅ | isPraise/isImgPraise/isVideoPraise + 内容 |
| 额外赏金 | ✅ | extraReward |
| 下单提示 | ✅ | memo |
| 验证口令 | ✅ | checkPassword |

**缺失字段**: 货比关键词、副关键词/备用关键词（在货比步骤中使用 mainProductFilter3/mainProductFilter4）

---

## 总结

### 全局缺失字段

以下字段在多个页面中缺失：

1. **货比关键词 (compareKeyword)** - 在关键词设置中应该单独显示
2. **副关键词/备用关键词 (backupKeyword)** - 在关键词设置中应该单独显示

### 需要修复的页面

| 页面 | 缺失字段 |
|------|----------|
| 商户中心任务详情页 | compareKeyword, backupKeyword |
| 后台任务详情弹窗 | compareKeyword, backupKeyword |
| 后台订单详情弹窗 | compareKeyword, backupKeyword |
| 用户任务详情页 | compareKeyword, backupKeyword |
| 用户任务执行页 | 已有 mainProductFilter3/mainProductFilter4，但命名不一致 |

### 已完整显示的字段

- ✅ 基础信息（平台、结算方式、店铺、任务数量）
- ✅ 商品信息（名称、价格、数量、本金、下单规格、核对口令）
- ✅ 进店关键词及筛选设置
- ✅ 浏览要求（货比、收藏、关注、加购、客服、时长）
- ✅ 增值服务（包邮、重量、快速返款、口令验证、定时发布/付款、回购、隔天、延长周期、接单间隔、额外赏金）
- ✅ 好评设置（文字/图片/视频好评及内容）
- ✅ 下单提示/商家备注
- ✅ 费用明细（本金、押金、佣金、各项费用）

### 建议修复优先级

1. **高优先级**: 添加货比关键词和副关键词显示（影响用户找商品）
2. **中优先级**: 统一字段命名（如 mainProductFilter3 → compareKeyword）
