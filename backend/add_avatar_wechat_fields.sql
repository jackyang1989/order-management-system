-- 添加 avatar 和 wechat 字段到 users 表
-- 执行时间: 2026-01-16

-- 检查并添加 avatar 字段
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'avatar'
    ) THEN
        ALTER TABLE users ADD COLUMN avatar VARCHAR(500);
        RAISE NOTICE 'Added avatar column to users table';
    ELSE
        RAISE NOTICE 'avatar column already exists in users table';
    END IF;
END $$;

-- 检查并添加 wechat 字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'wechat'
    ) THEN
        ALTER TABLE users ADD COLUMN wechat VARCHAR(100);
        RAISE NOTICE 'Added wechat column to users table';
    ELSE
        RAISE NOTICE 'wechat column already exists in users table';
    END IF;
END $$;

-- 验证字段已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('avatar', 'wechat')
ORDER BY column_name;
