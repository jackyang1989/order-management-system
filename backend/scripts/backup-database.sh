#!/bin/bash

# 数据库备份脚本
# 用途：定期备份 PostgreSQL 数据库

# 加载环境变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# 配置
BACKUP_DIR="$SCRIPT_DIR/../backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/order_management_$DATE.sql"
KEEP_DAYS=7  # 保留最近7天的备份

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 执行备份
echo "开始备份数据库: $DB_DATABASE"
echo "备份文件: $BACKUP_FILE"

PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_DATABASE" \
    -F c \
    -b \
    -v \
    -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ 数据库备份成功: $BACKUP_FILE"

    # 压缩备份文件
    gzip "$BACKUP_FILE"
    echo "✓ 备份文件已压缩: ${BACKUP_FILE}.gz"

    # 清理旧备份
    echo "清理 $KEEP_DAYS 天前的备份..."
    find "$BACKUP_DIR" -name "order_management_*.sql.gz" -mtime +$KEEP_DAYS -delete

    # 显示当前备份列表
    echo ""
    echo "当前备份列表:"
    ls -lh "$BACKUP_DIR"
else
    echo "✗ 数据库备份失败"
    exit 1
fi
