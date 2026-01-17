#!/bin/bash

# 测试注册赠送银锭功能
# 生成随机测试用户

TIMESTAMP=$(date +%s)
TEST_USERNAME="test_silver_${TIMESTAMP}"
TEST_PHONE="1${TIMESTAMP: -10}"

echo "=========================================="
echo "测试注册赠送银锭功能"
echo "=========================================="
echo "测试用户名: ${TEST_USERNAME}"
echo "测试手机号: ${TEST_PHONE}"
echo ""

# 注册新用户
echo "1. 正在注册新用户..."
RESPONSE=$(curl -s -X POST http://localhost:6006/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${TEST_USERNAME}\",
    \"password\": \"Test123456\",
    \"phone\": \"${TEST_PHONE}\",
    \"wechat\": \"test_wechat\",
    \"invitationCode\": \"C5VXMC\"
  }")

echo "注册响应: ${RESPONSE}"
echo ""

# 提取用户ID
USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ 注册失败，无法获取用户ID"
  exit 1
fi

echo "✅ 注册成功，用户ID: ${USER_ID}"
echo ""

# 等待2秒让数据库写入完成
sleep 2

# 查询用户银锭
echo "2. 查询用户银锭..."
psql -U jianouyang -d order_management -c "
SELECT
  id,
  username,
  phone,
  silver,
  reward,
  \"createdAt\"
FROM users
WHERE id = '${USER_ID}';
"

echo ""
echo "3. 查询财务流水..."
psql -U jianouyang -d order_management -c "
SELECT
  \"userId\",
  type,
  action,
  amount,
  balance,
  description,
  \"createdAt\"
FROM fund_records
WHERE \"userId\" = '${USER_ID}'
ORDER BY \"createdAt\" DESC;
"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
echo ""
echo "预期结果："
echo "  - silver: 1.00"
echo "  - reward: 1.00"
echo "  - 财务流水: 首次注册赠送银锭"
echo ""
