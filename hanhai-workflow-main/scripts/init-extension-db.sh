#!/bin/bash
# =====================================================
# 瀚海集团管理中台 - 数据库初始化脚本
# =====================================================

echo "========================================="
echo "瀚海集团管理中台 - 数据库初始化"
echo "========================================="

# 检查环境变量
if [ -z "$COZE_SUPABASE_URL" ] || [ -z "$COZE_SUPABASE_ANON_KEY" ]; then
  echo "错误：未设置环境变量 COZE_SUPABASE_URL 和 COZE_SUPABASE_ANON_KEY"
  echo "请先设置环境变量后再运行此脚本"
  exit 1
fi

# 提取数据库连接信息
DB_HOST=$(echo "$COZE_SUPABASE_URL" | sed -n 's|.*https://\([^:]*\):.*|\1|p')
DB_PORT=$(echo "$COZE_SUPABASE_URL" | sed -n 's|.*:\([0-9]*\)/.*|\1|p')
DB_NAME=$(echo "$COZE_SUPABASE_URL" | sed -n 's|.*/\(.*\)|\1|p')
DB_USER=$(echo "$COZE_SUPABASE_ANON_KEY" | sed -n 's|.*\"role\":\"\\([^"]*\\)\".*|\1|p')
DB_PASS=$(echo "$COZE_SUPABASE_ANON_KEY" | sed -n 's|.*\"password\":\"\\([^"]*\\)\".*|\1|p')

echo "数据库信息："
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# 执行SQL脚本
SQL_FILE="src/db/schema-extension.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "错误：找不到SQL文件 $SQL_FILE"
  exit 1
fi

echo "开始执行SQL脚本..."
echo ""

# 使用psql执行SQL
if command -v psql &> /dev/null; then
  PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SQL_FILE"

  if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 数据库初始化成功！"
    echo ""
    echo "已创建以下数据表："
    echo "商品中心："
    echo "  - products (商品表)"
    echo "  - product_prices (商品价格表)"
    echo "  - product_inventory (商品库存表)"
    echo "  - suppliers (供应商表)"
    echo "  - supplier_ratings (供应商评分表)"
    echo "  - purchase_orders (采购订单表)"
    echo "  - product_sales_stats (商品销售统计表)"
    echo "  - product_feedbacks (商品反馈表)"
    echo ""
    echo "营销中台："
    echo "  - marketing_campaigns (活动策划表)"
    echo "  - campaign_tasks (活动任务表)"
    echo "  - campaign_executions (活动执行记录表)"
    echo "  - campaign_reviews (活动复盘表)"
    echo ""
    echo "企业协同平台："
    echo "  - knowledge_articles (知识文章表)"
    echo "  - knowledge_categories (知识分类表)"
    echo "  - collaboration_projects (项目协同表)"
    echo "  - project_tasks (项目任务表)"
    echo "  - task_comments (任务评论表)"
    echo "  - schedule_events (日程管理表)"
    echo "  - approval_workflows (审批流程定义表)"
    echo "  - approval_instances (审批实例表)"
    echo "  - approval_records (审批记录表)"
    echo "  - internal_messages (内部消息表)"
    echo "  - message_groups (消息群组表)"
    echo ""
    echo "📚 请查看 PLATFORM-EXTENSION-GUIDE.md 了解更多详细信息"
  else
    echo ""
    echo "❌ 数据库初始化失败！"
    echo "请检查数据库连接信息和SQL脚本"
    exit 1
  fi
else
  echo "错误：未安装 psql 命令行工具"
  echo "请先安装 PostgreSQL 客户端"
  echo "或手动执行 SQL 文件：$SQL_FILE"
  exit 1
fi
