# 数据库备份快速开始

## 快速命令

```bash
# 进入后端目录
cd backend

# 1. 测试备份功能
npm run backup:test

# 2. 手动执行备份
npm run backup

# 3. 设置定期自动备份
npm run backup:setup

# 4. 恢复数据库（查看可用备份）
npm run backup:restore

# 5. 恢复指定备份
npm run backup:restore order_management_20260116_140000.sql.gz
```

## 首次设置流程

### 步骤 1: 测试环境
```bash
cd backend
npm run backup:test
```

这会检查：
- ✓ 脚本权限
- ✓ 环境变量配置
- ✓ PostgreSQL 工具
- ✓ 数据库连接
- ✓ 备份目录

### 步骤 2: 执行首次备份
```bash
npm run backup
```

备份文件保存在：`backend/backups/`

### 步骤 3: 配置定期备份
```bash
npm run backup:setup
```

选择备份频率：
- 选项 1: 每天凌晨 2:00（推荐）
- 选项 2: 每天凌晨 3:00
- 选项 3: 每 6 小时
- 选项 4: 每 12 小时

### 步骤 4: 验证配置
```bash
# 查看 cron 任务
crontab -l | grep backup

# 查看备份文件
ls -lh backups/

# 查看备份日志
tail -f logs/backup.log
```

## 常用操作

### 查看所有备份
```bash
ls -lh backend/backups/
```

### 查看备份大小
```bash
du -sh backend/backups/*
```

### 手动删除旧备份
```bash
# 删除 30 天前的备份
find backend/backups/ -name "*.sql.gz" -mtime +30 -delete
```

### 恢复最新备份
```bash
cd backend
LATEST=$(ls -t backups/*.sql.gz | head -1)
npm run backup:restore $LATEST
```

## 备份策略建议

### 开发环境
- 频率：每天 1 次
- 保留：7 天
- 时间：凌晨 2:00

### 生产环境
- 频率：每 6 小时
- 保留：30 天
- 异地备份：同步到云存储

## 故障排查

### 问题：pg_dump 命令未找到
```bash
# macOS
brew install postgresql

# 验证安装
which pg_dump
```

### 问题：权限错误
```bash
chmod +x backend/scripts/*.sh
```

### 问题：cron 任务未执行
```bash
# 查看 cron 日志（macOS）
log show --predicate 'process == "cron"' --last 1h

# 手动测试脚本
cd backend/scripts
./backup-database.sh
```

## 详细文档

查看完整文档：
```bash
cat backend/scripts/BACKUP_README.md
```

## 安全提示

1. **定期测试恢复** - 每月至少测试一次
2. **异地备份** - 将备份同步到云存储
3. **权限控制** - 限制备份文件访问权限
4. **监控告警** - 设置备份失败通知

## 支持

如有问题，请查看：
- 详细文档：`backend/scripts/BACKUP_README.md`
- PostgreSQL 文档：https://www.postgresql.org/docs/
