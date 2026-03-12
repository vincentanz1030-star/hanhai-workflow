#!/bin/bash
# 商品更新功能测试

BASE_URL="http://localhost:5000"

echo "=========================================="
echo "商品更新功能测试"
echo "=========================================="
echo ""

# 登录获取管理员token
echo "=== 登录获取Token ==="
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hanhai.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "管理员Token: ${ADMIN_TOKEN:0:20}..."

# 获取一个商品ID
echo ""
echo "=== 获取商品列表 ==="
PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products?brand=all" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
PRODUCT_ID=$(echo $PRODUCTS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "使用商品ID: $PRODUCT_ID"

if [ -z "$PRODUCT_ID" ]; then
    echo "❌ 没有找到商品，无法测试"
    exit 1
fi

# 获取商品详情
echo ""
echo "=== 获取商品详情 ==="
DETAIL=$(curl -s -X GET "$BASE_URL/api/product-center/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "商品详情: $DETAIL"

# 测试1: 只更新名称
echo ""
echo "=== 测试1: 只更新名称 ==="
UPDATE1=$(curl -s -X PUT "$BASE_URL/api/product-center/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"测试更新名称-'$(date +%s)'"}')
echo "Response: $UPDATE1"
if echo "$UPDATE1" | grep -q '"success":true'; then
    echo "✅ 更新成功"
else
    echo "❌ 更新失败"
fi

# 测试2: 更新多个字段
echo ""
echo "=== 测试2: 更新多个字段 ==="
UPDATE2=$(curl -s -X PUT "$BASE_URL/api/product-center/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"测试多字段更新","description":"这是更新后的描述","designer":"测试设计师","color":"白色"}')
echo "Response: $UPDATE2"
if echo "$UPDATE2" | grep -q '"success":true'; then
    echo "✅ 更新成功"
else
    echo "❌ 更新失败"
fi

# 验证数据是否正确更新
echo ""
echo "=== 验证更新结果 ==="
VERIFY=$(curl -s -X GET "$BASE_URL/api/product-center/products/$PRODUCT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "更新后商品详情: $VERIFY"

# 检查名称是否更新
if echo "$VERIFY" | grep -q '"测试多字段更新"'; then
    echo "✅ 名称更新正确"
else
    echo "❌ 名称更新失败"
fi

# 检查描述是否更新
if echo "$VERIFY" | grep -q '"这是更新后的描述"'; then
    echo "✅ 描述更新正确"
else
    echo "❌ 描述更新失败"
fi

# 检查设计师是否更新
if echo "$VERIFY" | grep -q '"测试设计师"'; then
    echo "✅ 设计师更新正确"
else
    echo "❌ 设计师更新失败"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
