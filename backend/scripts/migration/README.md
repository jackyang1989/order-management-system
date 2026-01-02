# 数据迁移工具

将原版 PHP/MySQL 系统 (tfkz.com) 的数据迁移到新版 NestJS/PostgreSQL 系统。

## 文件说明

| 文件 | 说明 |
|------|------|
| `table-mapping.ts` | 表名和字段映射配置 |
| `migrate-full.ts` | 完整迁移脚本 (推荐) |
| `migrate-simple.ts` | 简化版迁移脚本 |
| `id-mapping.json` | 迁移后生成的 ID 映射文件 |

## 使用方法

### 1. 准备工作

确保 PostgreSQL 数据库已创建，且 NestJS 应用已运行过一次（TypeORM 会自动创建表）：

```bash
cd backend
npm run start:dev
# 等待表创建完成后 Ctrl+C 停止
```

### 2. 设置环境变量

```bash
export DB_HOST=localhost
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_DATABASE=order_management
```

或者直接修改 `migrate-full.ts` 中的 `PG_CONFIG`。

### 3. 运行迁移

```bash
cd backend
npx ts-node scripts/migration/migrate-full.ts
```

## 迁移内容

按依赖顺序迁移以下表：

| # | 原版表 (MySQL) | 新版表 (PostgreSQL) |
|---|---------------|---------------------|
| 1 | tfkz_bank | banks |
| 2 | tfkz_delivery | deliveries |
| 3 | tfkz_system | system_global_configs |
| 4 | tfkz_commission | commission_rates |
| 5 | tfkz_admin_user | admin_users |
| 6 | tfkz_users | users |
| 7 | tfkz_seller | merchants |
| 8 | tfkz_shop | shops |
| 9 | tfkz_user_buyno | buyer_accounts |
| 10 | tfkz_goods | goods |
| 11 | tfkz_seller_limit | merchant_blacklist |
| 12 | tfkz_notice | notices |
| 13 | tfkz_message | messages |
| 14 | tfkz_vip_record | vip_records |
| 15 | tfkz_recharge | recharges |

## 数据转换

### ID 转换
- 原版使用整数自增 ID
- 新版使用 UUID
- 迁移时自动生成 UUID 并维护映射关系
- 映射关系保存在 `id-mapping.json`

### 时间戳转换
- 原版使用 Unix 时间戳 (整数秒)
- 新版使用 ISO 8601 格式 (timestamp with time zone)
- 自动转换: `1642519118` → `2022-01-18T12:38:38.000Z`

### 字段名转换
- 原版使用下划线命名: `create_time`, `seller_id`
- 新版使用驼峰命名: `createdAt`, `merchantId`
- 数据库列名保持下划线: `created_at`, `merchant_id`

### 表名转换
- 原版: `tfkz_seller` (商家)
- 新版: `merchants`

## 注意事项

1. **迁移前请备份数据库**
2. 迁移使用 `ON CONFLICT DO NOTHING`，可重复运行
3. 外键关系通过 ID 映射缓存解决
4. 迁移脚本会跳过已存在的数据
5. 查看控制台输出了解迁移进度和错误

## 迁移后验证

```sql
-- PostgreSQL 中执行
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM merchants;
SELECT COUNT(*) FROM shops;
SELECT COUNT(*) FROM goods;
SELECT COUNT(*) FROM buyer_accounts;
```

## 扩展迁移

如需迁移更多表（如 `tfkz_seller_task`, `tfkz_user_task` 等），可在 `migrate-full.ts` 中添加相应的迁移函数。
