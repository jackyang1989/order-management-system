#!/bin/bash

# 清空测试数据脚本
# 保留：管理员、用户ouyang、商家infu
# 清空：所有业务数据

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"

# 加载环境变量
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

echo "========================================"
echo "清空测试数据"
echo "========================================"
echo ""
echo "此操作将："
echo "  ✓ 保留：管理员账户"
echo "  ✓ 保留：用户 ouyang"
echo "  ✓ 保留：商家 infu"
echo "  ✗ 清空：所有订单、任务、商品"
echo "  ✗ 清空：其他用户和商家"
echo "  ✗ 重置：ouyang 和 infu 的余额为 0"
echo ""
echo "数据库: $DB_DATABASE"
echo ""
read -p "确定要继续吗? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "操作已取消"
    exit 0
fi

# 先备份
echo ""
read -p "是否先备份当前数据库? (yes/no): " DO_BACKUP
if [ "$DO_BACKUP" = "yes" ]; then
    echo "执行备份..."
    "$SCRIPT_DIR/backup-database.sh"
    echo ""
fi

# 执行清理
echo "开始清理数据..."
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USERNAME" \
    -d "$DB_DATABASE" \
    -f "$SCRIPT_DIR/clear-test-data.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "✓ 数据清理完成！"
    echo "========================================"
    echo ""
    echo "保留的账户："
    echo "  - 管理员: admin"
    echo "  - 用户: ouyang (余额已重置为0)"
    echo "  - 商家: infu (余额已重置为0)"
    echo ""
else
    echo ""
    echo "✗ 数据清理失败"
    exit 1
fi
