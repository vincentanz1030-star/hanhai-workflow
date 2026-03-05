# 国内可访问部署方案

由于 Vercel 域名在国内无法直接访问，以下是几种国内可用的部署方案：

---

## 方案 1：扣子编程部署（推荐）✅

### 优势
- ✅ 国内直接可访问
- ✅ 无需配置代理
- ✅ 自动部署
- ✅ 免费

### 部署步骤

#### 1. 确认扣子编程环境

检查是否在扣子编程环境中：

```bash
# 检查环境变量
echo $COZE_WORKSPACE_PATH

# 应该输出类似：
# /workspace/projects/
```

#### 2. 启动服务

在扣子编程环境中启动服务：

```bash
# 进入项目目录
cd ${COZE_WORKSPACE_PATH}

# 启动开发服务（端口 5000）
coze dev > /app/work/logs/bypass/dev.log 2>&1 &

# 检查服务状态
curl -I http://localhost:5000
```

#### 3. 访问应用

通过扣子编程提供的预览 URL 访问应用。

---

## 方案 2：配置 Vercel 自定义域名

### 优势
- ✅ 使用自己的域名
- ✅ 可以备案后在国内访问
- ✅ 保持使用 Vercel 服务器

### 部署步骤

#### 1. 购买域名

购买一个国内可用的域名（如：阿里云、腾讯云）。

#### 2. 配置域名 DNS

在 Vercel 项目中配置自定义域名：

1. Vercel 项目 → Settings → Domains
2. 添加您的域名
3. Vercel 会提供 DNS 记录

#### 3. 配置 DNS 解析

在域名服务商处添加 DNS 记录：

```
类型: CNAME
主机记录: @
记录值: cname.vercel-dns.com
```

#### 4. 域名备案（可选）

如果需要在国内长期稳定访问，建议进行 ICP 备案。

#### 5. 访问应用

通过自定义域名访问应用：
```
https://your-domain.com
```

---

## 方案 3：使用国内云服务器部署

### 选项 A：阿里云

#### 1. 购买服务器

购买阿里云 ECS 实例（推荐配置：2核4GB）

#### 2. 安装环境

```bash
# 安装 Node.js
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 克隆代码
git clone https://github.com/vincentanz1030-star/hanhai-workflow.git
cd hanhai-workflow

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，添加环境变量

# 构建应用
pnpm run build

# 启动服务
pnpm start
```

#### 3. 配置 Nginx

```bash
# 安装 Nginx
sudo yum install -y nginx

# 配置 Nginx
sudo vi /etc/nginx/conf.d/hanhai.conf
```

配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 启动服务

```bash
# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 访问应用
http://your-server-ip
```

### 选项 B：腾讯云

步骤与阿里云类似，使用腾讯云 CVM 实例。

### 选项 C：华为云

步骤与阿里云类似，使用华为云 ECS 实例。

---

## 方案 4：使用 Docker 部署

### 优势
- ✅ 环境一致
- ✅ 易于管理
- ✅ 可移植

### 部署步骤

#### 1. 创建 Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["pnpm", "start"]
```

#### 2. 构建镜像

```bash
docker build -t hanhai-workflow .
```

#### 3. 运行容器

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --name hanhai-workflow \
  hanhai-workflow
```

#### 4. 访问应用

```
http://localhost:3000
```

---

## 方案 5：使用 PM2 部署（推荐用于生产环境）

### 部署步骤

#### 1. 安装 PM2

```bash
npm install -g pm2
```

#### 2. 创建 PM2 配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'hanhai-workflow',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: '.env.production'
  }]
};
```

#### 3. 启动应用

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 设置开机自启
pm2 startup
pm2 save
```

---

## 推荐方案总结

### 测试/演示环境
**推荐：方案 1（扣子编程部署）**
- 无需额外成本
- 直接可访问
- 快速部署

### 生产环境
**推荐：方案 2（Vercel + 自定义域名）**
- 使用 Vercel 优质服务
- 通过自定义域名访问
- 稳定可靠

**备选：方案 3（国内云服务器）**
- 完全可控
- 数据安全
- 可根据需求扩展

---

## 快速开始

### 如果您有扣子编程环境：

```bash
# 启动服务
coze dev > /app/work/logs/bypass/dev.log 2>&1 &

# 访问应用
# 通过扣子编程提供的预览 URL 访问
```

### 如果您想使用云服务器：

参考方案 3，选择阿里云、腾讯云或华为云。

### 如果您想使用 Vercel 但需要可访问：

参考方案 2，配置自定义域名。

---

## 获取帮助

如遇到部署问题，请提供以下信息：

1. 选择的部署方案
2. 遇到的具体错误
3. 服务器环境信息（如果适用）
4. 日志输出

我们会尽快帮助您解决！
