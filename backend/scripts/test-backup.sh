#!/bin/bash

# 备份功能测试脚本
# 用途：测试备份和恢复功能是否正常工作

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "数据库备份功能测试"
echo "=================="
echo ""

# 1. 检查脚本权限
echo "1. 检查脚本权限..."
if [ -x "$SCRIPT_DIR/backup-database.sh" ] && [ -x "$SCRIPT_DIR/restore-database.sh" ]; then
    echo "   ✓ 脚本权限正常"
else
    echo "   ✗ 脚本权限不足，正在修复..."
    chmod +x "$SCRIPT_DIR/backup-database.sh"
    chmod +x "$SCRIPT_DIR/restore-database.sh"
    chmod +x "$SCRIPT_DIR/setup-cron.sh"
    echo "   ✓ 权限已修复"
fi

# 2. 检查环境变量
echo ""
echo "2. 检查环境变量..."
ENV_FILE="$SCRIPT_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
    if [ -n "$DB_HOST" ] && [ -n "$DB_USERNAME" ] && [ -n "$DB_DATABASE" ]; then
        echo "   ✓ 环境变量配置正常"
        echo "   - 数据库主机: $DB_HOST"
        echo "   - 数据库名称: $DB_DATABASE"
        echo "   - 数据库用户: $DB_USERNAME"
    else
        echo "   ✗ 环境变量配置不完整"
        exit 1
    fi
else
    echo "   ✗ .env 文件不存在"
    exit 1
fi

# 3. 检查 PostgreSQL 工具
echo ""
echo "3. 检查 PostgreSQL 工具..."
if command -v pg_dump &> /dev/null && command -v pg_restore &> /dev/null; then
    echo "   ✓ PostgreSQL 工具已安装"
    echo "   - pg_dump: $(which pg_dump)"
    echo "   - pg_restore: $(which pg_restore)"
else
    echo "   ✗ PostgreSQL 工具未安装"
    echo "   请运行: brew install postgresql"
    exit 1
fi

# 4. 测试数据库连接
echo ""
echo "4. 测试数据库连接..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -c "SELECT 1;" &> /dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ 数据库连接成功"
else
    echo "   ✗ 数据库连接失败"
    echo "   请检查数据库配置和服务状态"
    exit 1
fi

# 5. 检查备份目录
echo ""
echo "5. 检查备份目录..."
BACKUP_DIR="$SCRIPT_DIR/../backups"
if [ -d "$BACKUP_DIR" ]; then
    echo "   ✓ 备份目录存在: $BACKUP_DIR"
    BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/*.sql.gz 2>/dev/null | wc -l)
    echo "   - 现有备份数量: $BACKUP_COUNT"
else
    echo "   ! 备份目录不存在，将在首次备份时创建"
fi

# 6. 执行测试备份
echo ""
echo "6. 执行测试备份..."
read -p "   是否执行测试备份? (yes/no): " DO_BACKUP
if [ "$DO_BACKUP" = "yes" ]; then
    "$SCRIPT_DIR/backup-database.sh"
    if [ $? -eq 0 ]; then
        echo "   ✓ 测试备份成功"
    else
        echo "   ✗ 测试备份失败"
        exit 1
    fi
else
    echo "   - 跳过测试备份"
fi

# 7. 检查 cron 任务
echo ""
echo "7. 检查 cron 任务..."
if crontab -l 2>/dev/null | grep -q backup-database.sh; then
    echo "   ✓ 已配置 cron 任务"
    echo "   当前配置:"
    crontab -l | grep backup-database.sh | sed 's/^/   /'
else
    echo "   ! 未配置 cron 任务"
    echo "   运行以下命令配置定期备份:"
    echo "   cd $SCRIPT_DIR && ./setup-cron.sh"
fi

# 总结
echo ""
echo "=================="
echo "测试完成！"
echo ""
echo "下一步操作:"
echo "1. 配置定期备份: cd $SCRIPT_DIR && ./setup-cron.sh"
echo "2. 查看备份文件: ls -lh $BACKUP_DIR"
echo "3. 查看详细文档: cat $SCRIPT_DIR/BACKUP_README.md"
