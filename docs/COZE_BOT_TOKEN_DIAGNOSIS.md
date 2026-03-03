# Coze Bot 配置问题诊断

## 当前状态

❌ **Coze API 调用失败**

### 错误信息
```json
{
  "code": 4101,
  "msg": "The token you entered is incorrect"
}
```

### 已尝试的配置

#### 配置1：国际版 API
```bash
COZE_API_URL=https://api.coze.com
COZE_BOT_ID=7612859121276125222
COZE_BOT_TOKEN=sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S
```

**结果：** Token 无效

#### 配置2：中国版 API
```bash
COZE_API_URL=https://api.coze.cn
COZE_BOT_ID=7612859121276125222
COZE_BOT_TOKEN=sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S
```

**结果：** Bot 不存在

```
{"code":4200,"msg":"Requested resource bot_id=7612859121276125222 does not exist"}
```

## 问题分析

### 可能的原因

1. **Token 和 Bot ID 不匹配**
   - Token `sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S` 可能不是 Bot ID `7612859121276125222` 的授权 Token
   - Token 可能属于另一个 Bot 或账户

2. **Token 类型不正确**
   - `sat_` 开头的 Token 可能是 Service Account Token，而不是 Bot Token
   - Bot Token 通常有不同的格式

3. **Bot 配置问题**
   - Bot ID `7612859121276125222` 可能被删除或禁用
   - Bot 可能在中国区，而非国际区

## 解决方案

### 方案1：获取正确的 Bot Token（推荐）

#### 步骤1：登录 Coze 平台
访问 https://www.coze.com/

#### 步骤2：找到 Bot
找到 Bot ID 为 `7612859121276125222` 的 Bot

#### 步骤3：获取 Token
1. 进入 Bot 设置页面
2. 找到 "API" 或 "Token" 选项
3. **复制正确的 Bot Token**
4. **确认 Token 的类型是 Bot Token，而非 Service Account Token**

#### 步骤4：更新配置
编辑 `.env.local` 和 `.env.production`：

```bash
COZE_BOT_TOKEN=<你的实际 Bot Token>
```

#### 步骤5：重启服务
```bash
# 停止服务
pkill -f "next-server"

# 重新构建
cd /workspace/projects && pnpm run build

# 启动服务
bash scripts/start.sh
```

### 方案2：获取正确的 Bot ID

如果 Token 是正确的，但 Bot ID 错误：

1. 登录 Coze 平台
2. 查看你拥有的 Bot 列表
3. 找到与 Token 匹配的 Bot
4. 获取该 Bot 的 ID
5. 更新环境变量 `COZE_BOT_ID`

### 方案3：使用本地规则引擎（临时方案）

如果暂时无法获取正确的 Token 或 Bot ID，系统会自动使用本地规则引擎。

**当前可用功能：**
- ✅ 问候与自我介绍
- ✅ 功能说明
- ✅ 项目分析指导
- ✅ 常见问题解答

## 验证步骤

### 验证 Token 是否正确
```bash
curl -X POST 'https://api.coze.com/v3/chat' \
  -H 'Authorization: Bearer <你的 Token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "bot_id": "<你的 Bot ID>",
    "user": "test",
    "query": "你好"
  }'
```

### 验证服务是否使用新配置
```bash
curl http://localhost:5000/api/ai/chat
# 检查返回的 configured 字段
```

### 测试对话
```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"你好"}'
```

## 技术细节

### Coze API 版本
- **国际版：** https://api.coze.com
- **中国版：** https://api.coze.cn

### Token 类型
- **Bot Token：** 用于调用特定 Bot
- **Service Account Token (sat_)：** 用于 API 服务账号
- **Personal Access Token (PAT)：** 用于个人账号授权

### 本地规则引擎
当前系统已实现完善的回退机制，当 Coze API 不可用时自动切换到本地规则引擎。

## 当前环境变量

```bash
COZE_API_URL=https://api.coze.com
COZE_BOT_ID=7612859121276125222
COZE_BOT_TOKEN=sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S
```

## 建议

1. **确认 Token 和 Bot ID 是否匹配**
   - 检查 Coze 平台上的 Bot 设置
   - 确认 Token 是该 Bot 的授权 Token

2. **确认 Token 类型**
   - Token 应该是 Bot Token，而非 Service Account Token
   - Bot Token 格式可能不同于 `sat_` 开头

3. **确认 API 区域**
   - Bot ID `7612859121276125222` 可能在中国区
   - 如果是这样，需要使用中国区的 API：https://api.coze.cn

4. **联系 Coze 支持**
   - 如果以上方法都不奏效，请联系 Coze 技术支持

---

**最后更新：** 2026-03-03
**状态：** 等待正确的 Bot Token 配置
**临时方案：** 本地规则引擎已启用
