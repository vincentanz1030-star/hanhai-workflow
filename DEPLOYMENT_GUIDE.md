# 瀚海集团工作流程管理系统 - 部署指南

本文档提供系统的部署指南和常见问题解决方案。

---

## 📋 前置要求

### 环境变量

项目需要以下环境变量才能正常运行：

| 环境变量 | 说明 | 必需 | 示例值 |
|---------|------|------|--------|
| `COZE_SUPABASE_URL` | Supabase 数据库 URL | ✅ 是 | `https://xxx.supabase.co` |
| `COZE_SUPABASE_ANON_KEY` | Supabase 匿名访问密钥 | ✅ 是 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `JWT_SECRET` | JWT Token 签名密钥 | ✅ 是 | `your-strong-secret-key` |

⚠️ **重要**：
- `JWT_SECRET` 必须设置为强密钥，否则应用将无法启动
- 建议使用至少 32 字符的随机字符串

---

## 🚀 部署步骤

### 开发环境

```bash
# 安装依赖
bash scripts/prepare.sh

# 启动开发服务器（自动热更新）
bash scripts/dev.sh
```

开发服务器将在 http://localhost:5000 启动。

### 生产环境

```bash
# 1. 构建
bash scripts/build.sh

# 2. 启动
bash scripts/start.sh
```

生产服务器将在 http://localhost:5000 启动。

---

## 🔧 环境变量配置

### 配置方法

在项目根目录创建或编辑 `.env.local` 文件：

```bash
# Supabase 配置
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key-here

# JWT 密钥（必须设置）
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

### 生成安全的 JWT_SECRET

使用以下命令生成随机密钥：

```bash
# Linux/Mac
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## ❌ 常见错误及解决方案

### 1. 构建失败：JWT_SECRET 环境变量未设置

**错误信息**：
```
Error: JWT_SECRET 环境变量未设置，请在环境变量中配置强密钥
```

**原因**：
项目现在强制要求 `JWT_SECRET` 环境变量，以提高安全性。

**解决方案**：

1. 在 `.env.local` 文件中添加 `JWT_SECRET`：
```bash
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

2. 或者通过环境变量设置：
```bash
export JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

---

### 2. 构建失败：Supabase 环境变量未设置

**错误信息**：
```
Supabase 环境变量未设置
```

**解决方案**：

在 `.env.local` 文件中添加：
```bash
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

### 3. 构建失败：unbound variable 错误

**错误信息**：
```
./scripts/build.sh: line 15: COZE_SUPABASE_URL: unbound variable
```

**说明**：
这是一个 Bash 脚本错误，通常表示环境变量未正确加载。

**原因**：
- `.env.local` 文件不存在或格式错误
- 环境变量值包含特殊字符（如引号、空格等）

**解决方案**：

1. 确保 `.env.local` 文件存在：
```bash
ls -la .env.local
```

2. 检查 `.env.local` 文件格式，确保没有语法错误：
```bash
# 正确格式
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key

# 错误格式（值中的引号会导致问题）
COZE_SUPABASE_URL="https://your-project.supabase.co"
```

3. 验证环境变量是否正确加载：
```bash
bash -c "export \$(cat .env.local | grep -v '^#' | xargs) && echo 'COZE_SUPABASE_URL:' \$COZE_SUPABASE_URL"
```

4. 如果环境变量值包含特殊字符，使用 `source` 命令加载：
```bash
# 修改 .env.local 为正确的 shell 格式
export COZE_SUPABASE_URL="https://your-project.supabase.co"
export COZE_SUPABASE_ANON_KEY="your-anon-key"
export JWT_SECRET="your-secret-key"

# 然后在脚本中 source
if [ -f .env.local ]; then
  source .env.local
fi
```

---

### 4. 构建失败：unbound variable 错误

**错误信息**：
```
./scripts/build.sh: line 15: COZE_SUPABASE_URL: unbound variable
```

**说明**：
这是一个 Bash 脚本错误，通常表示环境变量未正确加载。

**原因**：
- `.env.local` 文件不存在或格式错误
- 环境变量值包含特殊字符（如引号、空格等）

**解决方案**：

1. 确保 `.env.local` 文件存在：
```bash
ls -la .env.local
```

2. 检查 `.env.local` 文件格式，确保没有语法错误：
```bash
# 正确格式
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-secret-key

# 错误格式（值中的引号会导致问题）
COZE_SUPABASE_URL="https://your-project.supabase.co"
```

3. 验证环境变量是否正确加载：
```bash
bash -c "export \$(cat .env.local | grep -v '^#' | xargs) && echo 'COZE_SUPABASE_URL:' \$COZE_SUPABASE_URL"
```

4. 如果环境变量值包含特殊字符，使用 `source` 命令加载：
```bash
# 修改 .env.local 为正确的 shell 格式
export COZE_SUPABASE_URL="https://your-project.supabase.co"
export COZE_SUPABASE_ANON_KEY="your-anon-key"
export JWT_SECRET="your-secret-key"

# 然后在脚本中 source
if [ -f .env.local ]; then
  source .env.local
fi
```

---

### 5. 部署环境中环境变量未设置

**错误信息**：
```
Error: COZE_SUPABASE_URL is not set
```

**说明**：
在部署环境中，`.env.local` 文件可能不存在或不包含必需的环境变量。

**原因**：
- `.env.local` 文件在 `.gitignore` 中被忽略，未包含在部署包中
- 部署平台需要通过其他方式提供环境变量

**解决方案**：

**方案 A：在部署平台中配置环境变量（推荐）**

在部署平台（如 Coze、Vercel、AWS 等）的环境中配置以下环境变量：
- `COZE_SUPABASE_URL`
- `COZE_SUPABASE_ANON_KEY`
- `JWT_SECRET`

**方案 B：在部署包中包含 .env 文件**

1. 创建 `.env.production` 文件（包含生产环境的环境变量）
2. 确保 `.env.production` 不在 `.gitignore` 中
3. 脚本将自动加载 `.env.production` 文件

**方案 C：使用 secrets 管理工具**

使用部署平台提供的 secrets 管理功能：
```bash
# 在部署平台中设置 secrets
COZE_SUPABASE_URL=<your_url>
COZE_SUPABASE_ANON_KEY=<your_key>
JWT_SECRET=<your_secret>
```

---

### 6. Middleware 警告

**警告信息**：
```
⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
```

**说明**：
这是一个警告，不影响应用功能。Next.js 16 将 `middleware` 重命名为 `proxy`。

**解决方案**：
可以暂时忽略此警告，或在未来版本中将 `src/middleware.ts` 重命名为 `src/proxy.ts`。

---

### 5. 多个 lockfile 警告

**警告信息**：
```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
 We detected multiple lockfiles and selected the directory of /pnpm-lock.yaml
```

**说明**：
这是一个警告，不影响构建。

**解决方案**：
可以忽略此警告，或在 `next.config.ts` 中设置：
```typescript
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};
```

---

## 📊 部署检查清单

在部署前，确保完成以下检查：

- [ ] `.env.local` 文件已配置所有必需的环境变量
- [ ] `JWT_SECRET` 已设置为强密钥（至少 32 字符）
- [ ] `COZE_SUPABASE_URL` 和 `COZE_SUPABASE_ANON_KEY` 已正确配置
- [ ] 数据库已初始化（所有表已创建）
- [ ] 运行 `bash scripts/build.sh` 构建成功
- [ ] 运行 `bash scripts/start.sh` 启动成功
- [ ] 访问 http://localhost:5000 确认应用正常运行

---

## 🔐 安全建议

1. **不要在代码中硬编码密钥**
   - 始终使用环境变量存储敏感信息
   - 不要将 `.env.local` 提交到版本控制

2. **生产环境使用强密钥**
   - `JWT_SECRET` 应该使用至少 32 字符的随机字符串
   - 定期更换 JWT 密钥

3. **限制文件访问权限**
   - 确保 `.env.local` 文件只有必要用户可读
   - 设置文件权限：`chmod 600 .env.local`

4. **使用 HTTPS**
   - 在生产环境中始终使用 HTTPS
   - 确保 JWT Cookie 设置了 `secure` 标志

---

## 📞 技术支持

如果遇到其他问题，请联系：
- 技术支持：support@hanhai.com
- 开发团队：dev@hanhai.com

---

**最后更新**: 2026-03-01
**版本**: 1.0
