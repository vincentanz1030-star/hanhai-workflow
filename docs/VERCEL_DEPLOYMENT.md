# Vercel 部署详细指南

## 🚀 快速开始 - 5 步完成部署

### 方法一：通过 Vercel 网站部署（推荐新手）

#### 步骤 1：注册 Vercel 账号

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Sign Up"
3. 使用 GitHub、GitLab 或 Bitbucket 账号登录（推荐使用 GitHub）

#### 步骤 2：准备代码仓库

**如果您还没有代码仓库：**

```bash
# 1. 初始化 Git 仓库
cd /workspace/projects
git init

# 2. 添加所有文件
git add .

# 3. 提交代码
git commit -m "Initial commit"

# 4. 创建 GitHub 仓库（在 GitHub 网站上创建）
# 访问 https://github.com/new

# 5. 关联远程仓库
git remote add origin https://github.com/your-username/your-repo.git

# 6. 推送代码
git branch -M main
git push -u origin main
```

**如果您已有代码仓库：**
- 确保代码已推送到 GitHub
- 确保 `.gitignore` 文件正确配置

#### 步骤 3：在 Vercel 导入项目

1. 登录 Vercel 后，点击 "Add New..." → "Project"
2. Vercel 会自动列出您的 GitHub 仓库
3. 找到您的项目，点击 "Import"
4. 如果看不到，点击 "Import Git Repository" 输入仓库 URL

#### 步骤 4：配置项目

**Project Name:**
- 输入项目名称（如：hanhai-workflow）
- 这个名称会作为子域名（如：hanhai-workflow.vercel.app）

**Framework Preset:**
- Vercel 会自动检测为 "Next.js"
- 如果没有检测到，手动选择 "Next.js"

**Root Directory:**
- 保持为 `./`（根目录）

**Build and Output Settings:**
- Build Command: `npm run build` 或 `pnpm run build`
- Output Directory: `.next`

**Install Command:**
- `pnpm install`

**Environment Variables:**
- 点击 "Environment Variables" 下方的 "Add New"
- 添加以下环境变量：

| Name | Value | Environment |
|------|-------|-------------|
| `COZE_SUPABASE_URL` | `https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com` | Production, Preview, Development |
| `COZE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg` | Production, Preview, Development |
| `JWT_SECRET` | `hanhai-workflow-secret-key-2024` | Production, Preview, Development |
| `COZE_BUCKET_ENDPOINT_URL` | （您的对象存储端点） | Production, Preview, Development |
| `COZE_BUCKET_NAME` | （您的存储桶名称） | Production, Preview, Development |

**⚠️ 注意事项：**
- 对象存储相关的环境变量是可选的，如果不需要文件上传功能可以不配置
- JWT_SECRET 建议生产环境使用更安全的随机字符串

#### 步骤 5：部署

1. 点击 "Deploy" 按钮
2. 等待部署完成（通常需要 2-3 分钟）
3. 部署成功后，会显示访问 URL（如：`https://hanhai-workflow.vercel.app`）
4. 点击 URL 访问您的应用

---

### 方法二：通过 Vercel CLI 部署（推荐开发者）

#### 步骤 1：安装 Vercel CLI

```bash
# 使用 npm 安装
npm install -g vercel

# 使用 pnpm 安装
pnpm add -g vercel

# 使用 yarn 安装
yarn global add vercel
```

#### 步骤 2：登录 Vercel

```bash
vercel login
```

按照提示选择：
1. 登录方式（GitHub / GitLab / Bitbucket）
2. 输入邮箱
3. 验证邮箱

#### 步骤 3：部署到预览环境

```bash
# 在项目根目录执行
vercel

# 首次部署会提示：
# ? Set up and deploy "~/your-project"? [Y/n] y
# ? Which scope do you want to deploy to? Your Name
# ? Link to existing project? [y/N] n
# ? What's your project's name? hanhai-workflow
# ? In which directory is your code located? ./
# ? Want to override the settings? [y/N] n
```

部署成功后，会得到一个预览 URL（如：`https://hanhai-workflow-xyz.vercel.app`）

#### 步骤 4：添加环境变量

```bash
# 方法1：通过命令行添加
vercel env add COZE_SUPABASE_URL production
# 输入值：https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com

vercel env add COZE_SUPABASE_ANON_KEY production
# 输入值：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg

vercel env add JWT_SECRET production
# 输入值：hanhai-workflow-secret-key-2024

# 可选：添加对象存储配置
vercel env add COZE_BUCKET_ENDPOINT_URL production
vercel env add COZE_BUCKET_NAME production
```

**方法2：通过 Vercel 网站添加**
1. 访问 Vercel Dashboard
2. 选择您的项目
3. 点击 "Settings" → "Environment Variables"
4. 逐个添加环境变量

#### 步骤 5：部署到生产环境

```bash
# 部署到生产环境
vercel --prod

# 或使用别名
vercel --prod
```

部署成功后，会得到生产环境 URL（如：`https://hanhai-workflow.vercel.app`）

---

## 📋 部署后配置

### 1. 配置自定义域名

**免费域名：**
- Vercel 自动提供 `.vercel.app` 域名

**自定义域名：**
1. 在 Vercel Dashboard 选择项目
2. 点击 "Settings" → "Domains"
3. 输入您的域名（如：`www.yourdomain.com`）
4. 按照提示配置 DNS 记录

**DNS 记录配置：**
```
类型: CNAME
名称: www
值: cname.vercel-dns.com
```

### 2. 配置环境变量

**查看现有环境变量：**
```bash
vercel env ls
```

**删除环境变量：**
```bash
vercel env rm COZE_SUPABASE_URL production
```

**拉取环境变量到本地（可选）：**
```bash
vercel env pull .env.local
```

### 3. 配置自动部署

**从 GitHub 自动部署：**
1. 在 Vercel 项目设置中，选择 "Git"
2. 确保已连接 GitHub 仓库
3. 选择自动部署的分支（通常是 `main` 或 `master`）
4. 每次推送代码到该分支时，Vercel 会自动部署

**配置部署钩子：**
1. 在项目设置中，找到 "Git" → "Deploy Hooks"
2. 创建新的部署钩子
3. 将钩子 URL 添加到您的 CI/CD 流程

---

## 🔧 高级配置

### 1. 配置 vercel.json

创建 `vercel.json` 文件进行自定义配置：

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": ".next",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["hkg1"],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NEXT_PUBLIC_API_URL": "https://your-domain.com"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

**配置说明：**
- `buildCommand`: 构建命令
- `outputDirectory`: 输出目录
- `installCommand`: 安装依赖命令
- `regions`: 部署区域（可选：`hkg1` 香港、`sin1` 新加坡等）
- `headers`: 自定义 HTTP 头
- `rewrites`: URL 重写规则

### 2. 配置数据库连接

**确保 Supabase URL 和密钥正确：**
- 使用 Supabase 项目的 URL
- 使用 Supabase 项目的 anon/public 密钥
- 不要使用 service_role 密钥（不安全）

**获取 Supabase 配置：**
1. 访问 [supabase.com](https://supabase.com)
2. 进入您的项目
3. 点击 "Settings" → "API"
4. 复制以下信息：
   - Project URL
   - anon/public 密钥

### 3. 配置对象存储（可选）

**如果使用对象存储上传文件：**

1. 在 Vercel 环境变量中添加：
   ```bash
   COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint
   COZE_BUCKET_NAME=your-bucket-name
   ```

2. 确保存储桶策略允许访问：
   - 存储桶权限：公共读取
   - CORS 配置：允许跨域

---

## 🎯 部署检查清单

### 部署前

- [ ] 代码已推送到 GitHub
- [ ] `.gitignore` 文件已配置
- [ ] 环境变量已准备
- [ ] Supabase 配置正确
- [ ] 本地构建测试通过

### 部署中

- [ ] 项目成功导入 Vercel
- [ ] 构建命令正确执行
- [ ] 环境变量已添加
- [ ] 部署成功完成

### 部署后

- [ ] 可以访问部署 URL
- [ ] 健康检查通过
- [ ] 用户可以正常登录
- [ ] 文件上传功能正常（如配置）
- [ ] 自定义域名已配置（如需要）

---

## 📊 监控与维护

### 查看部署日志

**通过 Vercel Dashboard：**
1. 访问项目页面
2. 点击 "Deployments"
3. 选择一个部署
4. 点击 "View Logs"

**通过 CLI：**
```bash
vercel logs [deployment-url]
```

### 查看函数日志

```bash
# 查看实时日志
vercel logs --follow

# 查看特定部署的日志
vercel logs --build [deployment-url]
```

### 配置告警

**在 Vercel Dashboard：**
1. 项目设置 → "Notifications"
2. 配置邮件通知
3. 配置 Slack 集成（可选）
4. 配置 Webhook（可选）

### 性能监控

**使用 Vercel Analytics：**
1. 安装 `@vercel/analytics` 包
2. 在项目中初始化
3. 查看访问数据和性能指标

**使用 Speed Insights：**
1. Vercel 自动提供
2. 查看页面加载时间
3. 优化性能瓶颈

---

## 🔄 持续部署

### 自动部署流程

1. **开发阶段**
   ```bash
   # 创建功能分支
   git checkout -b feature/new-feature

   # 开发并提交
   git add .
   git commit -m "Add new feature"

   # 推送到远程
   git push origin feature/new-feature
   ```
   - Vercel 会自动部署预览版本
   - 预览 URL：`https://hanhai-workflow-feature-new-feature.vercel.app`

2. **测试阶段**
   - 在预览环境测试功能
   - 确认无误后合并到主分支

3. **生产部署**
   ```bash
   # 切换到主分支
   git checkout main

   # 合并功能分支
   git merge feature/new-feature

   # 推送到主分支
   git push origin main
   ```
   - Vercel 自动部署生产环境

### 部署策略

**Canary 部署（灰度发布）：**
- 部署到生产环境的部分用户
- 观察性能和错误
- 逐步扩大范围

**回滚部署：**
```bash
# 通过 Dashboard
# 1. 访问项目 → Deployments
# 2. 找到之前的成功部署
# 3. 点击 "..." → "Promote to Production"

# 通过 CLI
vercel rollback [deployment-url]
```

---

## 🆘 常见问题

### Q1: 部署失败怎么办？

**检查构建日志：**
1. 访问 Vercel Dashboard
2. 找到失败的部署
3. 点击 "View Logs"
4. 查看错误信息

**常见失败原因：**
- 依赖安装失败：检查 `package.json`
- 环境变量缺失：检查环境变量配置
- TypeScript 错误：本地运行 `pnpm run build` 检查
- 内存不足：升级 Vercel 计划

### Q2: 环境变量不生效？

**解决方案：**
1. 确认环境变量名称正确（大小写敏感）
2. 重新部署项目
3. 检查环境变量的环境选择（Production/Preview/Development）

### Q3: 自定义域名无法访问？

**检查步骤：**
1. DNS 记录是否正确配置
2. DNS 是否已生效（可能需要 24-48 小时）
3. Vercel 是否已验证域名
4. SSL 证书是否已签发

### Q4: 如何降级 Vercel 计划？

**降级步骤：**
1. 登录 Vercel Dashboard
2. 进入 "Billing" 设置
3. 选择降级到免费计划
4. 注意：某些功能可能不可用

### Q5: 如何备份数据？

**数据备份：**
- Supabase：使用 Supabase 的自动备份
- 对象存储：配置跨区域复制
- 代码：GitHub 已自动备份

---

## 💡 最佳实践

### 1. 使用环境变量管理配置

```bash
# 开发环境
COZE_SUPABASE_URL=dev_supabase_url

# 生产环境
COZE_SUPABASE_URL=prod_supabase_url
```

### 2. 配置 CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 3. 使用预览部署

- 每次提交到非主分支都会创建预览部署
- 用于代码审查和测试
- 避免影响生产环境

### 4. 监控部署状态

- 配置 Slack 集成
- 接收部署通知
- 快速响应问题

### 5. 优化构建速度

- 使用 `.vercelignore` 排除不必要的文件
- 缓存依赖
- 使用并行构建

---

## 📞 获取帮助

**Vercel 文档：**
- [Vercel Docs](https://vercel.com/docs)
- [Next.js 部署指南](https://vercel.com/docs/frameworks/nextjs)

**Vercel 社区：**
- [Discord](https://vercel.com/discord)
- [GitHub Discussions](https://github.com/vercel/vercel/discussions)

**技术支持：**
- [支持中心](https://vercel.com/support)
- 企业用户：邮件支持

---

## 🎉 总结

**快速部署步骤：**
1. 注册 Vercel 账号
2. 导入 GitHub 项目
3. 配置环境变量
4. 点击部署
5. 访问应用

**关键要点：**
- 免费计划适合个人和小团队
- 自动部署简化流程
- 预览部署降低风险
- 监控告警及时发现问题

**开始部署吧！** 🚀
