# 自定义 API Bridge 配置完成

## 已完成的配置

### 环境变量更新

已将以下配置更新到 `.env.local` 和 `.env.production`：

```bash
COZE_API_URL=http://localhost:5001
COZE_BOT_ID=7612859121276125222
COZE_BOT_TOKEN=hanhai-1772521174-cc6493d7
COZE_API_PATH=/api/chat
COZE_API_KEY_HEADER=X-API-Key
COZE_USE_CUSTOM_API=true
```

### 代码修改

**src/lib/ai/coze-service.ts**
- 支持自定义 API Bridge 配置
- 使用 `COZE_USE_CUSTOM_API` 环境变量切换 API 模式
- 自定义 API 使用 `X-API-Key` header
- 支持自定义 API 的返回格式（`reply`、`response`、`message`）

### 测试结果

**日志显示：**
```
使用自定义 API: http://localhost:5001/api/chat
调用 API 失败: TypeError: fetch failed
Coze API 调用失败，使用本地规则引擎
```

**结果：**
- ✅ 代码已正确配置为使用自定义 API
- ❌ 自定义 API 服务（http://localhost:5001）未启动
- ✅ 回退到本地规则引擎正常工作

## 需要完成的步骤

### 步骤1：启动自定义 API 服务

需要在 `localhost:5001` 启动 API Bridge 服务。

**API 服务配置：**
```
URL: http://localhost:5001/api/chat
Method: POST
Headers:
  Content-Type: application/json
  X-API-Key: hanhai-1772521174-cc6493d7
Body:
  {
    "message": "用户消息",
    "context": {
      "platform": "瀚海集团工作流平台",
      "botId": "7612859121276125222",
      "projectId": "...",
      "projectName": "..."
    }
  }
```

**预期返回格式：**
```json
{
  "reply": "AI 回复内容",
  // 或者
  "response": "AI 回复内容",
  // 或者
  "message": "AI 回复内容"
}
```

### 步骤2：验证 API 服务

启动自定义 API 服务后，测试连接：

```bash
curl -X POST http://localhost:5001/api/chat \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: hanhai-1772521174-cc6493d7' \
  -d '{
    "message": "你好",
    "context": {
      "platform": "瀚海集团工作流平台"
    }
  }'
```

### 步骤3：测试集成

API 服务启动后，测试系统集成：

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"你好"}'
```

## 代码架构

### API 调用流程

```
用户消息
    ↓
前端组件 (AIAssistant.tsx)
    ↓ fetch('/api/ai/chat')
API 路由 (/api/ai/chat)
    ↓ 调用 coze-service.ts
检查 COZE_USE_CUSTOM_API
    ├─ true → 调用自定义 API (localhost:5001)
    └─ false → 调用 Coze API (api.coze.com)
提取回复
    ↓
用户界面显示
```

### 回退机制

```
尝试调用 API
    ├─ 成功 → 返回 AI 回复
    └─ 失败 → 本地规则引擎回退
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 当前值 |
|--------|------|--------|
| COZE_API_URL | API 基础 URL | http://localhost:5001 |
| COZE_API_PATH | API 路径 | /api/chat |
| COZE_BOT_ID | Bot ID | 7612859121276125222 |
| COZE_BOT_TOKEN | API Key | hanhai-1772521174-cc6493d7 |
| COZE_API_KEY_HEADER | API Key Header 名称 | X-API-Key |
| COZE_USE_CUSTOM_API | 是否使用自定义 API | true |

### API 模式切换

**使用自定义 API：**
```bash
COZE_USE_CUSTOM_API=true
COZE_API_URL=http://localhost:5001
COZE_API_KEY_HEADER=X-API-Key
```

**使用 Coze API：**
```bash
COZE_USE_CUSTOM_API=false
COZE_API_URL=https://api.coze.com
COZE_API_KEY_HEADER=Authorization
```

## 当前状态

✅ **代码配置完成**
- 环境变量已更新
- 代码已支持自定义 API
- 回退机制已实现

✅ **本地规则引擎可用**
- 自定义 API 未启动时自动切换
- 用户可以正常使用基础功能

⏳ **等待自定义 API 服务启动**
- 需要在 localhost:5001 启动 API 服务
- API 服务需要支持指定的请求格式

## 用户可以做什么

**现在就可以使用：**
- 点击右下角聊天图标
- 输入："你好"、"你是谁"、"功能介绍"
- 获得本地规则引擎的回复

**自定义 API 启动后：**
- 获得更智能的 AI 回复
- 支持更复杂的对话场景
- 可以使用 Coze Bot 的全部功能

## 相关文档

- [AI 助手使用指南](./AI_ASSISTANT_GUIDE.md)
- [AI 集成总结](./AI_INTEGRATION_SUMMARY.md)
- [Coze Bot Token 诊断](./COZE_BOT_TOKEN_DIAGNOSIS.md)

---

**最后更新：** 2026-03-03
**状态：** 自定义 API 配置完成，等待 API 服务启动
**临时方案：** 本地规则引擎已启用
