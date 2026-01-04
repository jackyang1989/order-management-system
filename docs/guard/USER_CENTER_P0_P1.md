# 用户中心 P0 / P1 业务保护说明（不可随意修改）

以下逻辑来源于旧版 PHP（tfkz.com），已完成等价复刻：

## P0（不可破坏）
- 注册赠送 VIP + 银锭
- 接单必扣银锭（含 FinanceRecord）
- 买号星级 / 冻结 / 所属校验

## P1（强约束）
- VIP 过期自动降级（jwt.strategy）
- 提现手续费规则由后端统一计算

⚠️ 注意：
- 不得在 Controller / Frontend 重算费用
- 不得在非事务中修改银锭余额
- 不得绕过 jwt.strategy 访问业务接口

如需修改规则：
→ 只能通过 SystemConfig（数据库）
→ 不允许直接改 Service 逻辑
