#!/bin/bash

# 阿里云一键部署脚本
# 使用方法: bash scripts/deploy-aliyun.sh

set -e

echo "========================================"
echo "瀚海集团工作流程管理系统 - 阿里云部署"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    print_error "请使用 root 用户运行此脚本"
    exit 1
fi

# 步骤 1: 更新系统
print_info "步骤 1/10: 更新系统..."
apt update && apt upgrade -y

# 步骤 2: 安装必要软件
print_info "步骤 2/10: 安装必要软件..."
apt install -y nginx git vim curl wget ufw

# 步骤 3: 安装 Node.js
print_info "步骤 3/10: 安装 Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
print_info "Node.js 版本: $(node -v)"

# 步骤 4: 安装 pnpm 和 PM2
print_info "步骤 4/10: 安装 pnpm 和 PM2..."
npm install -g pnpm pm2

# 步骤 5: 创建应用目录
print_info "步骤 5/10: 创建应用目录..."
APP_DIR="/var/www/hanhai-workflow"
mkdir -p $APP_DIR
mkdir -p /var/log/hanhai

# 步骤 6: 克隆代码
print_info "步骤 6/10: 克隆代码..."
if [ -d "$APP_DIR/.git" ]; then
    print_warn "代码已存在，跳过克隆"
else
    git clone https://github.com/vincentanz1030-star/hanhai-workflow.git $APP_DIR
fi

cd $APP_DIR

# 步骤 7: 安装依赖
print_info "步骤 7/10: 安装依赖..."
pnpm install

# 步骤 8: 配置环境变量
print_info "步骤 8/10: 配置环境变量..."
if [ -f ".env.local" ]; then
    print_warn ".env.local 已存在，跳过"
else
    print_warn "请手动配置 .env.local 文件"
    print_warn "文件路径: $APP_DIR/.env.local"
    
    # 创建模板
    cat > .env.local << 'EOF'
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
EOF
    
    print_warn "已创建 .env.local 模板，请修改其中的配置"
fi

# 步骤 9: 构建应用
print_info "步骤 9/10: 构建应用..."
read -p "是否已完成环境变量配置？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "请先配置环境变量后再运行此脚本"
    exit 1
fi

pnpm build

# 步骤 10: 创建 PM2 配置
print_info "步骤 10/10: 创建 PM2 配置..."
cat > ecosystem.config.js << 'EOF'
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
EOF

# 启动应用
print_info "启动应用..."
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# 配置防火墙
print_info "配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 配置 Nginx
print_info "配置 Nginx..."
cat > /etc/nginx/sites-available/hanhai-workflow << 'EOF'
server {
    listen 80;
    server_name _;
    
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
    }
    
    location /_next/static/ {
        alias /var/www/hanhai-workflow/.next/static/;
        expires 365d;
        access_log off;
    }
}
EOF

ln -sf /etc/nginx/sites-available/hanhai-workflow /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl restart nginx

# 完成
echo ""
echo "========================================"
print_info "部署完成！"
echo "========================================"
echo ""
echo "下一步操作："
echo "1. 配置域名解析："
echo "   - 添加 A 记录指向此服务器 IP"
echo ""
echo "2. 配置 SSL 证书："
echo "   certbot --nginx -d your-domain.com"
echo ""
echo "3. 查看应用状态："
echo "   pm2 status"
echo "   pm2 logs hanhai-workflow"
echo ""
echo "4. 访问应用："
echo "   http://your_server_ip"
echo ""
