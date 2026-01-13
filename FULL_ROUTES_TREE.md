# 全站完整路由树形结构

```
order-management-system/
├── frontend/                                    # Next.js 前端应用
│   └── src/app/                                # App Router 路由目录
│       ├── layout.tsx                          # 全局布局
│       ├── page.tsx                            # 首页 (/)
│       ├── login/
│       │   └── page.tsx                        # 用户登录 (/login)
│       ├── register/
│       │   └── page.tsx                        # 用户注册 (/register)
│       ├── forgot-password/
│       │   └── page.tsx                        # 忘记密码 (/forgot-password)
│       ├── help/
│       │   └── page.tsx                        # 帮助中心 (/help)
│       ├── invite/
│       │   └── page.tsx                        # 邀请页面 (/invite)
│       ├── messages/
│       │   └── page.tsx                        # 消息中心 (/messages)
│       ├── pay/
│       │   └── page.tsx                        # 支付页面 (/pay)
│       │
│       ├── admin/                              # 后台管理系统
│       │   ├── layout.tsx                      # 后台布局
│       │   ├── login/
│       │   │   └── page.tsx                    # 管理员登录 (/admin/login)
│       │   ├── dashboard/
│       │   │   └── page.tsx                    # 仪表盘 (/admin/dashboard)
│       │   │
│       │   ├── users/                          # 用户管理
│       │   │   ├── page.tsx                    # 买手列表 (/admin/users)
│       │   │   ├── [id]/
│       │   │   │   └── page.tsx                # 买手详情 (/admin/users/[id])
│       │   │   ├── accounts/
│       │   │   │   └── page.tsx                # 买号管理 (/admin/users/accounts)
│       │   │   └── balance/
│       │   │       └── page.tsx                # 余额记录 (/admin/users/balance)
│       │   │
│       │   ├── merchants/                      # 商家管理
│       │   │   ├── page.tsx                    # 商家列表 (/admin/merchants)
│       │   │   ├── [id]/
│       │   │   │   └── page.tsx                # 商家详情 (/admin/merchants/[id])
│       │   │   └── balance/
│       │   │       └── page.tsx                # 商家余额 (/admin/merchants/balance)
│       │   │
│       │   ├── tasks/                          # 任务管理
│       │   │   ├── page.tsx                    # 任务列表 (/admin/tasks)
│       │   │   └── reviews/
│       │   │       └── page.tsx                # 任务审核 (/admin/tasks/reviews)
│       │   │
│       │   ├── orders/
│       │   │   └── page.tsx                    # 订单列表 (/admin/orders)
│       │   │
│       │   ├── finance/                        # 财务管理
│       │   │   ├── recharge/
│       │   │   │   └── page.tsx                # 充值记录 (/admin/finance/recharge)
│       │   │   ├── vip/
│       │   │   │   └── page.tsx                # VIP会员记录 (/admin/finance/vip)
│       │   │   └── bank/
│       │   │       └── page.tsx                # 银行卡审核 (/admin/finance/bank)
│       │   │
│       │   ├── system/                         # 系统设置
│       │   │   ├── params/
│       │   │   │   └── page.tsx                # 基础参数 (/admin/system/params)
│       │   │   ├── commission/
│       │   │   │   └── page.tsx                # 佣金比例设置 (/admin/system/commission)
│       │   │   ├── vip/
│       │   │   │   └── page.tsx                # VIP等级设置 (/admin/system/vip)
│       │   │   ├── platforms/
│       │   │   │   └── page.tsx                # 平台管理 (/admin/system/platforms)
│       │   │   ├── entry-types/
│       │   │   │   └── page.tsx                # 任务入口类型 (/admin/system/entry-types)
│       │   │   ├── banners/
│       │   │   │   └── page.tsx                # 轮播图管理 (/admin/system/banners)
│       │   │   ├── sensitive/
│       │   │   │   └── page.tsx                # 敏感词管理 (/admin/system/sensitive)
│       │   │   ├── deliveries/
│       │   │   │   └── page.tsx                # 快递管理 (/admin/system/deliveries)
│       │   │   └── api/
│       │   │       └── page.tsx                # API配置 (/admin/system/api)
│       │   │
│       │   ├── notice/
│       │   │   └── page.tsx                    # 公告列表 (/admin/notice)
│       │   │
│       │   ├── help/
│       │   │   └── page.tsx                    # 帮助文章 (/admin/help)
│       │   │
│       │   ├── messages/
│       │   │   └── page.tsx                    # 消息列表 (/admin/messages)
│       │   │
│       │   ├── permission/                     # 权限管理
│       │   │   ├── admin/
│       │   │   │   └── page.tsx                # 管理员管理 (/admin/permission/admin)
│       │   │   ├── role/
│       │   │   │   └── page.tsx                # 角色管理 (/admin/permission/role)
│       │   │   └── menu/
│       │   │       └── page.tsx                # 菜单管理 (/admin/permission/menu)
│       │   │
│       │   ├── blacklist/
│       │   │   └── page.tsx                    # 黑名单列表 (/admin/blacklist)
│       │   │
│       │   ├── withdrawals/
│       │   │   └── page.tsx                    # 提现审核 (/admin/withdrawals)
│       │   │
│       │   ├── shops/
│       │   │   └── page.tsx                    # 店铺列表 (/admin/shops)
│       │   │
│       │   └── tools/                          # 系统工具
│       │       ├── logs/
│       │       │   └── page.tsx                # 操作日志 (/admin/tools/logs)
│       │       ├── cache/
│       │       │   └── page.tsx                # 缓存管理 (/admin/tools/cache)
│       │       └── backup/
│       │           └── page.tsx                # 数据备份 (/admin/tools/backup)
│       │
│       ├── merchant/                           # 商户中心
│       │   ├── layout.tsx                      # 商户布局
│       │   ├── page.tsx                        # 商户首页 (/merchant)
│       │   ├── login/
│       │   │   └── page.tsx                    # 商户登录 (/merchant/login)
│       │   ├── dashboard/
│       │   │   └── page.tsx                    # 商户仪表盘 (/merchant/dashboard)
│       │   │
│       │   ├── tasks/                          # 任务管理
│       │   │   ├── page.tsx                    # 任务列表 (/merchant/tasks)
│       │   │   ├── [id]/
│       │   │   │   └── page.tsx                # 任务详情 (/merchant/tasks/[id])
│       │   │   └── new/
│       │   │       ├── page.tsx                # 发布新任务 (/merchant/tasks/new)
│       │   │       └── _components/
│       │   │           ├── Step1BasicInfo.tsx  # 第一步：基础信息
│       │   │           ├── Step2ValueAdded.tsx # 第二步：增值服务
│       │   │           ├── Step3Review.tsx     # 第三步：确认发布
│       │   │           └── types.ts            # 类型定义
│       │   │
│       │   ├── goods/                          # 商品管理
│       │   │   ├── page.tsx                    # 商品列表 (/merchant/goods)
│       │   │   ├── new/
│       │   │   │   └── page.tsx                # 新增商品 (/merchant/goods/new)
│       │   │   └── edit/
│       │   │       └── [id]/
│       │   │           └── page.tsx            # 编辑商品 (/merchant/goods/edit/[id])
│       │   │
│       │   ├── keywords/                       # 关键词库
│       │   │   ├── page.tsx                    # 关键词列表 (/merchant/keywords)
│       │   │   └── [id]/
│       │   │       └── page.tsx                # 关键词详情 (/merchant/keywords/[id])
│       │   │
│       │   ├── shops/                          # 店铺管理
│       │   │   ├── page.tsx                    # 店铺列表 (/merchant/shops)
│       │   │   ├── new/
│       │   │   │   └── page.tsx                # 新增店铺 (/merchant/shops/new)
│       │   │   └── edit/
│       │   │       └── [id]/
│       │   │           └── page.tsx            # 编辑店铺 (/merchant/shops/edit/[id])
│       │   │
│       │   ├── orders/
│       │   │   └── page.tsx                    # 订单列表 (/merchant/orders)
│       │   │
│       │   ├── reviews/                        # 评价管理
│       │   │   ├── page.tsx                    # 评价列表 (/merchant/reviews)
│       │   │   ├── create/
│       │   │   │   └── page.tsx                # 创建评价 (/merchant/reviews/create)
│       │   │   └── pay/
│       │   │       └── page.tsx                # 评价支付 (/merchant/reviews/pay)
│       │   │
│       │   ├── bank/
│       │   │   └── page.tsx                    # 银行卡列表 (/merchant/bank)
│       │   │
│       │   ├── wallet/
│       │   │   └── page.tsx                    # 钱包概览 (/merchant/wallet)
│       │   │
│       │   ├── vip/
│       │   │   └── page.tsx                    # VIP等级 (/merchant/vip)
│       │   │
│       │   ├── blacklist/
│       │   │   └── page.tsx                    # 黑名单列表 (/merchant/blacklist)
│       │   │
│       │   ├── recommend/
│       │   │   └── page.tsx                    # 推荐配置 (/merchant/recommend)
│       │   │
│       │   ├── help/
│       │   │   └── page.tsx                    # 帮助文章 (/merchant/help)
│       │   │
│       │   └── setting/
│       │       └── page.tsx                    # 账户设置 (/merchant/setting)
│       │
│       ├── profile/                            # 用户中心
│       │   ├── layout.tsx                      # 用户中心布局
│       │   ├── page.tsx                        # 用户概览 (/profile)
│       │   │
│       │   ├── buyer-accounts/                 # 买号管理
│       │   │   ├── page.tsx                    # 买号列表 (/profile/buyer-accounts)
│       │   │   └── edit/
│       │   │       └── [id]/
│       │   │           └── page.tsx            # 编辑买号 (/profile/buyer-accounts/edit/[id])
│       │   │
│       │   ├── bind/
│       │   │   └── page.tsx                    # 绑定账户 (/profile/bind)
│       │   │
│       │   ├── withdraw/
│       │   │   └── page.tsx                    # 提现申请 (/profile/withdraw)
│       │   │
│       │   ├── payment/
│       │   │   └── page.tsx                    # 支付方式管理 (/profile/payment)
│       │   │
│       │   ├── invite/
│       │   │   └── page.tsx                    # 邀请链接 (/profile/invite)
│       │   │
│       │   ├── reviews/                        # 评价管理
│       │   │   ├── page.tsx                    # 评价列表 (/profile/reviews)
│       │   │   └── [id]/
│       │   │       └── page.tsx                # 评价详情 (/profile/reviews/[id])
│       │   │
│       │   ├── records/
│       │   │   └── page.tsx                    # 交易记录 (/profile/records)
│       │   │
│       │   ├── vip/
│       │   │   └── page.tsx                    # VIP等级 (/profile/vip)
│       │   │
│       │   ├── convert/
│       │   │   └── page.tsx                    # 身份转换 (/profile/convert)
│       │   │
│       │   └── settings/
│       │       └── page.tsx                    # 账户设置 (/profile/settings)
│       │
│       ├── tasks/                              # 任务中心（买手端）
│       │   ├── page.tsx                        # 任务列表 (/tasks)
│       │   ├── [id]/
│       │   │   └── page.tsx                    # 任务详情 (/tasks/[id])
│       │   └── continue/
│       │       └── page.tsx                    # 继续任务 (/tasks/continue)
│       │
│       └── orders/                             # 订单中心（买手端）
│           ├── page.tsx                        # 订单列表 (/orders)
│           ├── pending/
│           │   └── page.tsx                    # 待支付订单 (/orders/pending)
│           ├── [id]/
│           │   ├── page.tsx                    # 订单详情 (/orders/[id])
│           │   ├── execute/
│           │   │   └── page.tsx                # 执行任务 (/orders/[id]/execute)
│           │   ├── receive/
│           │   │   └── page.tsx                # 确认收货 (/orders/[id]/receive)
│           │   └── presale-payment/
│           │       └── page.tsx                # 预售支付 (/orders/[id]/presale-payment)
│           └── additional-review/
│               └── [id]/
│                   └── page.tsx                # 额外审核 (/orders/additional-review/[id])
│
├── backend/                                    # Node.js 后端应用
│   ├── src/
│   │   ├── controllers/                        # 控制器
│   │   ├── services/                           # 业务逻辑
│   │   ├── entities/                           # 数据模型
│   │   ├── repositories/                       # 数据访问层
│   │   ├── middleware/                         # 中间件
│   │   ├── guards/                             # 守卫（认证、授权）
│   │   ├── decorators/                         # 装饰器
│   │   ├── pipes/                              # 管道
│   │   ├── filters/                            # 异常过滤器
│   │   ├── interceptors/                       # 拦截器
│   │   ├── config/                             # 配置
│   │   ├── utils/                              # 工具函数
│   │   ├── constants/                          # 常量
│   │   ├── types/                              # 类型定义
│   │   ├── migrations/                         # 数据库迁移
│   │   ├── seeds/                              # 数据库种子
│   │   └── main.ts                             # 应用入口
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
│
└── docs/                                       # 文档
    ├── API.md                                  # API 文档
    ├── DATABASE.md                             # 数据库设计
    ├── ARCHITECTURE.md                         # 架构设计
    ├── DEPLOYMENT.md                           # 部署指南
    └── README.md                               # 项目说明
```

---

## 路由统计

| 模块 | 路由数 | 说明 |
|------|--------|------|
| 公共页面 | 7 | 登录、注册、帮助等 |
| 后台管理 | 45+ | 16个子模块 |
| 商户中心 | 35+ | 15个子模块 |
| 用户中心 | 20+ | 11个子模块 |
| 任务中心 | 3 | 买手任务 |
| 订单中心 | 8 | 买手订单 |
| **总计** | **118+** | **完整系统** |

---

## 路由分类

### 认证相关
- `/login` - 用户登录
- `/register` - 用户注册
- `/forgot-password` - 忘记密码
- `/admin/login` - 管理员登录
- `/merchant/login` - 商户登录

### 列表页面
- `/admin/users` - 买手列表
- `/admin/merchants` - 商家列表
- `/admin/tasks` - 任务列表
- `/merchant/tasks` - 商户任务列表
- `/merchant/goods` - 商品列表
- `/tasks` - 买手任务列表
- `/orders` - 买手订单列表

### 详情页面
- `/admin/users/[id]` - 买手详情
- `/merchant/tasks/[id]` - 任务详情
- `/tasks/[id]` - 任务详情
- `/orders/[id]` - 订单详情

### 创建/编辑页面
- `/merchant/tasks/new` - 发布新任务
- `/merchant/goods/new` - 新增商品
- `/merchant/goods/edit/[id]` - 编辑商品
- `/merchant/shops/new` - 新增店铺
- `/merchant/shops/edit/[id]` - 编辑店铺

### 执行操作页面
- `/orders/[id]/execute` - 执行任务
- `/orders/[id]/receive` - 确认收货
- `/orders/[id]/presale-payment` - 预售支付

### 管理配置页面
- `/admin/system/params` - 基础参数
- `/admin/system/commission` - 佣金配置
- `/admin/system/platforms` - 平台管理
- `/admin/permission/admin` - 管理员管理

