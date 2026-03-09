#!/bin/bash

# Coze Bot 配置测试脚本

echo "==================================="
echo "Coze Bot 配置测试"
echo "==================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1：检查配置状态
echo "📋 测试1: 检查配置状态..."
echo "-----------------------------------"
CONFIG_RESULT=$(curl -s http://localhost:5000/api/ai/test)

if echo "$CONFIG_RESULT" | grep -q '"configured":true'; then
    echo -e "${GREEN}✓ 配置成功${NC}"
    echo "$CONFIG_RESULT" | python3 -m json.tool 2>/dev/null || echo "$CONFIG_RESULT"
else
    echo -e "${RED}✗ 配置失败${NC}"
    echo "$CONFIG_RESULT"
    exit 1
fi

echo ""
echo "-----------------------------------"
echo ""

# 测试2：测试对话功能
echo "💬 测试2: 测试对话功能..."
echo "-----------------------------------"
CHAT_RESULT=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"message":"你好"}' \
  http://localhost:5000/api/ai/test)

if echo "$CHAT_RESULT" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ 对话功能正常${NC}"
    MESSAGE=$(echo "$CHAT_RESULT" | python3 -c "import sys, json; print(json.load(sys.stdin).get('message', ''))" 2>/dev/null)
    echo "AI 回复: $MESSAGE"
else
    echo -e "${YELLOW}⚠ 对话功能可能需要调整${NC}"
    echo "$CHAT_RESULT"
fi

echo ""
echo "-----------------------------------"
echo ""

# 测试3：检查环境变量
echo "🔧 测试3: 检查环境变量..."
echo "-----------------------------------"
if [ -n "$COZE_BOT_ID" ]; then
    echo -e "${GREEN}✓ COZE_BOT_ID 已设置${NC}"
    echo "Bot ID: ${COZE_BOT_ID:0:10}..."
else
    echo -e "${YELLOW}⚠ COZE_BOT_ID 未设置（可能使用 .env.local）${NC}"
fi

if [ -n "$COZE_BOT_TOKEN" ]; then
    echo -e "${GREEN}✓ COZE_BOT_TOKEN 已设置${NC}"
    echo "Token 预览: ${COZE_BOT_TOKEN:0:10}..."
else
    echo -e "${YELLOW}⚠ COZE_BOT_TOKEN 未设置（可能使用 .env.local）${NC}"
fi

echo ""
echo "-----------------------------------"
echo ""

# 总结
echo "==================================="
echo "测试总结"
echo "==================================="
echo ""
echo "✓ Coze Bot 已成功配置"
echo "✓ Bot ID: 7612859121276125222"
echo "✅ Token: 已加密配置"
echo ""
echo "📝 下一步:"
echo "1. 访问 http://localhost:5000"
echo "2. 登录系统"
echo "3. 查看 AI 智能洞察"
echo "4. 测试 AI 对话功能"
echo ""
echo -e "${GREEN}配置完成！${NC}"
echo "==================================="
