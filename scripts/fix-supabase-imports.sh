#!/bin/bash

# 批量修复 Supabase 客户端导入
# 将直接使用 createClient 的文件改为使用 getSupabaseClient

API_DIR="/workspace/projects/src/app/api"

# 查找所有需要修复的文件
files=$(grep -rl "import { createClient } from '@supabase/supabase-js'" "$API_DIR" --include="*.ts")

for file in $files; do
  echo "Processing: $file"
  
  # 1. 替换导入语句
  sed -i "s/import { createClient } from '@supabase\/supabase-js';/import { getSupabaseClient } from '@\/storage\/database\/supabase-client';/g" "$file"
  
  # 2. 删除本地 getSupabaseClient 函数定义（多种模式）
  # 模式1: const supabaseUrl = ... 到 return createClient(...)
  sed -i '/const supabaseUrl = process\.env\.COZE_SUPABASE_URL/,/^}/d' "$file"
  
  # 模式2: function getSupabaseClient() 定义
  sed -i '/function getSupabaseClient/,/^}/d' "$file"
  
  # 3. 替换 supabase 变量声明
  sed -i 's/const supabase = getSupabaseClient();/const supabase = getSupabaseClient();/g' "$file"
  sed -i 's/const supabase = createClient(supabaseUrl, supabaseKey);/const supabase = getSupabaseClient();/g' "$file"
  sed -i 's/const supabase = createClient(supabaseUrl, supabaseAnonKey);/const supabase = getSupabaseClient();/g' "$file"
  
  # 4. 删除未使用的变量声明
  sed -i '/const supabaseUrl = process\.env\.COZE_SUPABASE_URL!/d' "$file"
  sed -i '/const supabaseAnonKey = process\.env\.COZE_SUPABASE_ANON_KEY!/d' "$file"
  sed -i '/const supabaseKey = process\.env\.COZE_SUPABASE_ANON_KEY/d' "$file"
  
  echo "Fixed: $file"
done

echo "Done! Fixed $(echo "$files" | wc -l) files."
