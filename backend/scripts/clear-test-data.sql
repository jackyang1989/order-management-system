-- 清空测试数据脚本
-- 保留：管理员账户、用户ouyang、商家infu
-- 清空：所有业务数据（订单、任务、商品等）

-- 开始事务
BEGIN;

-- 获取要保留的用户和商家ID
DO $$
DECLARE
    ouyang_id UUID;
    infu_id UUID;
BEGIN
    -- 获取用户ouyang的ID
    SELECT id INTO ouyang_id FROM users WHERE username = 'ouyang';
    
    -- 获取商家infu的ID
    SELECT id INTO infu_id FROM merchants WHERE username = 'infu';
    
    -- 1. 清空订单相关数据
    DELETE FROM order_logs;
    DELETE FROM orders;
    
    -- 2. 清空任务相关数据
    DELETE FROM review_tasks;
    DELETE FROM task_goods;
    DELETE FROM task_drafts;
    DELETE FROM tasks;
    
    -- 3. 清空商品数据
    DELETE FROM goods;
    
    -- 4. 清空用户相关数据（保留ouyang的数据）
    DELETE FROM user_invites WHERE "userId" != ouyang_id;
    DELETE FROM user_credits WHERE "userId" != ouyang_id;
    DELETE FROM user_addresses WHERE "userId" != ouyang_id;
    DELETE FROM fund_records WHERE "userId" != ouyang_id;
    DELETE FROM finance_records WHERE "userId" != ouyang_id;
    DELETE FROM withdrawals WHERE "userId" != ouyang_id;
    DELETE FROM bank_cards WHERE "userId" != ouyang_id;
    
    -- 5. 清空商家相关数据（保留infu的数据）
    DELETE FROM merchant_withdrawals WHERE "merchantId" != infu_id;
    DELETE FROM merchant_bank_cards WHERE "merchantId" != infu_id;
    DELETE FROM merchant_blacklist WHERE "merchantId" != infu_id;
    DELETE FROM deliveries WHERE "merchantId" != infu_id;
    
    -- 6. 清空买手账号数据
    DELETE FROM buyer_accounts;
    
    -- 7. 清空店铺数据（保留infu的店铺）
    DELETE FROM shops WHERE "merchantId" != infu_id;
    
    -- 8. 清空上传文件记录（保留ouyang和infu的）
    DELETE FROM uploaded_files 
    WHERE "uploaderId" NOT IN (ouyang_id, infu_id);
    
    -- 9. 清空消息数据（保留ouyang和infu的）
    DELETE FROM messages 
    WHERE "userId" NOT IN (ouyang_id) 
    AND "merchantId" NOT IN (infu_id);
    
    -- 10. 清空充值记录（保留ouyang的）
    DELETE FROM recharge_records WHERE "userId" != ouyang_id;
    DELETE FROM reward_recharge_records WHERE "userId" != ouyang_id;
    
    -- 11. 清空推荐奖励记录（保留ouyang的）
    DELETE FROM referral_rewards WHERE "userId" != ouyang_id;
    
    -- 12. 清空操作日志（保留最近的）
    DELETE FROM operation_logs WHERE "createdAt" < NOW() - INTERVAL '7 days';
    
    -- 13. 清空统计数据
    DELETE FROM day_counts;
    
    -- 14. 清空其他商家（保留infu和管理员）
    DELETE FROM merchants 
    WHERE username NOT IN ('infu', 'admin');
    
    -- 15. 清空其他用户（保留ouyang和管理员）
    DELETE FROM users 
    WHERE username NOT IN ('ouyang', 'admin');
    
    -- 16. 重置ouyang的余额和统计数据
    UPDATE users 
    SET balance = 0,
        "frozenBalance" = 0,
        silver = 0,
        "frozenSilver" = 0,
        reward = 0,
        "referralReward" = 0,
        "referralRewardToday" = 0,
        "referralCount" = 0,
        "monthlyTaskCount" = 0
    WHERE username = 'ouyang';
    
    -- 17. 重置infu的余额和统计数据
    UPDATE merchants 
    SET balance = 0,
        "frozen_balance" = 0,
        silver = 0
    WHERE username = 'infu';
    
END $$;

-- 提交事务
COMMIT;

-- 显示清理结果
SELECT 
    'orders' as table_name, 
    COUNT(*) as remaining_count 
FROM orders
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'goods', COUNT(*) FROM goods
UNION ALL
SELECT 'merchants', COUNT(*) FROM merchants
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'bank_cards', COUNT(*) FROM bank_cards
UNION ALL
SELECT 'buyer_accounts', COUNT(*) FROM buyer_accounts
UNION ALL
SELECT 'shops', COUNT(*) FROM shops
UNION ALL
SELECT 'uploaded_files', COUNT(*) FROM uploaded_files;

-- 显示保留的账户
SELECT '=== 保留的账户 ===' as info;
SELECT 'User' as type, username, phone, balance, silver FROM users WHERE username IN ('ouyang', 'admin');
SELECT 'Merchant' as type, username, phone, balance, silver FROM merchants WHERE username IN ('infu', 'admin');
