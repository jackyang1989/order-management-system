-- ============================================================
-- STATUS ENUM FIX SCRIPT
-- Order Management System
-- Generated: 2026-01-04
-- ============================================================
-- 
-- PURPOSE: Map old integer status values to new string enums
-- (Only needed if migrating from legacy system)
-- 
-- ============================================================

BEGIN;

-- ============================================================
-- 1. ORDER STATUS MAPPING
-- ============================================================
-- Current: varchar field with enum values
-- Status values already use string enums:
--   PENDING, PAID, SEARCHING, ORDERED, SHIPPED, RECEIVED, 
--   REVIEWED, COMPLETED, SUBMITTED, APPROVED, REJECTED

-- No migration needed - orders.status is already varchar

-- ============================================================
-- 2. TASK STATUS MAPPING (integer -> meaning)
-- ============================================================
-- Current status values (integer):
--   1 = 进行中 (Active)
--   2 = 已暂停 (Paused)
--   3 = 已结束 (Ended)
--   4 = 审核中 (Pending Review)
--   5 = 审核拒绝 (Rejected)

-- To convert to string enum (if needed):
-- UPDATE tasks SET status_new = CASE status
--     WHEN 1 THEN 'ACTIVE'
--     WHEN 2 THEN 'PAUSED'
--     WHEN 3 THEN 'ENDED'
--     WHEN 4 THEN 'PENDING'
--     WHEN 5 THEN 'REJECTED'
--     ELSE 'UNKNOWN'
-- END;

-- ============================================================
-- 3. WITHDRAWAL STATUS MAPPING
-- ============================================================
-- Current status values (integer):
--   0 = 待审核 (Pending)
--   1 = 已通过 (Approved)
--   2 = 已拒绝 (Rejected)
--   3 = 已完成 (Completed)

-- To convert to string enum (if needed):
-- UPDATE withdrawals SET status_new = CASE status
--     WHEN 0 THEN 'PENDING'
--     WHEN 1 THEN 'APPROVED'
--     WHEN 2 THEN 'REJECTED'
--     WHEN 3 THEN 'COMPLETED'
--     ELSE 'UNKNOWN'
-- END;

-- ============================================================
-- 4. USER STATUS/VIP MAPPING
-- ============================================================
-- vip field is already boolean (true/false)
-- No mapping needed

-- ============================================================
-- 5. MERCHANT STATUS MAPPING
-- ============================================================
-- Current status values (integer):
--   0 = 禁用 (Disabled)
--   1 = 正常 (Active)
--   2 = 审核中 (Pending)

-- To convert to string enum (if needed):
-- UPDATE merchants SET status_new = CASE status
--     WHEN 0 THEN 'DISABLED'
--     WHEN 1 THEN 'ACTIVE'
--     WHEN 2 THEN 'PENDING'
--     ELSE 'UNKNOWN'
-- END;

-- ============================================================
-- 6. REVIEW_TASKS STATUS MAPPING
-- ============================================================
-- Current state values (integer):
--   0 = UNPAID (未支付)
--   1 = PAID (已支付)
--   2 = APPROVED (已审核)
--   3 = UPLOADED (已上传)
--   4 = COMPLETED (已完成)
--   5 = CANCELLED (已取消)
--   6 = BUYER_REJECTED (买手拒接)
--   7 = REJECTED (已拒绝)

-- Integer enums are fine - TypeORM handles the mapping automatically

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check status distribution in each table
SELECT 'orders' as table_name, status, COUNT(*) as count 
FROM orders GROUP BY status
UNION ALL
SELECT 'tasks', status::text, COUNT(*) FROM tasks GROUP BY status
UNION ALL
SELECT 'withdrawals', status::text, COUNT(*) FROM withdrawals GROUP BY status
UNION ALL
SELECT 'merchants', status::text, COUNT(*) FROM merchants GROUP BY status
ORDER BY table_name, status;

COMMIT;

-- ============================================================
-- NOTES
-- ============================================================
--
-- The current system uses a hybrid approach:
-- - orders.status: VARCHAR with string enum values
-- - All other tables: INTEGER with numeric enum values
--
-- TypeORM entities define TypeScript enums that map to these
-- integer values, so no database-level migration is needed.
--
-- The frontend also correctly handles both formats.
-- ============================================================
