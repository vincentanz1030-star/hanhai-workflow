# Vercel 部署完整指南

## 前置条件

✅ 已完成：
- 代码已推送到 GitHub
- GitHub 仓库：`https://github.com/vincentanz1030-star/hanhai-workflow`
- 环境变量已准备好

---

## 方法 1：从 Vercel 网站部署（推荐）

### 步骤 1：登录 Vercel

1. 访问 [vercel.com](https://vercel.com)
2. 点击右上角 "Sign Up" 或 "Log In"
3. 选择 **使用 GitHub 账号登录**（推荐）
4. 授权 Vercel 访问您的 GitHub 仓库

### 步骤 2：导入项目

#### 2.1 进入项目导入页面

点击右上角 **"Add New..."** → **"Project"**

#### 2.2 导入 GitHub 仓库

Vercel 会显示您的 GitHub 仓库列表：
- 找到 `vincentanz1030-star/hanhai-workflow`
- 点击右侧的 **"Import"** 按钮

### 步骤 3：配置项目

#### 3.1 项目设置

在 "Configure Project" 页面：

| 设置项 | 值 | 说明 |
|--------|-----|------|
| **Project Name** | `hanhai-workflow` | 项目名称 |
| **Framework Preset** | `Next.js` | 自动检测 |
| **Root Directory** | `./` | 根目录 |
| **Build Command** | `pnpm run build` | 自动识别 |
| **Install Command** | `pnpm install` | 自动识别 |
| **Output Directory** | `.next` | Next.js 默认 |

**注意**：这些设置应该自动填充，无需手动修改。

#### 3.2 配置环境变量

在 "Environment Variables" 部分，点击 **"Add New"**，逐个添加：

**必需的环境变量：**

1. **COZE_SUPABASE_URL**
   - Name: `COZE_SUPABASE_URL`
   - Value: `https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com`
   - Environments: ✅ Production ✅ Preview ✅ Development

2. **COZE_SUPABASE_ANON_KEY**
   - Name: `COZE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg`
   - Environments: ✅ Production ✅ Preview ✅ Development

3. **JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: `hanhai-workflow-secret-key-2024`
   - Environments: ✅ Production ✅ Preview ✅ Development

**⚠️ 重要提示：**
- 三个复选框都要勾选：Production、Preview、Development
- Value 要完全复制，不要有空格或换行
- 点击 "Add" 添加每个变量

#### 3.3 高级设置（可选）

不需要修改。Vercel 会自动识别：
- Node.js 版本
- 包管理器（pnpm）
- 构建输出目录

### 步骤 4：部署

1. 检查所有配置是否正确
2. 点击页面底部的 **"Deploy"** 按钮
3. 等待部署完成（通常 2-3 分钟）

### 步骤 5：访问应用

部署成功后：
- **生产环境 URL**: `https://hanhai-workflow.vercel.app`
- **每次部署**: Vercel 会生成一个预览 URL

---

## 方法 2：使用 Vercel CLI 部署

### 步骤 1：安装 Vercel CLI

```bash
# macOS
brew install vercel

# Linux
npm i -g vercel

# Windows (PowerShell)
npm i -g vercel
```

### 步骤 2：登录

```bash
vercel login
```

选择 **Continue with GitHub**

### 步骤 3：部署到生产环境

```bash
vercel --prod
```

按照提示操作：
1. Link to existing project? → No
2. Set up and deploy? → hanhai-workflow
3. Link to hanhai-workflow? → Yes

### 步骤 4：配置环境变量

访问 Vercel 网站配置环境变量（同方法 1 的步骤 3.2）

---

## 故障排查

### 问题 1：构建失败 - "pnpm not found"

**原因**：Vercel 未正确识别 pnpm

**解决方案**：

检查 `package.json` 是否包含：
```json
{
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "pnpm": ">=9.0.0"
  },
  "scripts": {
    "preinstall": "npx only-allow pnpm"
  }
}
```

检查 `.npmrc` 是否存在：
```
shamefully-hoist=true
strict-peer-dependencies=false
```

### 问题 2：构建失败 - "Missing environment variables"

**原因**：环境变量未正确配置

**解决方案**：

1. 在 Vercel 项目页面
2. 点击 **Settings** → **Environment Variables**
3. 检查是否已添加以下变量：
   - COZE_SUPABASE_URL
   - COZE_SUPABASE_ANON_KEY
   - JWT_SECRET
4. 确保三个环境（Production、Preview、Development）都已勾选

### 问题 3：构建超时

**原因**：构建时间过长或依赖下载慢

**解决方案**：

1. 点击 Deployments 标签
2. 找到失败的部署
3. 点击右侧 **···** → **Redeploy**

### 问题 4：部署成功但无法访问

**原因**：可能是应用启动失败

**解决方案**：

1. 检查部署日志
2. 查看是否有运行时错误
3. 访问诊断页面：`https://hanhai-workflow.vercel.app/diagnostic/health`

---

## 验证部署

部署完成后，访问以下页面验证功能：

### 1. 健康检查

```
https://hanhai-workflow.vercel.app/diagnostic/health
```

应该返回：
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 2. 环境变量检查

```
https://hanhai-workflow.vercel.app/api/diagnostic/env-check
```

应该返回所有必需的环境变量状态。

### 3. 登录页面

```
https://hanhai-workflow.vercel.app/login
```

应该显示登录表单。

### 4. 创建测试用户

1. 注册一个新账号
2. 登录系统
3. 尝试创建项目

---

## 常用操作

### 查看部署日志

1. 访问 [vercel.com](https://vercel.com)
2. 进入项目
3. 点击 **Deployments** 标签
4. 点击某个部署查看日志

### 重新部署

**方法 A：触发新部署**
```bash
git push origin main
```

**方法 B：在 Vercel 重新部署**
1. Deployments 标签
2. 找到要重新部署的提交
3. 点击 **···** → **Redeploy**

### 查看环境变量

1. 进入项目
2. 点击 **Settings** → **Environment Variables**

### 查看部署日志

1. Deployments 标签
2. 点击某个部署
3. 查看构建日志和运行时日志

---

## 性能优化

### 启用 Edge Runtime（可选）

如果某些 API 路由需要更快的响应速度，可以修改为 Edge Runtime：

```typescript
// src/app/api/example/route.ts
export const runtime = 'edge';
```

### 自定义域名（可选）

1. 进入项目
2. 点击 **Settings** → **Domains**
3. 添加您的域名

### 分析性能

1. 进入项目
2. 点击 **Analytics** 标签
3. 查看访问统计和性能数据

---

## 成本说明

Vercel 免费套餐包含：
- ✅ 无限部署
- ✅ 100GB 带宽/月
- ✅ 10000 分钟构建/月
- ✅ 6 个并发构建

超出免费额度后：
- Pro 计划：$20/月
- 更多功能：查看 [vercel.com/pricing](https://vercel.com/pricing)

---

## 总结

**快速部署步骤（3 分钟）：**

1. 访问 [vercel.com](https://vercel.com)，使用 GitHub 登录
2. 点击 "Add New" → "Project"
3. 导入 `hanhai-workflow` 仓库
4. 添加 3 个环境变量（COZE_SUPABASE_URL, COZE_SUPABASE_ANON_KEY, JWT_SECRET）
5. 点击 "Deploy"
6. 等待 2-3 分钟
7. 访问 `https://hanhai-workflow.vercel.app`

**祝部署顺利！🚀**
