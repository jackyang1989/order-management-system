#!/bin/bash

# 数据库恢复脚本
# 用途：从备份文件恢复 PostgreSQL 数据库

# 加载环境变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# 配置
BACKUP_DIR="$SCRIPT_DIR/../backups"

# 检查参数
if [ -z "$1" ]; then
    echo "用法: $0 <备份文件名>"
    echo ""
    echo "可用的备份文件:"
    ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "没有找到备份文件"
    exit 1
fi

BACKUP_FILE="$1"

# 如果只提供了文件名，添加完整路径
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "✗ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 确认操作
echo "警告: 此操作将覆盖当前数据库 $DB_DATABASE"
echo "备份文件: $BACKUP_FILE"
echo ""
read -p "确定要继续吗? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 解压备份文件（如果是压缩的）
TEMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "解压备份文件..."
    TEMP_FILE="${BACKUP_FILE%.gz}"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
fi

# 执行恢复
echo "开始恢复数据库: $DB_DATABASE"

# 先删除现有数据库（可选，谨慎使用）
# PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -c "DROP DATABASE IF EXISTS $DB_DATABASE;"
# PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -c "CREATE DATABASE $DB_DATABASE;"

# 恢复数据库
PGPASSWORD="$DB_PASSWORD" pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_DATABASE" \
    -c \
    -v \
    "$TEMP_FILE"

if [ $? -eq 0 ]; then
    echo "✓ 数据库恢复成功"
else
    echo "✗ 数据库恢复失败"
    exit 1
fi

# 清理临时文件
if [[ "$BACKUP_FILE" == *.gz ]] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
    echo "✓ 临时文件已清理"
fi

echo ""
echo "恢复完成！"
