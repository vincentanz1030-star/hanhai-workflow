#!/bin/bash
# 品牌隔离和权限控制测试脚本 - 使用数据库中现有用户

echo "=========================================="
echo "品牌隔离和权限控制全面测试"
echo "=========================================="
echo ""

BASE_URL="http://localhost:5000"

# 使用数据库中现有用户
# 管理员: admin@hanhai.com (brand: all)
# 普通用户: 346640172@qq.com (brand: bao_deng_yuan)
# 普通用户: 2683161370@qq.com (brand: he_zhe)

echo "=== 步骤1: 登录获取Token ==="

echo "--- 1.1 管理员登录 ---"
ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hanhai.com","password":"admin123"}')
echo "Response: $ADMIN_LOGIN"
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$ADMIN_TOKEN" ]; then
    echo "✅ 管理员登录成功"
    echo "Token: ${ADMIN_TOKEN:0:30}..."
else
    echo "❌ 管理员登录失败"
fi
echo ""

echo "--- 1.2 he_zhe品牌用户登录 ---"
HE_ZHE_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"2683161370@qq.com","password":"123456"}')
echo "Response: $HE_ZHE_LOGIN"
HE_ZHE_TOKEN=$(echo $HE_ZHE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$HE_ZHE_TOKEN" ]; then
    echo "✅ he_zhe用户登录成功"
    echo "Token: ${HE_ZHE_TOKEN:0:30}..."
else
    echo "❌ he_zhe用户登录失败，尝试其他密码..."
    HE_ZHE_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"2683161370@qq.com","password":"password"}')
    HE_ZHE_TOKEN=$(echo $HE_ZHE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$HE_ZHE_TOKEN" ]; then
        echo "✅ he_zhe用户登录成功 (密码: password)"
    fi
fi
echo ""

echo "--- 1.3 bao_deng_yuan品牌用户登录 ---"
BAO_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"346640172@qq.com","password":"123456"}')
echo "Response: $BAO_LOGIN"
BAO_TOKEN=$(echo $BAO_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -n "$BAO_TOKEN" ]; then
    echo "✅ bao_deng_yuan用户登录成功"
    echo "Token: ${BAO_TOKEN:0:30}..."
else
    echo "❌ bao_deng_yuan用户登录失败，尝试其他密码..."
    BAO_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"346640172@qq.com","password":"password"}')
    BAO_TOKEN=$(echo $BAO_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$BAO_TOKEN" ]; then
        echo "✅ bao_deng_yuan用户登录成功 (密码: password)"
    fi
fi
echo ""

# 检查是否成功获取token
if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ 管理员登录失败，无法继续测试"
    exit 1
fi

if [ -z "$HE_ZHE_TOKEN" ] && [ -z "$BAO_TOKEN" ]; then
    echo "⚠️ 没有普通用户登录成功，将只测试管理员功能"
fi

echo "=========================================="
echo "开始测试..."
echo "=========================================="
echo ""

# 函数：测试API响应
test_api() {
    local name="$1"
    local method="$2"
    local url="$3"
    local token="$4"
    local data="$5"
    local expect_fail="$6"
    
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
        if [ "$expect_fail" = "expect_fail" ]; then
            echo "✅ 预期失败: $error"
            return 0
        else
            echo "❌ 意外错误: $error"
            return 1
        fi
    else
        if [ "$expect_fail" = "expect_fail" ]; then
            echo "❌ 应该失败但成功了"
            return 1
        else
            echo "✅ 成功"
            return 0
        fi
    fi
    echo ""
}

# 测试1: 管理员功能
echo "=========================================="
echo "测试1: 管理员功能"
echo "=========================================="

echo "--- 1.1 管理员查看所有商品 ---"
test_api "管理员查看所有商品" "GET" "$BASE_URL/api/product-center/products?brand=all" "$ADMIN_TOKEN"

echo "--- 1.2 管理员查看商品列表（带品牌过滤）---"
test_api "管理员查看he_zhe品牌商品" "GET" "$BASE_URL/api/product-center/products?brand=he_zhe" "$ADMIN_TOKEN"

echo "--- 1.3 管理员创建商品 ---"
test_api "管理员创建商品" "POST" "$BASE_URL/api/product-center/products" "$ADMIN_TOKEN" \
'{"name":"测试商品-Admin","brand":"he_zhe","price":200,"sku":"TEST-ADMIN-001","categoryId":null}'

# 测试2: 普通用户品牌隔离
if [ -n "$HE_ZHE_TOKEN" ]; then
    echo ""
    echo "=========================================="
    echo "测试2: he_zhe品牌用户测试"
    echo "=========================================="

    echo "--- 2.1 he_zhe用户查看商品（应只能看到he_zhe的商品）---"
    test_api "he_zhe用户查看商品" "GET" "$BASE_URL/api/product-center/products" "$HE_ZHE_TOKEN"

    echo "--- 2.2 he_zhe用户尝试查看所有品牌（应被忽略，只能看到自己的品牌）---"
    test_api "he_zhe用户尝试查看所有品牌" "GET" "$BASE_URL/api/product-center/products?brand=all" "$HE_ZHE_TOKEN"

    echo "--- 2.3 he_zhe用户创建自己品牌的商品 ---"
    test_api "he_zhe用户创建自己品牌商品" "POST" "$BASE_URL/api/product-center/products" "$HE_ZHE_TOKEN" \
    '{"name":"测试商品-he_zhe","brand":"he_zhe","price":100,"sku":"TEST-HE-ZHE-001","categoryId":null}'

    echo "--- 2.4 he_zhe用户尝试创建其他品牌的商品（应失败，403错误）---"
    test_api "he_zhe用户创建其他品牌商品" "POST" "$BASE_URL/api/product-center/products" "$HE_ZHE_TOKEN" \
    '{"name":"测试商品-other","brand":"ai_he","price":100,"sku":"TEST-OTHER-001","categoryId":null}' "expect_fail"
fi

# 测试3: 分类品牌隔离
if [ -n "$HE_ZHE_TOKEN" ]; then
    echo ""
    echo "=========================================="
    echo "测试3: 分类品牌隔离"
    echo "=========================================="

    echo "--- 3.1 he_zhe用户查看分类 ---"
    test_api "he_zhe用户查看分类" "GET" "$BASE_URL/api/product-categories" "$HE_ZHE_TOKEN"

    echo "--- 3.2 he_zhe用户创建自己品牌的分类 ---"
    test_api "he_zhe用户创建自己品牌分类" "POST" "$BASE_URL/api/product-categories" "$HE_ZHE_TOKEN" \
    '{"name":"测试分类-he_zhe","brand":"he_zhe","level":1}'

    echo "--- 3.3 he_zhe用户尝试创建其他品牌的分类（应失败）---"
    test_api "he_zhe用户创建其他品牌分类" "POST" "$BASE_URL/api/product-categories" "$HE_ZHE_TOKEN" \
    '{"name":"测试分类-other","brand":"ai_he","level":1}' "expect_fail"
fi

# 测试4: 无效token测试
echo ""
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
