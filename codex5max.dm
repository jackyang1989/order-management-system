审计报告内容： [# 重构版前端用户中心深度审计（原版 mobile vs 新版 OMS）

## 范围
- 原版：/Users/jianouyang/.gemini/antigravity/scratch/tfkz.com （仅移动端）
- 新版：/Users/jianouyang/.gemini/antigravity/scratch/order-management-system （Next.js 前端）
- 比对维度：页面/路由、UI 入口、流程与业务约束（VIP、银锭、本金、任务领取/取消/超时、买号星级与限额、定时/隔天任务、追评、提现/记录）、缺失与重复

## 页面与路由清单（对比）
- 登录注册：原版 /mobile/login/index|register|forget；新版 /login /register /forgot-password
- 个人中心：原版 /mobile/my/index；新版 /profile
- 任务大厅/领取：原版 /mobile/task/index + /mobile/task/get_task；新版 /tasks (添加任务单)
- 我的任务/订单：原版 /mobile/my/taskmanagement + detail/shoukuan/shouhuo/zhuipin/zhuidetail；新版 /orders、/orders/[id]、/profile/task/[id]/receive|refund|review
- VIP：原版 /mobile/my/vip_recharge、vip_record；新版 /vip + /profile/vip-record（入口重复）
- 资金/银锭记录：原版 silver_record/drawal_record/commission 等；新版 /profile/records?tab=balance|silver|withdraw
- 提现：原版 withdrawal/withsilver；新版 /profile/withdraw
- 买号：原版 add_buyno/edit_buyno；新版 /profile/bind、/profile/buyno/edit/[id]
- 银行卡：原版 add_bank_card/edit_bank_card；新版 /profile/payment
- 设置：原版 editphone/edit_login_pwd/edit_pay_pwd/editusername；新版 /profile/settings
- 帮助/邀请：原版 recommend/helpcenter；新版 /invite /help
- 追评：原版 zhuipin/zhuidetail 流程；新版仅有 /profile/reviews 列表，无领取/拒接/提交流
- 继续任务入口：原版 detail/shoukuan/shouhuo 等内链；新版有 /tasks/continue 路由但无实现内容

## 关键业务逻辑差异
### VIP / 会员
- 原版：登录时若 vip_time 过期即清 vip；可用本金或银锭购买；记录写 vip_record + finance；开通后延长 vip_time。
- 新版：展示 VIP 徽章与剩余天数，但无到期降级处理提示；支付闭环缺失（支付宝仅提示，不跳转/轮询）；套餐可能回落到 mock；无 VIP 权益应用（免费提现次数、任务优先等）；入口重复 (/vip vs /profile/vip-record)。

### 银锭/资金
- 原版：接单即冻结 1 银锭；银锭不足禁止领取；待商家发放/冻结/累计显示；取消/超时/客服撤单会返还银锭/本金并记流水；银锭提现与本金提现区分。
- 新版：仅展示银锭余额与提现；无接单冻结与返还规则提示；无银锭充值/转换入口；银锭提现固定 5% 手续费，未体现 VIP 免费次数或减免；无待发放/冻结银锭视图。

### 任务领取前置约束
- 原版：必须 VIP 且银锭≥1；买号日上限 4 单、月上限 220 单；买号星级限制任务价格档；同商家周期/复购限制；接单间隔 union_interval_time；回购任务需历史单；定时/隔天任务设置 ending_time；任务不可用时出队。
- 新版：任务大厅“添加任务单”无 VIP 校验、银锭扣冻、星级价位门槛、同商家日限制、周期/复购限制、接单间隔、定时/隔天截止提示；无超时自动取消/返还策略提示。

### 任务生命周期与取消
- 原版：状态筛选细化（进行/待发货/待收货/待返款/待确认返款/已完成/超时/手动/客服取消）；取消来源区分；倒计时和截止处理；追评领取/拒接/提交；定时/隔天任务提醒；自动超时取消返还；收货、返款、再评价上传链路完整。
- 新版：/orders 仅基础状态和简单筛选；无取消来源区分与倒计时；无自动超时处理提示；无客服取消/手动放弃入口；追评流程缺失；/tasks/continue 未实现；收货页仅上传高评截图，未覆盖物流/返款/超时流转。

### 买号与限额
- 原版：买号星级与价格门槛、日单量计数、冻结时间检查、SMS 校验、拉黑/周期限制。
- 新版：有买号管理 UI，但无星级价位校验提示、日单量提示、冻结期/黑名单/周期限制提示；SMS 校验未体现。

### 资金记录/提现
- 原版：银锭/本金流水区分，提现记录、佣金记录、银锭记录齐全。
- 新版：有记录 tabs，但缺少银锭冻结/待发放细分，缺少返还流水场景；提现缺少规则提示（VIP 免费次数、金额/次数限制）。

### 追评/加赏
- 原版：追评任务列表、状态（待处理/待返款/已完成/已拒接）、上传图片/视频、拒接退回奖励。
- 新版：仅静态 reviews 列表，缺流程与状态流转。

### 重复/缺失路由
- VIP 入口重复：/vip 与 /profile/vip-record。
- /tasks/continue 存在路由无内容。
- 无投诉/客服入口。

## 主要缺失清单（新版需补齐或提升）
1) 任务领取校验与扣冻：VIP 有效期、银锭≥1、星级-价格门槛、同商家周期/复购、接单间隔、日/月上限、回购限制；成功后冻结 1 银锭并提示返还规则。
2) 取消/超时/客服处理：超时自动取消、手动放弃、客服取消路径；对应银锭/本金返还与流水；前端展示取消来源与倒计时。
3) 定时/隔天任务：截止时间提示、提醒/继续入口；完善 /tasks/continue。
4) 追评流程：领取、提交、拒接、状态变更、加赏/返还。
5) 收货/返款链路：物流上传、收货确认、返款确认、倒计时与状态标签。
6) 银锭视图：冻结/待发放/累计赚取展示；银锭充值或显式禁用说明；返还流水。
7) VIP 闭环：真实支付跳转或轮询、续费/有效期处理、自动降级提示；权益（免费提现次数/优先任务）展示；合并入口避免重复。
8) 限额提示：买号日 4 单、用户月 220 单、同商家当日限制；星级价位门槛提示。
9) 买号/银行卡校验：星级与价格、冻结期、黑名单/周期；银行卡数量限制与上传校验提示。
10) 运营指标：邀请统计、月剩余可接任务数、日接单余量。
11) 投诉/客服：申诉/客服取消入口与状态。
12) 状态筛选与搜索：支持终端、任务类型、时间、取消来源、买号筛选，匹配原版丰富筛选。

## 设计与排版
- 允许新版保持现有风格，但需补齐缺失功能与提示；验证码可省。

## 结论
重构版用户中心在任务、资金、VIP、银锭、追评、限额与取消等关键业务上大量缺口，需按上述缺失清单补齐；VIP 入口重复需合并；/tasks/continue 需落地。确保前端显式提示原版的约束与返还规则，以避免违规接单和资金风险。
]