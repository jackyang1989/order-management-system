# 用户中心前端深度审计报告

## 📋 审计概述

| 项目 | 原版 (tfkz.com) | 重构版 (order-management-system) |
|------|----------------|----------------------------------|
| 技术栈 | Vue 2.6 + Vant + ThinkPHP | Next.js 14 + React + NestJS |
| 平台 | 淘宝刷单/补单 | 订单管理系统 |
| 登录入口 | http://localhost:8000/mobile/login/index.html | http://localhost:6005/login |

---

## 🔴 严重缺失功能 (P0 - 必须实现)

### 1. 买号管理 - 严重缺失字段和功能

#### 原版买号表单字段 (tfkz_user_buyno)
| 字段 | 原版 | 重构版 | 状态 |
|------|------|--------|------|
| 旺旺ID (wwid) | ✅ | ❌ 缺失 | 🔴 严重 |
| 旺旺常用登陆地（省市） | ✅ | ❌ 缺失 | 🔴 严重 |
| 旺旺档案截图 (wwdaimg) | ✅ | ❌ 缺失 | 🔴 严重 |
| 淘气值截图 (ipimg) | ✅ | ❌ 缺失 | 🔴 严重 |
| 芝麻信用截图 | ✅ | ❌ 缺失 | 🔴 严重 |
| 支付宝实名认证截图 (alipayimg) | ✅ | ❌ 缺失 | 🔴 严重 |
| 支付宝认证姓名 (alipayname) | ✅ | ❌ 缺失 | 🔴 严重 |
| 收货人姓名 | ✅ | ✅ 有 | ✅ |
| 收货地址（省市区街道） | ✅ 4级选择 | ⚠️ 简化 | 🟡 需完善 |
| 收货人手机号 | ✅ | ✅ 有 | ✅ |
| 手机验证码验证 | ✅ | ❌ 缺失 | 🔴 严重 |
| 身份证截图 (idcardimg) | ✅ | ❌ 缺失 | 🟡 |
| 买号修改功能 | ✅ | ❌ 缺失 | 🔴 严重 |
| 买号星级 (star) | ✅ | ❌ 缺失 | 🟡 |
| 冻结时间 (frozen_time) | ✅ | ❌ 缺失 | 🟡 |

#### 重构版当前实现
```
平台选择: 淘宝/京东/拼多多 (简化)
账号名称
收货人
3张截图 (简化)
```

#### 原版完整实现
```
旺旺常用登陆地（省+市选择器）
旺旺ID
旺旺档案截图（含示例图）
淘气值截图（含示例图）
收货人姓名
收货地址（省+市+区+街道详细地址）
收货人手机号
手机验证码验证
支付宝认证姓名
支付宝实名认证截图
芝麻信用截图
4张截图必填验证
```

### 2. 个人中心首页 - 缺失统计数据

| 数据项 | 原版 | 重构版 | 状态 |
|--------|------|--------|------|
| 累计垫付本金 | ✅ | ❌ 缺失 | 🔴 |
| 本月剩余任务数 | ✅ (220-已做) | ❌ 缺失 | 🔴 |
| 累计完成任务数 | ✅ | ❌ 缺失 | 🔴 |
| 累计赚取银锭 | ✅ | ❌ 缺失 | 🔴 |
| 待商家发放银锭 | ✅ | ❌ 缺失 | 🔴 |
| 冻结的银锭 | ✅ | ❌ 缺失 | 🔴 |
| 银锭折现金额 | ✅ | ❌ 缺失 | 🟡 |
| 今日邀请人数 | ✅ | ⚠️ API有 | 🟢 |
| 总邀请人数 | ✅ | ⚠️ API有 | 🟢 |

### 3. 提现功能 - 逻辑差异

| 功能 | 原版 | 重构版 | 差异说明 |
|------|------|--------|----------|
| 提现类型 | 本金/银锭 | 本金/银锭 | ✅ 一致 |
| 手续费规则 | 本金<X元收Y元 | 固定5% | 🔴 逻辑不同 |
| 银锭汇率 | 按系统配置折算 | 1:1 | 🔴 逻辑不同 |
| 收款方式 | 收款码扫码/银行卡转账 | 银行卡 | 🟡 |
| 到账说明 | 2个工作日 | 1-3个工作日 | 🟢 |
| 提现密码 | 6位支付密码 | 6位支付密码 | ✅ 一致 |

**原版手续费规则**:
```
本金提现: {user_fee_max_price}元及以下收取{user_cash_free}元手续费
银锭提现: 按{reward_price}单价折算取整
```

### 4. 个人信息设置 - 缺失功能

| 功能 | 原版 | 重构版 | 状态 |
|------|------|--------|------|
| 修改手机号 | ✅ 需原手机+支付密码+新手机+验证码 | ⚠️ Mock实现 | 🔴 未对接API |
| 修改登录密码 | ✅ 需原密码+新密码+手机验证 | ⚠️ Mock实现 | 🔴 未对接API |
| 修改支付密码 | ✅ 需新密码+手机验证 | ⚠️ Mock实现 | 🔴 未对接API |
| 真实姓名显示 | ✅ | ❌ 缺失 | 🟡 |
| 头像上传 | ❌ | ❌ | - |

---

## 🟡 功能差异 (P1 - 需优化)

### 5. 任务管理页面 - 重大差异

原版路径: `/mobile/my/taskmanagement`

| 功能 | 原版 | 重构版 | 状态 |
|------|------|--------|------|
| 任务列表筛选 | 按买号/状态/日期/任务类型/终端 | ❌ 简化 | 🔴 |
| 任务状态 | 待发货/待收货/待返款/待确认返款/已完成 | ❌ 缺失 | 🔴 |
| 追评任务 | 待处理/待返款/已完成/已拒绝 | ❌ 缺失 | 🔴 |
| 订单号搜索 | ✅ | ❌ | 🔴 |
| 批量操作 | ✅ | ❌ | 🟡 |
| 任务详情展示 | 完整商品信息+店铺信息 | ❌ 简化 | 🔴 |

**原版任务状态流转**:
```
待打印快递单 → 待发货 → 待收货 → 待返款 → 待确认返款 → 已完成
                                                    ↓
                                               超时取消/客服取消/买手取消
```

### 6. 侧边栏菜单结构差异

原版侧边栏 (`public/left.html`):
```
├── 个人中心 (/my/index)
├── 帮助中心 (/helpcenter/index)
├── 银锭记录 (/money/withsilver)
├── 本佣提现 (展开)
│   ├── 本佣提现 (/money/withdrawal)
│   └── 本金记录 (/money/withdrawal?show=2)
├── 任务大厅 (/task/index)
├── 任务管理 (/my/taskmanagement)
└── 退出登录
```

重构版底部导航:
```
├── 账号信息 (展开)
│   ├── 基本信息
│   ├── 收款账户
│   ├── 买号管理
│   └── 会员VIP
├── 任务大厅 (展开)
│   ├── 继续任务
│   ├── 任务领取
│   └── 任务管理
├── 资金管理 (展开)
│   ├── 本佣提现
│   ├── 提现记录
│   ├── 本金记录
│   └── 银锭记录
└── 好友邀请 (展开)
```

### 7. 银行卡管理差异

| 功能 | 原版 | 重构版 | 状态 |
|------|------|--------|------|
| 银行选择 | 从tfkz_bank表获取 | 硬编码10家银行 | 🟡 |
| 开户支行 | ✅ 必填 | ⚠️ 可选 | 🟡 |
| 身份证号 | ✅ | ❌ | 🟡 |
| 身份证截图 | ✅ (正反面) | ❌ | 🟡 |
| 审核周期显示 | ✅ | ❌ | 🟡 |

---

## 🟢 已实现功能

### 正确实现的功能
1. ✅ 登录/注册流程
2. ✅ 邀请好友链接复制
3. ✅ 邀请统计数据
4. ✅ 银行卡基本CRUD
5. ✅ 提现基本流程
6. ✅ VIP会员购买
7. ✅ 本金/银锭余额显示
8. ✅ 退出登录

---

## 📊 数据库表结构对比

### 原版核心表 → 重构版映射

| 原版表 | 重构版表 | 对齐状态 |
|--------|----------|----------|
| tfkz_users | User | ⚠️ 字段差异 |
| tfkz_user_buyno | BuyerAccount | 🔴 严重缺失字段 |
| tfkz_user_bank | BankCard | ⚠️ 字段差异 |
| tfkz_user_cash | Withdrawal | 🟢 基本对齐 |
| tfkz_user_deposit_recharge | FundRecord | ⚠️ 需合并逻辑 |
| tfkz_user_reward_recharge | FundRecord | ⚠️ 需合并逻辑 |
| tfkz_user_invited | UserInvite | 🟢 基本对齐 |
| tfkz_user_task | Order | ⚠️ 状态值差异 |
| tfkz_seller_task | Task | ⚠️ 字段差异 |
| tfkz_system | SystemConfig | ⚠️ 需补充配置项 |

### 用户表字段对比

| 原版 tfkz_users | 重构版 User | 状态 |
|-----------------|-------------|------|
| username | username | ✅ |
| login_pwd | password | ✅ |
| pay_pwd | payPassword | ✅ |
| name | realName | ✅ |
| mobile | phone | ✅ |
| tjuser (推荐人) | invitedBy | ✅ |
| qq | qq | ❌ 缺失 |
| vip | vip | ✅ |
| vip_time | vipExpireAt | ✅ |
| balance | balance | ✅ |
| reward | silver | ✅ |
| tj_award (累计佣金) | - | ❌ 缺失 |
| tj_award_day | - | ❌ 缺失 |
| star | - | ❌ 缺失 |
| invite_code | invitationCode | ✅ |
| qualified (每月修改次数) | - | ❌ 缺失 |
| mc_task_num | - | ❌ 缺失 |
| note | - | ❌ 缺失 |
| head_img | avatar | ✅ |

### 买号表字段对比 (关键差异)

| 原版 tfkz_user_buyno | 重构版 BuyerAccount | 状态 |
|----------------------|---------------------|------|
| wwid | accountName | ⚠️ 名称不同 |
| wwpro | - | ❌ 缺失 |
| wwcity | - | ❌ 缺失 |
| wwdaimg | - | ❌ 缺失 |
| ipimg | - | ❌ 缺失 |
| addressname | receiverName | ✅ |
| addresspro | - | ❌ 需拆分 |
| addresscity | - | ❌ 需拆分 |
| addressarea | - | ❌ 需拆分 |
| addresstext | fullAddress | ⚠️ |
| addressphone | receiverPhone | ✅ |
| alipayname | - | ❌ 缺失 |
| idcardimg | - | ❌ 缺失 |
| alipayimg | - | ❌ 缺失 |
| star | - | ❌ 缺失 |
| frozen_time | - | ❌ 缺失 |
| uid | userId | ✅ |
| state | status | ✅ |

---

## 🛠 像素级复刻方案

### 第一阶段: 买号管理完善 (预估工作量: 3天)

#### 1.1 数据库改造
```sql
-- 修改 buyer_accounts 表
ALTER TABLE buyer_accounts ADD COLUMN wangwangId VARCHAR(100); -- 旺旺ID
ALTER TABLE buyer_accounts ADD COLUMN wangwangProvince VARCHAR(50); -- 旺旺常用登陆省
ALTER TABLE buyer_accounts ADD COLUMN wangwangCity VARCHAR(50); -- 旺旺常用登陆市
ALTER TABLE buyer_accounts ADD COLUMN wangwangArchiveImg VARCHAR(500); -- 旺旺档案截图
ALTER TABLE buyer_accounts ADD COLUMN taoqiValueImg VARCHAR(500); -- 淘气值截图
ALTER TABLE buyer_accounts ADD COLUMN zhimaScoreImg VARCHAR(500); -- 芝麻信用截图
ALTER TABLE buyer_accounts ADD COLUMN alipayAuthImg VARCHAR(500); -- 支付宝认证截图
ALTER TABLE buyer_accounts ADD COLUMN alipayRealName VARCHAR(50); -- 支付宝认证姓名
ALTER TABLE buyer_accounts ADD COLUMN idCardImg VARCHAR(500); -- 身份证截图
ALTER TABLE buyer_accounts ADD COLUMN addressProvince VARCHAR(50); -- 收货地址省
ALTER TABLE buyer_accounts ADD COLUMN addressCity VARCHAR(50); -- 收货地址市
ALTER TABLE buyer_accounts ADD COLUMN addressArea VARCHAR(50); -- 收货地址区
ALTER TABLE buyer_accounts ADD COLUMN addressDetail VARCHAR(200); -- 详细地址
ALTER TABLE buyer_accounts ADD COLUMN star INT DEFAULT 1; -- 账号星级
ALTER TABLE buyer_accounts ADD COLUMN frozenTime DATETIME; -- 冻结时间
ALTER TABLE buyer_accounts ADD COLUMN note TEXT; -- 备注
```

#### 1.2 前端表单改造
- 添加省市区三级联动选择器 (使用vant-area-data或类似库)
- 添加4张图片上传组件（带示例图预览）
- 添加手机验证码验证流程
- 添加详细的表单验证规则
- 添加买号修改功能

#### 1.3 API新增
```
POST /buyer-accounts/send-sms  -- 发送验证码
PUT  /buyer-accounts/:id       -- 修改买号
```

### 第二阶段: 个人中心数据统计 (预估工作量: 2天)

#### 2.1 后端API改造
```typescript
// GET /user/profile 返回增强
interface UserProfileResponse {
  // 现有字段...

  // 新增统计字段
  totalPaidPrincipal: number;      // 累计垫付本金
  monthlyRemainingTasks: number;   // 本月剩余任务数 (220-已完成)
  totalCompletedTasks: number;     // 累计完成任务数
  totalEarnedSilver: number;       // 累计赚取银锭
  pendingMerchantSilver: number;   // 待商家发放银锭
  frozenSilver: number;            // 冻结的银锭
  silverToYuan: number;            // 银锭折现金额
}
```

#### 2.2 前端Profile页面改造
- 添加完整统计磁贴展示
- 添加买号列表预览

### 第三阶段: 提现功能完善 (预估工作量: 1天)

#### 3.1 配置系统改造
```typescript
// SystemConfig增加
{
  userMinMoney: number;        // 最低提现金额
  userCashFree: number;        // 手续费金额
  userFeeMaxPrice: number;     // 免手续费阈值
  rewardPrice: number;         // 银锭单价
  userMinReward: number;       // 银锭最低提现
}
```

#### 3.2 提现逻辑改造
- 本金提现: 小于阈值收固定手续费
- 银锭提现: 按单价折算取整

### 第四阶段: 个人信息设置对接API (预估工作量: 1天)

#### 4.1 后端API
```
POST /user/change-phone        -- 修改手机号
POST /user/change-password     -- 修改登录密码
POST /user/change-pay-password -- 修改支付密码
POST /user/send-sms            -- 发送验证码
```

#### 4.2 前端对接
- 移除Mock逻辑，对接真实API
- 添加QQ显示
- 添加真实姓名显示

### 第五阶段: 任务管理完善 (预估工作量: 3天)

#### 5.1 任务状态对齐
```typescript
enum OrderStatus {
  PENDING = 0,           // 进行中
  COMPLETED = 1,         // 已完成
  CANCELLED = 2,         // 已取消
  WAIT_SHIP = 3,         // 待发货
  WAIT_RECEIVE = 4,      // 待收货
  WAIT_REFUND = 5,       // 待返款
  WAIT_CONFIRM = 6,      // 待确认返款
}
```

#### 5.2 任务管理页面
- 添加按买号筛选
- 添加按状态筛选
- 添加按日期范围筛选
- 添加按任务类型筛选
- 添加订单号搜索
- 添加追评任务Tab

---

## 📅 实施优先级

| 优先级 | 功能模块 | 预估工时 | 影响程度 |
|--------|----------|----------|----------|
| P0 | 买号管理完善 | 3天 | 核心业务 |
| P0 | 任务管理完善 | 3天 | 核心业务 |
| P1 | 个人中心统计 | 2天 | 用户体验 |
| P1 | 提现逻辑完善 | 1天 | 资金安全 |
| P2 | 个人信息API对接 | 1天 | 基础功能 |
| P2 | 银行卡管理完善 | 1天 | 辅助功能 |

**总预估工时: 11天**

---

## 📝 结论

重构版用户中心与原版存在**较大差距**，主要体现在：

1. **买号管理**: 缺失约70%的字段和验证逻辑
2. **任务管理**: 状态流转和筛选功能严重缺失
3. **个人中心**: 缺少关键统计数据展示
4. **提现功能**: 手续费逻辑与原版不一致
5. **API对接**: 多个功能仍为Mock实现

建议按照上述方案进行像素级复刻，优先完成P0级别的买号管理和任务管理功能。
