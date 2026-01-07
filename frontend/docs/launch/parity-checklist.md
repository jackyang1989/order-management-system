# Parity Checklist (Mobile User Center)

来源：原版 mobile (`application/mobile/controller/{My,Task,Money}.php` + `application/mobile/view/mobile/*`). 目标：新版买手端不退化。

## 模块：个人中心 (My)
- 首页 (my/index.html)
  - 展示：余额、本金/银锭、冻结、VIP 到期、邀请奖励、待审核/待评价任务数
  - 入口：买号管理、任务管理、资金记录、提现、VIP、追评、设置
  - 空/错：数据拉取失败提示，重新加载；无数据时显示 0/"暂无"
- 买号添加/列表 (my/add_buyno.html, my/edit_buyno.html)
  - 展示：买号列表（状态：未审核/通过/禁用），账号名、收货信息
  - 操作：新增、编辑、设默认(无)、禁用(无)、删除(无)
  - 校验：必填、手机号格式、验证码、上传资料
  - 空/错：无买号提示去新增；提交失败提示
- 任务管理入口 (my/taskmanagement.html)
  - 展示：我的任务/追评列表，状态过滤
  - 操作：查看详情、继续任务
- 提现 (my/withdrawal.html)
  - 展示：余额、可提额度、费率/限额提示，银行卡/收款码
  - 操作：提交提现
  - 空/错：无银行卡提示去绑定；失败提示
- VIP 充值/记录 (my/vip_recharge.html, my/vip_record.html)
  - 展示：VIP 套餐说明、历史记录
  - 操作：充值按钮
  - 空/错：无记录时显示空态
- 追评列表/详情 (my/zhuipin.html, my/zhuidetail.html)
  - 展示：任务标题、要求、状态
  - 操作：进入详情上传追评、查看要求
  - 空/错：无追评提示空态

## 模块：任务 (Task)
- 任务大厅 (task/index.html)
  - 展示：任务列表，筛选（买号、任务类型、返款方式、价格）
  - 操作：领取任务（添加任务单）
  - 文案：同日同店 1 单等规则提示
  - 空/错：无任务空态，加载失败重试
- 待完成列表 (task/maketask.html)
  - 展示：已领取未完成任务列表（商家、类型、返款方式、垫付、佣金、买号）
  - 操作：继续任务（跳步骤/验收页）、放弃任务
  - 空/错：无任务空态，失败提示
- 任务步骤 (task/taskstep*.html, task/wk.html)
  - 展示：步骤指引、上传/验收入口
  - 操作：下一步/提交

## 模块：资金 (Money)
- 资金/银锭/佣金记录 (money/{withsilver,drawal_record,silver_record,commission}.html)
  - 展示：记录列表、类型/状态、金额、时间
  - 空/错：无记录空态，加载失败重试
- 提现 (money/withdrawal.html)
  - 展示：余额、费率/限额、记录
  - 操作：提交提现
- 充值/支付 (money/pay.html)
  - 展示：充值金额、渠道
  - 操作：创建支付单

## 新版必须补齐点（/profile/**, /tasks/**, /orders/**）
- /profile 首页：余额/银锭/冻结/VIP/邀请/任务入口 + 空/错态
- /profile/bind：新增买号表单（platform/accountId 必填，限同平台 3 个）
- /profile/buyno：列表 + 设默认/启用禁用/删除，空/错/加载态
- /profile/records：资金记录分类展示，空/错/重试
- /profile/payment：收款方式列表空态与引导
- /profile/withdraw：提现表单校验/提示/结果反馈
- /profile/vip-record：VIP 记录空/错态
- /profile/reviews(+detail)：追评列表/详情空/错/重试
- /profile/settings：基础信息加载、空/错/重试
- /tasks：列表/筛选/空/错，领取任务按钮使用后端接口
- /tasks/[id]：任务详情展示完整字段，领取失败提示
- /tasks/continue：待完成任务列表加载/空/错，继续按钮跳可用页面
- /orders、/orders/pending、/orders/[id]：列表/详情加载/空/错，状态文案清晰
