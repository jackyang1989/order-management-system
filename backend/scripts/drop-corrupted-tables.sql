-- ==========================================
-- 数据库物理重建脚本
-- 用于清理列膨胀事故中受损的表结构
-- ==========================================
--
-- 【重要警告】
-- 1. 此脚本会删除表及其所有数据！
-- 2. 执行前请确保已备份重要数据
-- 3. 建议在测试环境先验证
--
-- 【执行步骤】
-- 1. 停止后端服务
-- 2. 备份数据库: pg_dump -h localhost -U postgres order_management > backup.sql
-- 3. 执行此脚本清理损坏的表
-- 4. 重启后端服务（synchronize: true），让 TypeORM 重新创建表结构
-- 5. 恢复必要数据
--
-- ==========================================

-- 开始事务
BEGIN;

-- 1. 删除因重复实体导致列膨胀的表
-- 这些表需要完全重建

-- VIP 记录表 (vip_records) - 两个模块都有定义
DROP TABLE IF EXISTS vip_records CASCADE;

-- 商品关键词方案表 (goods_keys) - goods 和 keywords 模块都有定义
DROP TABLE IF EXISTS goods_keys CASCADE;
DROP TABLE IF EXISTS goods_key_worlds CASCADE;  -- 关联表也需要清理
DROP TABLE IF EXISTS keyword_details CASCADE;   -- 新版关联表

-- 任务商品表 (task_goods) - tasks 和 task-goods 模块都有定义
DROP TABLE IF EXISTS task_goods CASCADE;
DROP TABLE IF EXISTS task_words CASCADE;        -- 关联表
DROP TABLE IF EXISTS task_keywords CASCADE;     -- 新版关联表
DROP TABLE IF EXISTS seller_task_praises CASCADE; -- 好评内容表

-- 佣金费率表 (commission_rates) - admin-config 和 commission-rates 模块都有定义
DROP TABLE IF EXISTS commission_rates CASCADE;

-- 平台配置表 (platforms) - admin-config 和 categories 模块都有定义
DROP TABLE IF EXISTS platforms CASCADE;

-- 菜单表 (admin_menus) - admin-menus 和 admin-config/rbac 模块都有定义
DROP TABLE IF EXISTS admin_menus CASCADE;
DROP TABLE IF EXISTS admin_menus_closure CASCADE; -- Tree 闭包表

-- 角色表 (admin_roles) - admin-users 和 admin-config/rbac 模块都有定义
DROP TABLE IF EXISTS admin_roles CASCADE;

-- 2. 删除可能损坏的 VIP 相关表（需要重建）
DROP TABLE IF EXISTS vip_level_configs CASCADE;
DROP TABLE IF EXISTS user_vip_status CASCADE;
DROP TABLE IF EXISTS vip_packages CASCADE;
DROP TABLE IF EXISTS vip_purchases CASCADE;
DROP TABLE IF EXISTS recharge_orders CASCADE;

-- 3. 清理 TypeORM 的元数据表（可选，用于完全重置）
-- 注意：如果使用了 migrations，请谨慎执行
-- DROP TABLE IF EXISTS typeorm_metadata CASCADE;

-- 提交事务
COMMIT;

-- ==========================================
-- 执行后验证
-- ==========================================
-- 运行以下命令验证表已被删除：
-- \dt *vip*
-- \dt *goods*
-- \dt *task*
-- \dt *commission*
-- \dt *platform*
-- \dt *admin_menu*
-- \dt *admin_role*

-- ==========================================
-- 重建说明
-- ==========================================
-- 删除表后，需要：
-- 1. 临时将 app.module.ts 中 synchronize 改为 true
-- 2. 启动服务让 TypeORM 重建表结构
-- 3. 确认表结构正确后，将 synchronize 改回 false
-- 4. 如有需要，恢复备份数据

SELECT '清理脚本执行完成。请重启后端服务以重建表结构。' AS message;
