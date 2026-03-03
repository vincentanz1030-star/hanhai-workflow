# Coze Bot Token 配置问题

## 问题描述

当前系统配置的 Coze Bot Token 不正确，导致无法调用 Coze AI 服务。

### 错误信息
```
The token you entered is incorrect.
```

## 根本原因

当前使用的 Token 是 **Personal Access Token (PAT)**，而不是 **Bot Token**。

### Token 类型区别

1. **Personal Access Token (PAT)**
   - 用于调用 Coze API 的通用身份验证
   - 格式：`{PAT_ID}:{PAT_TOKEN}`
   - 示例：`t812eRxKLGB4T9rG10xNr2RoeMFyZJ0G:GpqLSrEEx3r9JCYLIcJKfSt6XFW1mE78ik262I6o8cduuPITg5q0FlTYDYk2WA8j`
   - 用途：管理 Coze 账户、创建 Bot 等

2. **Bot Token**
   - 用于调用特定 Bot 的 API
   - 在 Bot 设置页面获取
   - 用途：与特定 Bot 进行对话交互

## 当前状态

✅ **本地规则引擎已启用**
- 当 Coze API 不可用时，自动使用本地规则引擎
- 支持基础对话功能：问候、自我介绍、功能说明、项目分析
- 无需网络连接，响应快速

❌ **Coze AI 服务暂不可用**
- Token 配置错误
- 需要重新获取正确的 Bot Token

## 解决方案

### 方案1：获取正确的 Bot Token（推荐）

#### 步骤1：登录 Coze 平台
访问 https://www.coze.com/

#### 步骤2：找到 Bot "禾哲OpenClaw助理"
在 Bot 列表中找到 Bot ID 为 `7612859121276125222` 的 Bot

#### 步骤3：获取 Bot Token
1. 进入 Bot 设置页面
2. 找到 "API" 或 "Token" 选项
3. 复制 Bot Token（通常不是 Base64 编码的）

#### 步骤4：更新环境变量
编辑 `.env.local` 或 `.env.production`：

```bash
# 旧的 PAT Token（错误）
COZE_BOT_TOKEN=dTgxMmVSeEtMR0I0VDlyRzEweE5yMlJvZU1GeVpKMEc6R3BxTFNyRUV4M3I5SkNZTEljSktmU3Q2WEZXMW1FNzhpazI2Mkk2bzhjZHV1UElUZzVxMEZsVFlEWWsyV0E4ag==

# 新的 Bot Token（正确）
COZE_BOT_TOKEN=your_actual_bot_token_here
```

#### 步骤5：重启服务
```bash
# 停止服务
# 重新启动
pnpm dev
```

### 方案2：继续使用本地规则引擎（无需配置）

如果暂时无法获取正确的 Bot Token，系统会自动使用本地规则引擎。

#### 本地规则引擎功能
- ✅ 问候与自我介绍
- ✅ 功能说明
- ✅ 项目分析指导
- ✅ 常见问题解答

#### 限制
- ❌ 无法进行复杂的自然语言理解
- ❌ 无法进行深度项目分析
- ❌ 无法提供个性化建议

## 验证配置

### 检查当前使用的引擎
```bash
curl http://localhost:5000/api/ai/test
```

如果返回 `"configured": true`，说明已配置 Bot Token。

### 测试对话
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"你好"}'
```

如果返回本地规则引擎的回复，说明 Coze API 不可用。

## 技术细节

### Coze Bot API 调用方式

```typescript
const response = await fetch('https://api.coze.com/v3/chat', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${COZE_BOT_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bot_id: COZE_BOT_ID,
    user: 'system-user',
    query: userMessage,
    stream: false,
  }),
});
```

### 回退机制

```typescript
try {
  // 尝试调用 Coze API
  const response = await fetch(...);
  if (!response.ok) {
    throw new Error('API 调用失败');
  }
  return cozeResponse;
} catch (error) {
  // Coze API 不可用，使用本地规则引擎
  console.warn('Coze API 不可用，使用本地规则引擎');
  return getLocalResponse(message, context);
}
```

## 相关文档

- [Coze 官方文档](https://coze.com/docs/developer_guides/authentication)
- [Bot API 文档](https://coze.com/docs/developer_guides/bot)
- [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md)
- [AI 集成总结](./AI_INTEGRATION_SUMMARY.md)

## 联系支持

如果需要帮助配置 Coze Bot，请联系：
- 系统管理员
- 或参考 Coze 官方文档

---

**最后更新：** 2026-03-03
**状态：** 本地规则引擎已启用，Coze Bot Token 需要重新配置
