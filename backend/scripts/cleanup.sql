-- ============================================================
-- DATABASE CLEANUP SCRIPT (Final Version v2)
-- Order Management System
-- Generated: 2026-01-04
-- ============================================================

BEGIN;

-- Get test user IDs as text (for varchar columns)
CREATE TEMP TABLE test_user_ids AS
SELECT id::text as id_text FROM users WHERE username LIKE 'test_%';

-- Get test merchant IDs as text and uuid
CREATE TEMP TABLE test_merchant_ids AS
SELECT id, id::text as id_text FROM merchants WHERE username LIKE 'test_%';

-- ============================================================
-- DELETE USER-RELATED TEST DATA
-- ============================================================

DELETE FROM orders WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM buyer_accounts WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM bank_cards WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM withdrawals WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM fund_records WHERE "userId"::text IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_addresses WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_credits WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_day_counts WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_invites WHERE "inviterId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_invites WHERE "inviteeId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM vip_records WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM vip_purchases WHERE "userId"::text IN (SELECT id_text FROM test_user_ids);
DELETE FROM finance_records WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM user_vip_status WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM invite_codes WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM notice_reads WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM review_tasks WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM sensitive_word_logs WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM payment_orders WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM recharge_orders WHERE "userId"::text IN (SELECT id_text FROM test_user_ids);
DELETE FROM credit_logs WHERE "userId" IN (SELECT id_text FROM test_user_ids);
DELETE FROM file_groups WHERE "userId" IN (SELECT id_text FROM test_user_ids);

-- Delete test users
DELETE FROM users WHERE id::text IN (SELECT id_text FROM test_user_ids);

-- ============================================================
-- DELETE MERCHANT-RELATED TEST DATA
-- ============================================================

-- tasks.merchantId is UUID
DELETE FROM tasks WHERE "merchantId" IN (SELECT id FROM test_merchant_ids);

-- shops uses sellerId (UUID)
DELETE FROM shops WHERE "sellerId" IN (SELECT id FROM test_merchant_ids);

-- goods uses sellerId (UUID)
DELETE FROM goods WHERE "sellerId" IN (SELECT id FROM test_merchant_ids);

-- merchant_bank_cards.merchantId is VARCHAR
DELETE FROM merchant_bank_cards WHERE "merchantId" IN (SELECT id_text FROM test_merchant_ids);

-- merchant_withdrawals.merchantId is VARCHAR
DELETE FROM merchant_withdrawals WHERE "merchantId" IN (SELECT id_text FROM test_merchant_ids);

-- recharges.userId is VARCHAR (referring to merchant)
DELETE FROM recharges WHERE "userId" IN (SELECT id_text FROM test_merchant_ids);

-- review_tasks.merchantId is VARCHAR
DELETE FROM review_tasks WHERE "merchantId" IN (SELECT id_text FROM test_merchant_ids);

-- Delete test merchants
DELETE FROM merchants WHERE id IN (SELECT id FROM test_merchant_ids);

-- Cleanup temp tables
DROP TABLE test_user_ids;
DROP TABLE test_merchant_ids;

-- ============================================================
-- VERIFICATION
-- ============================================================

SELECT 'Remaining Users' as metric, COUNT(*) as count FROM users
UNION ALL SELECT 'Remaining Merchants', COUNT(*) FROM merchants
UNION ALL SELECT 'Remaining Orders', COUNT(*) FROM orders
UNION ALL SELECT 'Remaining Tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'Remaining Shops', COUNT(*) FROM shops
UNION ALL SELECT 'Remaining Goods', COUNT(*) FROM goods
UNION ALL SELECT 'Test Users Left', (SELECT COUNT(*) FROM users WHERE username LIKE 'test_%')
UNION ALL SELECT 'Test Merchants Left', (SELECT COUNT(*) FROM merchants WHERE username LIKE 'test_%');

COMMIT;
