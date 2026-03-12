#!/bin/bash
# 品牌隔离和权限控制测试脚本

echo "=========================================="
echo "品牌隔离和权限控制全面测试"
echo "=========================================="
echo ""

# 测试账号信息
ADMIN_TOKEN="admin-token-001"
BRAND_A_TOKEN="user-token-002"
BRAND_B_TOKEN="user-token-003"

BASE_URL="http://localhost:5000"

echo "=== 测试账号信息 ==="
echo "管理员: admin001 (token: $ADMIN_TOKEN, brand: all)"
echo "品牌A用户: user002 (token: $BRAND_A_TOKEN, brand: brand-a)"
echo "品牌B用户: user003 (token: $BRAND_B_TOKEN, brand: brand-b)"
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
    else
        echo "✅ Success"
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

echo "--- 2.2 品牌A用户尝试创建其他品牌的商品（应失败）---"
test_api "品牌A用户创建其他品牌商品" "POST" "$BASE_URL/api/product-center/products" "$BRAND_A_TOKEN" \
'{"name":"测试商品-B","brand":"brand-b","price":100,"sku":"TEST-B-001","categoryId":null}'

echo "--- 2.3 管理员创建任意品牌商品 ---"
test_api "管理员创建商品" "POST" "$BASE_URL/api/product-center/products" "$ADMIN_TOKEN" \
'{"name":"测试商品-Admin","brand":"brand-a","price":200,"sku":"TEST-ADMIN-001","categoryId":null}'

# 测试3: 商品更新权限
echo "=========================================="
echo "测试3: 商品更新权限验证"
echo "=========================================="

# 先获取一个商品ID
PRODUCT_ID=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "使用商品ID: $PRODUCT_ID"
echo ""

if [ -n "$PRODUCT_ID" ]; then
    echo "--- 3.1 品牌A用户尝试更新其他品牌的商品（应失败）---"
    test_api "品牌A用户更新其他品牌商品" "PUT" "$BASE_URL/api/product-center/products/$PRODUCT_ID" "$BRAND_A_TOKEN" \
    '{"name":"修改后的商品名"}'
    
    echo "--- 3.2 管理员更新商品 ---"
    test_api "管理员更新商品" "PUT" "$BASE_URL/api/product-center/products/$PRODUCT_ID" "$ADMIN_TOKEN" \
    '{"name":"管理员修改后的商品名"}'
fi

# 测试4: 商品删除权限
echo "=========================================="
echo "测试4: 商品删除权限验证"
echo "=========================================="

echo "--- 4.1 品牌A用户尝试删除其他品牌的商品（应失败）---"
if [ -n "$PRODUCT_ID" ]; then
    test_api "品牌A用户删除其他品牌商品" "DELETE" "$BASE_URL/api/product-center/products/$PRODUCT_ID" "$BRAND_A_TOKEN"
fi

# 测试5: 分类品牌隔离
echo "=========================================="
echo "测试5: 分类品牌隔离"
echo "=========================================="

echo "--- 5.1 管理员查看所有分类 ---"
test_api "管理员查看所有分类" "GET" "$BASE_URL/api/product-categories?brand=all" "$ADMIN_TOKEN"

echo "--- 5.2 品牌A用户查看分类（应只能看到brand-a的分类）---"
test_api "品牌A用户查看分类" "GET" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN"

echo "--- 5.3 品牌A用户尝试创建其他品牌的分类（应失败）---"
test_api "品牌A用户创建其他品牌分类" "POST" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN" \
'{"name":"测试分类-B","brand":"brand-b","level":1}'

echo "--- 5.4 品牌A用户创建自己品牌的分类 ---"
test_api "品牌A用户创建自己品牌分类" "POST" "$BASE_URL/api/product-categories" "$BRAND_A_TOKEN" \
'{"name":"测试分类-A","brand":"brand-a","level":1}'

# 测试6: 无效token测试
echo "=========================================="
echo "测试6: 无效Token测试"
echo "=========================================="

echo "--- 6.1 无Token访问 ---"
response=$(curl -s -X GET "$BASE_URL/api/product-center/products")
echo "Response: $response"
if echo "$response" | grep -q '"error"'; then
    echo "✅ 正确拒绝无Token访问"
else
    echo "❌ 未拒绝无Token访问"
fi
echo ""

echo "--- 6.2 无效Token访问 ---"
response=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer invalid-token")
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
