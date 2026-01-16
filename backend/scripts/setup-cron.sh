#!/bin/bash

# Cron 任务设置脚本
# 用途：配置数据库定期备份的 cron 任务

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

echo "数据库备份 Cron 任务设置"
echo "=========================="
echo ""
echo "备份脚本位置: $BACKUP_SCRIPT"
echo ""
echo "请选择备份频率:"
echo "1) 每天凌晨 2:00 备份"
echo "2) 每天凌晨 3:00 备份"
echo "3) 每 6 小时备份一次"
echo "4) 每 12 小时备份一次"
echo "5) 自定义 cron 表达式"
echo "6) 查看当前 cron 任务"
echo "7) 删除备份 cron 任务"
echo ""
read -p "请选择 (1-7): " CHOICE

case $CHOICE in
    1)
        CRON_EXPR="0 2 * * *"
        ;;
    2)
        CRON_EXPR="0 3 * * *"
        ;;
    3)
        CRON_EXPR="0 */6 * * *"
        ;;
    4)
        CRON_EXPR="0 */12 * * *"
        ;;
    5)
        read -p "请输入 cron 表达式 (例如: 0 2 * * *): " CRON_EXPR
        ;;
    6)
        echo ""
        echo "当前 cron 任务:"
        crontab -l | grep backup-database.sh || echo "没有找到备份任务"
        exit 0
        ;;
    7)
        echo ""
        echo "删除备份 cron 任务..."
        crontab -l | grep -v backup-database.sh | crontab -
        echo "✓ 已删除"
        exit 0
        ;;
    *)
        echo "无效选择"
        exit 1
        ;;
esac

# 添加 cron 任务
echo ""
echo "添加 cron 任务: $CRON_EXPR $BACKUP_SCRIPT"

# 检查是否已存在
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo ""
    echo "警告: 已存在备份任务"
    read -p "是否替换现有任务? (yes/no): " REPLACE
    if [ "$REPLACE" != "yes" ]; then
        echo "操作已取消"
        exit 0
    fi
    # 删除旧任务
    crontab -l | grep -v backup-database.sh | crontab -
fi

# 添加新任务
(crontab -l 2>/dev/null; echo "$CRON_EXPR $BACKUP_SCRIPT >> $SCRIPT_DIR/../logs/backup.log 2>&1") | crontab -

echo "✓ Cron 任务已添加"
echo ""
echo "当前 cron 任务:"
crontab -l | grep backup-database.sh

echo ""
echo "备份日志位置: $SCRIPT_DIR/../logs/backup.log"
echo ""
echo "提示:"
echo "- 使用 'crontab -l' 查看所有 cron 任务"
echo "- 使用 'crontab -e' 手动编辑 cron 任务"
echo "- 使用 '$0' 重新运行此脚本来修改配置"
