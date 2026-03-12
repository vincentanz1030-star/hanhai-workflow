#!/bin/bash
# 详细验证品牌隔离效果

BASE_URL="http://localhost:5000"

echo "=========================================="
echo "品牌隔离详细验证"
echo "=========================================="
echo ""

# 登录获取token
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

echo "=== 1. 管理员视角 ==="
ADMIN_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products?brand=all" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_TOTAL=$(echo $ADMIN_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "管理员可看到的商品总数: $ADMIN_TOTAL"

# 统计各品牌数量
echo "各品牌商品数量统计:"
echo "$ADMIN_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c
echo ""

echo "=== 2. he_zhe品牌用户视角 ==="
HE_ZHE_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $HE_ZHE_TOKEN")
HE_ZHE_TOTAL=$(echo $HE_ZHE_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "he_zhe用户可看到的商品总数: $HE_ZHE_TOTAL"

# 检查是否有非he_zhe品牌的数据
if echo "$HE_ZHE_PRODUCTS" | grep -q '"brand":"ai_he"'; then
    echo "❌ 错误: he_zhe用户看到了ai_he品牌的数据!"
else
    echo "✅ 正确: he_zhe用户没有看到ai_he品牌的数据"
fi

if echo "$HE_ZHE_PRODUCTS" | grep -q '"brand":"hezhe"'; then
    echo "⚠️ 注意: he_zhe用户看到了hezhe品牌的数据(可能是同一品牌的不同写法)"
else
    echo "✅ 正确: he_zhe用户没有看到hezhe品牌的数据"
fi

# 检查所有brand字段
echo "he_zhe用户看到的品牌:"
echo "$HE_ZHE_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c
echo ""

echo "=== 3. bao_deng_yuan品牌用户视角 ==="
BAO_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $BAO_TOKEN")
BAO_TOTAL=$(echo $BAO_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "bao_deng_yuan用户可看到的商品总数: $BAO_TOTAL"

if [ "$BAO_TOTAL" = "0" ]; then
    echo "✅ 正确: bao_deng_yuan用户没有看到其他品牌的数据(该品牌暂无商品)"
else
    echo "bao_deng_yuan用户看到的品牌:"
    echo "$BAO_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c
fi
echo ""

echo "=== 4. 跨品牌操作测试 ==="

# 获取一个he_zhe的商品ID用于测试
HE_ZHE_PRODUCT_ID=$(echo $HE_ZHE_PRODUCTS | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "使用he_zhe的商品ID进行测试: $HE_ZHE_PRODUCT_ID"

# bao_deng_yuan用户尝试修改he_zhe的商品
echo ""
echo "--- bao_deng_yuan用户尝试修改he_zhe的商品 ---"
UPDATE_RESULT=$(curl -s -X PUT "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" \
    -H "Authorization: Bearer $BAO_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"尝试修改的商品名"}')
echo "Response: $UPDATE_RESULT"
if echo "$UPDATE_RESULT" | grep -q '"error"'; then
    echo "✅ 正确拒绝跨品牌修改"
else
    echo "❌ 错误: 允许了跨品牌修改"
fi

# bao_deng_yuan用户尝试删除he_zhe的商品
echo ""
echo "--- bao_deng_yuan用户尝试删除he_zhe的商品 ---"
DELETE_RESULT=$(curl -s -X DELETE "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" \
    -H "Authorization: Bearer $BAO_TOKEN")
echo "Response: $DELETE_RESULT"
if echo "$DELETE_RESULT" | grep -q '"error"'; then
    echo "✅ 正确拒绝跨品牌删除"
else
    echo "❌ 错误: 允许了跨品牌删除"
fi

echo ""
echo "=========================================="
echo "验证完成"
echo "=========================================="
