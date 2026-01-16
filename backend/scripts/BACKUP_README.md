# 数据库备份管理

## 概述

本目录包含数据库备份和恢复的脚本工具。

## 脚本说明

### 1. backup-database.sh
数据库备份脚本，支持自动备份和压缩。

**功能：**
- 从 `.env` 文件读取数据库配置
- 使用 `pg_dump` 创建完整备份
- 自动压缩备份文件（gzip）
- 自动清理超过 7 天的旧备份
- 备份文件命名格式：`order_management_YYYYMMDD_HHMMSS.sql.gz`

**使用方法：**
```bash
cd backend/scripts
./backup-database.sh
```

**备份位置：**
`backend/backups/`

### 2. restore-database.sh
数据库恢复脚本，从备份文件恢复数据库。

**功能：**
- 列出可用的备份文件
- 支持压缩和未压缩的备份文件
- 恢复前需要确认操作
- 自动解压 gzip 文件

**使用方法：**
```bash
cd backend/scripts

# 查看可用备份
./restore-database.sh

# 恢复指定备份
./restore-database.sh order_management_20260116_140000.sql.gz
```

**警告：** 恢复操作会覆盖当前数据库，请谨慎操作！

### 3. setup-cron.sh
Cron 任务配置脚本，设置定期自动备份。

**功能：**
- 交互式配置备份频率
- 预设常用备份时间
- 支持自定义 cron 表达式
- 查看和删除现有任务

**使用方法：**
```bash
cd backend/scripts
./setup-cron.sh
```

**预设选项：**
1. 每天凌晨 2:00 备份
2. 每天凌晨 3:00 备份
3. 每 6 小时备份一次
4. 每 12 小时备份一次
5. 自定义 cron 表达式
6. 查看当前任务
7. 删除备份任务

## 快速开始

### 首次设置

1. **确保环境变量配置正确**
   ```bash
   # 检查 backend/.env 文件
   cat backend/.env | grep DB_
   ```

2. **测试手动备份**
   ```bash
   cd backend/scripts
   ./backup-database.sh
   ```

3. **设置定期备份**
   ```bash
   ./setup-cron.sh
   # 选择备份频率（推荐选项 1 或 2）
   ```

4. **验证 cron 任务**
   ```bash
   crontab -l | grep backup-database
   ```

### 恢复数据库

1. **查看可用备份**
   ```bash
   cd backend/scripts
   ./restore-database.sh
   ```

2. **选择备份文件恢复**
   ```bash
   ./restore-database.sh order_management_20260116_140000.sql.gz
   ```

3. **确认操作**
   - 输入 `yes` 确认恢复
   - 输入 `no` 取消操作

## 备份策略

### 默认配置
- **保留时间：** 7 天
- **备份格式：** PostgreSQL 自定义格式（-F c）
- **压缩方式：** gzip
- **备份内容：** 完整数据库（包括数据和结构）

### 修改保留时间
编辑 `backup-database.sh` 文件：
```bash
KEEP_DAYS=7  # 修改为需要的天数
```

### 推荐备份频率
- **开发环境：** 每天 1 次
- **测试环境：** 每天 2 次
- **生产环境：** 每 6-12 小时 1 次

## 日志管理

### 备份日志
位置：`backend/logs/backup.log`

查看最近的备份日志：
```bash
tail -f backend/logs/backup.log
```

### Cron 日志
macOS 系统日志：
```bash
log show --predicate 'process == "cron"' --last 1h
```

## 故障排查

### 问题 1: 权限错误
```bash
chmod +x backend/scripts/*.sh
```

### 问题 2: pg_dump 命令未找到
安装 PostgreSQL 客户端工具：
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client
```

### 问题 3: 环境变量未加载
确保 `.env` 文件存在且格式正确：
```bash
cat backend/.env
```

### 问题 4: Cron 任务未执行
检查 cron 服务状态：
```bash
# macOS
sudo launchctl list | grep cron

# 查看系统日志
log show --predicate 'process == "cron"' --last 1d
```

## 安全建议

1. **备份文件权限**
   ```bash
   chmod 600 backend/backups/*.sql.gz
   ```

2. **定期测试恢复**
   - 每月至少测试一次恢复流程
   - 确保备份文件完整可用

3. **异地备份**
   - 将备份文件同步到云存储
   - 使用 rsync、rclone 等工具

4. **监控备份状态**
   - 定期检查备份日志
   - 设置备份失败告警

## 高级用法

### 手动指定备份文件名
```bash
DATE=$(date +%Y%m%d_%H%M%S)
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h localhost \
    -p 5432 \
    -U postgres \
    -d order_management \
    -F c \
    -f "custom_backup_$DATE.sql"
```

### 只备份特定表
```bash
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h localhost \
    -p 5432 \
    -U postgres \
    -d order_management \
    -t users -t orders \
    -F c \
    -f "partial_backup.sql"
```

### 备份到远程服务器
```bash
./backup-database.sh && \
rsync -avz backend/backups/ user@remote:/path/to/backups/
```

## 相关命令

```bash
# 查看所有 cron 任务
crontab -l

# 编辑 cron 任务
crontab -e

# 删除所有 cron 任务
crontab -r

# 查看备份文件大小
du -sh backend/backups/*

# 清理所有备份（谨慎使用）
rm -rf backend/backups/*.sql.gz
```

## 联系支持

如有问题，请查看：
- PostgreSQL 官方文档：https://www.postgresql.org/docs/
- pg_dump 文档：https://www.postgresql.org/docs/current/app-pgdump.html
- pg_restore 文档：https://www.postgresql.org/docs/current/app-pgrestore.html
