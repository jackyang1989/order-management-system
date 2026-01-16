#!/bin/bash

# 数据库备份脚本
# 每天自动备份数据库，保留最近 7 天的备份

BACKUP_DIR="$HOME/db-backups/order-management"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="order_management"
DB_USER="jianouyang"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
pg_dump -h localhost -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# 压缩备份文件
gzip "$BACKUP_DIR/backup_$DATE.sql"

# 删除 7 天前的备份
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

echo "✅ 数据库备份完成: backup_$DATE.sql.gz"
echo "📁 备份位置: $BACKUP_DIR"
