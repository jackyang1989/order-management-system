# 买号体系前端说明

## ① UI 结构
- /profile/bind（绑定买号）
  - Header：返回、标题
  - 摘要卡片：已绑定数量 + loading
  - 表单卡片：平台下拉（必填）、账号ID（必填）、展示名称（可选，默认同账号ID）、提交按钮（loading/disabled）
  - 限额提示：同平台已达上限时红字提示
- /profile/buyno（买号管理）
  - Header：返回、标题
  - 主区：
    - loading：整页 Spinner
    - error：Empty 组件 + “重试”按钮
    - empty：Empty 组件 + CTA 跳 /profile/bind
    - list 卡片：platform、accountName(或 accountId)、accountId、status 徽标、isDefault 标签；操作按钮区（设默认/启用禁用/删除）

## ② 状态机/交互流程
- /profile/bind
  - 进入→加载 list → 显示数量
  - 提交：校验必填与平台限额(>=3 禁止)→loading 禁用→成功 toast + 跳 /profile/buyno；失败 toast
- /profile/buyno
  - 进入→loadAccounts：loading→(error 可重试)|(empty CTA 跳 bind)|(list)
  - 设默认：仅 APPROVED；点击→局部 loading→成功 toast + reload；失败 toast
  - 启用/禁用：APPROVED<->DISABLED 切换；点击→局部 loading→成功 toast + reload；失败 toast
  - 删除：确认→局部 loading→成功 toast + reload；失败 toast

## ③ API 列表（前端字段 platform/accountId/accountName/status/isDefault/id）
- list(): GET /buyer-accounts?all=1 → map: accountName→accountId/accountName, status 数字→枚举, isDefault→bool
- create({platform, accountId, accountName}): POST /buyer-accounts {platform, accountName: accountId}
- remove(id): DELETE /buyer-accounts/:id
- setDefault(id): // TODO: replace with real API endpoint （当前内存覆盖：唯一 isDefault）
- setStatus(id, status): // TODO: replace with real API endpoint （当前内存覆盖：切换 APPROVED/DISABLED）

## ④ 后端缺口建议 endpoint
- PATCH /buyer-accounts/:id/default ：设默认（同用户唯一 isDefault=true）
- PATCH /buyer-accounts/:id/status ：启用/禁用（支持 APPROVED/DISABLED 切换）
- GET/返回体：buyer-accounts 列表建议补充 isDefault 字段；字段 accountName 用作前端 accountId/accountName
- GET /config/account-limits ：返回每平台最大绑定数（如 maxPerPlatform=3），供前端替代常量

## 改动文件
- frontend/src/services/buyerAccountService.ts
- frontend/src/app/profile/bind/page.tsx
- frontend/src/app/profile/buyno/page.tsx
- frontend/buyer-account-notes.md
