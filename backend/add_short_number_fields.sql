-- 添加商家编号字段
ALTER TABLE merchant ADD COLUMN IF NOT EXISTS "merchantNo" VARCHAR;

-- 添加用户编号字段
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "userNo" VARCHAR;

-- 添加订单编号字段
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "orderNo" VARCHAR;

-- 为已存在的记录生成编号（可选，如果需要的话）
-- 这里暂时不生成，让系统在创建新记录时自动生成
