#!/bin/bash
# 品牌隔离和权限控制测试脚本 - 使用登录接口获取有效token

echo "=========================================="
echo "品牌隔离和权限控制全面测试"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# 1. 登录获取token
echo "=== 步骤1: 登录获取Token ==="

echo "--- 1.1 管理员登录 ---"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@example.com","password":"admin123"}')
echo "Response: $ADMIN_LOGIN"
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${ADMIN_TOKEN:0:50}..."
echo ""

echo "--- 1.2 品牌A用户登录 ---"
BRAND_A_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"user-a@example.com","password":"user123"}')
echo "Response: $BRAND_A_LOGIN"
BRAND_A_TOKEN=$(echo $BRAND_A_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${BRAND_A_TOKEN:0:50}..."
echo ""

echo "--- 1.3 品牌B用户登录 ---"
BRAND_B_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"user-b@example.com","password":"user123"}')
echo "Response: $BRAND_B_LOGIN"
BRAND_B_TOKEN=$(echo $BRAND_B_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Token: ${BRAND_B_TOKEN:0:50}..."
echo ""

# 检查是否成功获取token
if [ -z "$ADMIN_TOKEN" ] || [ -z "$BRAND_A_TOKEN" ] || [ -z "$BRAND_B_TOKEN" ]; then
    echo "❌ 登录失败，无法获取有效Token"
    echo "尝试使用测试账号..."
    
    # 尝试其他账号组合
    echo "--- 尝试其他账号 ---"
    
    # 查看数据库中的用户
    curl -s -X GET "$BASE_URL/api/debug/users" 2>/dev/null || echo "调试接口不可用"
    exit 1
fi

echo "=========================================="
echo "成功获取所有Token，开始测试..."
echo "=========================================="
echo ""

# 函数：测试API响应
test_api() {
    local name="$1"
    local method="$2"
    local url="$3"
    local token="$4"
    local data="$5"
    
    echo "--- $name ---"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -X GET "$url" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -X "$method" "$url" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    echo "Response: $response"
    
    # 检查是否包含错误
    if echo "$response" | grep -q '"error"'; then
        error=$(echo "$response" | grep -o '"error":"[^"]*"' | head -1)
        echo "❌ Error: $error"
        return 1
    else
        echo "✅ Success"
        return 0
    fi
    echo ""
}

# 测试1: 商品列表品牌隔离
echo "=========================================="
echo "测试1: 商品列表品牌隔离"
echo "=========================================="

echo "--- 1.1 管理员查看所有商品 ---"
test_api "管理员查看所有商品" "GET" "$BASE_URL/api/product-center/products?brand=all" "$ADMIN_TOKEN"

echo "--- 1.2 品牌A用户查看商品（应只能看到brand-a的商品）---"
test_api "品牌A用户查看商品" "GET" "$BASE_URL/api/product-center/products" "$BRAND_A_TOKEN"

echo "--- 1.3 品牌B用户查看商品（应只能看到brand-b的商品）---"
test_api "品牌B用户查看商品" "GET" "$BASE_URL/api/product-center/products" "$BRAND_B_TOKEN"

# 测试2: 商品创建权限
echo "=========================================="
echo "测试2: 商品创建权限验证"
echo "=========================================="

echo "--- 2.1 品牌A用户创建自己品牌的商品 ---"
test_api "品牌A用户创建自己品牌商品" "POST" "$BASE_URL/api/product-center/products" "$BRAND_A_TOKEN" \
'{"name":"测试商品-A","brand":"brand-a","price":100,"sku":"TEST-A-001","categoryId":null}'

echo "--- 2.2 品牌A用户尝试创建其他品牌的商品（应失败，403错误）---"
test_api "品牌A用户创建其他品牌商品" "POST" "$BASE_URL/api/product-center/products" "$BRAND_A_TOKEN" \
'{"name":"测试商品-B","brand":"brand-b","price":100,"sku":"TEST-B-001","categoryId":null}'

echo "--- 2.3 管理员创建任意品牌商品 ---"
test_api "管理员创建商品" "POST" "$BASE_URL/api/product-center/products" "$ADMIN_TOKEN" \
'{"name":"测试商品-Admin","brand":"brand-a","price":200,"sku":"TEST-ADMIN-001","categoryId":null}'

# 测试3: 分类品牌隔离
echo "=========================================="
echo "测试3: 分类品牌隔离"
echo "=========================================="

echo "--- 3.1 管理员查看所有分类 ---"
test_api "管理员查看所有分类" "GET" "$BASE_URL/api/product-categories?brand=all" "$ADMIN_TOKEN"

echo "--- 3.2 品牌A用户查看分类（应只能看到brand-a的分类）---"
test_api "品牌A用户查看分类" "GET" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN"

echo "--- 3.3 品牌A用户尝试创建其他品牌的分类（应失败，403错误）---"
test_api "品牌A用户创建其他品牌分类" "POST" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN" \
'{"name":"测试分类-B","brand":"brand-b","level":1}'

echo "--- 3.4 品牌A用户创建自己品牌的分类 ---"
test_api "品牌A用户创建自己品牌分类" "POST" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN" \
'{"name":"测试分类-A","brand":"brand-a","level":1}'

# 测试4: 无效token测试
echo "=========================================="
echo "测试4: 无效Token测试"
echo "=========================================="

echo "--- 4.1 无Token访问 ---"
response=$(curl -s -X GET "$BASE_URL/api/product-center/products")
echo "Response: $response"
if echo "$response" | grep -q '"error"'; then
    echo "✅ 正确拒绝无Token访问"
else
    echo "❌ 未拒绝无Token访问"
fi
echo ""

echo "--- 4.2 无效Token访问 ---"
response=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer invalid-token-12345")
echo "Response: $response"
if echo "$response" | grep -q '"error"'; then
    echo "✅ 正确拒绝无效Token访问"
else
    echo "❌ 未拒绝无效Token访问"
fi
echo ""

echo "=========================================="
echo "测试完成"
echo "=========================================="
