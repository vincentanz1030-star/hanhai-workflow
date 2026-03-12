#!/bin/bash
# 品牌隔离测试 - 验证各品牌只能查看自己内容

BASE_URL="http://localhost:5000"

echo "=========================================="
echo "品牌隔离测试 - 各品牌只能查看自己内容"
echo "=========================================="
echo ""

# 登录获取token
echo "=== 登录获取Token ==="

ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@hanhai.com","password":"admin123"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
ADMIN_BRAND=$(echo $ADMIN_LOGIN | grep -o '"brand":"[^"]*"' | cut -d'"' -f4)
echo "管理员: brand=$ADMIN_BRAND, token=${ADMIN_TOKEN:0:20}..."

HE_ZHE_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"2683161370@qq.com","password":"123456"}')
HE_ZHE_TOKEN=$(echo $HE_ZHE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
HE_ZHE_BRAND=$(echo $HE_ZHE_LOGIN | grep -o '"brand":"[^"]*"' | cut -d'"' -f4)
echo "he_zhe用户: brand=$HE_ZHE_BRAND, token=${HE_ZHE_TOKEN:0:20}..."

BAO_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"346640172@qq.com","password":"123456"}')
BAO_TOKEN=$(echo $BAO_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
BAO_BRAND=$(echo $BAO_LOGIN | grep -o '"brand":"[^"]*"' | cut -d'"' -f4)
echo "bao_deng_yuan用户: brand=$BAO_BRAND, token=${BAO_TOKEN:0:20}..."

echo ""
echo "=========================================="
echo "测试1: 商品列表品牌隔离"
echo "=========================================="

echo ""
echo "--- 1.1 管理员 (brand=all) 查看商品 ---"
ADMIN_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
ADMIN_TOTAL=$(echo $ADMIN_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "可看到商品总数: $ADMIN_TOTAL"
echo "品牌分布:"
echo "$ADMIN_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c
if [ "$ADMIN_TOTAL" -gt 0 ]; then
    echo "✅ 管理员可以看到所有品牌商品"
else
    echo "❌ 管理员无法看到商品"
fi

echo ""
echo "--- 1.2 he_zhe用户 (brand=he_zhe) 查看商品 ---"
HE_ZHE_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $HE_ZHE_TOKEN")
HE_ZHE_TOTAL=$(echo $HE_ZHE_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "可看到商品总数: $HE_ZHE_TOTAL"
echo "品牌分布:"
echo "$HE_ZHE_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

# 检查是否只有 he_zhe 品牌
if [ "$HE_ZHE_TOTAL" -eq 0 ]; then
    echo "⚠️ he_zhe 品牌暂无商品"
else
    OTHER_BRANDS=$(echo "$HE_ZHE_PRODUCTS" | grep -o '"brand":"[^"]*"' | grep -v '"brand":"he_zhe"' | wc -l)
    if [ "$OTHER_BRANDS" -eq 0 ]; then
        echo "✅ 正确: he_zhe用户只能看到自己品牌的商品"
    else
        echo "❌ 错误: he_zhe用户看到了其他品牌的商品"
    fi
fi

echo ""
echo "--- 1.3 bao_deng_yuan用户 (brand=bao_deng_yuan) 查看商品 ---"
BAO_PRODUCTS=$(curl -s -X GET "$BASE_URL/api/product-center/products" \
    -H "Authorization: Bearer $BAO_TOKEN")
BAO_TOTAL=$(echo $BAO_PRODUCTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
echo "可看到商品总数: $BAO_TOTAL"
echo "品牌分布:"
echo "$BAO_PRODUCTS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

# 检查是否只有 bao_deng_yuan 品牌
if [ "$BAO_TOTAL" -eq 0 ]; then
    echo "✅ 正确: bao_deng_yuan用户只能看到自己品牌的商品（该品牌暂无商品）"
else
    OTHER_BRANDS=$(echo "$BAO_PRODUCTS" | grep -o '"brand":"[^"]*"' | grep -v '"brand":"bao_deng_yuan"' | wc -l)
    if [ "$OTHER_BRANDS" -eq 0 ]; then
        echo "✅ 正确: bao_deng_yuan用户只能看到自己品牌的商品"
    else
        echo "❌ 错误: bao_deng_yuan用户看到了其他品牌的商品"
    fi
fi

echo ""
echo "=========================================="
echo "测试2: 分类品牌隔离"
echo "=========================================="

echo ""
echo "--- 2.1 管理员查看分类 ---"
ADMIN_CATS=$(curl -s -X GET "$BASE_URL/api/product-categories" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
echo "管理员可看到的分类品牌分布:"
echo "$ADMIN_CATS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

echo ""
echo "--- 2.2 he_zhe用户查看分类 ---"
HE_ZHE_CATS=$(curl -s -X GET "$BASE_URL/api/product-categories" \
    -H "Authorization: Bearer $HE_ZHE_TOKEN")
echo "he_zhe用户可看到的分类品牌分布:"
echo "$HE_ZHE_CATS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

# 检查是否只有 he_zhe 品牌
OTHER_CAT_BRANDS=$(echo "$HE_ZHE_CATS" | grep -o '"brand":"[^"]*"' | grep -v '"brand":"he_zhe"' | wc -l)
if [ "$OTHER_CAT_BRANDS" -eq 0 ]; then
    echo "✅ 正确: he_zhe用户只能看到自己品牌的分类"
else
    echo "❌ 错误: he_zhe用户看到了其他品牌的分类"
fi

echo ""
echo "--- 2.3 bao_deng_yuan用户查看分类 ---"
BAO_CATS=$(curl -s -X GET "$BASE_URL/api/product-categories" \
    -H "Authorization: Bearer $BAO_TOKEN")
echo "bao_deng_yuan用户可看到的分类品牌分布:"
echo "$BAO_CATS" | grep -o '"brand":"[^"]*"' | sort | uniq -c

# 检查是否只有 bao_deng_yuan 品牌
OTHER_CAT_BRANDS=$(echo "$BAO_CATS" | grep -o '"brand":"[^"]*"' | grep -v '"brand":"bao_deng_yuan"' | wc -l)
if [ "$OTHER_CAT_BRANDS" -eq 0 ]; then
    echo "✅ 正确: bao_deng_yuan用户只能看到自己品牌的分类"
else
    echo "❌ 错误: bao_deng_yuan用户看到了其他品牌的分类"
fi

echo ""
echo "=========================================="
echo "测试3: 跨品牌操作权限"
echo "=========================================="

# 获取一个 he_zhe 品牌的商品ID
HE_ZHE_PRODUCT_ID=$(curl -s -X GET "$BASE_URL/api/product-center/products?brand=he_zhe" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$HE_ZHE_PRODUCT_ID" ]; then
    echo "使用 he_zhe 商品ID: $HE_ZHE_PRODUCT_ID"
    
    echo ""
    echo "--- 3.1 bao_deng_yuan用户尝试修改he_zhe商品 ---"
    UPDATE_RESULT=$(curl -s -X PUT "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" \
        -H "Authorization: Bearer $BAO_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"name":"尝试修改","brand":"he_zhe","sku_code":"MODIFIED"}')
    echo "Response: $UPDATE_RESULT"
    if echo "$UPDATE_RESULT" | grep -q '"无权限'; then
        echo "✅ 正确拒绝跨品牌修改"
    else
        echo "❌ 允许了跨品牌修改"
    fi
    
    echo ""
    echo "--- 3.2 bao_deng_yuan用户尝试删除he_zhe商品 ---"
    DELETE_RESULT=$(curl -s -X DELETE "$BASE_URL/api/product-center/products/$HE_ZHE_PRODUCT_ID" \
        -H "Authorization: Bearer $BAO_TOKEN")
    echo "Response: $DELETE_RESULT"
    if echo "$DELETE_RESULT" | grep -q '"无权限'; then
        echo "✅ 正确拒绝跨品牌删除"
    else
        echo "❌ 允许了跨品牌删除"
    fi
else
    echo "⚠️ 没有找到 he_zhe 品牌商品用于测试"
fi

echo ""
echo "=========================================="
echo "测试完成"
echo "=========================================="
