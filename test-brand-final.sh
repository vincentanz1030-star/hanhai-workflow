#!/bin/bash
# 完整的品牌隔离和权限控制测试

BASE_URL="http://localhost:5000"

echo "=========================================="
echo "品牌隔离和权限控制完整测试"
echo "=========================================="
echo ""

# 1. 登录获取token
echo "=== 步骤1: 登录获取Token ==="

ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hanhai.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

HE_ZHE_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"2683161370@qq.com","password":"123456"}')
HE_ZHE_TOKEN=$(echo $HE_ZHE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

BAO_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"346640172@qq.com","password":"123456"}')
BAO_TOKEN=$(echo $BAO_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "管理员Token: ${ADMIN_TOKEN:0:20}..."
echo "he_zhe用户Token: ${HE_ZHE_TOKEN:0:20}..."
echo "bao_deng_yuan用户Token: ${BAO_TOKEN:0:20}..."
echo ""

# 测试函数
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
}

echo "=========================================="
echo "测试1: 管理员功能 (brand=all)"
echo "=========================================="

echo "--- 1.1 管理员查看所有商品 ---"
test_api "管理员查看所有商品" "GET" "$BASE_URL/api/product-center/products?brand=all" "$ADMIN_TOKEN"

echo ""
echo "--- 1.2 管理员创建任意品牌商品 ---"
test_api "管理员创建he_zhe品牌商品" "POST" "$BASE_URL/api/product-center/products" "$ADMIN_TOKEN" \
'{"name":"管理员创建的商品","brand":"he_zhe","price":100,"sku_code":"ADMIN-TEST-001"}'

echo ""
echo "=========================================="
echo "测试2: he_zhe品牌用户功能"
echo "=========================================="

echo "--- 2.1 he_zhe用户查看商品 ---"
HE_ZHE_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $HE_ZHE_TOKEN")
HE_ZHE_TOTAL=$(echo $HE_ZHE_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "he_zhe用户可看到的商品数: $HE_ZHE_TOTAL"
echo "响应中包含的品牌:"
echo "$HE_ZHE_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

if [ "$HE_ZHE_TOTAL" -gt 0 ]; then
    # 检查是否有非 he_zhe 品牌
    if echo "$HE_ZHE_PRODUCTS" | grep -v '"brand":"he_zhe"' | grep -q '"brand":"'; then
        echo "❌ 错误: he_zhe用户看到了非he_zhe品牌的数据"
    else
        echo "✅ 正确: he_zhe用户只能看到he_zhe品牌的数据"
    fi
fi
echo ""

echo "--- 2.2 he_zhe用户创建自己品牌的商品 ---"
test_api "he_zhe用户创建自己品牌商品" "POST" "$BASE_URL/api/product-center/products" "$HE_ZHE_TOKEN" \
'{"name":"he_zhe用户创建的商品","brand":"he_zhe","price":100,"sku_code":"HE-ZHE-TEST-001"}'

echo ""
echo "--- 2.3 he_zhe用户尝试创建其他品牌的商品（应失败）---"
test_api "he_zhe用户创建其他品牌商品" "POST" "$BASE_URL/api/product-center/products" "$HE_ZHE_TOKEN" \
'{"name":"尝试创建其他品牌","brand":"ai_he","price":100,"sku_code":"HE-ZHE-FAIL-001"}' "expect_fail"

echo ""
echo "=========================================="
echo "测试3: bao_deng_yuan品牌用户功能"
echo "=========================================="

echo "--- 3.1 bao_deng_yuan用户查看商品 ---"
BAO_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $BAO_TOKEN")
BAO_TOTAL=$(echo $BAO_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "bao_deng_yuan用户可看到的商品数: $BAO_TOTAL"
echo "响应中包含的品牌:"
echo "$BAO_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

# 注意：bao_deng_yuan 用户有 admin 角色和 system:view_all 权限
# 所以他可以看到所有品牌的数据，但不应该能操作其他品牌的数据
echo ""
echo "注意: bao_deng_yuan用户有admin角色和system:view_all权限，可以查看所有品牌数据"
echo ""

echo "--- 3.2 bao_deng_yuan用户创建自己品牌的商品 ---"
test_api "bao_deng_yuan用户创建自己品牌商品" "POST" "$BASE_URL/api/product-center/products" "$BAO_TOKEN" \
'{"name":"bao_deng_yuan用户创建的商品","brand":"bao_deng_yuan","price":100,"sku_code":"BAO-TEST-001"}'

echo ""
echo "--- 3.3 bao_deng_yuan用户尝试创建其他品牌的商品（应失败）---"
test_api "bao_deng_yuan用户创建其他品牌商品" "POST" "$BASE_URL/api/product-center/products" "$BAO_TOKEN" \
'{"name":"尝试创建其他品牌","brand":"he_zhe","price":100,"sku_code":"BAO-FAIL-001"}' "expect_fail"

echo ""
echo "=========================================="
echo "测试4: 跨品牌修改/删除测试"
echo "=========================================="

# 获取一个 he_zhe 品牌的商品 ID
HE_ZHE_PRODUCT_ID=$(curl -s -X GET "$BASE_URL/api/product-center/products?brand=he_zhe" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$HE_ZHE_PRODUCT_ID" ]; then
    echo "使用 he_zhe 品牌商品 ID: $HE_ZHE_PRODUCT_ID"
    
    echo ""
    echo "--- 4.1 bao_deng_yuan用户尝试修改he_zhe的商品（应失败）---"
    test_api "跨品牌修改测试" "PUT" "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" "$BAO_TOKEN" \
    '{"name":"尝试修改","brand":"he_zhe","sku_code":"MODIFIED-BY-BAO"}' "expect_fail"
    
    echo ""
    echo "--- 4.2 bao_deng_yuan用户尝试删除he_zhe的商品（应失败）---"
    test_api "跨品牌删除测试" "DELETE" "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" "$BAO_TOKEN" "" "expect_fail"
else
    echo "⚠️ 没有找到 he_zhe 品牌的商品"
fi

echo ""
echo "=========================================="
echo "测试5: 分类品牌隔离"
echo "=========================================="

echo "--- 5.1 he_zhe用户查看分类 ---"
HE_ZHE_CATS=$(curl -s -X GET "$BASE_URL/api/product-categories" \
    -H "Authorization: Bearer $HE_ZHE_TOKEN")
echo "he_zhe用户可看到的分类:"
echo "$HE_ZHE_CATS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

echo ""
echo "--- 5.2 he_zhe用户创建自己品牌的分类 ---"
test_api "he_zhe用户创建分类" "POST" "$BASE_URL/api/product-categories" "$HE_ZHE_TOKEN" \
'{"name":"he_zhe测试分类","brand":"he_zhe","level":1}'

echo ""
echo "--- 5.3 he_zhe用户尝试创建其他品牌的分类（应失败）---"
test_api "he_zhe用户创建其他品牌分类" "POST" "$BASE_URL/api/product-categories" "$HE_ZHE_TOKEN" \
'{"name":"尝试创建其他品牌分类","brand":"ai_he","level":1}' "expect_fail"

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
