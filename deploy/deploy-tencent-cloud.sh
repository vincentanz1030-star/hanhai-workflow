#!/bin/bash

#################################################################
#  瀚海集团工作流程管理系统 - 一键部署脚本
#  适用于：Ubuntu 22.04 LTS
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

# 打印带颜色的信息
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ==========================================
# 配置区域 - 请修改以下配置
# ==========================================

# 项目配置
PROJECT_NAME="hanhai"
PROJECT_DIR="/var/www/$PROJECT_NAME"
GIT_REPO="https://github.com/vincentanz1030-star/hanhai-workflow.git"

# 域名配置
DOMAIN="hanhai.cloud"
WWW_DOMAIN="www.hanhai.cloud"

# 环境变量 - ⚠️ 请修改为您的实际配置
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR-SUPABASE-ANON-KEY"
JWT_SECRET="hanhai-jwt-secret-$(openssl rand -hex 32 2>/dev/null || date +%s)"
COZE_AK=""
COZE_SK=""

# ==========================================
# 检查是否为 root 用户
# ==========================================
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 用户运行此脚本"
fi

# ==========================================
# 1. 更新系统
# ==========================================
info "更新系统..."
apt update && apt upgrade -y
info "系统更新完成"

# ==========================================
# 2. 安装 Node.js 20
# ==========================================
info "安装 Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
NODE_VERSION=$(node -v)
info "Node.js 版本: $NODE_VERSION"

# ==========================================
# 3. 安装 pnpm
# ==========================================
info "安装 pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi
PNPM_VERSION=$(pnpm -v)
info "pnpm 版本: $PNPM_VERSION"

# ==========================================
# 4. 安装 PM2
# ==========================================
info "安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi
info "PM2 安装完成"

# ==========================================
# 5. 安装 Git
# ==========================================
info "安装 Git..."
if ! command -v git &> /dev/null; then
    apt install -y git
fi
info "Git 安装完成"

# ==========================================
# 6. 安装 Nginx
# ==========================================
info "安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi
info "Nginx 安装完成"

# ==========================================
# 7. 安装 Certbot (Let's Encrypt SSL)
# ==========================================
info "安装 Certbot..."
apt install -y certbot python3-certbot-nginx
info "Certbot 安装完成"

# ==========================================
# 8. 检查环境变量配置
# ==========================================
warn "检查环境变量配置..."
if [[ "$SUPABASE_URL" == *"YOUR-PROJECT"* ]] || [[ "$SUPABASE_ANON_KEY" == *"YOUR-SUPABASE"* ]]; then
    error "请先修改脚本中的环境变量配置！\n编辑文件：nano deploy.sh\n修改 SUPABASE_URL 和 SUPABASE_ANON_KEY"
fi

# ==========================================
# 9. 克隆代码
# ==========================================
info "克隆代码仓库..."
if [ -d "$PROJECT_DIR" ]; then
    warn "目录已存在，删除旧目录..."
    rm -rf "$PROJECT_DIR"
fi
mkdir -p /var/www
git clone "$GIT_REPO" "$PROJECT_DIR"
cd "$PROJECT_DIR"
info "代码克隆完成"

# ==========================================
# 10. 创建环境变量文件
# ==========================================
info "创建环境变量文件..."
cat > "$PROJECT_DIR/.env.local" << EOF
# Supabase 数据库配置
COZE_SUPABASE_URL=$SUPABASE_URL
COZE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# JWT 密钥
JWT_SECRET=$JWT_SECRET

# 对象存储配置（可选）
COZE_AK=$COZE_AK
COZE_SK=$COZE_SK
EOF
info "环境变量文件创建完成"

# ==========================================
# 11. 安装依赖
# ==========================================
info "安装项目依赖..."
cd "$PROJECT_DIR"
pnpm install
info "依赖安装完成"

# ==========================================
# 12. 构建项目
# ==========================================
info "构建项目（可能需要几分钟）..."
pnpm build
info "项目构建完成"

# ==========================================
# 13. 配置 PM2
# ==========================================
info "配置 PM2..."
# 停止旧进程（如果存在）
pm2 delete $PROJECT_NAME 2>/dev/null || true

# 启动新进程
pm2 start pnpm --name "$PROJECT_NAME" -- start

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root 2>/dev/null || true

info "PM2 配置完成"

# ==========================================
# 14. 配置 Nginx (HTTP)
# ==========================================
info "配置 Nginx..."

# 创建 Nginx 配置（先配置 HTTP，后续申请 SSL）
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
# HTTP 重定向到 HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # Let's Encrypt 验证路径
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 其他请求重定向到 HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS 配置（SSL 申请后启用）
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name $DOMAIN $WWW_DOMAIN;
    
    # SSL 证书路径（Certbot 会自动配置）
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 文件上传大小限制
        client_max_body_size 100M;
    }
}
EOF

# 创建 certbot 验证目录
mkdir -p /var/www/certbot

# 启用站点
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

# 删除默认站点
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

info "Nginx 配置完成"

# ==========================================
# 15. 配置防火墙
# ==========================================
info "配置防火墙..."
if command -v ufw &> /dev/null; then
    ufw allow 22/tcp    # SSH
    ufw allow 80/tcp    # HTTP
    ufw allow 443/tcp   # HTTPS
    ufw --force enable
    info "防火墙配置完成"
else
    warn "未检测到 ufw，请手动配置防火墙"
fi

# ==========================================
# 16. 申请 SSL 证书
# ==========================================
info "申请 SSL 证书..."
warn "请确保域名 $DOMAIN 已解析到此服务器 IP"
echo ""
read -p "域名是否已解析？继续申请 SSL 证书？(y/n): " confirm_ssl

if [[ "$confirm_ssl" == "y" || "$confirm_ssl" == "Y" ]]; then
    info "申请 Let's Encrypt SSL 证书..."
    
    # 获取邮箱
    read -p "请输入邮箱地址（用于 SSL 证书通知）: " email
    
    # 申请证书
    certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email "$email" --redirect
    
    # 设置自动续期
    systemctl enable certbot.timer 2>/dev/null || true
    
    # 测试续期
    certbot renew --dry-run 2>/dev/null || true
    
    info "SSL 证书配置完成"
else
    warn "跳过 SSL 证书申请，稍后可手动执行："
    echo "  certbot --nginx -d $DOMAIN -d $WWW_DOMAIN"
fi

# ==========================================
# 17. 执行数据库迁移
# ==========================================
info "数据库配置提醒..."
warn "请确保已在 Supabase 中执行以下 SQL 文件创建数据表："
echo "  1. database/schema.sql"
echo "  2. database/shared_resources.sql"
echo ""

# ==========================================
# 18. 显示部署结果
# ==========================================
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址:"
echo "  http://$DOMAIN"
echo "  https://$DOMAIN"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs $PROJECT_NAME"
echo "  重启服务: pm2 restart $PROJECT_NAME"
echo ""
echo "更新代码:"
echo "  cd $PROJECT_DIR && git pull && pnpm install && pnpm build && pm2 restart $PROJECT_NAME"
echo ""
echo "SSL 证书:"
echo "  查看证书: certbot certificates"
echo "  手动续期: certbot renew"
echo ""
echo "=========================================="
