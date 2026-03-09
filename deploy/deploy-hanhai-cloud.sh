#!/bin/bash

#################################################################
#  瀚海集团工作流程管理系统 - 一键部署脚本
#  域名：hanhai.cloud
#  执行方式：bash deploy.sh
#################################################################

set -e

echo "=========================================="
echo "  瀚海工作流程管理系统 - 开始部署"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ==========================================
# 项目配置
# ==========================================
PROJECT_NAME="hanhai"
PROJECT_DIR="/var/www/$PROJECT_NAME"
GIT_REPO="https://github.com/vincentanz1030-star/hanhai-workflow.git"
DOMAIN="hanhai.cloud"
WWW_DOMAIN="www.hanhai.cloud"

# 环境变量（已配置）
SUPABASE_URL="https://qugnojxwovdywurikxll.supabase.co"
SUPABASE_ANON_KEY="sb_publishable_Qhh8U0JLgDcOej1ZbwbVLQ_YNNumc13"
JWT_SECRET="hanhai-jwt-secret-$(openssl rand -hex 32 2>/dev/null || echo "$(date +%s)$RANDOM")"
COZE_AK=""
COZE_SK=""

# ==========================================
# 检查 root
# ==========================================
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 用户运行此脚本"
fi

# ==========================================
# 1. 更新系统
# ==========================================
info "更新系统..."
apt update && apt upgrade -y

# ==========================================
# 2. 安装 Node.js 20
# ==========================================
info "安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
info "Node.js: $(node -v)"

# ==========================================
# 3. 安装 pnpm
# ==========================================
info "安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
info "pnpm: $(pnpm -v)"

# ==========================================
# 4. 安装 PM2
# ==========================================
info "安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# ==========================================
# 5. 安装 Git 和 Nginx
# ==========================================
info "安装 Git 和 Nginx..."
apt install -y git nginx certbot python3-certbot-nginx

# ==========================================
# 6. 克隆代码
# ==========================================
info "克隆代码..."
rm -rf "$PROJECT_DIR"
mkdir -p /var/www
git clone "$GIT_REPO" "$PROJECT_DIR"
cd "$PROJECT_DIR"

# ==========================================
# 7. 创建环境变量
# ==========================================
info "创建环境变量..."
cat > "$PROJECT_DIR/.env.local" << EOF
COZE_SUPABASE_URL=$SUPABASE_URL
COZE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
JWT_SECRET=$JWT_SECRET
COZE_AK=$COZE_AK
COZE_SK=$COZE_SK
EOF

# ==========================================
# 8. 安装依赖并构建
# ==========================================
info "安装依赖..."
pnpm install

info "构建项目（约 2-3 分钟）..."
pnpm build

# ==========================================
# 9. 启动 PM2
# ==========================================
info "启动服务..."
pm2 delete $PROJECT_NAME 2>/dev/null || true
pm2 start pnpm --name "$PROJECT_NAME" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# ==========================================
# 10. 配置 Nginx
# ==========================================
info "配置 Nginx..."
mkdir -p /var/www/certbot

cat > /etc/nginx/sites-available/$PROJECT_NAME << 'NGINX_EOF'
server {
    listen 80;
    listen [::]:80;
    server_name hanhai.cloud www.hanhai.cloud;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hanhai.cloud www.hanhai.cloud;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        client_max_body_size 100M;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx && systemctl enable nginx

# ==========================================
# 11. 配置防火墙
# ==========================================
info "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
fi

# ==========================================
# 12. 申请 SSL 证书
# ==========================================
echo ""
warn "申请 SSL 证书前，请确保域名已解析到本服务器！"
echo "  域名: hanhai.cloud"
echo "  需要添加 A 记录指向本服务器 IP"
echo ""
read -p "域名是否已解析？继续申请 SSL？(y/n): " confirm

if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
    read -p "请输入邮箱（SSL 通知）: " email
    certbot --nginx -d hanhai.cloud -d www.hanhai.cloud --non-interactive --agree-tos --email "$email" --redirect
    systemctl enable certbot.timer 2>/dev/null || true
    info "SSL 证书配置完成"
fi

# ==========================================
# 完成
# ==========================================
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: https://hanhai.cloud"
echo ""
echo "默认账号（需先执行数据库迁移）:"
echo "  邮箱: 346640172@qq.com"
echo "  密码: 123456"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs hanhai"
echo "  重启服务: pm2 restart hanhai"
echo ""
echo "更新代码:"
echo "  cd /var/www/hanhai && git pull && pnpm install && pnpm build && pm2 restart hanhai"
echo ""
echo "⚠️ 重要：请在 Supabase 执行 database/schema.sql 和 database/shared_resources.sql"
echo "=========================================="
