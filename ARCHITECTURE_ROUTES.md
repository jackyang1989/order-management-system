# 全站架构路由图

## 项目结构概览

```
order-management-system/
├── frontend/                    # Next.js 前端应用
│   └── src/app/                # App Router 路由目录
│       ├── layout.tsx          # 全局布局
│       ├── page.tsx            # 首页
│       ├── login/              # 登录页
│       ├── register/           # 注册页
│       ├── forgot-password/    # 忘记密码
│       ├── help/               # 帮助中心
│       ├── invite/             # 邀请页
│       ├── messages/           # 消息中心
│       ├── pay/                # 支付页
│       ├── admin/              # 后台管理系统
│       ├── merchant/           # 商户中心
│       ├── profile/            # 用户中心
│       ├── tasks/              # 任务中心（买手）
│       └── orders/             # 订单中心（买手）
├── backend/                     # Node.js 后端应用
└── docs/                        # 文档
```

---

## 一、后台管理系统 (/admin)

### 1.1 认证
- `/admin/login` - 管理员登录

### 1.2 仪表盘
- `/admin/dashboard` - 数据统计概览

### 1.3 用户管理 (/admin/users)
- `/admin/users` - 买手列表
- `/admin/users/[id]` - 买手详情
- `/admin/users/accounts` - 买号管理
- `/admin/users/balance` - 余额记录

### 1.4 商家管理 (/admin/merchants)
- `/admin/merchants` - 商家列表
- `/admin/merchants/[id]` - 商家详情
- `/admin/merchants/balance` - 商家余额

### 1.5 任务管理 (/admin/tasks)
- `/admin/tasks` - 任务列表
- `/admin/tasks/reviews` - 任务审核

### 1.6 订单管理 (/admin/orders)
- `/admin/orders` - 订单列表

### 1.7 财务管理 (/admin/finance)
- `/admin/finance/recharge` - 充值记录
- `/admin/finance/vip` - VIP会员记录
- `/admin/finance/bank` - 银行卡审核

### 1.8 系统设置 (/admin/system)
- `/admin/system/params` - 基础参数
- `/admin/system/commission` - 佣金比例设置
- `/admin/system/vip` - VIP等级设置
- `/admin/system/platforms` - 平台管理
- `/admin/system/entry-types` - 任务入口类型
- `/admin/system/banners` - 轮播图管理
- `/admin/system/sensitive` - 敏感词管理
- `/admin/system/deliveries` - 快递管理
- `/admin/system/api` - API配置

### 1.9 公告管理 (/admin/notice)
- `/admin/notice` - 公告列表

### 1.10 帮助中心 (/admin/help)
- `/admin/help` - 帮助文章

### 1.11 消息管理 (/admin/messages)
- `/admin/messages` - 消息列表

### 1.12 权限管理 (/admin/permission)
- `/admin/permission/admin` - 管理员管理
- `/admin/permission/role` - 角色管理
- `/admin/permission/menu` - 菜单管理

### 1.13 黑名单管理 (/admin/blacklist)
- `/admin/blacklist` - 黑名单列表

### 1.14 提现管理 (/admin/withdrawals)
- `/admin/withdrawals` - 提现审核

### 1.15 店铺管理 (/admin/shops)
- `/admin/shops` - 店铺列表

### 1.16 系统工具 (/admin/tools)
- `/admin/tools/logs` - 操作日志
- `/admin/tools/cache` - 缓存管理
- `/admin/tools/backup` - 数据备份

---

## 二、商户中心 (/merchant)

### 2.1 认证
- `/merchant/login` - 商户登录

### 2.2 仪表盘
- `/merchant/dashboard` - 商户概览

### 2.3 任务管理 (/merchant/tasks)
- `/merchant/tasks` - 任务列表
- `/merchant/tasks/new` - 发布新任务
  - `/merchant/tasks/new/_components/Step1BasicInfo` - 第一步：基础信息
  - `/merchant/tasks/new/_components/Step2ValueAdded` - 第二步：增值服务
  - `/merchant/tasks/new/_components/Step3Review` - 第三步：确认发布
- `/merchant/tasks/[id]` - 任务详情

### 2.4 商品管理 (/merchant/goods)
- `/merchant/goods` - 商品列表
- `/merchant/goods/new` - 新增商品
- `/merchant/goods/edit/[id]` - 编辑商品

### 2.5 关键词库 (/merchant/keywords)
- `/merchant/keywords` - 关键词列表
- `/merchant/keywords/[id]` - 关键词详情

### 2.6 店铺管理 (/merchant/shops)
- `/merchant/shops` - 店铺列表
- `/merchant/shops/new` - 新增店铺
- `/merchant/shops/edit/[id]` - 编辑店铺

### 2.7 订单管理 (/merchant/orders)
- `/merchant/orders` - 订单列表

### 2.8 评价管理 (/merchant/reviews)
- `/merchant/reviews` - 评价列表
- `/merchant/reviews/create` - 创建评价
- `/merchant/reviews/pay` - 评价支付

### 2.9 银行卡管理 (/merchant/bank)
- `/merchant/bank` - 银行卡列表

### 2.10 钱包管理 (/merchant/wallet)
- `/merchant/wallet` - 钱包概览

### 2.11 VIP管理 (/merchant/vip)
- `/merchant/vip` - VIP等级

### 2.12 黑名单管理 (/merchant/blacklist)
- `/merchant/blacklist` - 黑名单列表

### 2.13 推荐管理 (/merchant/recommend)
- `/merchant/recommend` - 推荐配置

### 2.14 帮助中心 (/merchant/help)
- `/merchant/help` - 帮助文章

### 2.15 设置 (/merchant/setting)
- `/merchant/setting` - 账户设置

---

## 三、用户中心 (/profile)

### 3.1 个人中心
- `/profile` - 用户概览

### 3.2 买号管理 (/profile/buyer-accounts)
- `/profile/buyer-accounts` - 买号列表
- `/profile/buyer-accounts/edit/[id]` - 编辑买号

### 3.3 账户绑定 (/profile/bind)
- `/profile/bind` - 绑定账户

### 3.4 提现管理 (/profile/withdraw)
- `/profile/withdraw` - 提现申请

### 3.5 支付方式 (/profile/payment)
- `/profile/payment` - 支付方式管理

### 3.6 邀请管理 (/profile/invite)
- `/profile/invite` - 邀请链接

### 3.7 评价管理 (/profile/reviews)
- `/profile/reviews` - 评价列表
- `/profile/reviews/[id]` - 评价详情

### 3.8 记录 (/profile/records)
- `/profile/records` - 交易记录

### 3.9 VIP管理 (/profile/vip)
- `/profile/vip` - VIP等级

### 3.10 转换 (/profile/convert)
- `/profile/convert` - 身份转换

### 3.11 设置 (/profile/settings)
- `/profile/settings` - 账户设置

---

## 四、任务中心 (/tasks) - 买手端

### 4.1 任务列表
- `/tasks` - 任务列表

### 4.2 任务详情
- `/tasks/[id]` - 任务详情（领取页）

### 4.3 继续任务
- `/tasks/continue` - 继续之前的任务

---

## 五、订单中心 (/orders) - 买手端

### 5.1 订单列表
- `/orders` - 订单列表

### 5.2 待支付订单
- `/orders/pending` - 待支付订单

### 5.3 订单详情
- `/orders/[id]` - 订单详情
- `/orders/[id]/execute` - 执行任务
- `/orders/[id]/receive` - 确认收货
- `/orders/[id]/presale-payment` - 预售支付

### 5.4 额外审核
- `/orders/additional-review/[id]` - 额外审核

---

## 六、公共页面

### 6.1 认证
- `/login` - 用户登录
- `/register` - 用户注册
- `/forgot-password` - 忘记密码

### 6.2 其他
- `/help` - 帮助中心
- `/invite` - 邀请页面
- `/messages` - 消息中心
- `/pay` - 支付页面

---

## 路由权限矩阵

| 路由前缀 | 角色 | 认证 | 说明 |
|---------|------|------|------|
| `/admin` | 管理员 | ✅ | 后台管理系统 |
| `/merchant` | 商户 | ✅ | 商户中心 |
| `/profile` | 买手 | ✅ | 用户中心 |
| `/tasks` | 买手 | ✅ | 任务中心 |
| `/orders` | 买手 | ✅ | 订单中心 |
| `/login` | 所有 | ❌ | 登录页 |
| `/register` | 所有 | ❌ | 注册页 |
| `/help` | 所有 | ❌ | 帮助中心 |
| `/invite` | 所有 | ❌ | 邀请页 |

---

## 数据流向

```
┌─────────────────────────────────────────────────────────────┐
│                     用户访问流程                              │
└─────────────────────────────────────────────────────────────┘

1. 首次访问
   / → /login (未认证) 或 /admin/dashboard (已认证)

2. 商户发布任务流程
   /merchant/tasks 
   → /merchant/tasks/new (Step1: 基础信息)
   → /merchant/tasks/new (Step2: 增值服务)
   → /merchant/tasks/new (Step3: 确认发布)
   → /merchant/tasks (任务列表)
   → /merchant/tasks/[id] (任务详情)

3. 买手领取任务流程
   /tasks (任务列表)
   → /tasks/[id] (任务详情)
   → /orders/[id]/execute (执行任务)
   → /orders/[id]/receive (确认收货)
   → /orders/[id] (订单详情)

4. 管理员审核流程
   /admin/tasks (任务列表)
   → /admin/tasks/reviews (审核任务)
   → /admin/tasks (返回列表)

5. 用户个人中心流程
   /profile (概览)
   → /profile/buyer-accounts (买号管理)
   → /profile/withdraw (提现)
   → /profile/reviews (评价)
```

---

## 关键路由特性

### 动态路由
- `[id]` - 用于详情页、编辑页等
- `[id]/execute` - 嵌套动态路由

### 布局继承
- `/admin/layout.tsx` - 后台管理布局
- `/merchant/layout.tsx` - 商户中心布局
- `/profile/layout.tsx` - 用户中心布局

### 认证保护
- 所有 `/admin/*` 路由需要管理员权限
- 所有 `/merchant/*` 路由需要商户权限
- 所有 `/profile/*` 路由需要买手权限
- 所有 `/tasks/*` 和 `/orders/*` 路由需要买手权限

---

## API 端点对应关系

| 前端路由 | 主要 API 端点 |
|---------|-------------|
| `/admin/tasks` | `GET /admin/tasks` |
| `/admin/tasks/[id]` | `GET /tasks/:id` |
| `/merchant/tasks/new` | `POST /tasks` |
| `/merchant/tasks/[id]` | `GET /tasks/:id`, `PUT /tasks/:id` |
| `/tasks` | `GET /tasks` |
| `/tasks/[id]` | `GET /tasks/:id` |
| `/orders` | `GET /orders` |
| `/orders/[id]/execute` | `POST /orders/:id/execute` |
| `/profile/buyer-accounts` | `GET /buyer-accounts` |
| `/admin/users` | `GET /admin/users` |
| `/admin/merchants` | `GET /admin/merchants` |

