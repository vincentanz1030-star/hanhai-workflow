#!/bin/bash

#################################################################
#  瀚海集团工作流程管理系统 - 一键部署脚本
#  适用于：Ubuntu 22.04 LTS
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

# 环境变量 - 请在部署前填写
# ⚠️ 重要：请修改以下值为您的实际配置
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_ANON_KEY="YOUR-SUPABASE-ANON-KEY"
JWT_SECRET="hanhai-jwt-secret-change-this-to-random-string-$(date +%s)"
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
# 7. 检查环境变量配置
# ==========================================
warn "检查环境变量配置..."
if [[ "$SUPABASE_URL" == *"YOUR-PROJECT"* ]] || [[ "$SUPABASE_ANON_KEY" == *"YOUR-SUPABASE"* ]]; then
    error "请先修改脚本中的环境变量配置！\n编辑文件：nano deploy.sh\n修改 SUPABASE_URL 和 SUPABASE_ANON_KEY"
fi

# ==========================================
# 8. 克隆代码
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
# 9. 创建环境变量文件
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
# 10. 安装依赖
# ==========================================
info "安装项目依赖..."
cd "$PROJECT_DIR"
pnpm install
info "依赖安装完成"

# ==========================================
# 11. 构建项目
# ==========================================
info "构建项目（可能需要几分钟）..."
pnpm build
info "项目构建完成"

# ==========================================
# 12. 配置 PM2
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
# 13. 配置 Nginx
# ==========================================
info "配置 Nginx..."

# 获取服务器 IP
SERVER_IP=$(curl -s ifconfig.me || curl -s ip.sb || echo "YOUR_SERVER_IP")

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/$PROJECT_NAME << EOF
server {
    listen 80;
    server_name $SERVER_IP;

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
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

# 删除默认站点（可选）
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx
systemctl enable nginx

info "Nginx 配置完成"

# ==========================================
# 14. 配置防火墙
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
# 15. 显示部署结果
# ==========================================
echo ""
echo "=========================================="
echo -e "${GREEN}  部署完成！${NC}"
echo "=========================================="
echo ""
echo "访问地址: http://$SERVER_IP"
echo ""
echo "常用命令:"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs $PROJECT_NAME"
echo "  重启服务: pm2 restart $PROJECT_NAME"
echo "  更新代码: cd $PROJECT_DIR && git pull && pnpm install && pnpm build && pm2 restart $PROJECT_NAME"
echo ""
echo "数据库配置:"
echo "  请确保已执行 database/schema.sql 创建数据表"
echo ""
echo "=========================================="
