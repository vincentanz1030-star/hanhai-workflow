# 推送代码到 GitHub 完整指南

## 🔍 问题诊断

**错误原因：** 仓库网址无效

**根本原因：** 本地 Git 仓库还没有配置远程仓库（GitHub）

**解决方案：** 按照以下步骤将代码推送到 GitHub

---

## 📝 完整步骤（5 分钟完成）

### 步骤 1：创建 GitHub 仓库

1. **访问 GitHub**
   - 打开浏览器，访问 [github.com](https://github.com)
   - 登录您的 GitHub 账号（如果没有，请先注册）

2. **创建新仓库**
   - 点击右上角的 "+" 号
   - 选择 "New repository"
   
3. **配置仓库**
   - **Repository name**: 输入仓库名称（建议：`hanhai-workflow`）
   - **Description**: 可选，输入描述（如：瀚海集团工作流程管理系统）
   - **Public/Private**: 
     - 选择 **Public**（公开）：可以免费部署到 Vercel
     - 选择 **Private**（私有）：需要升级 Vercel 计划或使用 GitHub 个人访问令牌
   - ⚠️ **重要**：不要勾选以下选项：
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
   - 点击 "Create repository"

4. **复制仓库 URL**
   - 创建成功后，会显示仓库的 HTTPS URL
   - 格式类似：`https://github.com/your-username/hanhai-workflow.git`
   - 点击复制按钮，保存这个 URL

---

### 步骤 2：配置本地 Git

**在命令行中执行以下命令：**

```bash
# 1. 配置 Git 用户信息（如果还没配置过）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

### 步骤 3：关联远程仓库

```bash
# 替换 YOUR_GITHUB_URL 为您复制的 GitHub 仓库 URL
# 例如：https://github.com/your-username/hanhai-workflow.git

git remote add origin YOUR_GITHUB_URL
```

**示例：**
```bash
git remote add origin https://github.com/zhangsan/hanhai-workflow.git
```

**验证远程仓库：**
```bash
git remote -v
```

应该看到：
```
origin  https://github.com/your-username/hanhai-workflow.git (fetch)
origin  https://github.com/your-username/hanhai-workflow.git (push)
```

---

### 步骤 4：推送代码到 GitHub

```bash
# 1. 确认当前分支
git branch

# 如果显示 main，继续执行；如果不是，切换到 main
git checkout main

# 2. 添加所有文件到暂存区
git add .

# 3. 提交代码
git commit -m "Initial commit"

# 4. 推送代码到 GitHub
git push -u origin main
```

**如果遇到认证问题，使用以下方法：**

**方法 A：使用 GitHub Personal Access Token（推荐）**

1. **创建 GitHub Token**
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" → "Generate new token (classic)"
   - 填写：
     - Note: Vercel Deployment
     - Expiration: 选择过期时间（如 90 days）
     - 勾选权限：
       - ✅ repo (full control)
       - ✅ workflow (full control)
   - 点击 "Generate token"
   - **重要**：复制生成的 token（只显示一次）

2. **使用 Token 推送**
   ```bash
   git push -u origin main
   ```
   - 当提示输入用户名时，输入您的 GitHub 用户名
   - 当提示输入密码时，粘贴刚才复制的 Token（不是 GitHub 密码）

**方法 B：使用 GitHub CLI（gh）**

1. **安装 GitHub CLI**
   ```bash
   # macOS
   brew install gh
   
   # Linux
   sudo apt install gh
   
   # Windows
   # 下载：https://cli.github.com/
   ```

2. **登录 GitHub**
   ```bash
   gh auth login
   ```

3. **推送代码**
   ```bash
   git push -u origin main
   ```

---

### 步骤 5：验证推送成功

1. **访问您的 GitHub 仓库**
   - 浏览器打开：`https://github.com/your-username/hanhai-workflow`

2. **检查文件**
   - 应该能看到所有项目文件
   - 包括 `src/`、`package.json`、`.env.local`（如果在 .gitignore 中）

3. **确认最新提交**
   - 应该能看到 "Initial commit" 提交

---

## 🚀 现在可以在 Vercel 导入了

### 在 Vercel 导入项目

1. **访问 Vercel**
   - 打开 [vercel.com](https://vercel.com)
   - 登录您的账号

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 在 "Import Git Repository" 中输入您的仓库 URL：
     ```
     https://github.com/your-username/hanhai-workflow
     ```
   - 点击 "Import"

3. **或者从列表中选择**
   - 如果您的 GitHub 账号已授权给 Vercel
   - 可以直接在列表中看到您的仓库
   - 点击 "Import"

---

## ⚠️ 常见问题

### Q1: 提示 "Authentication failed"（认证失败）

**解决方案：**
```bash
# 清除凭据缓存
git credential-cache exit

# 重新推送
git push -u origin main
```

### Q2: 提示 "Permission denied"（权限被拒绝）

**可能原因：**
- 仓库是私有的
- Vercel 没有权限访问

**解决方案：**

**选项 1：将仓库改为公开**
1. 访问 GitHub 仓库
2. 点击 "Settings"
3. 向下滚动到 "Danger Zone"
4. 点击 "Change visibility"
5. 选择 "Make public"

**选项 2：使用 GitHub Token**
1. 创建 GitHub Personal Access Token（见步骤 4）
2. 在 Vercel 中配置：
   - Vercel Dashboard → Settings → Git
   - 添加 GitHub Token

### Q3: 提示 "Updates were rejected"（更新被拒绝）

**解决方案：**
```bash
# 如果 GitHub 仓库有 README 或其他文件
# 需要先拉取，然后合并
git pull origin main --allow-unrelated-histories

# 解决冲突后
git push -u origin main
```

### Q4: 推送速度很慢

**解决方案：**
```bash
# 1. 使用 SSH 而不是 HTTPS
git remote set-url origin git@github.com:your-username/hanhai-workflow.git

# 2. 配置 SSH 密钥
# 生成 SSH 密钥
ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# 添加到 GitHub
# 复制 ~/.ssh/id_rsa.pub 的内容
# GitHub Settings → SSH and GPG keys → New SSH key
```

---

## 📋 快速命令参考

```bash
# 完整流程（一次性执行）
git remote add origin https://github.com/your-username/hanhai-workflow.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

**如果需要使用 Token：**
```bash
git remote set-url origin https://your-token@github.com/your-username/hanhai-workflow.git
git push -u origin main
```

---

## 🎯 验证清单

**完成以下步骤后：**
- [ ] GitHub 仓库已创建
- [ ] 本地已配置远程仓库
- [ ] 代码已成功推送到 GitHub
- [ ] 可以在 GitHub 网页看到代码
- [ ] Vercel 可以导入项目

---

## 💡 下一步

推送成功后：

1. **访问 Vercel**
   - 网址：https://vercel.com
   - 登录账号

2. **导入项目**
   - 输入仓库 URL：`https://github.com/your-username/hanhai-workflow`
   - 点击 "Import"

3. **配置环境变量**
   - 添加以下环境变量：
   ```
   COZE_SUPABASE_URL=https://br-bonny-dunn-a5ffca3a.supabase2.aidap-global.cn-beijing.volces.com
   COZE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjMzNTI0OTk3ODQsInJvbGUiOiJhbm9uIn0.ViaI7gA49j2TCrou2yW6xXtRc3B06M2GURcxcXga6Pg
   JWT_SECRET=hanhai-workflow-secret-key-2024
   ```

4. **部署**
   - 点击 "Deploy"
   - 等待 2-3 分钟
   - 访问您的应用！

---

## 📞 需要帮助？

如果遇到问题，请提供：
1. 执行的命令
2. 完整的错误信息
3. Git 输出内容

祝部署顺利！🚀
