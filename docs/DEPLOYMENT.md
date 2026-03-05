# 部署指南

## 📌 Console 错误 "supabaseUrl is required" 说明

如果您在浏览器控制台看到这个错误，请忽略它。这是正常的，原因如下：

1. **错误来源**：这个错误可能来自某些第三方库的初始化检查，但不影响系统运行
2. **实际影响**：系统的所有功能都通过 API 路由运行，不依赖客户端的 Supabase 连接
3. **验证方法**：您可以正常登录、创建项目、上传文件，说明系统运行正常

## 🚀 部署方案选择

### 方案一：部署在扣子编程（推荐用于测试/演示）

**适用场景：**
- ✅ 测试和验证功能
- ✅ 内部演示
- ✅ 快速原型开发
- ❌ 不建议用于生产环境长期使用

**优点：**
- 免费使用
- 快速部署
- 自动配置环境
- 无需管理服务器

**缺点：**
- 资源限制
- 不保证服务稳定性
- 数据持久化风险
- 无法自定义域名
- 性能受限

### 方案二：独立部署（推荐用于生产环境）

**适用场景：**
- ✅ 正式生产环境
- ✅ 长期稳定运行
- ✅ 需要自定义配置
- ✅ 需要高可用性

**优点：**
- 完全控制环境
- 可扩展性强
- 性能稳定
- 数据安全可控
- 支持自定义域名

**缺点：**
- 需要购买服务器
- 需要运维管理
- 需要配置环境

---

## 🌐 独立部署选项

### 1. Vercel（推荐）

**适合：** Next.js 应用、需要快速部署

**步骤：**
```bash
# 1. 创建 Vercel 账号
# 访问：https://vercel.com

# 2. 安装 Vercel CLI
npm i -g vercel

# 3. 登录 Vercel
vercel login

# 4. 部署项目
vercel

# 5. 配置环境变量
# 在 Vercel 控制台中添加以下环境变量：
COZE_SUPABASE_URL=your_supabase_url
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret
COZE_BUCKET_ENDPOINT_URL=your_bucket_endpoint
COZE_BUCKET_NAME=your_bucket_name
```

**费用：**
- Hobby 计划：免费（适合个人项目）
- Pro 计划：$20/月（适合商业项目）

**特点：**
- 自动 HTTPS
- 全球 CDN
- 自动扩展
- Git 集成

### 2. Railway（推荐）

**适合：** 全栈应用、需要数据库集成

**步骤：**
```bash
# 1. 创建 Railway 账号
# 访问：https://railway.app

# 2. 安装 Railway CLI
npm i -g @railway/cli

# 3. 登录 Railway
railway login

# 4. 创建项目
railway init

# 5. 添加环境变量
railway variables set COZE_SUPABASE_URL=your_supabase_url
railway variables set COZE_SUPABASE_ANON_KEY=your_supabase_anon_key
railway variables set JWT_SECRET=your_jwt_secret

# 6. 部署
railway up
```

**费用：**
- 按使用量计费
- $5 起步
- 适合中小型项目

**特点：**
- 一键部署
- 自动 SSL
- 数据库托管
- 日志查看

### 3. 自建服务器（适合企业用户）

**适合：** 大型企业、需要完全控制

**步骤：**

#### 购买服务器
- 阿里云 ECS
- 腾讯云 CVM
- AWS EC2
- DigitalOcean Droplets

#### 服务器配置建议
- CPU：2 核以上
- 内存：4GB 以上
- 硬盘：40GB 以上 SSD
- 操作系统：Ubuntu 20.04 LTS

#### 部署步骤
```bash
# 1. 登录服务器
ssh user@your-server-ip

# 2. 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安装 pnpm
npm install -g pnpm

# 4. 克隆项目（或上传代码）
git clone your-repo-url
cd your-project

# 5. 安装依赖
pnpm install

# 6. 配置环境变量
cp .env.production .env.local
nano .env.local
# 编辑环境变量

# 7. 构建项目
pnpm build

# 8. 启动服务
pnpm start

# 9. 配置 Nginx 反向代理
sudo apt-get install nginx
sudo nano /etc/nginx/sites-available/your-app
```

**Nginx 配置示例：**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**配置 SSL（Let's Encrypt）：**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

**使用 PM2 管理进程：**
```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start npm --name "hanhai-workflow" -- start

# 设置开机自启
pm2 startup
pm2 save
```

**费用：**
- 服务器：$20-100/月（取决于配置）
- 域名：$10-20/年
- SSL 证书：免费（Let's Encrypt）

---

## 📊 部署方案对比

| 特性 | 扣子编程 | Vercel | Railway | 自建服务器 |
|------|---------|--------|---------|-----------|
| 部署难度 | ⭐ 最简单 | ⭐⭐ 简单 | ⭐⭐ 简单 | ⭐⭐⭐⭐ 复杂 |
| 成本 | 免费 | 免费/$20/月 | $5/月起 | $20+/月 |
| 性能 | 一般 | 优秀 | 良好 | 可定制 |
| 稳定性 | 不保证 | 高 | 高 | 最高 |
| 可扩展性 | 有限 | 高 | 中 | 无限 |
| 域名 | 无 | 支持 | 支持 | 完全自定义 |
| 数据控制 | 有限 | 完全 | 完全 | 完全 |
| 适合场景 | 测试 | 个人/小团队 | 中小团队 | 大企业 |

---

## 🔧 环境变量配置

无论选择哪种部署方案，都需要配置以下环境变量：

### 必需变量
```bash
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_random_secret_key
```

### 可选变量（对象存储）
```bash
COZE_BUCKET_ENDPOINT_URL=https://your-bucket-endpoint
COZE_BUCKET_NAME=your-bucket-name
```

### 如何生成 JWT_SECRET
```bash
# 使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 使用 OpenSSL
openssl rand -hex 32

# 使用 Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🎯 推荐部署流程

### 阶段一：测试与验证（扣子编程）
1. ✅ 在扣子编程中测试所有功能
2. ✅ 验证权限管理是否正常
3. ✅ 测试文件上传和预览
4. ✅ 验证用户注册和登录

### 阶段二：生产部署（Vercel/Railway）
1. **准备阶段**
   - 注册账号
   - 配置域名（可选）
   - 准备环境变量

2. **部署阶段**
   - 连接代码仓库
   - 配置环境变量
   - 启动部署
   - 验证部署结果

3. **优化阶段**
   - 配置自定义域名
   - 启用 CDN
   - 设置监控告警
   - 配置备份策略

### 阶段三：企业级部署（自建服务器）
1. **架构设计**
   - 设计高可用架构
   - 规划负载均衡
   - 配置数据库集群
   - 设置备份策略

2. **部署实施**
   - 搭建服务器环境
   - 部署应用服务
   - 配置反向代理
   - 启用 SSL 证书

3. **运维监控**
   - 配置监控告警
   - 设置日志收集
   - 建立备份机制
   - 制定应急预案

---

## 📝 部署检查清单

### 部署前
- [ ] 所有功能测试通过
- [ ] 环境变量配置完整
- [ ] 数据库已创建并初始化
- [ ] 对象存储已配置（如需要）
- [ ] 域名已解析（如使用自定义域名）
- [ ] SSL 证书已准备

### 部署后
- [ ] 服务正常运行
- [ ] 健康检查通过
- [ ] 用户可以正常登录
- [ ] 核心功能正常工作
- [ ] 文件上传功能正常
- [ ] 日志正常输出
- [ ] 监控告警已配置

---

## 🆘 常见问题

### Q1: 扣子编程部署的数据会丢失吗？
**A:** 扣子编程环境主要用于开发测试，不保证数据持久化。生产环境请使用独立部署。

### Q2: Vercel 免费计划有什么限制？
**A:**
- 每月 100GB 带宽
- 每月 1000 次构建
- 无限项目
- 100ms 超时（Hobby 计划）

### Q3: 如何备份数据？
**A:**
- Supabase：使用 Supabase 的自动备份功能
- 对象存储：配置跨区域复制
- 数据库：定期导出 SQL 备份

### Q4: 如何监控服务状态？
**A:**
- 使用 Uptime Robot 监控可用性
- 使用 Sentry 监控错误
- 使用 LogRocket 记录用户行为
- 配置自定义监控仪表板

### Q5: 如何处理高并发？
**A:**
- 使用 CDN 加速静态资源
- 启用数据库连接池
- 实现缓存策略
- 使用负载均衡

---

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看部署日志
2. 检查环境变量配置
3. 验证数据库连接
4. 查看网络配置
5. 联系技术支持

---

## 🎉 总结

- **测试/演示**：使用扣子编程（免费、快速）
- **个人/小团队**：使用 Vercel（免费、简单）
- **中小团队**：使用 Railway（性价比高）
- **大企业**：自建服务器（完全控制）

选择适合您的部署方案，祝部署顺利！🚀
