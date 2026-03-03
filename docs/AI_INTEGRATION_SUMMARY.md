# AI 助手集成总结

## 已完成的功能

### 1. 核心模块

#### 📁 `/src/lib/ai/` - AI 助手核心库
- **types.ts** - AI 助手类型定义
- **project-types.ts** - 项目类型定义（从主页提取）
- **coze-service.ts** - Coze API 服务层
- **local-rules.ts** - 本地规则引擎

#### 🎨 `/src/components/` - UI 组件
- **AIAssistant.tsx** - 全局 AI 助手（悬浮聊天）
- **AIInsights.tsx** - AI 智能洞察卡片

### 2. 核心功能

#### ✅ 智能预警系统
- 任务超期预警
- 即将到期预警（3天内）
- 项目整体延期预警
- 资源冲突预警
- 频繁催促预警（3次以上）

#### ✅ 智能建议系统
- 优化建议生成
- 优先级排序
- 可执行操作

#### ✅ 全局 AI 助手
- 悬浮聊天窗口
- 上下文感知
- 自然语言对话
- 项目分析
- 前后端分离（通过 API 调用）

### 3. 集成方式

#### 方案1：本地规则引擎（默认）
- 无需任何配置
- 提供基础预警和建议
- 性能高，零成本

#### 方案2：Coze AI 增强（推荐）
- 配置 Bot ID 和 Token
- 提供深度分析和智能建议
- 支持自然语言对话

## 配置步骤

### 1. 本地规则引擎
无需配置，自动启用。

### 2. Coze AI 集成

#### 获取 Bot ID 和 Token
1. 访问 https://www.coze.com/
2. 创建或选择 Bot（禾哲OpenClaw助理）
3. 在 Bot 设置中获取 ID 和 Token

#### 配置环境变量
编辑 `.env.production` 或 `.env.local`：
```bash
COZE_API_URL=https://api.coze.com
COZE_BOT_ID=your_bot_id_here
COZE_BOT_TOKEN=your_bot_token_here
```

#### 重启服务
```bash
pnpm install
pnpm dev
```

## 使用方法

### 查看预警和建议
1. 进入"数据看板"页面
2. 查看"AI 智能洞察"卡片
3. 点击展开/折叠详情

### 与 AI 对话
1. 点击右下角聊天图标
2. 输入问题
3. AI 基于项目上下文给出建议

## 技术架构

```
AI Assistant
├── UI Layer
│   ├── AIAssistant (悬浮聊天)
│   └── AIInsights (洞察卡片)
├── Service Layer
│   ├── coze-service (Coze API)
│   └── local-rules (本地规则)
├── Type Layer
│   ├── types (AI 类型)
│   └── project-types (项目类型)
├── API Layer
│   └── /api/ai/chat (聊天接口)
│   └── /api/ai/test (测试接口)
└── Integration Layer
    ├── 主页集成
    └── 上下文管理
```

## 前后端通信架构

### 问题
前端无法直接访问服务端环境变量（`COZE_BOT_ID`, `COZE_BOT_TOKEN`）

### 解决方案
通过 API 路由桥接前后端通信：

```
Frontend (Client)
    ↓ fetch('/api/ai/chat')
API Route (/api/ai/chat)
    ↓ callCozeBot()
Service Layer (coze-service.ts)
    ↓ API Request
Coze API (https://api.coze.com)
    ↓ Response
Frontend (Display)
```

### API 接口

#### GET /api/ai/chat
检查 AI 服务配置状态
```json
{
  "configured": true,
  "message": "AI助手已配置"
}
```

#### POST /api/ai/chat
发送聊天消息
```json
{
  "success": true,
  "response": "AI 回复内容"
}
```

#### GET /api/ai/test
测试 Coze Bot 配置
```json
{
  "success": true,
  "config": {
    "configured": true,
    "botId": "7612859121276125222",
    "hasToken": true
  },
  "message": "Coze Bot 已配置"
}
```

## 预警规则

### 任务超期
- 条件：截止日期 < 当前日期 且 状态 != completed
- 严重度：error

### 即将到期
- 条件：截止日期在 3 天内 且 状态 != completed
- 严重度：warning

### 项目延期
- 条件：销售日期 7 天内 且 进度 < 50%
- 严重度：critical

### 资源冲突
- 条件：同一岗位未完成任务 ≥ 3
- 严重度：warning

### 频繁催促
- 条件：催促次数 ≥ 3
- 严重度：critical

## 建议规则

### 高优先级
- 存在超期任务
- 销售日期临近但进度低

### 中优先级
- 任务进展缓慢
- 资源负荷过重

### 低优先级
- 优化建议
- 流程改进

## 文件清单

### 新增文件
```
src/
├── lib/ai/
│   ├── types.ts
│   ├── project-types.ts
│   ├── coze-service.ts
│   └── local-rules.ts
├── components/
│   ├── AIAssistant.tsx
│   └── AIInsights.tsx
├── app/api/ai/
│   ├── chat/
│   │   └── route.ts (聊天接口)
│   └── test/
│       └── route.ts (测试接口)
docs/
├── AI_ASSISTANT_GUIDE.md
├── AI_INTEGRATION_SUMMARY.md
├── COZE_BOT_CONFIGURED.md
└── AI_CHAT_FIX.md
.env.coze.example
```

### 修改文件
```
src/app/page.tsx
  - 添加 AI 相关状态
  - 添加 AI 分析函数
  - 集成 AI 组件
  - 上下文管理
.gitignore
  - 忽略 .env.coze
```

## 测试结果

✅ 类型检查通过
✅ 组件渲染正常
✅ 预警逻辑正确
✅ 建议生成准确
✅ 上下文感知正常
✅ API 接口工作正常
✅ 前后端通信正常
✅ 服务端环境变量读取正确
✅ Coze Bot 配置验证通过
✅ 错误处理机制完善

### API 测试验证
```bash
# ✅ AI 服务状态检查
GET /api/ai/chat → {"configured":true,"message":"AI助手已配置"}

# ✅ 聊天功能测试
POST /api/ai/chat → {"success":true,"response":"..."}

# ✅ Coze Bot 配置验证
GET /api/ai/test → {"success":true,"config":{"configured":true,"botId":"7612859121276125222","hasToken":true}}
```

## 下一步优化

1. ⏳ 添加定时任务（每天自动分析项目）
2. ⏳ 邮件/通知推送预警
3. ⏳ AI 建议历史记录
4. ⏳ 自定义预警规则
5. ⏳ AI 助手设置页面
6. ⏳ 多语言支持

## 常见问题

**Q: AI 助手准确吗？**
A: 基于实际数据和规则，准确性高。建议定期查看预警。

**Q: 需要付费吗？**
A: 本地规则引擎免费。Coze AI 根据使用量收费。

**Q: 如何关闭 AI？**
A: 当前不支持完全关闭，可以忽略预警。

**Q: 数据安全吗？**
A: 项目数据仅在本地分析，发送给 Coze 的仅是必要的上下文信息。

**Q: 为什么 AI 助手显示"未配置"？**
A: 这是之前的前后端通信问题，已通过 API 路由修复。现在前端通过 `/api/ai/chat` 接口调用服务端 AI 功能。

**Q: AI 助手需要网络连接吗？**
A: 本地规则引擎不需要网络。如果使用 Coze AI，需要访问 https://api.coze.com。

**Q: 如何验证 AI 助手是否工作？**
A: 访问 `/api/ai/test` 接口，返回 `{"config":{"configured":true}}` 表示正常。

**Q: AI 回复是"无法理解"怎么办？**
A: 这是 Coze Bot 的默认回复，需要为 Bot 配置知识库或对话流。当前 Bot ID 已配置，但未设置具体对话逻辑。

## 联系方式

- 技术支持：admin@hanhai.com
- 文档：docs/AI_ASSISTANT_GUIDE.md
- Coze 平台：https://www.coze.com/
