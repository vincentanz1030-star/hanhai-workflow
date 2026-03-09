# 阿里云部署指南

## 概述

本文档提供瀚海集团工作流程管理系统的阿里云完整部署方案。

---

## 一、部署架构

### 推荐方案：ECS + Supabase

```
┌─────────────────┐
│   用户访问       │
└────────┬────────┘
         │
    ┌────▼────┐
    │  域名    │ (hanhai.cloud)
    └────┬────┘
         │
    ┌────▼────┐
    │  DNS    │ (阿里云 DNS)
    └────┬────┘
         │
    ┌────▼────────────────┐
    │  阿里云 ECS          │
    │  - Nginx (反向代理)  │
    │  - Node.js + PM2    │
    │  - SSL 证书          │
    └────┬────────────────┘
         │
    ┌────▼────────────────┐
    │  Supabase           │
    │  (PostgreSQL 数据库) │
    └─────────────────────┘
```

**优势：**
- ✅ 稳定性高（ECS 不会冷启动）
- ✅ 国内访问快
- ✅ 成本可控（约 ¥100-200/月）
- ✅ 完全控制服务器

---

## 二、准备工作

### 2.1 购买 ECS 服务器

**推荐配置：**

| 配置项 | 推荐值 | 价格/月 |
|--------|--------|---------|
| **实例规格** | 2核4G (ecs.c6.large) | ¥150-200 |
| **地域** | 华东1（杭州）或华北2（北京） | - |
| **操作系统** | Ubuntu 22.04 LTS | 免费 |
| **带宽** | 3-5 Mbps | ¥30-50 |
| **系统盘** | 40GB SSD | ¥10 |
| **总计** | - | **¥190-260/月** |

**购买地址：**
https://ecs.console.aliyun.com/

**购买步骤：**
1. 登录阿里云控制台
2. 进入 ECS 购买页
3. 选择配置（推荐：2核4G）
4. 选择操作系统（Ubuntu 22.04）
5. 设置安全组（开放 22、80、443 端口）
6. 设置登录密码
7. 确认购买

### 2.2 域名和备案

**如果使用国内服务器，必须完成 ICP 备案！**

**备案步骤：**
1. 登录阿里云控制台
2. 进入"ICP 备案"系统
3. 提交备案申请
4. 准备材料：
   - 企业营业执照
   - 法人身份证
   - 网站负责人身份证
   - 域名证书
5. 等待审核（约 7-20 天）

**临时方案（备案期间）：**
- 使用 IP 地址访问
- 使用香港/海外服务器（无需备案）

---

## 三、服务器配置

### 3.1 连接服务器

```bash
# 使用 SSH 连接
ssh root@your_server_ip

# 或使用阿里云控制台的远程连接功能
```

### 3.2 安装必要软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 PM2（进程管理器）
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 安装 Git
apt install -y git

# 安装其他工具
apt install -y vim curl wget
```

### 3.3 配置防火墙

```bash
# 开放必要端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 5000/tcp  # 应用端口（内网）

# 启用防火墙
ufw enable
```

---

## 四、部署应用

### 4.1 创建应用目录

```bash
# 创建应用目录
mkdir -p /var/www/hanhai-workflow
cd /var/www/hanhai-workflow
```

### 4.2 克隆代码

```bash
# 克隆仓库
git clone https://github.com/vincentanz1030-star/hanhai-workflow.git .

# 或使用 SSH（如果配置了 SSH key）
# git clone git@github.com:vincentanz1030-star/hanhai-workflow.git .
```

### 4.3 安装依赖

```bash
# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install
```

### 4.4 配置环境变量

```bash
# 创建环境变量文件
vim .env.local
```

**添加以下内容：**

```bash
# Supabase 配置
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key

# JWT 密钥
JWT_SECRET=your_jwt_secret

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=https://integration.coze.cn/coze-coding-s3proxy/v1
COZE_BUCKET_NAME=bucket_1772160652033
COZE_STORAGE_ACCESS_KEY=sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S
COZE_STORAGE_SECRET_KEY=sat_lfEgkOo1nWWOwDDG8VXbDDb8uEvUizboEiNW3XUU6iEho9BU90hUrzyUEPbU7k2S

# 应用配置
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 4.5 构建应用

```bash
# 构建
pnpm build

# 检查构建结果
ls -la .next/
```

### 4.6 使用 PM2 启动应用

```bash
# 创建 PM2 配置文件
vim ecosystem.config.js
```

**添加以下内容：**

```javascript
module.exports = {
  apps: [{
    name: 'hanhai-workflow',
    script: 'pnpm',
    args: 'start',
    cwd: '/var/www/hanhai-workflow',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/hanhai/error.log',
    out_file: '/var/log/hanhai/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
  }]
};
```

```bash
# 创建日志目录
mkdir -p /var/log/hanhai

# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs hanhai-workflow

# 设置开机自启
pm2 startup
pm2 save
```

---

## 五、配置 Nginx

### 5.1 创建 Nginx 配置

```bash
vim /etc/nginx/sites-available/hanhai-workflow
```

**添加以下内容：**

```nginx
# HTTP 配置（重定向到 HTTPS）
server {
    listen 80;
    server_name hanhai.cloud www.hanhai.cloud;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS 配置
server {
    listen 443 ssl http2;
    server_name hanhai.cloud www.hanhai.cloud;
    
    # SSL 证书配置（稍后配置）
    ssl_certificate /etc/nginx/ssl/hanhai.cloud.pem;
    ssl_certificate_key /etc/nginx/ssl/hanhai.cloud.key;
    
    # SSL 优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 反向代理到 Node.js 应用
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location /_next/static/ {
        alias /var/www/hanhai-workflow/.next/static/;
        expires 365d;
        access_log off;
    }
    
    # 图片等静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        expires 30d;
        access_log off;
    }
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
}
```

### 5.2 启用配置

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/hanhai-workflow /etc/nginx/sites-enabled/

# 删除默认配置
rm /etc/nginx/sites-enabled/default

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

## 六、配置 SSL 证书

### 方案 1：使用阿里云免费 SSL 证书

1. 登录阿里云控制台
2. 进入"SSL 证书（应用安全）"
3. 购买免费证书（DV 单域名）
4. 申请证书，验证域名
5. 下载 Nginx 格式证书
6. 上传到服务器：

```bash
# 创建 SSL 目录
mkdir -p /etc/nginx/ssl

# 上传证书文件（在本地执行）
scp your_cert.pem root@your_server_ip:/etc/nginx/ssl/hanhai.cloud.pem
scp your_key.key root@your_server_ip:/etc/nginx/ssl/hanhai.cloud.key

# 设置权限
chmod 600 /etc/nginx/ssl/*

# 重启 Nginx
systemctl restart nginx
```

### 方案 2：使用 Let's Encrypt（免费）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书
certbot --nginx -d hanhai.cloud -d www.hanhai.cloud

# 自动续期
certbot renew --dry-run
```

---

## 七、配置域名解析

1. 登录阿里云控制台
2. 进入"域名" → "解析"
3. 添加 A 记录：

```
类型: A
主机记录: @
记录值: your_server_ip
TTL: 600
```

4. 添加 www 记录：

```
类型: A
主机记录: www
记录值: your_server_ip
TTL: 600
```

---

## 八、配置 CI/CD 自动部署

### 8.1 创建部署脚本

```bash
vim /var/www/hanhai-workflow/deploy.sh
```

**添加以下内容：**

```bash
#!/bin/bash

APP_DIR="/var/www/hanhai-workflow"
LOG_FILE="/var/log/hanhai/deploy.log"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始部署..." >> $LOG_FILE

cd $APP_DIR

# 拉取最新代码
git pull origin main >> $LOG_FILE 2>&1

# 安装依赖
pnpm install >> $LOG_FILE 2>&1

# 构建
pnpm build >> $LOG_FILE 2>&1

# 重启应用
pm2 restart hanhai-workflow >> $LOG_FILE 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 部署完成" >> $LOG_FILE
```

```bash
chmod +x deploy.sh
```

### 8.2 配置 GitHub Webhook

1. 进入 GitHub 仓库 Settings → Webhooks
2. 添加 Webhook：
   - Payload URL: `http://your_server_ip:5000/api/webhook/deploy`
   - Content type: `application/json`
   - Secret: 自定义密钥
   - Events: Just the push event

3. 创建 Webhook 接口（需要开发）

### 8.3 或使用定时拉取

```bash
# 添加定时任务
crontab -e

# 每 5 分钟检查一次更新
*/5 * * * * cd /var/www/hanhai-workflow && git pull origin main && pnpm build && pm2 restart hanhai-workflow
```

---

## 九、监控和维护

### 9.1 安装监控工具

```bash
# PM2 监控
pm2 install pm2-logrotate

# 查看实时监控
pm2 monit

# 查看应用状态
pm2 status
```

### 9.2 日志管理

```bash
# 查看应用日志
pm2 logs hanhai-workflow

# 查看 Nginx 日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# 清理旧日志
find /var/log/hanhai -name "*.log" -mtime +7 -delete
```

### 9.3 备份策略

```bash
# 创建备份脚本
vim /root/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份环境变量
cp /var/www/hanhai-workflow/.env.local $BACKUP_DIR/.env.local.$DATE

# 备份数据库（如果需要）
# pg_dump -h your_host -U your_user -d your_db > $BACKUP_DIR/db_$DATE.sql

# 保留最近 7 天的备份
find $BACKUP_DIR -type f -mtime +7 -delete
```

```bash
chmod +x /root/backup.sh

# 每天备份
crontab -e
0 2 * * * /root/backup.sh
```

---

## 十、常见问题

### 10.1 端口被占用

```bash
# 查看端口占用
netstat -tlnp | grep 5000

# 杀掉进程
kill -9 <PID>
```

### 10.2 内存不足

```bash
# 查看内存使用
free -h

# 创建 swap（如果需要）
dd if=/dev/zero of=/swapfile bs=1024 count=2048k
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
```

### 10.3 Nginx 502 错误

```bash
# 检查应用是否运行
pm2 status

# 检查端口
netstat -tlnp | grep 5000

# 重启应用
pm2 restart hanhai-workflow
```

### 10.4 SSL 证书问题

```bash
# 检查证书
openssl x509 -in /etc/nginx/ssl/hanhai.cloud.pem -text -noout

# 测试 HTTPS
curl -I https://hanhai.cloud
```

---

## 十一、成本估算

| 项目 | 配置 | 费用/月 |
|------|------|---------|
| ECS 服务器 | 2核4G | ¥150-200 |
| 带宽 | 3-5 Mbps | ¥30-50 |
| 系统盘 | 40GB SSD | ¥10 |
| 域名 | .cloud | ¥50/年 |
| SSL 证书 | 免费 | ¥0 |
| Supabase | 免费版 | ¥0 |
| **总计** | - | **¥190-260/月** |

---

## 十二、快速部署命令总结

```bash
# 1. 连接服务器
ssh root@your_server_ip

# 2. 安装软件
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git vim curl wget
npm install -g pnpm pm2

# 3. 克隆代码
mkdir -p /var/www/hanhai-workflow
cd /var/www/hanhai-workflow
git clone https://github.com/vincentanz1030-star/hanhai-workflow.git .

# 4. 安装依赖
pnpm install

# 5. 配置环境变量
vim .env.local

# 6. 构建
pnpm build

# 7. 启动应用
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 8. 配置 Nginx
vim /etc/nginx/sites-available/hanhai-workflow
ln -s /etc/nginx/sites-available/hanhai-workflow /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 9. 配置 SSL
certbot --nginx -d hanhai.cloud -d www.hanhai.cloud

# 10. 测试访问
curl -I https://hanhai.cloud
```

---

## 支持

如有问题，请查看：
- 应用日志：`pm2 logs hanhai-workflow`
- Nginx 日志：`/var/log/nginx/error.log`
- 系统日志：`/var/log/syslog`

---

**部署完成！** 🎉
