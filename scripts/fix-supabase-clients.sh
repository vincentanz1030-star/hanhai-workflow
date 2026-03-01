#!/bin/bash

# 批量修复所有使用 getSupabaseClient 的 API Route 文件

# 找到所有需要修复的文件
files=$(find src/app/api -name "route.ts" -type f -exec grep -l "getSupabaseClient" {} \;)

echo "找到以下需要修复的文件："
echo "$files"
echo ""

# 为每个文件添加头部配置
for file in $files; do
    echo "处理文件: $file"
    
    # 检查文件是否已经包含环境变量配置
    if grep -q "const supabaseUrl = process.env.COZE_SUPABASE_URL" "$file"; then
        echo "  - 文件已包含环境变量配置，跳过"
        continue
    fi
    
    # 在文件开头添加环境变量配置（在 import 之后）
    # 使用临时文件进行修改
    temp_file=$(mktemp)
    
    # 读取文件内容
    content=$(cat "$file")
    
    # 检查是否有 import createClient 语句
    if ! grep -q "import.*createClient.*from.*@supabase/supabase-js" "$file"; then
        # 在第一行 import 前添加 createClient import
        content=$(sed '1s/^/import { createClient } from '"'"'@supabase\/supabase-js'"'"';\n/' "$file")
    fi
    
    # 移除 getSupabaseClient 的 import
    content=$(echo "$content" | sed '/import.*getSupabaseClient.*from.*@\/storage\/database\/supabase-client/d')
    
    # 在 export async function 之前添加环境变量配置
    # 找到第一个 "export async function" 或 "export function" 的位置
    export_line=$(echo "$content" | grep -n "^export" | head -n 1 | cut -d: -f1)
    
    if [ -n "$export_line" ]; then
        # 在 export 前插入环境变量配置
        env_config="
// 直接从环境变量获取 Supabase 配置
const supabaseUrl = process.env.COZE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.COZE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[$(basename $(dirname "$file"))] Supabase 环境变量未设置');
}
"
        content=$(echo "$content" | sed "${export_line}i\\$env_config")
    fi
    
    # 替换 getSupabaseClient() 为 createClient
    content=$(echo "$content" | sed 's/getSupabaseClient()/createClient(supabaseUrl, supabaseAnonKey, { db: { schema: '"'"'public'"'"' as const } })/g')
    content=$(echo "$content" | sed 's/const .* = getSupabaseClient()/const supabase = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: '"'"'public'"'"' as const } })/g')
    content=$(echo "$content" | sed 's/const client = getSupabaseClient()/const client = createClient(supabaseUrl, supabaseAnonKey, { db: { schema: '"'"'public'"'"' as const } })/g')
    
    # 写入临时文件
    echo "$content" > "$temp_file"
    
    # 替换原文件
    mv "$temp_file" "$file"
    
    echo "  - 修复完成"
done

echo ""
echo "批量修复完成！"
