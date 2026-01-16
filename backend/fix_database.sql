-- 修复数据库：添加缺失的短编号字段
-- 执行方法：psql -h localhost -U postgres -d order_management -f fix_database.sql

-- 1. 添加商家编号字段
ALTER TABLE merchant ADD COLUMN IF NOT EXISTS "merchantNo" VARCHAR;

-- 2. 添加用户编号字段
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "userNo" VARCHAR;

-- 3. 添加订单编号字段
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "orderNo" VARCHAR;

-- 验证列已添加
SELECT 'merchantNo column added to merchant table' as status;
SELECT 'userNo column added to user table' as status;
SELECT 'orderNo column added to order table' as status;
