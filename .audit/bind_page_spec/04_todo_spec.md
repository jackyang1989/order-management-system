# /profile/bind（添加买号）开发清单（只做这一页）

## 页面目标
- 添加买号
- 成功后跳转 /profile/buyno
- 不对齐旺旺字段，不参考旧字段名

## 使用字段（最终版）
- platform
- accountId
- accountName
- status
- isDefault

## 必须具备的状态
- 初始空表单
- 提交中 loading
- 成功状态
- 错误提示状态

## 不允许做的事
- ❌ 不复刻旧版 PHP 写法
- ❌ 不引入旺旺 / wwid 字段
- ❌ 不改后端已有逻辑

## 后端若缺接口
- 允许前端 mock
- 必须标 TODO: replace with real API

