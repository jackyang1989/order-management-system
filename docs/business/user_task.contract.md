# user_task 业务事实契约 (Business Contract)

> **版本**: v1.0
> **冻结日期**: 2026-01-04
> **数据来源**: 原版数据库 `tfkz_user_task` 表
> **约束级别**: LOCKED - 任何修改必须先更新此文档

---

## 表说明

买手订单表，存储买手领取任务后的订单信息、执行进度、截图上传、返款状态等。

---

## 字段契约

| 字段名 | 类型 | 必填 | 历史字段 | 业务语义 | 可修改端 | 备注 |
|--------|------|------|----------|----------|----------|------|
| `id` | int(11) | ✅ | ❌ | 主键ID | 系统 | 自增 |
| `user_id` | int(11) | ✅ | ❌ | 买手ID | 系统 | 关联 users.id |
| `seller_id` | int(11) | ✅ | ❌ | 商户ID | 系统 | 关联 seller.id |
| `shop_id` | int(11) | ✅ | ❌ | 店铺ID | 系统 | 关联 shop.id |
| `seller_task_id` | int(11) | ✅ | ❌ | 商家任务ID | 系统 | 关联 seller_task.id |
| `task_number` | varchar(100) | ✅ | ❌ | 任务编号 | 系统 | 格式: 主任务编号-时间戳 |
| `goods_id` | varchar(200) | ✅ | ⚠️ v1 | 商品ID | 系统 | v1=JSON数组, v2=空 |
| `goods_unit_price` | varchar(200) | ✅ | ⚠️ v1 | 商品单价 | 系统 | v1=JSON数组, v2=空 |
| `goods_num` | varchar(200) | ✅ | ⚠️ v1 | 商品数量 | 系统 | v1=JSON数组, v2=空 |
| `user_buyno_id` | int(11) | ✅ | ❌ | 买号ID | 买手 | 关联 user_buyno.id |
| `user_buyno_wangwang` | varchar(100) | ✅ | ❌ | 买号(旺旺) | 买手 | 淘宝账号名 |
| `principal` | decimal(12,2) | ✅ | ❌ | 本金 | 系统 | 任务商品总金额 |
| `commission` | decimal(12,2) | ✅ | ❌ | 佣金 | 系统 | 买手可获得佣金 |
| `user_principal` | decimal(12,2) | ✅ | ❌ | 买家自填本金 | 买手 | 买手填写的实付金额 |
| `seller_principal` | decimal(12,2) | ✅ | ❌ | 商家确认返款金额 | 后台/商家 | 审核确认的返款金额 |
| `terminal` | tinyint(1) | ✅ | ❌ | 做任务终端 | 系统 | 1=PC端 2=手机端 |
| `delivery` | varchar(100) | ✅ | ❌ | 快递公司 | 后台/商家 | 快递公司名称 |
| `delivery_status` | int(11) | ✅ | ❌ | 物流需求 | 系统 | 0=要发货 1=无需物流 |
| `delivery_num` | varchar(100) | ✅ | ❌ | 快递单号 | 后台/商家 | |
| `delivery_state` | int(11) | ✅ | ❌ | **发货状态** | 后台/商家/系统 | 见状态机定义 |
| `delivery_time` | int(11) | ✅ | ❌ | 发货时间 | 后台/商家 | 时间戳 |
| `sign_for_time` | int(11) | ✅ | ❌ | 签收时间 | 系统 | 时间戳 |
| `create_time` | int(11) | ✅ | ❌ | 创建时间 | 系统 | 时间戳 |
| `update_time` | int(11) | ✅ | ❌ | 修改时间 | 系统 | 时间戳 |
| `delete_time` | int(11) | ✅ | ❌ | 删除时间 | 系统 | 软删除标记 |
| `cancel_time` | int(11) | ❌ | ❌ | 取消时间 | 系统 | 时间戳 |
| `state` | int(11) | ✅ | ❌ | **订单状态** | 后台/商家/系统 | 见状态机定义 |
| `keywordimg` | varchar(300) | ❌ | ❌ | 搜索关键词截图 | 买手 | 步骤1截图 |
| `chatimg` | varchar(300) | ❌ | ❌ | 聊天截图 | 买手 | 步骤1截图 |
| `else_link1` | varchar(300) | ❌ | ❌ | 其他地址1 | 买手 | 浏览商品链接 |
| `else_link2` | varchar(300) | ❌ | ❌ | 其他地址2 | 买手 | 浏览商品链接 |
| `table_order_id` | varchar(300) | ✅ | ❌ | 淘宝订单号 | 买手 | 买手自填淘宝订单号 |
| `consignee` | varchar(300) | ❌ | ❌ | 收货人 | 买手 | 买手自填 |
| `order_detail_img` | varchar(500) | ❌ | ❌ | 订单详情截图 | 买手 | 淘宝订单付款截图 |
| `high_praise_img` | varchar(300) | ❌ | ❌ | 好评截图 | 买手 | 确认收货后好评截图 |
| `complete_time` | int(10) | ❌ | ❌ | 完成时间 | 系统 | 时间戳 |
| `address` | varchar(400) | ✅ | ❌ | 收货地址 | 买手 | 买手收货地址 |
| `shipping_address` | text | ✅ | ❌ | 商家发货地址 | 系统 | 冗余自seller_task |
| `shop_name` | varchar(100) | ❌ | ❌ | 店铺名 | 系统 | 冗余字段 |
| `task_type` | varchar(300) | ✅ | ❌ | 任务类型 | 系统 | 1=普通 2=隔天 3=定时付款 |
| `deltask_type` | varchar(10) | ❌ | ❌ | 取消类型 | 系统 | 1=自动取消 2=买家放弃 3=已取消 |
| `ending_time` | varchar(300) | ✅ | ❌ | 自动取消时间 | 系统 | 超时自动取消时间戳 |
| `task_step` | varchar(300) | ✅ | ❌ | 当前步骤 | 系统 | 1=未到第3步 3=已到第3步 |
| `user_divided` | varchar(200) | ✅ | ❌ | 买手增值分成 | 系统 | 单笔分成金额 |
| `addressname` | varchar(300) | ✅ | ❌ | 收货人姓名 | 买手 | |
| `addressphone` | varchar(11) | ✅ | ❌ | 收货人手机号 | 买手 | |
| `cancel_reason` | varchar(300) | ❌ | ❌ | 取消原因 | 买手/系统 | |
| `upload_order_time` | varchar(30) | ✅ | ❌ | 上传订单时间 | 系统 | 时间戳字符串 |
| `platform_refund_time` | int(11) | ✅ | ❌ | 平台返款时间 | 后台 | 商家返款给买手时间 |
| `step_two_complete` | int(11) | ✅ | ❌ | 第2步完成时间 | 系统 | 时间戳 |
| `text_praise` | text | ❌ | ❌ | 文字好评 | 系统 | JSON格式好评内容 |
| `img_praise` | text | ❌ | ❌ | 图片好评 | 买手 | 好评图片URL |
| `video_praise` | text | ❌ | ❌ | 视频好评 | 买手 | 好评视频URL |
| `high_praise_time` | int(11) | ✅ | ❌ | 好评上传时间 | 系统 | 确认收货时间 |
| `key_id` | int(10) | ✅ | ❌ | 关键词ID | 系统 | 关联 task_word.id |
| `key` | varchar(200) | ❌ | ❌ | 关键词 | 系统 | 冗余存储关键词 |
| `ids` | varchar(200) | ❌ | ❌ | 好评ID集合 | 系统 | JSON数组,关联praise表 |
| `fahuo_time` | int(11) | ✅ | ❌ | 72小时自动发货时间 | 系统 | 时间戳 |
| `cancel_remarks` | text | ❌ | ❌ | 取消备注 | 后台 | |
| `is_shengji` | tinyint(2) | ✅ | ⚠️ | **版本标识** | 系统 | 1=v1版本 2=v2版本 |
| `is_zp` | tinyint(1) | ✅ | ❌ | 是否已追评 | 系统 | 0=未追评 1=已追评 |
| `is_ys` | varchar(32) | ❌ | ❌ | **是否预售订单** | 系统 | 继承自seller_task |
| `ys_time` | varchar(32) | ❌ | ❌ | 预售时间 | 系统 | 时间戳字符串 |
| `yf_price` | varchar(32) | ❌ | ❌ | **预付款** | 买手/后台 | 预售订单预付金额 |
| `wk_price` | varchar(32) | ❌ | ❌ | **尾款** | 买手/后台 | 预售订单尾款金额 |
| `ys_fee` | varchar(32) | ❌ | ❌ | 预售服务费 | 系统 | |
| `code` | varchar(32) | ❌ | ❌ | 快递站点/发货仓编码 | 系统 | |

---

## 状态机定义

### 订单状态 (state)

```
0 (进行中) ─────────────────────────────────────────────────────────────────┐
     │                                                                       │
     ├──▶ [买手完成步骤] ──▶ 3 (待发货) ──▶ [商家发货] ──▶ 4 (待收货)         │
     │                            │                           │              │
     │                            │                           ▼              │
     │                            │                    [买手确认收货]         │
     │                            │                           │              │
     │                            ▼                           ▼              │
     │                     5 (待返款) ◀──────────────────────┘              │
     │                            │                                          │
     │                            ▼ [商家/后台返款]                           │
     │                     6 (待确认返款) ──▶ [买手确认] ──▶ 1 (已完成)        │
     │                                                                       │
     └──▶ [取消] ──▶ 2 (已取消)                                              │
```

| 状态值 | 状态名 | 业务含义 | 允许的前置状态 | 触发角色 |
|--------|--------|----------|---------------|----------|
| 0 | 进行中 | 买手正在执行任务步骤 | (初始) | 系统 |
| 1 | 已完成 | 订单全流程完成 | 6 | 买手/系统 |
| 2 | 已取消 | 订单被取消 | 0,3 | 买手/系统/后台 |
| 3 | 待发货 | 等待商家发货 | 0 | 系统 |
| 4 | 待收货 | 已发货等待收货 | 3 | 商家/后台 |
| 5 | 待返款 | 等待商家返款 | 3,4 | 买手/系统 |
| 6 | 待确认返款 | 商家已返款待买手确认 | 5 | 后台/商家 |

### 发货状态 (delivery_state)

```
0 (未发货) ──▶ 1 (已录入单号待发货) ──▶ 2 (已发货) ──▶ 3 (已签收)
```

| 状态值 | 状态名 | 业务含义 | 触发角色 |
|--------|--------|----------|----------|
| 0 | 未发货 | 初始状态 | 系统 |
| 1 | 已录入单号待发货 | 已填写快递单号 | 商家/后台 |
| 2 | 已发货 | 快递已揽收 | 商家/后台 |
| 3 | 已签收 | 买手已签收 | 买手/系统 |

---

## 任务步骤流程 (task_step)

| 步骤 | 买手操作 | 需上传内容 | 对应字段 |
|------|---------|-----------|----------|
| 1 | 搜索关键词+货比三家 | 关键词截图、聊天截图 | keywordimg, chatimg |
| 2 | 下单付款 | 淘宝订单号、订单详情截图 | table_order_id, order_detail_img |
| 3 | 确认收货+好评 | 好评截图、好评内容 | high_praise_img, text_praise |

---

## 关联表

- `seller_task`: 商家任务表 (seller_task_id)
- `users`: 买手用户表 (user_id)
- `seller`: 商家表 (seller_id)
- `shop`: 店铺表 (shop_id)
- `user_buyno`: 买号表 (user_buyno_id)
- `task_word`: 关键词表 (key_id)
- `seller_task_praise`: 好评内容表 (ids)
- `review_task`: 追评任务表 (is_zp关联)

---

## 版本兼容说明 (is_shengji)

| 版本 | goods_id/goods_num/goods_unit_price | 数据来源 |
|------|-------------------------------------|----------|
| 1 | JSON数组存储 | 直接读取user_task字段 |
| 2 | 空 | 从task_goods关联表读取 |

⚠️ **重构版必须兼容两种版本的数据读取方式**

---

## 预售订单说明 (is_ys=1)

预售订单特殊字段：
- `yf_price`: 预付款金额（买手需先付预付款）
- `wk_price`: 尾款金额（活动当天支付尾款）
- `ys_time`: 预售活动时间

预售订单返款逻辑：
1. 预付款返还时机：买手付预付款后
2. 尾款返还时机：买手付尾款后
3. 总返款 = yf_price + wk_price

---

## 后台/商家可修改字段

以下字段可被后台或商家修改：

1. `delivery` - 快递公司
2. `delivery_num` - 快递单号
3. `delivery_state` - 发货状态
4. `delivery_time` - 发货时间
5. `seller_principal` - 确认返款金额
6. `state` - 订单状态（审核/返款操作）
7. `cancel_remarks` - 取消备注

---

## 金额计算规则

- `principal` = 商品总金额（系统计算）
- `commission` = 买手佣金（系统计算）
- `user_principal` = 买手实际支付金额（买手填写）
- `seller_principal` = 商家确认返款金额（商家/后台确认）

⚠️ **返款时以 seller_principal 为准，而非 user_principal**
