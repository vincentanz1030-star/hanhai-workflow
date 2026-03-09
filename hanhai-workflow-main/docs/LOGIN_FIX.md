# 登录问题修复指南

## ❌ 问题描述

登录时出现错误：
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## 🔍 问题原因

服务缺少 `JWT_SECRET` 环境变量，导致 API 返回 500 错误页面而不是 JSON 数据。

## ✅ 已修复

### 修复内容
1. ✅ 添加了所有必需的环境变量到 `.env.local`
2. ✅ 重启了开发服务器
3. ✅ 验证服务正常运行

### 环境变量配置
```bash
# Supabase Configuration
COZE_SUPABASE_URL=https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com
COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg

# JWT Secret
JWT_SECRET=hanhai-workflow-secret-key-2024

# Coze AI Configuration
COZE_API_URL=https://api.coze.com
COZE_BOT_ID=7612859121276125222
COZE_BOT_TOKEN=dDgxMmVSeEtMR0I0VDlyRzEweE5yMlJvZU1GeVpKMEc6R3BxTFNyRUV4M3I5SkNZTEljSktmU3Q2WEZXMW1FNzhpazI2Mkk2bzhjZHV1UElUZzVxMEZsVFlEWWsyV0E4ag==
```

## 🧪 验证测试

### 测试1：健康检查
```bash
curl http://localhost:5000/api/health-check
```
**预期结果**: 返回 JSON 格式的健康检查信息

### 测试2：登录 API
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}' \
  http://localhost:5000/api/auth/login
```
**预期结果**:
- 成功：`{"token":"...","user":{...}}`
- 失败：`{"error":"邮箱或密码错误"}`

**注意**: 不应再返回 HTML 格式的错误页面

## 📝 环境变量说明

### 必需的环境变量
1. **COZE_SUPABASE_URL** - Supabase 数据库地址
2. **COZE_SUPABASE_ANON_KEY** - Supabase 匿名访问密钥
3. **JWT_SECRET** - JWT 签名密钥（用于用户认证）

### 可选的环境变量
1. **COZE_API_URL** - Coze API 地址
2. **COZE_BOT_ID** - Coze Bot ID
3. **COZE_BOT_TOKEN** - Coze Bot Token

## 🔧 故障排查

### 如果登录仍然失败

#### 检查1：服务是否正常运行
```bash
ss -lptn 'sport = :5000'
```
应该看到服务正在监听 5000 端口。

#### 检查2：环境变量是否加载
```bash
curl http://localhost:5000/api/health-check
```
查看是否返回 `{"overall":"ok"}`

#### 检查3：查看服务日志
```bash
tail -n 50 /app/work/logs/bypass/dev.log
```
查看是否有错误信息。

#### 检查4：浏览器控制台
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 查看 Network 标签，找到登录请求
4. 查看响应内容

## 🚀 重启服务步骤

如果需要手动重启服务：

### 停止服务
```bash
# 查找进程
ss -lptn 'sport = :5000'

# 停止进程（替换 PID）
kill <PID>

# 或者
pkill -f "next-server"
```

### 启动服务
```bash
cd /workspace/projects
coze dev > /app/work/logs/bypass/dev.log 2>&1 &
```

### 等待启动
```bash
sleep 5
curl http://localhost:5000/api/health-check
```

## 📋 登录流程

1. 用户输入邮箱和密码
2. 前端调用 `/api/auth/login` API
3. 后端验证用户凭证
4. 生成 JWT Token
5. 返回 Token 和用户信息
6. 前端保存 Token 到 localStorage
7. 跳转到主页

## ⚠️ 注意事项

### 环境变量文件
- `.env.local` - 开发环境（本地使用）
- `.env.production` - 生产环境（部署使用）
- `.env.local` 优先级高于 `.env.production`

### 安全建议
- 不要提交 `.env.local` 到代码仓库
- 不要在公开场合分享 Token 和密钥
- 定期更换 JWT_SECRET

## 🎯 现在可以做什么

1. ✅ 访问 http://localhost:5000/login
2. ✅ 使用已注册账号登录
3. ✅ 查看项目列表
4. ✅ 使用 AI 助手
5. ✅ 创建新项目

## 📞 如果还有问题

请检查：
1. 浏览器控制台是否有错误
2. 网络请求的响应内容
3. 服务日志是否有错误

或者提供以下信息：
- 浏览器控制台错误信息
- Network 标签中登录请求的响应
- 服务日志中的错误信息

---

**问题已解决，现在可以正常登录了！** 🎉
